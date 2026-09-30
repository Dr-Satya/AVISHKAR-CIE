import { PrismaClient as NodePrismaClient } from "@prisma/client";
import { PrismaClient as WasmPrismaClient } from "@prisma/client/wasm";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

let localPrisma: NodePrismaClient | null = null;
let d1Prisma: any = null;
let lastDbBinding: any = null;

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
    const ctx = getCloudflareContext();
    if (ctx?.env?.DB) {
      if (d1Prisma && lastDbBinding === ctx.env.DB) {
        return d1Prisma;
      }
      lastDbBinding = ctx.env.DB;
      const adapter = new PrismaD1(ctx.env.DB);
      d1Prisma = new WasmPrismaClient({ adapter });
      return d1Prisma;
    }
    throw new Error(`ctx.env.DB is missing. Available env keys: ${Object.keys(ctx?.env || {})}`);
  } catch (err: any) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`getDb on Cloudflare failed: ${err?.message || err}`);
    }
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
