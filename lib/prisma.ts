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
 */

import { PrismaClient as NodePrismaClient } from "@prisma/client";
import { PrismaClient as WasmPrismaClient } from "@prisma/client/wasm";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

let globalWasmClient: any = null;
let cachedDbBinding: any = null;
let localPrisma: NodePrismaClient | null = null;

// Global BigInt serialization patch: guarantees NextResponse.json and JSON.stringify
// never throw "TypeError: Do not know how to serialize a BigInt" on Edge or Node runtimes
if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
  Object.defineProperty(BigInt.prototype, "toJSON", {
    value: function () {
      return Number(this);
    },
    writable: true,
    configurable: true,
  });
}

function getLocalPrisma(): NodePrismaClient {
  if (!localPrisma) {
    localPrisma = new NodePrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return localPrisma;
}

/**
 * Resilient D1 Binding Proxy
 * Wraps Cloudflare D1 with automatic exponential backoff retry with jitter
 * to eliminate SQLITE_BUSY / database is locked errors under high write concurrency.
 */
function createResilientD1Binding(rawDb: any): any {
  if (!rawDb || typeof rawDb.prepare !== "function") return rawDb;

  const retryAsync = async <T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> => {
    let lastErr: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || err || "").toLowerCase();
        const isTransient =
          msg.includes("sqlite_busy") ||
          msg.includes("database is locked") ||
          msg.includes("d1_reset_do") ||
          msg.includes("timeout") ||
          msg.includes("too many requests") ||
          msg.includes("temporarily unavailable");

        if (!isTransient || attempt === maxRetries) {
          throw err;
        }
        // Jittered exponential backoff: 25ms, 50ms, 100ms, 200ms, 400ms (+0-50ms random)
        const delay = Math.min(1000, 25 * Math.pow(2, attempt) + Math.random() * 50);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastErr;
  };

  return new Proxy(rawDb, {
    get(target, prop, receiver) {
      if (prop === "batch") {
        return (statements: any[]) => retryAsync(() => target.batch(statements));
      }
      if (prop === "exec") {
        return (query: string) => retryAsync(() => target.exec(query));
      }
      if (prop === "prepare") {
        return (query: string) => {
          const stmt = target.prepare(query);
          return new Proxy(stmt, {
            get(stmtTarget, stmtProp, stmtReceiver) {
              if (["all", "run", "first", "raw"].includes(stmtProp as string)) {
                return (...args: any[]) =>
                  retryAsync(() => (stmtTarget as any)[stmtProp](...args));
              }
              return Reflect.get(stmtTarget, stmtProp, stmtReceiver);
            },
          });
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

export function resetDbClient(): void {
  globalWasmClient = null;
  cachedDbBinding = null;
}

export function getDb(): any {
  try {
    const cfContext = getCloudflareContext();
    if (cfContext?.env?.DB) {
      if (!globalWasmClient || cachedDbBinding !== cfContext.env.DB) {
        cachedDbBinding = cfContext.env.DB;
        const resilientDb = createResilientD1Binding(cfContext.env.DB);
        const adapter = new PrismaD1(resilientDb);
        globalWasmClient = new WasmPrismaClient({ adapter });
      }
      return globalWasmClient;
    }
    if (cfContext?.env) {
      throw new Error(
        `Cloudflare environment detected, but ctx.env.DB binding is missing. Available env keys: ${Object.keys(cfContext.env).join(", ")}`
      );
    }
  } catch (err: any) {
    if (err?.message?.includes("ctx.env.DB binding is missing")) {
      throw err;
    }
    // Running in local Node.js environment or build step -> fall back to local Prisma client
  }
  return getLocalPrisma();
}

export const prisma = new Proxy({} as NodePrismaClient, {
  get(_target, prop) {
    const db = getDb();
    const val = (db as any)[prop];
    if (typeof val === "function") {
      return val.bind(db);
    }
    return val;
  },
});
