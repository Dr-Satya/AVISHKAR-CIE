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

function getLocalPrisma(): NodePrismaClient {
  if (!localPrisma) {
    localPrisma = new NodePrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return localPrisma;
}

export function getDb(): any {
  try {
    const cfContext = getCloudflareContext();
    if (cfContext?.env?.DB) {
      if (!globalWasmClient || cachedDbBinding !== cfContext.env.DB) {
        cachedDbBinding = cfContext.env.DB;
        const adapter = new PrismaD1(cfContext.env.DB);
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
