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

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function normalizeValue(v: any): any {
  if (typeof v === "string" && ISO_DATE_REGEX.test(v)) {
    const t = new Date(v).getTime();
    if (!isNaN(t)) return t;
  }
  return v;
}

function wrapD1Statement(stmt: any): any {
  return {
    _rawStmt: stmt,
    bind(...args: any[]) {
      const sanitizedArgs = args.map((a) => {
        if (a instanceof Date) return a.getTime();
        if (typeof a === "string" && ISO_DATE_REGEX.test(a)) {
          const t = new Date(a).getTime();
          if (!isNaN(t)) return t;
        }
        return a;
      });
      return wrapD1Statement(stmt.bind(...sanitizedArgs));
    },
    async raw(options?: any) {
      const result = await stmt.raw(options);
      if (Array.isArray(result)) {
        if (options && options.columnNames) {
          const [columnNames, ...rows] = result;
          const normalizedRows = rows.map((row: any[]) =>
            Array.isArray(row) ? row.map(normalizeValue) : row
          );
          return [columnNames, ...normalizedRows];
        } else {
          return result.map((row: any[]) =>
            Array.isArray(row) ? row.map(normalizeValue) : row
          );
        }
      }
      return result;
    },
    async run() {
      return stmt.run();
    },
    async all() {
      const result = await stmt.all();
      if (result && Array.isArray(result.results)) {
        return {
          ...result,
          results: result.results.map((obj: any) => {
            if (typeof obj === "object" && obj !== null) {
              const out: any = {};
              for (const [k, v] of Object.entries(obj)) {
                out[k] = normalizeValue(v);
              }
              return out;
            }
            return obj;
          }),
        };
      }
      return result;
    },
    async first(colName?: string) {
      const obj = await stmt.first(colName);
      if (typeof obj === "object" && obj !== null) {
        const out: any = {};
        for (const [k, v] of Object.entries(obj)) {
          out[k] = normalizeValue(v);
        }
        return out;
      }
      return normalizeValue(obj);
    },
  };
}

function wrapD1Database(db: any): any {
  return {
    ...db,
    prepare(sql: string) {
      return wrapD1Statement(db.prepare(sql));
    },
    batch(stmts: any[]) {
      return db.batch(stmts.map((s: any) => s._rawStmt || s));
    },
    exec(sql: string) {
      return db.exec(sql);
    },
  };
}

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
        const adapter = new PrismaD1(wrapD1Database(cfContext.env.DB));
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
