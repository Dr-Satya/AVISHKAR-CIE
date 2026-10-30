/**
 * G D Goenka University - Inter-Disciplinary Project (IDP) Portal
 * 
 * Code Attribution:
 * - Dr. Satya Prakash (Avishkar Centre for Innovation and Entrepreneurship,
 *   School of Engineering and Sciences, G D Goenka University, Haryana)
 * - Potla Sri Sharan
 * - Sarthak Singh
 * 
 * Licensed under the Apache License, Version 2.0.
 *
 * In-Memory Sliding Window Rate Limiter for Cloudflare Workers Edge
 * Provides IP and identifier-based request throttling with zero external dependencies.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// Persist on globalThis across edge worker request executions within the V8 isolate
const globalForRateLimit = globalThis as unknown as {
  __rateLimitStore?: Map<string, RateLimitRecord>;
  __rateLimitLastCleanup?: number;
};

if (!globalForRateLimit.__rateLimitStore) {
  globalForRateLimit.__rateLimitStore = new Map<string, RateLimitRecord>();
}
const rateLimitStore = globalForRateLimit.__rateLimitStore;

const MAX_RATE_LIMIT_KEYS = 5000;

// Clean up expired entries every 60 seconds to prevent unbounded memory growth
function cleanupExpired() {
  const now = Date.now();
  const lastCleanup = globalForRateLimit.__rateLimitLastCleanup || 0;
  if (now - lastCleanup < 60000 && rateLimitStore.size < MAX_RATE_LIMIT_KEYS) return;
  globalForRateLimit.__rateLimitLastCleanup = now;
  for (const [key, record] of rateLimitStore.entries()) {
    if (now >= record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
  // Evict oldest entries if map exceeds maximum memory capacity
  if (rateLimitStore.size >= MAX_RATE_LIMIT_KEYS) {
    const keysToDelete = Array.from(rateLimitStore.keys()).slice(0, 1000);
    keysToDelete.forEach((k) => rateLimitStore.delete(k));
  }
}

export interface RateLimitOptions {
  windowMs: number; // Duration of rate limit window in milliseconds
  max: number;      // Maximum requests allowed in the window
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  cleanupExpired();
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now >= record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      success: true,
      limit: options.max,
      remaining: options.max - 1,
      resetAt: now + options.windowMs,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= options.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      success: false,
      limit: options.max,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: options.max,
    remaining: options.max - record.count,
    resetAt: record.resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Extract trusted client IP from Cloudflare or standard headers
 */
export function getClientIp(req: Request | any): string {
  if (req?.ip) return req.ip;
  const cfIp = req?.headers?.get?.("cf-connecting-ip");
  if (cfIp) return cfIp;
  const forwarded = req?.headers?.get?.("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req?.headers?.get?.("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}
