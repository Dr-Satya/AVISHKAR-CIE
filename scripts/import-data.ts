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

import * as path from "path";
import * as fs from "fs";
import { execSync } from "child_process";
import * as xlsx from "xlsx";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function cleanStr(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim().replace(/\s+/g, " ");
}

function normalizeTitle(val: any): string {
  return cleanStr(val).toLowerCase();
}

async function main() {
  console.log("=== STARTING GDGU DATA IMPORT (ACTIVE STUDENTS & FINAL IDP) ===");

  const defaultFacultyPasscode = process.env.DEFAULT_FACULTY_PASSCODE || "gdgu@2026";
  const defaultAdminPasscode = process.env.ADMIN_PASSCODE || "admin@gdgu2026";
  const facultyPassHash = await bcrypt.hash(defaultFacultyPasscode, 10);
  const adminPassHash = await bcrypt.hash(defaultAdminPasscode, 10);

  // 1. Setup Global Config
  await prisma.globalConfig.upsert({
    where: { id: "default" },
    update: {
      registrationOpen: true,
      maxSeats: 10,
      sameDeptLimit: 4,
      otherDeptLimit: 6,
      activeAcademicYear: "2025-2026",
      activeSemester: 3,
    },
    create: {
      id: "default",
      registrationOpen: true,
      maxSeats: 10,
      sameDeptLimit: 4,
      otherDeptLimit: 6,
      activeAcademicYear: "2025-2026",
      activeSemester: 3,
    },
  });
  console.log("✓ Global configuration initialized (2025-2026, Semester 3)");

  // 2. Setup System Admin
  await prisma.admin.upsert({
    where: { email: "admin@gdgu.org" },
    update: {
      name: "System Admin",
      role: "ADMIN",
    },
    create: {
      email: "admin@gdgu.org",
      name: "System Admin",
      passcodeHash: adminPassHash,
      role: "ADMIN",
    },
  });
  console.log(`✓ System Admin initialized (admin@gdgu.org / ${defaultAdminPasscode})`);

  // 3. Setup Default SPOC Accounts
  const defaultSpocs = [
    { email: "spoc.engineering@gdgu.org", name: "Asst. Prof. Mona Raghuwanshi (SPOC)", department: "School of Engineering & Sciences" },
    { email: "spoc.law@gdgu.org", name: "Ms. Mandeep Grewal (SPOC)", department: "School of Law" },
    { email: "test.spoc.gdgu@gmail.com", name: "Dr. Test SPOC (School of Management)", department: "School of Management" },
  ];
  for (const s of defaultSpocs) {
    await prisma.spoc.upsert({
      where: { email: s.email },
      update: { name: s.name, department: s.department },
      create: {
        email: s.email,
        name: s.name,
        department: s.department,
        passcodeHash: facultyPassHash,
      },
    });
  }
  console.log(`✓ Initialized ${defaultSpocs.length} SPOC accounts`);

  // 4. Load Excel Files
  const baseDir = path.resolve(process.cwd(), "idpportal");
  const activeStudentsPath = path.join(baseDir, "Active Students - Copy.xlsx");
  const idpFinalPath = path.join(baseDir, "IDP -final data.xlsx");
  const chcPath = path.join(baseDir, "CHC_Service_Report(38) (1).xlsx");

  console.log("Reading data files from:", baseDir);

  if (!fs.existsSync(activeStudentsPath)) {
    throw new Error(`Active Students file missing: ${activeStudentsPath}`);
  }
  if (!fs.existsSync(idpFinalPath)) {
    throw new Error(`IDP Final Data file missing: ${idpFinalPath}`);
  }

  const sWb = xlsx.readFile(activeStudentsPath);
  const studentRows: any[] = xlsx.utils.sheet_to_json(sWb.Sheets[sWb.SheetNames[0]]);

  const idpWb = xlsx.readFile(idpFinalPath);
  const idpRows: any[] = xlsx.utils.sheet_to_json(idpWb.Sheets[idpWb.SheetNames[0]]);

  let chcRows: any[] = [];
  if (fs.existsSync(chcPath)) {
    const chcWb = xlsx.readFile(chcPath);
    chcRows = xlsx.utils.sheet_to_json(chcWb.Sheets[chcWb.SheetNames[0]]);
  }

  console.log(`Loaded rows: ActiveStudents=${studentRows.length}, IDPFinal=${idpRows.length}, CHC=${chcRows.length}`);

  // Build CHC lookup by normalized title and email
  const chcMap = new Map<string, any>();
  const chcEmailMap = new Map<string, any>();
  for (const row of chcRows) {
    const rawTitle = row["Project  Title  ( Workflow  Version   -   1)"] || row["Project Title"] || "";
    const key = normalizeTitle(rawTitle);
    if (key) chcMap.set(key, row);

    const email = cleanStr(row["Email  ( Workflow  Version   -   1)"] || row["Email"]).toLowerCase();
    if (email) chcEmailMap.set(email, row);
  }

  // 5. Extract Unique Faculty & Projects from IDP Final Data
  const facultyMap = new Map<string, { name: string; email: string; department: string; phone?: string }>();
  const projectStudentCounts = new Map<string, number>();
  const projectMap = new Map<
    string,
    {
      projectId: string;
      title: string;
      category: string;
      theme: string;
      description: string;
      facultyEmail: string;
      department: string;
      sdgMapping?: string;
      maxSeats: number;
    }
  >();

  // Pre-calculate allocated student counts per project
  for (const row of idpRows) {
    const pId = cleanStr(row["Project ID"]);
    if (pId) {
      projectStudentCounts.set(pId, (projectStudentCounts.get(pId) || 0) + 1);
    }
  }

  for (const row of idpRows) {
    const pId = cleanStr(row["Project ID"]);
    const fEmail = cleanStr(row["Email ID"]).toLowerCase();
    const fName = cleanStr(row["Faculty Name"]);
    const school = cleanStr(row["School"]);
    const title = cleanStr(row["Projet Title"] || row["Project Title"]);
    const category = cleanStr(row["Project  Category  (IDP2501/IDP2502)"]) || "IDP2502";
    const theme = cleanStr(row["Theme"]) || "Others";
    const description = cleanStr(row["Description  of IDP  project"]);

    const chcRowByEmail = chcEmailMap.get(fEmail);
    const phone = chcRowByEmail
      ? cleanStr(chcRowByEmail["Phone  ( Workflow  Version   -   1)"] || chcRowByEmail["Phone"])
      : undefined;

    if (fEmail && !facultyMap.has(fEmail)) {
      facultyMap.set(fEmail, {
        name: fName || "Faculty Member",
        email: fEmail,
        department: school || "School of Engineering & Sciences",
        phone: phone || undefined,
      });
    }

    if (pId && !projectMap.has(pId)) {
      const normT = normalizeTitle(title);
      const chcRow = chcMap.get(normT) || chcEmailMap.get(fEmail);
      const sdg = chcRow ? cleanStr(chcRow["SD G  Mapping  ( Workflow  Version   -   1)"]) : undefined;
      const allocated = projectStudentCounts.get(pId) || 0;
      const maxSeats = Math.max(10, allocated);

      projectMap.set(pId, {
        projectId: pId,
        title: title || `Project ${pId}`,
        category: category,
        theme: theme,
        description: description,
        facultyEmail: fEmail,
        department: school || "School of Engineering & Sciences",
        sdgMapping: sdg || undefined,
        maxSeats: maxSeats,
      });
    }
  }

  console.log(`Unique faculty found: ${facultyMap.size}`);
  console.log(`Unique projects found: ${projectMap.size}`);

  // Upsert Faculty in Database
  const facultyDbIds = new Map<string, string>();
  for (const f of facultyMap.values()) {
    const faculty = await prisma.faculty.upsert({
      where: { email: f.email },
      update: {
        name: f.name,
        department: f.department,
        phone: f.phone,
      },
      create: {
        name: f.name,
        email: f.email,
        department: f.department,
        phone: f.phone,
        passcodeHash: facultyPassHash,
      },
    });
    facultyDbIds.set(f.email, faculty.id);
  }
  console.log(`✓ Upserted ${facultyDbIds.size} faculty accounts (passcode: ${defaultFacultyPasscode})`);

  // Upsert Projects in Database
  const projectDbIds = new Map<string, string>();
  for (const p of projectMap.values()) {
    const facultyId = facultyDbIds.get(p.facultyEmail);
    if (!facultyId) {
      console.warn(`Warning: No faculty found for email ${p.facultyEmail} for project ${p.projectId}`);
      continue;
    }
    const project = await prisma.project.upsert({
      where: { projectId: p.projectId },
      update: {
        title: p.title,
        category: p.category,
        theme: p.theme,
        description: p.description,
        department: p.department,
        facultyId: facultyId,
        sdgMapping: p.sdgMapping,
        academicYear: "2025-2026",
        semester: 3,
        maxSeats: p.maxSeats,
        sameDeptLimit: 4,
        otherDeptLimit: 6,
      },
      create: {
        projectId: p.projectId,
        title: p.title,
        category: p.category,
        theme: p.theme,
        description: p.description,
        department: p.department,
        facultyId: facultyId,
        sdgMapping: p.sdgMapping,
        academicYear: "2025-2026",
        semester: 3,
        maxSeats: p.maxSeats,
        sameDeptLimit: 4,
        otherDeptLimit: 6,
      },
    });
    projectDbIds.set(p.projectId, project.id);
  }
  console.log(`✓ Upserted ${projectDbIds.size} projects`);

  // Remove stale projects not in the final 188 list (e.g. DEMO projects)
  const allCurrentDbProjects = await prisma.project.findMany({ select: { id: true, projectId: true } });
  for (const dbProj of allCurrentDbProjects) {
    if (!projectMap.has(dbProj.projectId)) {
      console.log(`Removing deprecated project ${dbProj.projectId}`);
      await prisma.project.delete({ where: { id: dbProj.id } });
    }
  }

  // 6. Reset Registrations & Students for fresh master load
  console.log("Preparing fresh student and registration table load...");
  await prisma.registration.deleteMany();
  await prisma.studentPhoneOtp.deleteMany();
  await prisma.studentIdentity.deleteMany();
  await prisma.student.deleteMany();
  console.log("✓ Cleared legacy student and registration entries");

  // 7. Parse and Sanitize Students from Active Students Master File
  const studentMap = new Map<
    string,
    {
      enrollmentNumber: string;
      admissionNumber?: string;
      name: string;
      department: string;
      programme?: string;
      gender?: string;
      semester: number;
      batch: string;
      academicYear: string;
      email: string;
      phone?: string;
    }
  >();

  const usedEmails = new Map<string, string>(); // email -> enrollmentNumber

  for (const row of studentRows) {
    const rawEnr = cleanStr(row["Enroll. No."]);
    if (!rawEnr || rawEnr === "None" || rawEnr === "#N/A") continue;
    const enr = rawEnr;

    const adm = cleanStr(row["Application Number"]) || cleanStr(row["Application Number_1"]) || undefined;
    const name = cleanStr(row["Name"]) || "Student";
    const dept = cleanStr(row["Department"]) || "General";
    const prog = cleanStr(row["Programme"]) || undefined;
    const batch = cleanStr(row["Batch Year"]) || "2025";
    const genderRaw = cleanStr(row["Gender"]).toLowerCase();
    const gender = genderRaw ? genderRaw : undefined;
    const phone = cleanStr(row["Phone Number"]) || undefined;

    // Semester calculation
    let sem = 3;
    const termVal = cleanStr(row["current Term"]);
    if (termVal && !isNaN(parseInt(termVal, 10))) {
      sem = parseInt(termVal, 10);
    } else {
      const cy = cleanStr(row["Current Year"]).toLowerCase();
      if (cy.includes("1st")) sem = 1;
      else if (cy.includes("2nd")) sem = 3;
      else if (cy.includes("3rd")) sem = 5;
      else if (cy.includes("4th")) sem = 7;
    }

    // Email resolution & uniqueness enforcement
    let email = cleanStr(row["Email"]).toLowerCase();
    if (!email || email === "none") {
      email = `${enr.toLowerCase()}@gdgu.org`;
    }

    if (usedEmails.has(email) && usedEmails.get(email) !== enr) {
      email = `${enr.toLowerCase()}@gdgu.org`;
    }
    usedEmails.set(email, enr);

    studentMap.set(enr, {
      enrollmentNumber: enr,
      admissionNumber: adm,
      name,
      department: dept,
      programme: prog,
      gender,
      semester: sem,
      batch,
      academicYear: "2025-2026",
      email,
      phone,
    });
  }

  // Also include any students in IDP Final Data who weren't in the Active Students file
  let extraFromIdp = 0;
  for (const row of idpRows) {
    const rawEnr = cleanStr(row["Enrollment"]);
    if (!rawEnr || rawEnr === "None") continue;
    const enr = rawEnr;

    if (!studentMap.has(enr)) {
      extraFromIdp++;
      const name = cleanStr(row["Student Name"]) || "Student";
      const adm = cleanStr(row["Admission No"]) || undefined;
      const school = cleanStr(row["School"]) || "School of Engineering & Sciences";
      const prog = cleanStr(row["Program"]) || undefined;

      let email = `${enr.toLowerCase()}@gdgu.org`;
      if (usedEmails.has(email) && usedEmails.get(email) !== enr) {
        email = `${enr.toLowerCase()}.${Date.now()}@gdgu.org`;
      }
      usedEmails.set(email, enr);

      studentMap.set(enr, {
        enrollmentNumber: enr,
        admissionNumber: adm,
        name,
        department: school,
        programme: prog,
        gender: undefined,
        semester: 3,
        batch: "2025",
        academicYear: "2025-2026",
        email,
        phone: undefined,
      });
    }
  }

  console.log(`Parsed total unique students: ${studentMap.size} (including ${extraFromIdp} supplemental IDP students)`);

  // Batch insert all students in chunks of 500
  const allStudents = Array.from(studentMap.values());
  const CHUNK_SIZE = 500;
  for (let i = 0; i < allStudents.length; i += CHUNK_SIZE) {
    const chunk = allStudents.slice(i, i + CHUNK_SIZE);
    await prisma.student.createMany({
      data: chunk,
    });
  }
  console.log(`✓ Inserted ${allStudents.length} student records into database`);

  // Build enrollmentNumber -> student.id lookup map
  const dbStudents = await prisma.student.findMany({
    select: { id: true, enrollmentNumber: true },
  });
  const studentDbIds = new Map<string, string>();
  for (const s of dbStudents) {
    studentDbIds.set(s.enrollmentNumber, s.id);
  }

  // 8. Import Registrations from IDP Final Data
  const registeredEnrollments = new Set<string>();
  const registrationRecords: { studentId: string; projectId: string; status: string; createdAt: Date }[] = [];
  let skippedDuplicates = 0;
  let skippedMissing = 0;

  const registrationTimestamp = new Date();

  for (const row of idpRows) {
    const enr = cleanStr(row["Enrollment"]);
    const pId = cleanStr(row["Project ID"]);

    if (!enr || !pId) {
      skippedMissing++;
      continue;
    }

    if (registeredEnrollments.has(enr)) {
      skippedDuplicates++;
      continue;
    }

    const studentId = studentDbIds.get(enr);
    const projectId = projectDbIds.get(pId);

    if (!studentId || !projectId) {
      skippedMissing++;
      continue;
    }

    registeredEnrollments.add(enr);
    registrationRecords.push({
      studentId,
      projectId,
      status: "Approved",
      createdAt: registrationTimestamp,
    });
  }

  console.log(`Valid registrations to insert: ${registrationRecords.length} (Skipped duplicates=${skippedDuplicates}, Missing=${skippedMissing})`);

  for (let i = 0; i < registrationRecords.length; i += CHUNK_SIZE) {
    const chunk = registrationRecords.slice(i, i + CHUNK_SIZE);
    await prisma.registration.createMany({
      data: chunk,
    });
  }
  console.log(`✓ Inserted ${registrationRecords.length} registration records into database`);

  // 9. Final Database Verification
  const totalStudents = await prisma.student.count();
  const totalFaculty = await prisma.faculty.count();
  const totalProjects = await prisma.project.count();
  const totalRegistrations = await prisma.registration.count();
  const totalSpocs = await prisma.spoc.count();
  const totalAdmins = await prisma.admin.count();

  console.log("==========================================");
  console.log("DATABASE POPULATION COMPLETE & VERIFIED:");
  console.log(`  Admins:             ${totalAdmins}`);
  console.log(`  SPOCs:              ${totalSpocs}`);
  console.log(`  Faculty:            ${totalFaculty}`);
  console.log(`  Projects:           ${totalProjects}`);
  console.log(`  Total Seats:        ${totalProjects * 10}`);
  console.log(`  Total Students:     ${totalStudents}`);
  console.log(`  Approved Registrations: ${totalRegistrations}`);
  console.log("==========================================");

  // 10. Generate SQLite Dump for Cloudflare D1 Deployment
  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const d1SeedPath = path.join(backupDir, "seed_d1_latest.sql");
  try {
    execSync(`sqlite3 prisma/dev.db .dump > "${d1SeedPath}"`);
    console.log(`✓ Generated Cloudflare D1 seed SQL file at: ${d1SeedPath}`);
  } catch (err: any) {
    console.warn("Could not generate sqlite3 dump file automatically:", err?.message);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Import failed with error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
