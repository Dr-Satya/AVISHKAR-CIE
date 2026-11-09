/**
 * Automated Verification Test for Milestone 2: SPOC Dashboard & APIs Fixes
 */

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

async function runSpocTests() {
  console.log("================================================================================");
  console.log("🧪 TESTING: SPOC DASHBOARD & APIS FIXES (MILESTONE 2)");
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

  const { signSessionToken } = await import("../lib/auth");
  const { GET: getSpocDept } = await import("../app/api/spoc/department/route");

  try {
    // Test 1: Unauthorized Access
    currentSessionCookie = null;
    const unauthRes = await getSpocDept(
      new NextRequest("http://localhost:3000/api/spoc/department?department=School%20of%20Engineering%20%26%20Sciences")
    );
    assert(unauthRes.status === 401, "Security: Unauthenticated access returns 401");

    // Test 2: Admin Access to SPOC department route
    const adminToken = await signSessionToken({
      id: "admin_test",
      role: "ADMIN",
      email: "admin@gdgu.org",
      name: "Admin User",
    });
    currentSessionCookie = adminToken;

    const dept = "School of Engineering & Sciences";
    const res = await getSpocDept(
      new NextRequest(`http://localhost:3000/api/spoc/department?department=${encodeURIComponent(dept)}`)
    );
    assert(res.status === 200, "SPOC Department API: Admin query returns 200 OK");

    const data = await res.json();
    assert(data.department === dept, `SPOC Department API: returns requested department "${dept}"`);

    // Test 3: KPIs structure and accuracy
    const kpis = data.kpis;
    assert(typeof kpis.totalProjects === "number", `KPIs: totalProjects is number (${kpis.totalProjects})`);
    assert(typeof kpis.totalFaculty === "number", `KPIs: totalFaculty is number (${kpis.totalFaculty})`);
    assert(typeof kpis.facultyWithStudentsCount === "number", `KPIs: facultyWithStudentsCount is number (${kpis.facultyWithStudentsCount})`);
    assert(kpis.facultyWithStudentsCount <= kpis.totalFaculty, "KPIs: facultyWithStudentsCount <= totalFaculty");
    assert(typeof kpis.totalStudents === "number", `KPIs: totalStudents is number (${kpis.totalStudents})`);
    assert(typeof kpis.pendingCount === "number", `KPIs: pendingCount is number (${kpis.pendingCount})`);
    assert(typeof kpis.facultyMarksSharedCount === "number", `KPIs: facultyMarksSharedCount is number (${kpis.facultyMarksSharedCount})`);
    assert(typeof kpis.facultyMarksPartialCount === "number", `KPIs: facultyMarksPartialCount is number (${kpis.facultyMarksPartialCount})`);
    assert(typeof kpis.facultyMarksPendingCount === "number", `KPIs: facultyMarksPendingCount is number (${kpis.facultyMarksPendingCount})`);
    assert(typeof kpis.departmentEnrolledStudents === "number", `KPIs: departmentEnrolledStudents is number (${kpis.departmentEnrolledStudents})`);
    assert(typeof kpis.departmentUnregisteredStudents === "number", `KPIs: departmentUnregisteredStudents is number (${kpis.departmentUnregisteredStudents})`);

    // Verify cohort database counts match
    const dbEnrolled = await prisma.student.count({
      where: { department: { in: ["School of Engineering & Sciences", "SOES"] } },
    });
    const dbUnregistered = await prisma.student.count({
      where: {
        department: { in: ["School of Engineering & Sciences", "SOES"] },
        registration: null,
      },
    });
    assert(kpis.departmentEnrolledStudents === dbEnrolled, `KPIs: departmentEnrolledStudents (${kpis.departmentEnrolledStudents}) matches DB (${dbEnrolled})`);
    assert(kpis.departmentUnregisteredStudents === dbUnregistered, `KPIs: departmentUnregisteredStudents (${kpis.departmentUnregisteredStudents}) matches DB (${dbUnregistered})`);

    // Test 4: Active Faculty Mentors Count
    const activeFaculty = data.faculty.filter((f: any) => f.studentsCount > 0);
    assert(kpis.facultyWithStudentsCount === activeFaculty.length, `KPIs: facultyWithStudentsCount (${kpis.facultyWithStudentsCount}) matches active faculty with students (${activeFaculty.length})`);
    assert(
      kpis.facultyMarksSharedCount + kpis.facultyMarksPartialCount + kpis.facultyMarksPendingCount === activeFaculty.length,
      `KPIs: shared + partial + pending marks sum (${kpis.facultyMarksSharedCount + kpis.facultyMarksPartialCount + kpis.facultyMarksPendingCount}) equals active faculty count (${activeFaculty.length})`
    );

    // Test 5: Gender in Student Roster
    const students = data.students;
    assert(Array.isArray(students) && students.length > 0, `Student Roster: returned ${students.length} students`);
    const allHaveGender = students.every((s: any) => typeof s.gender === "string" && s.gender.length > 0);
    assert(allHaveGender, "Student Roster: every student record includes normalized gender string");

    const validGenders = new Set(["Male", "Female", "Other", "Unspecified"]);
    const allValidGenders = students.every((s: any) => validGenders.has(s.gender));
    assert(allValidGenders, "Student Roster: all gender values are normalized to TitleCase (Male, Female, Other, Unspecified)");

    const femaleCount = students.filter((s: any) => s.gender === "Female").length;
    const maleCount = students.filter((s: any) => s.gender === "Male").length;
    const unspecifiedCount = students.filter((s: any) => s.gender === "Unspecified").length;
    console.log(`     Gender distribution in SPOC roster: Female: ${femaleCount}, Male: ${maleCount}, Unspecified: ${unspecifiedCount}`);
    assert(femaleCount > 0 && maleCount > 0, "Student Roster: correctly identifies both Male and Female students in cohort");

    // Test 6: Gender in Project Students List
    const projects = data.projects;
    assert(Array.isArray(projects) && projects.length > 0, `Projects: returned ${projects.length} projects`);
    const firstProjWithStudents = projects.find((p: any) => p.students && p.students.length > 0);
    assert(!!firstProjWithStudents, "Projects: found project with enrolled students");
    if (firstProjWithStudents) {
      const projStudentsHaveGender = firstProjWithStudents.students.every(
        (s: any) => typeof s.gender === "string" && validGenders.has(s.gender)
      );
      assert(projStudentsHaveGender, "Project Embedded Students: every student includes normalized gender");
    }

    // Test 7: Marks Submission Logic — Legitimate Mark of 0 vs Unsubmitted
    // Create a temporary project and faculty to test marks submission edge case
    const runId = `test_spoc_${Date.now()}`;
    const testFac = await prisma.faculty.create({
      data: {
        name: `Prof. Marks Tester ${runId}`,
        email: `spoc_tester_${runId}@gdgu.org`,
        department: "School of Engineering & Sciences",
        passcodeHash: "$2a$10$xyz",
      },
    });

    const testProj = await prisma.project.create({
      data: {
        projectId: `P_SPOC_${runId.slice(-4)}`,
        title: `SPOC Marks Zero Verification ${runId}`,
        category: "IDP2501",
        theme: "Testing",
        department: "School of Engineering & Sciences",
        facultyId: testFac.id,
        submissionStatus: "PENDING",
      },
    });

    const testStd = await prisma.student.create({
      data: {
        enrollmentNumber: `EN_SPOC_${runId}`,
        name: `Student Zero ${runId}`,
        department: "School of Engineering & Sciences",
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

    // Case 7a: Before audit log (marks unsubmitted / default 0)
    const resBefore = await getSpocDept(
      new NextRequest(`http://localhost:3000/api/spoc/department?department=${encodeURIComponent(dept)}`)
    );
    const dataBefore = await resBefore.json();
    const facBefore = dataBefore.faculty.find((f: any) => f.id === testFac.id);
    assert(facBefore?.marksStatus === "NOT_SHARED", "Marks Logic: 0 marks without submission audit correctly classified as NOT_SHARED");

    // Case 7b: After faculty submits marks with legitimate 0 (AuditLog recorded)
    const marksAudit = await prisma.auditLog.create({
      data: {
        actor: testFac.name,
        actorRole: "FACULTY",
        action: "FACULTY_MARKS_SHARED",
        target: testProj.projectId,
        metadata: JSON.stringify({ count: 1, projectId: testProj.id }),
      },
    });

    const resAfter = await getSpocDept(
      new NextRequest(`http://localhost:3000/api/spoc/department?department=${encodeURIComponent(dept)}`)
    );
    const dataAfter = await resAfter.json();
    const facAfter = dataAfter.faculty.find((f: any) => f.id === testFac.id);
    assert(facAfter?.marksStatus === "SHARED", "Marks Logic: legitimate mark of 0 with FACULTY_MARKS_SHARED audit correctly classified as SHARED");

    // Clean up test entities
    await prisma.auditLog.delete({ where: { id: marksAudit.id } });
    await prisma.registration.deleteMany({ where: { projectId: testProj.id } });
    await prisma.student.delete({ where: { id: testStd.id } });
    await prisma.project.delete({ where: { id: testProj.id } });
    await prisma.faculty.delete({ where: { id: testFac.id } });
    assert(true, "Cleanup: temporary test entities cleanly removed");

  } catch (err: any) {
    console.error("Test execution error:", err);
    failed++;
  }

  console.log("================================================================================");
  if (failed === 0) {
    console.log(`🏁 SPOC TEST SUITE COMPLETED: ${passed} PASSED, 0 FAILED`);
  } else {
    console.error(`💥 SPOC TEST SUITE FAILED: ${passed} PASSED, ${failed} FAILED`);
    process.exit(1);
  }
}

runSpocTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
