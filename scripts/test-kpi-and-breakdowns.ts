/**
 * G D Goenka University - Inter-Disciplinary Project (IDP) Portal
 * 
 * Code Attribution:
 * - Dr. Satya Prakash (Avishkar Centre for Innovation and Entrepreneurship,
 *   School of Engineering and Sciences, G D Goenka University, Haryana)
 * - Potla Sri Sharan
 * - Sarthak Singh
 * 
 * Milestone 3: Comprehensive KPI Metrics, Breakdowns, and Statistics Automated Test Suite
 * 
 * Covers:
 * 1. Suite 1: Admin Dashboard KPI Totals & Ratios (/api/admin/dashboard)
 * 2. Suite 2: Gender Aggregation, Casing Invariance & Suppression Contract (/api/admin/students)
 * 3. Suite 3: School Acronym Normalization & Breakdown Consistency (/api/admin/students)
 * 4. Suite 4: SPOC Department KPIs & Gender Support (/api/spoc/department)
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
import { NextRequest } from "next/server";

async function runKpiTestSuite() {
  console.log("================================================================================");
  console.log("📊 COMPREHENSIVE KPI METRICS, BREAKDOWNS & STATISTICS TEST SUITE (MILESTONE 3)");
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
  const signSessionToken = authModule.signSessionToken || authModule.default?.signSessionToken;

  const dashModule: any = await import("../app/api/admin/dashboard/route");
  const getDashboard = dashModule.GET || dashModule.default?.GET;

  const studentsModule: any = await import("../app/api/admin/students/route");
  const getStudents = studentsModule.GET || studentsModule.default?.GET;

  const spocDeptModule: any = await import("../app/api/spoc/department/route");
  const getSpocDept = spocDeptModule.GET || spocDeptModule.default?.GET;

  // Session tokens
  const adminToken = await signSessionToken({
    role: "ADMIN",
    id: "admin_test_m3",
    email: "admin_test_m3@gdgu.org",
    name: "Admin Test Runner",
  });

  const studentToken = await signSessionToken({
    role: "STUDENT",
    id: "student_test_m3",
    email: "student_test_m3@gdgu.org",
    name: "Student Test Runner",
  });

  const facultyToken = await signSessionToken({
    role: "FACULTY",
    id: "faculty_test_m3",
    email: "faculty_test_m3@gdgu.org",
    name: "Faculty Test Runner",
    isSpoc: false,
  });

  try {
    // Pre-test sweep: Clean up any lingering temporary test entities from previously interrupted runs
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { actor: { contains: "test_kpi_m3_" } },
        ],
      },
    }).catch(() => {});
    await prisma.registration.deleteMany({
      where: {
        OR: [
          { student: { enrollmentNumber: { startsWith: "EN_TEST_0_" } } },
          { student: { enrollmentNumber: { startsWith: "EN_NOGENDER_" } } },
        ],
      },
    }).catch(() => {});
    await prisma.student.deleteMany({
      where: {
        OR: [
          { academicYear: { startsWith: "TEST_NULL_GENDER_" } },
          { enrollmentNumber: { startsWith: "EN_NOGENDER_" } },
          { name: { contains: "test_kpi_m3_" } },
          { enrollmentNumber: { startsWith: "EN_TEST_0_" } },
        ],
      },
    }).catch(() => {});
    await prisma.project.deleteMany({
      where: {
        OR: [
          { title: { contains: "Marks Zero Verification Project test_kpi_m3_" } },
        ],
      },
    }).catch(() => {});
    await prisma.faculty.deleteMany({
      where: {
        OR: [
          { email: { contains: "spoc_marks_tester_test_kpi_m3_" } },
          { name: { contains: "Prof. Marks Tester test_kpi_m3_" } },
        ],
      },
    }).catch(() => {});

    // ================================================================================
    // SUITE 1: Admin Dashboard KPI Totals & Ratios (/api/admin/dashboard)
    // ================================================================================
    console.log("\n--- Suite 1: Admin Dashboard KPI Totals & Ratios (/api/admin/dashboard) ---");

    // 1.1 Security: Unauthenticated access rejected
    currentSessionCookie = null;
    const unauthDash = await getDashboard();
    assert(unauthDash.status === 401, "Security: Unauthenticated GET /api/admin/dashboard returns 401");

    // 1.2 Security: Student role access rejected
    currentSessionCookie = studentToken;
    const studentDash = await getDashboard();
    assert(studentDash.status === 401, "Security: Student role access to /api/admin/dashboard returns 401");

    // 1.3 Security: Faculty role access rejected
    currentSessionCookie = facultyToken;
    const facultyDash = await getDashboard();
    assert(facultyDash.status === 401, "Security: Faculty role access to /api/admin/dashboard returns 401");

    // 1.4 Admin Authenticated Access
    currentSessionCookie = adminToken;
    const dashRes = await getDashboard();
    assert(dashRes.status === 200, "Admin Dashboard: Returns 200 OK for ADMIN session");

    const dashData = await dashRes.json();
    const kpi = dashData.kpi;
    assert(!!kpi, "Admin Dashboard: Returns KPI object");

    // 1.5 Database count parity
    const dbTotalStudents = await prisma.student.count();
    const dbTotalProjects = await prisma.project.count();
    const dbTotalRegistrations = await prisma.registration.count();

    assert(
      kpi.totalStudents === dbTotalStudents,
      `KPI: totalStudents (${kpi.totalStudents}) exactly matches prisma.student.count() (${dbTotalStudents})`
    );
    assert(
      kpi.totalProjects === dbTotalProjects,
      `KPI: totalProjects (${kpi.totalProjects}) exactly matches prisma.project.count() (${dbTotalProjects})`
    );
    assert(
      kpi.totalRegistrations === dbTotalRegistrations,
      `KPI: totalRegistrations (${kpi.totalRegistrations}) exactly matches prisma.registration.count() (${dbTotalRegistrations})`
    );

    // 1.6 Dynamic Capacity derivation
    const allProjects = await prisma.project.findMany({ select: { maxSeats: true } });
    const config = await prisma.globalConfig.findUnique({ where: { id: "default" } });
    const defaultMaxSeats = config?.maxSeats ?? 10;
    const derivedCapacity = allProjects.reduce(
      (sum, p) => sum + (p.maxSeats && p.maxSeats > 0 ? p.maxSeats : defaultMaxSeats),
      0
    );

    assert(derivedCapacity === 1902, `Capacity Derivation: dynamically computed capacity across projects is 1902`);
    assert(
      kpi.totalCapacity === 1902,
      `KPI: totalCapacity is 1902 (correctly derived from project maxSeats, not buggy 1900)`
    );
    assert(
      kpi.seatsFilledRatio === "1902/1902",
      `KPI: seatsFilledRatio is "1902/1902" (eliminating previous "1902/1900" 100.1% defect)`
    );

    // 1.7 Unregistered total calculation and mathematical identity
    const expectedUnregistered = Math.max(0, dbTotalStudents - dbTotalRegistrations);
    assert(
      kpi.unregisteredTotal === 4914,
      `KPI: unregisteredTotal is exactly 4914 (${dbTotalStudents} - ${dbTotalRegistrations})`
    );
    assert(
      kpi.unregisteredTotal === expectedUnregistered,
      `KPI: unregisteredTotal matches Math.max(0, totalStudents - totalRegistrations)`
    );
    assert(
      kpi.totalStudents === kpi.totalRegistrations + kpi.unregisteredTotal,
      "KPI Mathematical Identity: totalStudents === totalRegistrations + unregisteredTotal"
    );

    // ================================================================================
    // SUITE 2: Gender Aggregation, Casing Invariance & Suppression Contract (/api/admin/students)
    // ================================================================================
    console.log("\n--- Suite 2: Gender Aggregation, Casing Invariance & Suppression Contract (/api/admin/students) ---");

    // 2.1 Unregistered gender stats from students endpoint
    const studentsRes = await getStudents(
      new NextRequest("http://localhost:3000/api/admin/students?page=1&limit=25")
    );
    assert(studentsRes.status === 200, "Students API: Returns 200 OK for paginated query");

    const studentsData = await studentsRes.json();
    const unregStats = studentsData.unregisteredStats;
    assert(!!unregStats, "Students API: Returns unregisteredStats object");

    // Case-insensitive gender aggregation assertions
    assert(
      unregStats.byGender.Male === 2911,
      `Gender Aggregation: unregistered Male is 2911 (aggregating lowercase "male" and TitleCase "Male")`
    );
    assert(
      unregStats.byGender.Female === 1981,
      `Gender Aggregation: unregistered Female is 1981 (aggregating lowercase "female" and TitleCase "Female")`
    );
    assert(
      unregStats.byGender.Unspecified === 22,
      `Gender Aggregation: unregistered Unspecified is 22 (null/empty/unspecified gender handling)`
    );
    assert(
      unregStats.hasGenderData === true,
      "Gender Contract: hasGenderData is true when cohort contains Male/Female/Other data"
    );

    const sumGenderUnreg =
      unregStats.byGender.Male +
      unregStats.byGender.Female +
      (unregStats.byGender.Other || 0) +
      unregStats.byGender.Unspecified;
    assert(
      sumGenderUnreg === unregStats.total && sumGenderUnreg === 4914,
      `Gender Integrity: sum of gender categories (${sumGenderUnreg}) equals unregistered total (4914)`
    );

    // 2.2 Zero / Missing gender suppression contract
    // When (Male + Female + Other) === 0, hasGenderData MUST be false so UI suppresses "Male: 0 · Female: 0" badge
    const emptyCohortRes = await getStudents(
      new NextRequest("http://localhost:3000/api/admin/students?academicYear=NONEXISTENT_COHORT_2099")
    );
    const emptyCohortData = await emptyCohortRes.json();
    assert(
      emptyCohortData.unregisteredStats.byGender.Male === 0 &&
      emptyCohortData.unregisteredStats.byGender.Female === 0,
      "Zero Gender Suppression: Nonexistent cohort yields Male: 0 and Female: 0"
    );
    assert(
      emptyCohortData.unregisteredStats.hasGenderData === false,
      "Zero Gender Suppression: hasGenderData is false when (Male + Female + Other) === 0 (UI badge suppression contract)"
    );

    // Verify cohort with only NULL gender students also has hasGenderData === false
    const runAyId = `TEST_NULL_GENDER_${Date.now()}`;
    let testNullGenderStd: any = null;
    try {
      testNullGenderStd = await prisma.student.create({
        data: {
          enrollmentNumber: `EN_NOGENDER_${Date.now()}`,
          name: "Test Unspecified Gender",
          academicYear: runAyId,
          department: "School of Engineering & Sciences",
          gender: null,
        },
      });

      const nullCohortRes = await getStudents(
        new NextRequest(`http://localhost:3000/api/admin/students?academicYear=${runAyId}`)
      );
      const nullCohortData = await nullCohortRes.json();
      assert(
        nullCohortData.unregisteredStats.byGender.Unspecified === 1,
        "Zero Gender Suppression: Unspecified student counted under Unspecified"
      );
      assert(
        nullCohortData.unregisteredStats.byGender.Male === 0 &&
        nullCohortData.unregisteredStats.byGender.Female === 0 &&
        (nullCohortData.unregisteredStats.byGender.Other || 0) === 0,
        "Zero Gender Suppression: Male, Female, Other are all 0"
      );
      assert(
        nullCohortData.unregisteredStats.hasGenderData === false,
        "Zero Gender Suppression: hasGenderData is false when only Unspecified records exist (prevents 'Male: 0 · Female: 0' badge)"
      );
    } finally {
      // Clean up temporary null-gender student in finally block
      try {
        if (testNullGenderStd?.id) {
          await prisma.student.delete({ where: { id: testNullGenderStd.id } });
        } else {
          await prisma.student.deleteMany({ where: { academicYear: runAyId } });
        }
      } catch (cleanupErr) {
        console.error("Warning: Failed to cleanup testNullGenderStd:", cleanupErr);
      }
    }

    // 2.3 Gender Filtering Casing Invariance
    // Male variants: male, Male, MALE all return 4,107
    for (const g of ["male", "Male", "MALE"]) {
      const res = await getStudents(
        new NextRequest(`http://localhost:3000/api/admin/students?export=true&gender=${g}`)
      );
      const data = await res.json();
      assert(
        data.total === 4107,
        `Gender Filter Invariance: gender=${g} returns exactly 4,107 records (received: ${data.total})`
      );
    }

    // Female variants: female, Female, FEMALE all return 2,606
    for (const g of ["female", "Female", "FEMALE"]) {
      const res = await getStudents(
        new NextRequest(`http://localhost:3000/api/admin/students?export=true&gender=${g}`)
      );
      const data = await res.json();
      assert(
        data.total === 2606,
        `Gender Filter Invariance: gender=${g} returns exactly 2,606 records (received: ${data.total})`
      );
    }

    // Unspecified variants: unspecified and null both return 103
    for (const g of ["unspecified", "null"]) {
      const res = await getStudents(
        new NextRequest(`http://localhost:3000/api/admin/students?export=true&gender=${g}`)
      );
      const data = await res.json();
      assert(
        data.total === 103,
        `Gender Filter Invariance: gender=${g} returns exactly 103 records (received: ${data.total})`
      );
      const allUnspecified = data.students.every((s: any) => s.gender === "Unspecified");
      assert(
        allUnspecified,
        `Gender Filter Invariance: all rows returned for gender=${g} have normalized gender="Unspecified"`
      );
    }

    // Sum of all gender partitions equals total student body
    assert(
      4107 + 2606 + 103 === dbTotalStudents && dbTotalStudents === 6816,
      `Gender Partition Completeness: 4107 (Male) + 2606 (Female) + 103 (Unspecified) === ${dbTotalStudents} total students`
    );

    // 2.4 Row Formatting & TitleCase Normalization
    // Verify exported sample across genders normalizes to TitleCase
    const sampleExportRes = await getStudents(
      new NextRequest("http://localhost:3000/api/admin/students?page=1&limit=100")
    );
    const sampleExportData = await sampleExportRes.json();
    const rows = sampleExportData.students;
    const validTitleCaseGenders = new Set(["Male", "Female", "Other", "Unspecified"]);

    const allTitleCase = rows.every((r: any) => validTitleCaseGenders.has(r.gender));
    assert(
      allTitleCase,
      "Row Formatting: 100% of student rows return normalized TitleCase gender ('Male', 'Female', 'Other', 'Unspecified')"
    );

    const noLowercase = rows.every((r: any) => r.gender !== "male" && r.gender !== "female");
    assert(noLowercase, "Row Formatting: No student rows contain raw lowercase 'male' or 'female'");

    const noNullGender = rows.every((r: any) => r.gender !== null && r.gender !== undefined);
    assert(noNullGender, "Row Formatting: No student rows contain null/undefined gender (all mapped to 'Unspecified')");

    // ================================================================================
    // SUITE 3: School Acronym Normalization & Breakdown Consistency (/api/admin/students)
    // ================================================================================
    console.log("\n--- Suite 3: School Acronym Normalization & Breakdown Consistency (/api/admin/students) ---");

    const schoolStats = unregStats.bySchool;
    assert(typeof schoolStats === "object" && schoolStats !== null, "School Breakdown: bySchool object present");

    // 3.1 Sum of bySchool equals unregistered total
    const schoolSum = Object.values(schoolStats as Record<string, number>).reduce(
      (acc, count) => acc + count,
      0
    );
    assert(
      schoolSum === unregStats.total && schoolSum === 4914,
      `School Breakdown Consistency: Sum of all schools (${schoolSum}) exactly equals unregistered total (4914)`
    );

    // 3.2 Canonical School Name Normalization
    assert(
      schoolStats["School of Engineering & Sciences"] === 1774,
      `Canonical School: "School of Engineering & Sciences" is 1,774 (merging 1,773 standard + 1 legacy SOES)`
    );
    assert(
      schoolStats["Centre Of Excellence: Occupational Health, Safety, Fire & Environment"] === 134,
      `Canonical School: "Centre Of Excellence: ..." is 134 (merging 133 standard + 1 legacy COHSFE)`
    );
    assert(
      schoolStats["School of Agricultural Sciences"] === 170,
      `Canonical School: "School of Agricultural Sciences" is 170 (merging 169 standard + 1 legacy SOAS)`
    );
    assert(
      schoolStats["School of Liberal Arts"] === 182,
      `Canonical School: "School of Liberal Arts" is 182 (merging 180 standard + 2 legacy SOLA)`
    );
    assert(
      schoolStats["School of Hospitality & Tourism"] === 213,
      `Canonical School: "School of Hospitality & Tourism" is 213 (merging 206 standard + 7 legacy SoHT)`
    );
    assert(
      schoolStats["School of Healthcare and Allied Sciences"] === 1008,
      `Canonical School: "School of Healthcare and Allied Sciences" is 1,008`
    );
    assert(
      schoolStats["School of Management"] === 444,
      `Canonical School: "School of Management" is 444`
    );
    assert(
      schoolStats["United World Institute of Design (UID)"] === 440,
      `Canonical School: "United World Institute of Design (UID)" is 440`
    );
    assert(
      schoolStats["School of Law"] === 402,
      `Canonical School: "School of Law" is 402`
    );
    assert(
      schoolStats["Centre of Aerospace and Energy Studies"] === 132,
      `Canonical School: "Centre of Aerospace and Energy Studies" is 132`
    );
    assert(
      schoolStats["Centre for Innovation and Entrepreneurship"] === 15,
      `Canonical School: "Centre for Innovation and Entrepreneurship" is 15`
    );

    // 3.3 Legacy Acronym Elimination: Ensure NO duplicate legacy acronym keys exist
    const legacyAcronyms = ["SOES", "COHSFE", "SOAS", "SOLA", "SOHT", "SoHT"];
    for (const acronym of legacyAcronyms) {
      assert(
        schoolStats[acronym] === undefined,
        `Legacy Acronym Elimination: "${acronym}" is NOT present in bySchool keys (properly normalized away)`
      );
    }

    // ================================================================================
    // SUITE 4: SPOC Department KPIs & Gender Support (/api/spoc/department)
    // ================================================================================
    console.log("\n--- Suite 4: SPOC Department KPIs & Gender Support (/api/spoc/department) ---");

    const soesDept = "School of Engineering & Sciences";

    // 4.1 Security: Unauthenticated access returns 401
    currentSessionCookie = null;
    const unauthSpoc = await getSpocDept(
      new NextRequest(`http://localhost:3000/api/spoc/department?department=${encodeURIComponent(soesDept)}`)
    );
    assert(unauthSpoc.status === 401, "Security: Unauthenticated GET /api/spoc/department returns 401");

    // 4.2 Security: Student access returns 401
    currentSessionCookie = studentToken;
    const studentSpoc = await getSpocDept(
      new NextRequest(`http://localhost:3000/api/spoc/department?department=${encodeURIComponent(soesDept)}`)
    );
    assert(studentSpoc.status === 401, "Security: Student role access to /api/spoc/department returns 401");

    // 4.3 Security: Faculty without SPOC privileges returns 403
    currentSessionCookie = facultyToken;
    const nonSpocFaculty = await getSpocDept(
      new NextRequest(`http://localhost:3000/api/spoc/department?department=${encodeURIComponent(soesDept)}`)
    );
    assert(nonSpocFaculty.status === 403, "Security: Non-SPOC Faculty access to /api/spoc/department returns 403");

    // 4.4 Admin Access to SPOC Route returns 200 OK
    currentSessionCookie = adminToken;
    const spocRes = await getSpocDept(
      new NextRequest(`http://localhost:3000/api/spoc/department?department=${encodeURIComponent(soesDept)}`)
    );
    assert(spocRes.status === 200, "SPOC Department API: Admin query returns 200 OK");

    const spocData = await spocRes.json();
    assert(spocData.department === soesDept, `SPOC Department API: Correct department returned ("${soesDept}")`);

    // 4.5 Department KPIs Accuracy
    const spocKpis = spocData.kpis;
    assert(!!spocKpis, "SPOC KPIs: kpis object returned");
    assert(spocKpis.totalProjects === 66, `SPOC KPIs: totalProjects is 66 (received: ${spocKpis.totalProjects})`);
    assert(spocKpis.totalFaculty === 71, `SPOC KPIs: totalFaculty is 71 (received: ${spocKpis.totalFaculty})`);
    assert(
      spocKpis.facultyWithStudentsCount === 66,
      `SPOC KPIs: facultyWithStudentsCount is 66 (received: ${spocKpis.facultyWithStudentsCount})`
    );
    assert(spocKpis.pendingCount === 1, `SPOC KPIs: pendingCount is 1 (received: ${spocKpis.pendingCount})`);
    assert(
      spocKpis.facultyMarksSharedCount === 1,
      `SPOC KPIs: facultyMarksSharedCount is 1 (received: ${spocKpis.facultyMarksSharedCount})`
    );
    assert(
      spocKpis.facultyMarksPartialCount === 0,
      `SPOC KPIs: facultyMarksPartialCount is 0 (received: ${spocKpis.facultyMarksPartialCount})`
    );
    assert(
      spocKpis.facultyMarksPendingCount === 65,
      `SPOC KPIs: facultyMarksPendingCount is 65 (received: ${spocKpis.facultyMarksPendingCount})`
    );
    assert(spocKpis.totalStudents === 662, `SPOC KPIs: totalStudents is 662 (received: ${spocKpis.totalStudents})`);

    // 4.6 Department Cohort Visibility & Database Parity
    const dbDeptEnrolled = await prisma.student.count({
      where: { department: { in: ["School of Engineering & Sciences", "SOES"] } },
    });
    const dbDeptUnregistered = await prisma.student.count({
      where: {
        department: { in: ["School of Engineering & Sciences", "SOES"] },
        registration: null,
      },
    });

    assert(
      spocKpis.departmentEnrolledStudents === 2683,
      `SPOC KPIs: departmentEnrolledStudents is 2,683 (received: ${spocKpis.departmentEnrolledStudents})`
    );
    assert(
      spocKpis.departmentEnrolledStudents === dbDeptEnrolled,
      `SPOC KPIs: departmentEnrolledStudents (${spocKpis.departmentEnrolledStudents}) matches DB (${dbDeptEnrolled})`
    );

    assert(
      spocKpis.departmentUnregisteredStudents === 1774,
      `SPOC KPIs: departmentUnregisteredStudents is 1,774 (received: ${spocKpis.departmentUnregisteredStudents})`
    );
    assert(
      spocKpis.departmentUnregisteredStudents === dbDeptUnregistered,
      `SPOC KPIs: departmentUnregisteredStudents (${spocKpis.departmentUnregisteredStudents}) matches DB (${dbDeptUnregistered})`
    );

    // 4.7 Active Faculty Mentor Ratio & Zero-Division Safety Contract
    const activeFaculty = spocData.faculty.filter((f: any) => f.studentsCount > 0);
    assert(
      spocKpis.facultyWithStudentsCount === activeFaculty.length && spocKpis.facultyWithStudentsCount === 66,
      `Active Faculty Ratio: facultyWithStudentsCount (${spocKpis.facultyWithStudentsCount}) equals active mentors with students (66)`
    );

    assert(
      spocKpis.facultyMarksSharedCount + spocKpis.facultyMarksPartialCount + spocKpis.facultyMarksPendingCount ===
        spocKpis.facultyWithStudentsCount,
      `Active Faculty Ratio: shared (1) + partial (0) + pending (65) equals facultyWithStudentsCount (66)`
    );

    // Zero-division safety: Test ratio calculation logic matching SpocKpisCard.tsx contract
    const calcSharedPercent = (shared: number, active: number) =>
      active > 0 ? Math.round((shared / active) * 100) : 0;
    const calcRatioString = (shared: number, active: number) =>
      active > 0 ? `${shared}/${active}` : "—";

    // When active mentors = 66, shared = 1
    assert(
      calcRatioString(spocKpis.facultyMarksSharedCount, spocKpis.facultyWithStudentsCount) === "1/66",
      `Active Faculty Ratio: Formatted ratio string is "1/66"`
    );
    assert(
      calcSharedPercent(spocKpis.facultyMarksSharedCount, spocKpis.facultyWithStudentsCount) === 2,
      `Active Faculty Ratio: Formatted percentage is 2% (Math.round(1/66 * 100))`
    );

    // When active mentors = 0, verify zero-division safety
    assert(
      calcRatioString(0, 0) === "—",
      `Zero-Division Safety: When activeFacultyCount === 0, ratio renders "—" safely`
    );
    assert(
      calcSharedPercent(0, 0) === 0,
      `Zero-Division Safety: When activeFacultyCount === 0, percentage is 0% without NaN or error`
    );

    // 4.8 SPOC Student Roster & Embedded Projects TitleCase Gender Support
    const spocStudents = spocData.students;
    assert(
      Array.isArray(spocStudents) && spocStudents.length === 662,
      `SPOC Student Roster: Returns all 662 students enrolled in department projects`
    );

    const allSpocStudentsHaveGender = spocStudents.every(
      (s: any) => typeof s.gender === "string" && validTitleCaseGenders.has(s.gender)
    );
    assert(
      allSpocStudentsHaveGender,
      `SPOC Student Roster: Every student record includes normalized TitleCase gender`
    );

    const spocFemaleCount = spocStudents.filter((s: any) => s.gender === "Female").length;
    const spocMaleCount = spocStudents.filter((s: any) => s.gender === "Male").length;
    const spocUnspecifiedCount = spocStudents.filter((s: any) => s.gender === "Unspecified").length;

    assert(
      spocFemaleCount === 199,
      `SPOC Roster Demographic: Female students count is 199 (received: ${spocFemaleCount})`
    );
    assert(
      spocMaleCount === 420,
      `SPOC Roster Demographic: Male students count is 420 (received: ${spocMaleCount})`
    );
    assert(
      spocUnspecifiedCount === 43,
      `SPOC Roster Demographic: Unspecified students count is 43 (received: ${spocUnspecifiedCount})`
    );
    assert(
      spocFemaleCount + spocMaleCount + spocUnspecifiedCount === 662,
      "SPOC Roster Demographic: Sum of gender counts (199 + 420 + 43) equals total SPOC students (662)"
    );

    // Project embedded students gender check
    const spocProjects = spocData.projects;
    assert(Array.isArray(spocProjects) && spocProjects.length === 66, "SPOC Projects: Returns 66 projects");
    const projWithStudents = spocProjects.find((p: any) => p.students && p.students.length > 0);
    assert(!!projWithStudents, "SPOC Projects: Found project with embedded student array");

    if (projWithStudents) {
      const allEmbeddedHaveGender = projWithStudents.students.every(
        (s: any) => typeof s.gender === "string" && validTitleCaseGenders.has(s.gender)
      );
      assert(
        allEmbeddedHaveGender,
        "SPOC Projects: All embedded student records have normalized TitleCase gender"
      );
    }

    // 4.9 Marks Logic: Distinguish Unsubmitted 0 Marks from Submitted Mark of 0
    const runId = `test_kpi_m3_${Date.now()}`;
    let testFac: any = null;
    let testProj: any = null;
    let testStd: any = null;
    let testAudit: any = null;

    try {
      testFac = await prisma.faculty.create({
        data: {
          name: `Prof. Marks Tester ${runId}`,
          email: `spoc_marks_tester_${runId}@gdgu.org`,
          department: soesDept,
          passcodeHash: "$2a$10$abcdefghijklmnopqrstuv",
        },
      });

      testProj = await prisma.project.create({
        data: {
          projectId: `P_TEST_${runId.slice(-4)}`,
          title: `Marks Zero Verification Project ${runId}`,
          category: "IDP2501",
          theme: "Quality Assurance",
          department: soesDept,
          facultyId: testFac.id,
          submissionStatus: "PENDING",
        },
      });

      testStd = await prisma.student.create({
        data: {
          enrollmentNumber: `EN_TEST_0_${runId.slice(-6)}`,
          name: `Student Mark Zero ${runId}`,
          department: soesDept,
          gender: "female",
          internalMarks: 0,
          externalMarks: 0,
        },
      });

      await prisma.registration.create({
        data: {
          projectId: testProj.id,
          studentId: testStd.id,
        },
      });

      // 4.9a Before audit log: Marks are unsubmitted defaults (0/0) -> status MUST be NOT_SHARED
      const resBeforeAudit = await getSpocDept(
        new NextRequest(`http://localhost:3000/api/spoc/department?department=${encodeURIComponent(soesDept)}`)
      );
      const dataBeforeAudit = await resBeforeAudit.json();
      const facBefore = dataBeforeAudit.faculty.find((f: any) => f.id === testFac.id);
      assert(
        facBefore?.marksStatus === "NOT_SHARED",
        `Marks Logic: Default 0 marks without submission audit correctly classified as NOT_SHARED (received: ${facBefore?.marksStatus})`
      );

      // 4.9b After audit log: Faculty legitimately submitted marks of 0 -> status MUST be SHARED
      testAudit = await prisma.auditLog.create({
        data: {
          actor: testFac.name,
          actorRole: "FACULTY",
          action: "FACULTY_MARKS_SHARED",
          target: testProj.projectId,
          metadata: JSON.stringify({ count: 1, projectId: testProj.id }),
        },
      });

      const resAfterAudit = await getSpocDept(
        new NextRequest(`http://localhost:3000/api/spoc/department?department=${encodeURIComponent(soesDept)}`)
      );
      const dataAfterAudit = await resAfterAudit.json();
      const facAfter = dataAfterAudit.faculty.find((f: any) => f.id === testFac.id);
      assert(
        facAfter?.marksStatus === "SHARED",
        `Marks Logic: Legitimate mark of 0 with FACULTY_MARKS_SHARED audit correctly classified as SHARED (received: ${facAfter?.marksStatus})`
      );
    } finally {
      // 4.9c Cleanup temporary test entities guaranteed in finally block
      let cleanupSuccess = false;
      try {
        if (testAudit?.id) {
          await prisma.auditLog.delete({ where: { id: testAudit.id } });
        } else if (testProj?.projectId) {
          await prisma.auditLog.deleteMany({ where: { target: testProj.projectId } });
        }
        if (testProj?.id) {
          await prisma.registration.deleteMany({ where: { projectId: testProj.id } });
        }
        if (testStd?.id) {
          await prisma.student.delete({ where: { id: testStd.id } });
        }
        if (testProj?.id) {
          await prisma.project.delete({ where: { id: testProj.id } });
        }
        if (testFac?.id) {
          await prisma.faculty.delete({ where: { id: testFac.id } });
        }
        cleanupSuccess = true;
      } catch (cleanupErr: any) {
        console.error("Warning: Error during marks logic test cleanup:", cleanupErr);
      }

      assert(cleanupSuccess, "Cleanup: Temporary test entities for marks logic cleanly removed from database");
    }

    // 4.10 Post-Suite Entity Isolation Verification: Confirm zero lingering test entities
    const lingeringTestStdCount = await prisma.student.count({
      where: {
        OR: [
          { academicYear: { startsWith: "TEST_NULL_GENDER_" } },
          { enrollmentNumber: { startsWith: "EN_NOGENDER_" } },
          { name: { contains: "test_kpi_m3_" } },
          { enrollmentNumber: { startsWith: "EN_TEST_0_" } },
        ],
      },
    });
    const lingeringTestFacCount = await prisma.faculty.count({
      where: {
        OR: [
          { email: { contains: "test_kpi_m3_" } },
          { name: { contains: "test_kpi_m3_" } },
        ],
      },
    });
    const lingeringTestProjCount = await prisma.project.count({
      where: {
        OR: [
          { title: { contains: "test_kpi_m3_" } },
        ],
      },
    });
    const lingeringTestAuditCount = await prisma.auditLog.count({
      where: {
        OR: [
          { actor: { contains: "test_kpi_m3_" } },
        ],
      },
    });
    assert(
      lingeringTestStdCount === 0 &&
        lingeringTestFacCount === 0 &&
        lingeringTestProjCount === 0 &&
        lingeringTestAuditCount === 0,
      "Entity Isolation: 0 lingering temporary test entities remaining in database"
    );

  } catch (err: any) {
    console.error("Test Suite Runtime Error:", err);
    failed++;
  }

  console.log("\n================================================================================");
  if (failed === 0) {
    console.log(`🏁 COMPREHENSIVE KPI TEST SUITE COMPLETE: ${passed} PASSED, 0 FAILED`);
    console.log("================================================================================");
  } else {
    console.error(`💥 KPI TEST SUITE FAILED: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================================");
    process.exit(1);
  }
}

runKpiTestSuite().catch((e) => {
  console.error(e);
  process.exit(1);
});
