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

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const prisma = new PrismaClient();
const OUT_DIR = path.resolve("/tmp/d1-sync");

function escapeSqlVal(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "1" : "0";
  if (typeof val === "number") return String(val);
  if (val instanceof Date) return String(val.getTime());
  const str = String(val)
    .replace(/'/g, "''")
    .replace(/\0/g, "");
  return `'${str}'`;
}

async function main() {
  console.log("==================================================================");
  console.log("🚀 CLOUDFLARE D1 SYNCHRONIZATION WITH EXPLICIT COLUMN MAPPING");
  console.log("==================================================================");

  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const statements: string[] = [];

  const addTable = (tableName: string, rows: any[]) => {
    let count = 0;
    for (const row of rows) {
      const keys = Object.keys(row);
      const cols = keys.map((k) => `"${k}"`).join(", ");
      const vals = keys.map((k) => escapeSqlVal(row[k])).join(", ");
      statements.push(`INSERT OR REPLACE INTO "${tableName}" (${cols}) VALUES (${vals});`);
      count++;
    }
    console.log(`✓ Generated ${count} statements for ${tableName}`);
  };

  // 1. GlobalConfig
  addTable("GlobalConfig", await prisma.globalConfig.findMany());

  // 2. Admin
  addTable("Admin", await prisma.admin.findMany());

  // 3. Faculty
  addTable("Faculty", await prisma.faculty.findMany());

  // 4. Spoc
  addTable("Spoc", await prisma.spoc.findMany());

  // 5. Project
  addTable("Project", await prisma.project.findMany());

  // 6. DepartmentRegistrationLimit
  addTable("DepartmentRegistrationLimit", await prisma.departmentRegistrationLimit.findMany());

  // 7. Student
  addTable("Student", await prisma.student.findMany());

  // 8. Registration
  addTable("Registration", await prisma.registration.findMany());

  console.log(`\nTotal explicit SQL statements: ${statements.length}`);

  // Split into chunks of 500 statements per file for smooth D1 ingestion
  const CHUNK_SIZE = 500;
  const chunkFiles: string[] = [];
  let fileIdx = 1;

  for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
    const chunk = statements.slice(i, i + CHUNK_SIZE);
    const filePath = path.join(OUT_DIR, `batch_${String(fileIdx).padStart(3, "0")}.sql`);
    const content = ["PRAGMA foreign_keys = OFF;", ...chunk].join("\n");
    fs.writeFileSync(filePath, content, "utf-8");
    chunkFiles.push(filePath);
    fileIdx++;
  }

  console.log(`Created ${chunkFiles.length} batch files in ${OUT_DIR}`);

  // Ingest each chunk into remote D1
  console.log("\nExecuting batches against remote Cloudflare D1 (gdgu_idp_db)...");
  for (let i = 0; i < chunkFiles.length; i++) {
    const file = chunkFiles[i];
    const baseName = path.basename(file);
    console.log(`[${i + 1}/${chunkFiles.length}] Ingesting ${baseName}...`);
    try {
      execSync(`npx wrangler d1 execute gdgu_idp_db --remote --file="${file}" -y`, {
        stdio: "inherit",
      });
    } catch (err: any) {
      console.error(`Failed to ingest ${baseName}:`, err?.message);
      throw err;
    }
  }

  console.log("\n==================================================================");
  console.log("✅ D1 REMOTE SYNCHRONIZATION COMPLETE!");
  console.log("==================================================================");
}

main()
  .catch((err) => {
    console.error("Sync error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
