import * as path from "path";
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
  console.log("=== STARTING GDGU DATA IMPORT ===");

  const defaultFacultyPasscode = process.env.DEFAULT_FACULTY_PASSCODE || "gdgu@2026";
  const defaultAdminPasscode = process.env.ADMIN_PASSCODE || "admin@gdgu2026";
  const facultyPassHash = await bcrypt.hash(defaultFacultyPasscode, 10);
  const adminPassHash = await bcrypt.hash(defaultAdminPasscode, 10);

  // 1. Setup Global Config
  await prisma.globalConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      registrationOpen: true,
      maxSeats: 10,
      sameDeptLimit: 4,
      otherDeptLimit: 6,
    },
  });
  console.log("✓ Global configuration initialized");

  // 2. Setup System Admin
  await prisma.admin.upsert({
    where: { email: "admin@gdgu.org" },
    update: {},
    create: {
      email: "admin@gdgu.org",
      name: "System Admin",
      passcodeHash: adminPassHash,
      role: "ADMIN",
    },
  });
  console.log("✓ System Admin created (admin@gdgu.org / " + defaultAdminPasscode + ")");

  // 3. Load Excel Files
  const baseDir = path.resolve(process.cwd(), "idpportal");
  const chcPath = path.join(baseDir, "CHC_Service_Report(38) (1).xlsx");
  const cohortPath = path.join(baseDir, "IDP Cohorts Details_5Sep-2026.xlsx");
  const studentMapPath = path.join(baseDir, "IDP Mapping Format_original_data_recieved_frm_Mohit_maan.xlsx");

  console.log("Reading Excel files from:", baseDir);

  const chcWorkbook = xlsx.readFile(chcPath);
  const chcSheet = chcWorkbook.Sheets[chcWorkbook.SheetNames[0]];
  const chcRows: any[] = xlsx.utils.sheet_to_json(chcSheet);

  const cohortWorkbook = xlsx.readFile(cohortPath);
  const cohortSheet = cohortWorkbook.Sheets[cohortWorkbook.SheetNames[0]];
  const cohortRows: any[] = xlsx.utils.sheet_to_json(cohortSheet);

  const studentWorkbook = xlsx.readFile(studentMapPath);
  const studentSheet = studentWorkbook.Sheets[studentWorkbook.SheetNames[0]];
  const studentRows: any[] = xlsx.utils.sheet_to_json(studentSheet);

  console.log(`Loaded rows: CHC=${chcRows.length}, Cohorts=${cohortRows.length}, Students=${studentRows.length}`);

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

  // 4. Extract Unique Faculty & Projects from Cohort File
  const facultyMap = new Map<string, { name: string; email: string; department: string; phone?: string }>();
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
    }
  >();

  for (const row of cohortRows) {
    const pId = cleanStr(row["Project ID"]);
    const fEmail = cleanStr(row["Email ID"]).toLowerCase();
    const fName = cleanStr(row["Faculty Name"]);
    const school = cleanStr(row["School"]);
    const title = cleanStr(row["Projet Title"] || row["Project Title"]);
    const category = cleanStr(row["Project  Category  (IDP2501/IDP2502)"]);
    const theme = cleanStr(row["Theme"]);
    const description = cleanStr(row["Description  of IDP  project"]);
    
    const chcRowByEmail = chcEmailMap.get(fEmail);
    const phone = chcRowByEmail
      ? cleanStr(chcRowByEmail["Phone  ( Workflow  Version   -   1)"] || chcRowByEmail["Phone"])
      : cleanStr(row["Contact No."]);

    if (fEmail && !facultyMap.has(fEmail)) {
      facultyMap.set(fEmail, {
        name: fName || "Faculty Member",
        email: fEmail,
        department: school || "General",
        phone: phone || undefined,
      });
    }

    if (pId && !projectMap.has(pId)) {
      const normT = normalizeTitle(title);
      const chcRow = chcMap.get(normT);
      const sdg = chcRow ? cleanStr(chcRow["SD G  Mapping  ( Workflow  Version   -   1)"]) : undefined;

      projectMap.set(pId, {
        projectId: pId,
        title: title || `Project ${pId}`,
        category: category || "IDP2502",
        theme: theme || "Others",
        description: description,
        facultyEmail: fEmail,
        department: school || "School of Engineering & Sciences",
        sdgMapping: sdg || undefined,
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
  console.log(`✓ Seeded ${facultyDbIds.size} faculty accounts (passcode: ${defaultFacultyPasscode})`);

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
      },
    });
    projectDbIds.set(p.projectId, project.id);
  }
  console.log(`✓ Seeded ${projectDbIds.size} projects`);

  // 5. Import Students
  // Build student dictionary from student master file
  const studentMap = new Map<
    string,
    {
      enrollmentNumber: string;
      admissionNumber?: string;
      name: string;
      department: string;
      programme?: string;
      semester: number;
      batch: string;
      email: string;
    }
  >();

  for (const row of studentRows) {
    const enr = cleanStr(row["Enrolment No."]);
    if (!enr) continue;
    const name = cleanStr(row["Name "]);
    const adm = cleanStr(row["Admission No."]);
    const dept = cleanStr(row["Department"]);
    const prog = cleanStr(row["Programme Name"]);
    const batch = cleanStr(row["Batch"]) || "2025";
    const email = `${enr.toLowerCase()}@gdgu.org`;

    studentMap.set(enr, {
      enrollmentNumber: enr,
      admissionNumber: adm || undefined,
      name: name || "Student",
      department: dept || "School of Engineering & Sciences",
      programme: prog || undefined,
      semester: 3,
      batch: batch,
      email: email,
    });
  }

  // Also include any students in cohort file who might not be in the master mapping file
  for (const row of cohortRows) {
    const enr = cleanStr(row["Enrollment"]);
    if (!enr) continue;
    if (!studentMap.has(enr)) {
      const name = cleanStr(row["Student Name"]);
      const school = cleanStr(row["School"]);
      studentMap.set(enr, {
        enrollmentNumber: enr,
        admissionNumber: undefined,
        name: name || "Student",
        department: school || "School of Engineering & Sciences",
        programme: undefined,
        semester: 3,
        batch: "2025",
        email: `${enr.toLowerCase()}@gdgu.org`,
      });
    }
  }

  console.log(`Total students to process: ${studentMap.size}`);

  // Batch insert/upsert students
  const studentDbIds = new Map<string, string>();
  const studentsList = Array.from(studentMap.values());
  const BATCH_SIZE = 250;

  for (let i = 0; i < studentsList.length; i += BATCH_SIZE) {
    const chunk = studentsList.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map(async (st) => {
        const student = await prisma.student.upsert({
          where: { enrollmentNumber: st.enrollmentNumber },
          update: {
            name: st.name,
            admissionNumber: st.admissionNumber,
            department: st.department,
            programme: st.programme,
            semester: st.semester,
            batch: st.batch,
            email: st.email,
          },
          create: {
            enrollmentNumber: st.enrollmentNumber,
            admissionNumber: st.admissionNumber,
            name: st.name,
            department: st.department,
            programme: st.programme,
            semester: st.semester,
            batch: st.batch,
            email: st.email,
          },
        });
        studentDbIds.set(st.enrollmentNumber, student.id);
      })
    );
  }
  console.log(`✓ Seeded ${studentDbIds.size} student records`);

  // 6. Import Existing Registrations from Cohort File
  const registeredEnrollments = new Set<string>();
  const registrationRecords: { studentId: string; projectId: string; createdAt: Date }[] = [];
  let skippedDuplicates = 0;
  let skippedMissing = 0;

  const fixedTimestamp = new Date("2026-09-05T17:55:00.000Z");

  for (const row of cohortRows) {
    const enr = cleanStr(row["Enrollment"]);
    const pId = cleanStr(row["Project ID"]);
    if (!enr || !pId) {
      skippedMissing++;
      continue;
    }

    if (registeredEnrollments.has(enr)) {
      // Duplicate registration found in cohort file - skip to preserve 1 student : 1 project rule
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
      createdAt: fixedTimestamp,
    });
  }

  console.log(`Valid registrations to seed: ${registrationRecords.length} (Skipped dups=${skippedDuplicates}, Missing=${skippedMissing})`);

  // Insert registrations in chunks
  for (let i = 0; i < registrationRecords.length; i += BATCH_SIZE) {
    const chunk = registrationRecords.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map(async (reg) => {
        await prisma.registration.upsert({
          where: { studentId: reg.studentId },
          update: {
            projectId: reg.projectId,
            status: "Approved",
          },
          create: {
            studentId: reg.studentId,
            projectId: reg.projectId,
            status: "Approved",
            createdAt: reg.createdAt,
          },
        });
      })
    );
  }

  // 7. Verify Counts
  const totalStudents = await prisma.student.count();
  const totalProjects = await prisma.project.count();
  const totalRegistrations = await prisma.registration.count();
  console.log("==========================================");
  console.log("FINAL DATABASE VERIFICATION:");
  console.log(`Total Students:      ${totalStudents}`);
  console.log(`Total Projects:      ${totalProjects}`);
  console.log(`Total Registrations: ${totalRegistrations}`);
  console.log(`Total Seats:         ${totalProjects * 10}`);
  console.log("==========================================");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Import failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
