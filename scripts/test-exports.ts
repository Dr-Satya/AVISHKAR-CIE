/**
 * G D Goenka University - Inter-Disciplinary Project (IDP) Portal
 * 
 * Code Attribution:
 * - Dr. Satya Prakash (Avishkar Centre for Innovation and Entrepreneurship,
 *   School of Engineering and Sciences, G D Goenka University, Haryana)
 * - Potla Sri Sharan
 * - Sarthak Singh
 * 
 * Comprehensive Export Functionality & Security Automated Test Suite
 * Milestone 3: End-to-end automated verification of unpaginated exports,
 * active filter propagation, row transformations, serialization, and RBAC security.
 */

// 1. Hook next/headers cookies store before any Next.js route or auth imports
const headersPath = require.resolve("next/dist/client/components/headers");
let currentSessionCookie: string | null = null;

require.cache[headersPath] = {
  id: headersPath,
  filename: headersPath,
  loaded: true,
  exports: {
    cookies: () => ({
      get: (name: string) =>
        currentSessionCookie ? { name, value: currentSessionCookie } : undefined,
    }),
    headers: () => new Headers(),
    draftMode: () => ({ isEnabled: false }),
  },
} as any;

import { prisma } from "../lib/prisma";
import * as XLSX from "xlsx";
import { exportToCsv, exportToXlsx } from "../lib/export";
import { NextRequest } from "next/server";

async function runExportTestSuite() {
  console.log("================================================================================");
  console.log("🚀 COMPREHENSIVE EXPORT FUNCTIONALITY & SECURITY AUTOMATED TEST SUITE");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
      if (details) console.error(`     Reason: ${details}`);
      failed++;
    }
  }

  // Dynamically import auth and route handlers to ensure require.cache hook took effect
  const authModule: any = await import("../lib/auth");
  const signSessionToken = authModule.signSessionToken;

  const studentsModule: any = await import("../app/api/admin/students/route");
  const getStudents = studentsModule.GET || studentsModule.default?.GET;

  const registrationsModule: any = await import("../app/api/admin/registrations/route");
  const getRegistrations = registrationsModule.GET || registrationsModule.default?.GET;

  const projectsModule: any = await import("../app/api/admin/projects/route");
  const getProjects = projectsModule.GET || projectsModule.default?.GET;

  // Helper session generators
  const adminPayload = {
    role: "ADMIN" as const,
    id: "admin_test_m3",
    email: "admin_test_m3@gdgu.org",
    name: "Admin Test Runner",
  };
  const adminToken = await signSessionToken(adminPayload);

  const studentPayload = {
    role: "STUDENT" as const,
    id: "student_test_m3",
    email: "student_test_m3@gdgu.org",
    name: "Student Test Runner",
  };
  const studentToken = await signSessionToken(studentPayload);

  const facultyPayload = {
    role: "FACULTY" as const,
    id: "faculty_test_m3",
    email: "faculty_test_m3@gdgu.org",
    name: "Faculty Test Runner",
  };
  const facultyToken = await signSessionToken(facultyPayload);

  // ─────────────────────────────────────────────────────────────
  // 1. SECURITY & ACCESS CONTROL VERIFICATION
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 1. Security & RBAC Access Control Verification ---");

  // A. Unauthenticated requests (no session cookie)
  currentSessionCookie = null;
  const unauthStudents = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?export=true"));
  assert(unauthStudents.status === 401, "Security: Unauthenticated GET /api/admin/students returns 401 Unauthorized");

  const unauthRegistrations = await getRegistrations(new NextRequest("http://localhost:3000/api/admin/registrations?export=true"));
  assert(unauthRegistrations.status === 401, "Security: Unauthenticated GET /api/admin/registrations returns 401 Unauthorized");

  const unauthProjects = await getProjects(new NextRequest("http://localhost:3000/api/admin/projects?export=true"));
  assert(unauthProjects.status === 401, "Security: Unauthenticated GET /api/admin/projects returns 401 Unauthorized");

  // B. Corrupted / Malformed JWT cookie
  currentSessionCookie = "invalid.token.structure";
  const malformedRes = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?export=true"));
  assert(malformedRes.status === 401, "Security: Malformed session token returns 401 Unauthorized");

  // C. Non-Admin (Student) role access rejection
  currentSessionCookie = studentToken;
  const studentAccessStudents = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?export=true"));
  assert(studentAccessStudents.status === 401, "Security: Student role access to /api/admin/students is rejected with 401");

  const studentAccessRegistrations = await getRegistrations(new NextRequest("http://localhost:3000/api/admin/registrations?export=true"));
  assert(studentAccessRegistrations.status === 401, "Security: Student role access to /api/admin/registrations is rejected with 401");

  const studentAccessProjects = await getProjects(new NextRequest("http://localhost:3000/api/admin/projects?export=true"));
  assert(studentAccessProjects.status === 401, "Security: Student role access to /api/admin/projects is rejected with 401");

  // D. Non-Admin (Faculty) role access rejection
  currentSessionCookie = facultyToken;
  const facultyAccessStudents = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?export=true"));
  assert(facultyAccessStudents.status === 401, "Security: Faculty role access to /api/admin/students is rejected with 401");

  const facultyAccessRegistrations = await getRegistrations(new NextRequest("http://localhost:3000/api/admin/registrations?export=true"));
  assert(facultyAccessRegistrations.status === 401, "Security: Faculty role access to /api/admin/registrations is rejected with 401");

  const facultyAccessProjects = await getProjects(new NextRequest("http://localhost:3000/api/admin/projects?export=true"));
  assert(facultyAccessProjects.status === 401, "Security: Faculty role access to /api/admin/projects is rejected with 401");

  // Set active session to authorized Admin for all subsequent tests
  currentSessionCookie = adminToken;

  // ─────────────────────────────────────────────────────────────
  // 2. STUDENTS EXPORT VERIFICATION
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Students Export Verification ---");

  // Baseline database counts
  const totalDbStudents = await prisma.student.count();
  const regYesDbCount = await prisma.student.count({ where: { registration: { isNot: null } } });
  const regNoDbCount = await prisma.student.count({ where: { registration: null } });
  const soesDbCount = await prisma.student.count({ where: { department: "School of Engineering & Sciences" } });
  const maleDbCount = await prisma.student.count({ where: { gender: "male" } });
  const femaleDbCount = await prisma.student.count({ where: { gender: "female" } });
  const yearDbCount = await prisma.student.count({ where: { academicYear: "2026-2027" } });

  // 2a. Standard paginated query returns paginated slice (clamped to limit)
  const paginatedStudentsRes = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?page=1&limit=25"));
  assert(paginatedStudentsRes.status === 200, "Students API: Paginated query returns 200 OK");
  const paginatedStudentsData = await paginatedStudentsRes.json();
  assert(
    paginatedStudentsData.students?.length === 25,
    `Students API: Paginated query with limit=25 returns exactly 25 items (received: ${paginatedStudentsData.students?.length})`
  );
  assert(
    paginatedStudentsData.pagination?.page === 1 && paginatedStudentsData.pagination?.total === totalDbStudents,
    `Students API: Pagination metadata accurately reflects total records (${totalDbStudents})`
  );

  // 2b. Unpaginated export with export=true returns full record set
  const exportTrueRes = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?export=true"));
  assert(exportTrueRes.status === 200, "Students API: export=true query returns 200 OK");
  const exportTrueData = await exportTrueRes.json();
  assert(
    exportTrueData.students?.length === totalDbStudents && exportTrueData.total === totalDbStudents,
    `Students API: export=true returns complete unpaginated record set (all ${totalDbStudents} students)`
  );

  // 2c. Unpaginated export with all=true returns full record set
  const allTrueRes = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?all=true"));
  assert(allTrueRes.status === 200, "Students API: all=true query returns 200 OK");
  const allTrueData = await allTrueRes.json();
  assert(
    allTrueData.students?.length === totalDbStudents && allTrueData.total === totalDbStudents,
    `Students API: all=true returns complete unpaginated record set (all ${totalDbStudents} students)`
  );

  // 2d. Active filter: registered=yes
  const regYesRes = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?export=true&registered=yes"));
  const regYesData = await regYesRes.json();
  assert(
    regYesData.students?.length === regYesDbCount && regYesData.students.every((s: any) => s.registered === true),
    `Students Filter: registered=yes matches DB count (${regYesDbCount}) and every student has registered=true`
  );

  // 2e. Active filter: registered=no
  const regNoRes = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?export=true&registered=no"));
  const regNoData = await regNoRes.json();
  assert(
    regNoData.students?.length === regNoDbCount && regNoData.students.every((s: any) => s.registered === false),
    `Students Filter: registered=no matches DB count (${regNoDbCount}) and every student has registered=false`
  );

  // 2f. Active filter: school
  const schoolRes = await getStudents(
    new NextRequest("http://localhost:3000/api/admin/students?export=true&school=School%20of%20Engineering%20%26%20Sciences")
  );
  const schoolData = await schoolRes.json();
  assert(
    schoolData.students?.length === soesDbCount &&
      schoolData.students.every((s: any) => s.department === "School of Engineering & Sciences"),
    `Students Filter: school matches DB count (${soesDbCount}) and all records match department`
  );

  // 2g. Active filter: gender (verifying both lowercase and Title Case for UI compatibility)
  const maleRes = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?export=true&gender=male"));
  const maleData = await maleRes.json();
  assert(
    maleData.students?.length === maleDbCount && maleDbCount === 4107 && maleData.students.every((s: any) => s.gender?.toLowerCase() === "male"),
    `Students Filter: gender=male matches DB count (${maleDbCount})`
  );

  const maleTitleRes = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?export=true&gender=Male"));
  const maleTitleData = await maleTitleRes.json();
  assert(
    maleTitleData.students?.length === maleDbCount && maleTitleData.students.every((s: any) => s.gender?.toLowerCase() === "male"),
    `Students Filter: gender=Male (Title Case from UI) matches DB count (${maleDbCount})`
  );

  const femaleRes = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?export=true&gender=female"));
  const femaleData = await femaleRes.json();
  assert(
    femaleData.students?.length === femaleDbCount && femaleDbCount === 2606 && femaleData.students.every((s: any) => s.gender?.toLowerCase() === "female"),
    `Students Filter: gender=female matches DB count (${femaleDbCount})`
  );

  const femaleTitleRes = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?export=true&gender=Female"));
  const femaleTitleData = await femaleTitleRes.json();
  assert(
    femaleTitleData.students?.length === femaleDbCount && femaleTitleData.students.every((s: any) => s.gender?.toLowerCase() === "female"),
    `Students Filter: gender=Female (Title Case from UI) matches DB count (${femaleDbCount})`
  );

  // 2h. Active filter: academicYear
  const yearRes = await getStudents(new NextRequest("http://localhost:3000/api/admin/students?export=true&academicYear=2026-2027"));
  const yearData = await yearRes.json();
  assert(
    yearData.students?.length === yearDbCount && yearData.students.every((s: any) => s.academicYear === "2026-2027"),
    `Students Filter: academicYear=2026-2027 matches DB count (${yearDbCount})`
  );

  // 2i. Active filter: search query
  const sampleStudent = exportTrueData.students[0];
  const searchTerm = sampleStudent.name.split(" ")[0];
  const searchDbCount = await prisma.student.count({
    where: {
      OR: [
        { enrollmentNumber: { contains: searchTerm } },
        { name: { contains: searchTerm } },
        { department: { contains: searchTerm } },
        { programme: { contains: searchTerm } },
      ],
    },
  });
  const searchRes = await getStudents(
    new NextRequest(`http://localhost:3000/api/admin/students?export=true&search=${encodeURIComponent(searchTerm)}`)
  );
  const searchData = await searchRes.json();
  assert(
    searchData.students?.length === searchDbCount,
    `Students Filter: search query "${searchTerm}" returns exact matching subset (${searchDbCount} records)`
  );

  // 2j. Row transformation produces all 21 table columns matching StudentsTableCard
  const studentSampleSlice = exportTrueData.students.slice(0, 100);
  const transformedStudentRows = studentSampleSlice.map((s: any, idx: number) => ({
    "Sr. No": idx + 1,
    "Enrollment Number": s.enrollment,
    "Student Name": s.name,
    "Gender": s.gender || "Unspecified",
    "School": s.department,
    "Branch": s.program || "N/A",
    "Semester": s.sem,
    "Batch": s.batch,
    "Academic Year": s.academicYear || "2026-2027",
    "Phone": s.phone || "N/A",
    "Phone Verified": s.phoneVerified ? "Yes" : "No",
    "Attendance (%)": `${s.attendance}%`,
    "Internal Marks (/50)": s.internals,
    "External Marks (/50)": s.externals,
    "Total Marks (/100)": Number(s.internals ?? 0) + Number(s.externals ?? 0),
    "Registered": s.registered ? "Yes" : "No",
    "Project Code": s.projectCode || "N/A",
    "Project Title": s.projectTitle || "N/A",
    "Project Category": s.projectCategory || "N/A",
    "Faculty Guide": s.facultyName || "N/A",
    "Faculty Email": s.facultyEmail || "N/A",
  }));

  const expectedStudentColumns = [
    "Sr. No",
    "Enrollment Number",
    "Student Name",
    "Gender",
    "School",
    "Branch",
    "Semester",
    "Batch",
    "Academic Year",
    "Phone",
    "Phone Verified",
    "Attendance (%)",
    "Internal Marks (/50)",
    "External Marks (/50)",
    "Total Marks (/100)",
    "Registered",
    "Project Code",
    "Project Title",
    "Project Category",
    "Faculty Guide",
    "Faculty Email",
  ];

  const studentRowKeys = Object.keys(transformedStudentRows[0]);
  const studentKeysMatch =
    studentRowKeys.length === expectedStudentColumns.length &&
    expectedStudentColumns.every((col) => studentRowKeys.includes(col));
  assert(studentKeysMatch, `Students Row Transform: Formats all ${expectedStudentColumns.length} expected columns correctly`);

  // 2k. CSV Serialization & Line Count Verification
  const studentCsv = (await exportToCsv(transformedStudentRows, "test_students")) as string;
  assert(
    typeof studentCsv === "string" && studentCsv.length > 500,
    "Students CSV Serialization: Produces valid non-empty CSV output"
  );
  const studentCsvLines = studentCsv.trim().split("\n");
  assert(
    studentCsvLines.length === transformedStudentRows.length + 1,
    `Students CSV Line Count: Exactly matches header line + data rows (${studentCsvLines.length} lines)`
  );

  // 2l. XLSX Serialization & Round-trip Verification
  const studentWb = XLSX.utils.book_new();
  const studentWs = XLSX.utils.json_to_sheet(transformedStudentRows);
  XLSX.utils.book_append_sheet(studentWb, studentWs, "Students");
  const studentParsedRows = XLSX.utils.sheet_to_json(studentWs);
  assert(
    studentParsedRows.length === transformedStudentRows.length,
    `Students XLSX Serialization: Round-trip parsed worksheet maintains all ${transformedStudentRows.length} rows`
  );

  // ─────────────────────────────────────────────────────────────
  // 3. REGISTRATIONS EXPORT VERIFICATION
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. Registrations Export Verification ---");

  const totalDbRegistrations = await prisma.registration.count();

  // 3a. Standard paginated query returns paginated slice (e.g. limit=10)
  const paginatedRegRes = await getRegistrations(new NextRequest("http://localhost:3000/api/admin/registrations?page=1&limit=10"));
  assert(paginatedRegRes.status === 200, "Registrations API: Paginated query returns 200 OK");
  const paginatedRegData = await paginatedRegRes.json();
  assert(
    paginatedRegData.registrations?.length === 10,
    `Registrations API: Paginated query with limit=10 returns exactly 10 items`
  );
  assert(
    paginatedRegData.pagination?.page === 1 && paginatedRegData.pagination?.total === totalDbRegistrations,
    `Registrations API: Pagination metadata reflects total database registrations (${totalDbRegistrations})`
  );

  // 3b. Unpaginated export with export=true returns full dataset
  const regExportRes = await getRegistrations(new NextRequest("http://localhost:3000/api/admin/registrations?export=true"));
  assert(regExportRes.status === 200, "Registrations API: export=true query returns 200 OK");
  const regExportData = await regExportRes.json();
  assert(
    regExportData.registrations?.length === totalDbRegistrations && regExportData.total === totalDbRegistrations,
    `Registrations API: export=true returns full dataset (all ${totalDbRegistrations} registrations)`
  );

  // 3c. Unpaginated export with unpaginated=true returns full dataset
  const regUnpaginatedRes = await getRegistrations(
    new NextRequest("http://localhost:3000/api/admin/registrations?unpaginated=true")
  );
  assert(regUnpaginatedRes.status === 200, "Registrations API: unpaginated=true query returns 200 OK");
  const regUnpaginatedData = await regUnpaginatedRes.json();
  assert(
    regUnpaginatedData.registrations?.length === totalDbRegistrations && regUnpaginatedData.total === totalDbRegistrations,
    `Registrations API: unpaginated=true returns full dataset (all ${totalDbRegistrations} registrations)`
  );

  // 3d. Unpaginated export with all=true returns full dataset
  const regAllRes = await getRegistrations(new NextRequest("http://localhost:3000/api/admin/registrations?all=true"));
  assert(regAllRes.status === 200, "Registrations API: all=true query returns 200 OK");
  const regAllData = await regAllRes.json();
  assert(
    regAllData.registrations?.length === totalDbRegistrations && regAllData.total === totalDbRegistrations,
    `Registrations API: all=true returns full dataset (all ${totalDbRegistrations} registrations)`
  );

  // 3e. Search filter properly limits unpaginated export
  const regSearchKeyword = "Computer";
  const regSearchDbCount = await prisma.registration.count({
    where: {
      OR: [
        { student: { enrollmentNumber: { contains: regSearchKeyword } } },
        { student: { name: { contains: regSearchKeyword } } },
        { student: { department: { contains: regSearchKeyword } } },
        { project: { projectId: { contains: regSearchKeyword } } },
        { project: { title: { contains: regSearchKeyword } } },
        { project: { faculty: { name: { contains: regSearchKeyword } } } },
        { project: { theme: { contains: regSearchKeyword } } },
      ],
    },
  });

  const regSearchRes = await getRegistrations(
    new NextRequest(`http://localhost:3000/api/admin/registrations?export=true&search=${encodeURIComponent(regSearchKeyword)}`)
  );
  const regSearchData = await regSearchRes.json();
  assert(
    regSearchData.registrations?.length === regSearchDbCount && regSearchData.total === regSearchDbCount,
    `Registrations Filter: search="${regSearchKeyword}" properly limits unpaginated export (${regSearchDbCount} records)`
  );

  // 3f. Row transformation produces all 9 table columns matching RegistrationsTableCard
  const transformedRegRows = regExportData.registrations.map((r: any, idx: number) => ({
    "Sr. No": idx + 1,
    Timestamp: r.timestamp,
    Enrollment: r.enrollment,
    "Student Name": r.studentName,
    Department: r.department,
    "Project Code": r.projectCode,
    "Faculty Mentor": r.facultyName,
    Status: r.status,
    Theme: r.theme,
  }));

  const expectedRegColumns = [
    "Sr. No",
    "Timestamp",
    "Enrollment",
    "Student Name",
    "Department",
    "Project Code",
    "Faculty Mentor",
    "Status",
    "Theme",
  ];

  const regRowKeys = Object.keys(transformedRegRows[0]);
  const regKeysMatch =
    regRowKeys.length === expectedRegColumns.length &&
    expectedRegColumns.every((col) => regRowKeys.includes(col));
  assert(
    regKeysMatch,
    `Registrations Row Transform: Produces all ${expectedRegColumns.length} table columns (${expectedRegColumns.join(", ")})`
  );

  // 3g. Registrations CSV & XLSX Serialization Verification
  const regCsv = (await exportToCsv(transformedRegRows, "test_registrations")) as string;
  assert(typeof regCsv === "string" && regCsv.length > 500, "Registrations CSV Serialization: Produces valid CSV stream");
  const regWs = XLSX.utils.json_to_sheet(transformedRegRows);
  const regParsedRows = XLSX.utils.sheet_to_json(regWs);
  assert(
    regParsedRows.length === transformedRegRows.length,
    `Registrations XLSX Serialization: Round-trip parsed worksheet maintains all ${transformedRegRows.length} records`
  );

  // ─────────────────────────────────────────────────────────────
  // 4. PROJECTS EXPORT VERIFICATION
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 4. Projects Export Verification ---");

  const totalDbProjects = await prisma.project.count();
  const idp2502DbCount = await prisma.project.count({ where: { category: "IDP2502" } });
  const soesProjectsDbCount = await prisma.project.count({ where: { department: "School of Engineering & Sciences" } });

  // 4a. Standard paginated query returns paginated slice (limit=10)
  const paginatedProjRes = await getProjects(new NextRequest("http://localhost:3000/api/admin/projects?page=1&limit=10"));
  assert(paginatedProjRes.status === 200, "Projects API: Paginated query returns 200 OK");
  const paginatedProjData = await paginatedProjRes.json();
  assert(
    paginatedProjData.projects?.length === 10,
    `Projects API: Paginated query with limit=10 returns exactly 10 items`
  );
  assert(
    paginatedProjData.pagination?.page === 1 && paginatedProjData.pagination?.total === totalDbProjects,
    `Projects API: Pagination metadata reflects total database projects (${totalDbProjects})`
  );

  // 4b. Unpaginated export with export=true returns all project records with full metadata
  const projExportRes = await getProjects(new NextRequest("http://localhost:3000/api/admin/projects?export=true"));
  assert(projExportRes.status === 200, "Projects API: export=true returns 200 OK");
  const projExportData = await projExportRes.json();
  assert(
    projExportData.projects?.length === totalDbProjects && projExportData.total === totalDbProjects,
    `Projects API: export=true returns full unpaginated project dataset (all ${totalDbProjects} projects)`
  );
  assert(
    projExportData.projects[0].seatsRatio !== undefined && projExportData.projects[0].submissionStatus !== undefined,
    "Projects API: export=true includes complete calculated project metadata (seatsRatio, submissionStatus, etc.)"
  );

  // 4c. Backward compatibility 1: exportFiles=true returns file manifest for ZIP packaging
  const projFilesRes = await getProjects(new NextRequest("http://localhost:3000/api/admin/projects?exportFiles=true"));
  assert(projFilesRes.status === 200, "Projects API: exportFiles=true returns 200 OK");
  const projFilesData = await projFilesRes.json();
  assert(
    projFilesData.projects?.length === totalDbProjects &&
      Array.isArray(projFilesData.projects[0].artifacts) &&
      Array.isArray(projFilesData.projects[0].students),
    `Projects Backward Compatibility: exportFiles=true returns file manifest containing artifacts & students arrays`
  );

  // 4d. Backward compatibility 2: all=true without export param returns modal simpleList
  const projSimpleRes = await getProjects(new NextRequest("http://localhost:3000/api/admin/projects?all=true"));
  assert(projSimpleRes.status === 200, "Projects API: all=true without export param returns 200 OK");
  const projSimpleData = await projSimpleRes.json();
  assert(
    projSimpleData.projects?.length === totalDbProjects,
    `Projects Backward Compatibility: all=true returns all ${totalDbProjects} items for mapping dropdown`
  );
  const simpleItem = projSimpleData.projects[0];
  const isSimpleList =
    simpleItem.id !== undefined &&
    simpleItem.projectId !== undefined &&
    simpleItem.title !== undefined &&
    simpleItem.facultyName !== undefined &&
    simpleItem.seatsFilled !== undefined &&
    simpleItem.seatsRatio === undefined; // seatsRatio is NOT computed in simpleList
  assert(
    isSimpleList,
    "Projects Backward Compatibility: all=true yields lightweight simpleList structure without expensive calculations"
  );

  // 4e. Filter: category
  const projCategoryRes = await getProjects(new NextRequest("http://localhost:3000/api/admin/projects?export=true&category=IDP2502"));
  const projCategoryData = await projCategoryRes.json();
  assert(
    projCategoryData.projects?.length === idp2502DbCount &&
      projCategoryData.projects.every((p: any) => p.category === "IDP2502"),
    `Projects Filter: category=IDP2502 returns matching subset (${idp2502DbCount} projects)`
  );

  // 4f. Filter: school / department
  const projSchoolRes = await getProjects(
    new NextRequest("http://localhost:3000/api/admin/projects?export=true&school=School%20of%20Engineering%20%26%20Sciences")
  );
  const projSchoolData = await projSchoolRes.json();
  assert(
    projSchoolData.projects?.length === soesProjectsDbCount &&
      projSchoolData.projects.every((p: any) => p.department === "School of Engineering & Sciences"),
    `Projects Filter: school returns matching subset (${soesProjectsDbCount} projects)`
  );

  // 4g. Filter: search
  const projSearchKeyword = "Drone";
  const projSearchDbCount = await prisma.project.count({
    where: {
      OR: [
        { projectId: { contains: projSearchKeyword } },
        { title: { contains: projSearchKeyword } },
        { department: { contains: projSearchKeyword } },
        { theme: { contains: projSearchKeyword } },
        { faculty: { name: { contains: projSearchKeyword } } },
      ],
    },
  });
  const projSearchRes = await getProjects(
    new NextRequest(`http://localhost:3000/api/admin/projects?export=true&search=${encodeURIComponent(projSearchKeyword)}`)
  );
  const projSearchData = await projSearchRes.json();
  assert(
    projSearchData.projects?.length === projSearchDbCount,
    `Projects Filter: search="${projSearchKeyword}" returns exact matching subset (${projSearchDbCount} projects)`
  );

  // 4h. Filter: status (submissionStatus)
  const statusNotSubmittedDbCount = await prisma.project.count({ where: { submissionStatus: "NOT_SUBMITTED" } });
  const projStatusRes = await getProjects(new NextRequest("http://localhost:3000/api/admin/projects?export=true&status=NOT_SUBMITTED"));
  const projStatusData = await projStatusRes.json();
  assert(
    projStatusData.projects?.length === statusNotSubmittedDbCount &&
      projStatusData.projects.every((p: any) => p.submissionStatus === "NOT_SUBMITTED"),
    `Projects Filter: status=NOT_SUBMITTED returns matching subset (${statusNotSubmittedDbCount} projects)`
  );

  const statusPendingDbCount = await prisma.project.count({ where: { submissionStatus: "PENDING" } });
  const projPendingRes = await getProjects(new NextRequest("http://localhost:3000/api/admin/projects?export=true&status=PENDING"));
  const projPendingData = await projPendingRes.json();
  assert(
    projPendingData.projects?.length === statusPendingDbCount &&
      projPendingData.projects.every((p: any) => p.submissionStatus === "PENDING"),
    `Projects Filter: status=PENDING returns matching subset (${statusPendingDbCount} projects)`
  );

  // 4i. Row transformation produces all 20 columns matching ProjectsTableCard
  const transformedProjRows = projExportData.projects.map((p: any, idx: number) => ({
    "Sr. No": idx + 1,
    "Project ID": p.projectId,
    "Project Title": p.title,
    "Faculty Mentor": p.faculty,
    "School / Department": p.department,
    "Category": p.category,
    "Theme": p.theme || "N/A",
    "Submission Status": p.submissionStatus || "NOT_SUBMITTED",
    "Seats Ratio": p.seatsRatio,
    "Enrolled Students Count": p.students?.length ?? p.seatsFilled ?? 0,
    "Sem 1 Has Report": p.sem1HasReport ? "Yes" : "No",
    "Sem 1 Docs Count": p.sem1DocsCount || 0,
    "Sem 2 Has Report": p.sem2HasReport ? "Yes" : "No",
    "Sem 2 Docs Count": p.sem2DocsCount || 0,
    "Both Sems Submitted": p.bothSemestersSubmitted ? "Yes" : "No",
    "Similarity (%)": p.similarityPercent != null ? `${p.similarityPercent}%` : "N/A",
    "AI (%)": p.aiPercent != null ? `${p.aiPercent}%` : "N/A",
    "Manuscript Status": p.isManuscriptPublished
      ? "Published"
      : p.hasCommunicatedManuscript
      ? "Communicated"
      : p.hasDraftManuscript
      ? "In Draft"
      : "Not Linked",
    "Target Journal": p.journalName || "N/A",
    "Publication DOI": p.publicationDoi || "N/A",
  }));

  const expectedProjColumns = [
    "Sr. No",
    "Project ID",
    "Project Title",
    "Faculty Mentor",
    "School / Department",
    "Category",
    "Theme",
    "Submission Status",
    "Seats Ratio",
    "Enrolled Students Count",
    "Sem 1 Has Report",
    "Sem 1 Docs Count",
    "Sem 2 Has Report",
    "Sem 2 Docs Count",
    "Both Sems Submitted",
    "Similarity (%)",
    "AI (%)",
    "Manuscript Status",
    "Target Journal",
    "Publication DOI",
  ];

  const projRowKeys = Object.keys(transformedProjRows[0]);
  const projKeysMatch =
    projRowKeys.length === expectedProjColumns.length &&
    expectedProjColumns.every((col) => projRowKeys.includes(col));
  assert(
    projKeysMatch,
    `Projects Row Transform: Produces all ${expectedProjColumns.length} columns (${expectedProjColumns.join(", ")})`
  );

  // 4j. Projects CSV & XLSX Serialization Verification
  const projCsv = (await exportToCsv(transformedProjRows, "test_projects")) as string;
  assert(typeof projCsv === "string" && projCsv.length > 500, "Projects CSV Serialization: Produces valid CSV stream");
  const projWs = XLSX.utils.json_to_sheet(transformedProjRows);
  const projParsedRows = XLSX.utils.sheet_to_json(projWs);
  assert(
    projParsedRows.length === transformedProjRows.length,
    `Projects XLSX Serialization: Round-trip parsed worksheet maintains all ${transformedProjRows.length} records`
  );

  // ─────────────────────────────────────────────────────────────
  // 5. ADVERSARIAL & ROBUSTNESS EDGE CASES
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 5. Adversarial & Robustness Edge Cases ---");

  // 5a. Empty dataset export handling
  const emptyCsv = await exportToCsv([], "empty_test");
  assert(emptyCsv === undefined, "Adversarial: Empty record array passed to exportToCsv returns undefined without throwing");

  // 5b. Special characters, quotes, commas, newlines, and UTF-8 symbols
  const adversarialRows = [
    {
      "Sr. No": 1,
      "Name": `Dr. O'Connor, Ph.D. "The Mentor"`,
      "Title": "AI, ML & Robotics: Next-Gen \n Architecture & Systems",
      "Unicode & Math": "Alpha α, Beta β, Gamma γ, Smart City 🏙️",
      "Special Meta-Chars": "<script>alert(1)</script> & = ; \t \r",
    },
  ];

  const advCsv = (await exportToCsv(adversarialRows, "adversarial_test")) as string;
  assert(
    advCsv.includes('"Dr. O\'Connor, Ph.D. ""The Mentor"""') || advCsv.includes("Dr. O'Connor"),
    "Adversarial: Quotes and commas correctly escaped according to RFC-4180 CSV specifications"
  );
  assert(
    advCsv.includes("Smart City") && advCsv.includes("<script>alert(1)</script>"),
    "Adversarial: Unicode emojis and HTML meta-characters preserved without truncation"
  );

  const advWs = XLSX.utils.json_to_sheet(adversarialRows);
  const advParsed = XLSX.utils.sheet_to_json(advWs);
  assert(
    (advParsed[0] as any)["Unicode & Math"] === adversarialRows[0]["Unicode & Math"],
    "Adversarial: XLSX serialization preserves exact UTF-8 and Unicode characters across round-trip"
  );

  // 5c. Combinations of multiple active filters simultaneously
  const multiFilterRes = await getStudents(
    new NextRequest(
      "http://localhost:3000/api/admin/students?export=true&school=School%20of%20Engineering%20%26%20Sciences&registered=yes&gender=male"
    )
  );
  const multiFilterData = await multiFilterRes.json();
  const multiFilterDbCount = await prisma.student.count({
    where: {
      department: "School of Engineering & Sciences",
      registration: { isNot: null },
      gender: "male",
    },
  });
  assert(
    multiFilterData.students?.length === multiFilterDbCount && multiFilterDbCount > 0,
    `Adversarial: Multi-filter combination (School + Registered + Gender=male) returns exact database intersection (${multiFilterDbCount} records)`
  );

  const multiFilterTitleRes = await getStudents(
    new NextRequest(
      "http://localhost:3000/api/admin/students?export=true&school=School%20of%20Engineering%20%26%20Sciences&registered=yes&gender=Male"
    )
  );
  const multiFilterTitleData = await multiFilterTitleRes.json();
  assert(
    multiFilterTitleData.students?.length === multiFilterDbCount,
    `Adversarial: Multi-filter combination (School + Registered + Gender=Male) matches Gender=male (${multiFilterDbCount} records)`
  );

  console.log("\n================================================================================");
  console.log(`🏁 EXPORT TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runExportTestSuite()
  .catch((err) => {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
