import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import {
  registerStudentForProject,
  resolveProjectLimits,
  executeBulkRegistration,
  normalizeDept,
  getCanonicalDepartment,
  clearProjectQueryCache,
} from "../services/registration.service";
import { exportAllTables, getTableSnapshot } from "../lib/data-management";
import * as path from "path";

async function runComprehensiveAudit() {
  console.log("================================================================================");
  console.log("🧪 STARTING DEEP AUDIT: ALL DATABASE FUNCTIONS & LOGICAL INTEGRITY");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, failureDetails?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
      if (failureDetails) console.error(`     Reason: ${failureDetails}`);
      failed++;
    }
  }

  const testId = `audit_${Date.now()}`;
  const testYear = "2025-2026";
  const testDeptA = "School of Engineering & Sciences";
  const testDeptB = "School of Management";

  try {
    // ─────────────────────────────────────────────────────────────
    // SECTION 1: GLOBAL CONFIG & DEPARTMENT LIMITS
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- SECTION 1: Global Config & Department Limits ---");

    const config = await prisma.globalConfig.findUnique({ where: { id: "default" } });
    assert(!!config, "Default GlobalConfig exists in database");

    // Test resolving limits: Global default
    const globalLimits = await resolveProjectLimits("dummy_id", testDeptA);
    assert(
      globalLimits.source === "GLOBAL" && globalLimits.maxSeats > 0,
      `Global limits resolved correctly (maxSeats: ${globalLimits.maxSeats}, sameDept: ${globalLimits.sameDeptLimit}, otherDept: ${globalLimits.otherDeptLimit})`
    );

    // Test creating Department Limit Override
    const deptLimit = await prisma.departmentRegistrationLimit.upsert({
      where: { department: `TestDept_${testId}` },
      update: { sameDeptLimit: 3, otherDeptLimit: 5 },
      create: { department: `TestDept_${testId}`, sameDeptLimit: 3, otherDeptLimit: 5 },
    });
    clearProjectQueryCache();
    assert(deptLimit.sameDeptLimit === 3 && deptLimit.otherDeptLimit === 5, "DepartmentRegistrationLimit create/upsert succeeded");

    const resolvedDeptOverride = await resolveProjectLimits("dummy_id", `TestDept_${testId}`);
    assert(
      resolvedDeptOverride.source === "DEPARTMENT" && resolvedDeptOverride.sameDeptLimit === 3 && resolvedDeptOverride.otherDeptLimit === 5,
      "resolveProjectLimits prioritizes Department override over Global config"
    );

    // Clean up test dept limit
    await prisma.departmentRegistrationLimit.delete({ where: { id: deptLimit.id } });
    clearProjectQueryCache();

    // ─────────────────────────────────────────────────────────────
    // SECTION 2: FACULTY & PASSCODE OPERATIONS
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- SECTION 2: Faculty & Passcode Operations ---");

    const rawPass = "Secret@2026";
    const passHash = await bcrypt.hash(rawPass, 10);

    const testFaculty = await prisma.faculty.create({
      data: {
        name: `Dr. Auditor ${testId}`,
        email: `auditor_${testId}@gdgu.org`,
        department: testDeptA,
        passcodeHash: passHash,
        isAdmin: false,
        isSpoc: false,
      },
    });
    assert(!!testFaculty.id, "Faculty record created successfully");

    const verifyPassOk = await bcrypt.compare(rawPass, testFaculty.passcodeHash);
    const verifyPassBad = await bcrypt.compare("WrongPassword", testFaculty.passcodeHash);
    assert(verifyPassOk && !verifyPassBad, "Faculty bcrypt passcode verification works accurately");

    // Update passcode
    const newPass = "NewSecret@2026";
    const newHash = await bcrypt.hash(newPass, 10);
    const updatedFaculty = await prisma.faculty.update({
      where: { id: testFaculty.id },
      data: { passcodeHash: newHash, isSpoc: true, spocDepartment: testDeptA },
    });
    const verifyNewPass = await bcrypt.compare(newPass, updatedFaculty.passcodeHash);
    assert(verifyNewPass && updatedFaculty.isSpoc, "Faculty update (passcode, SPOC flag, spocDepartment) succeeded");

    // ─────────────────────────────────────────────────────────────
    // SECTION 3: STUDENT CRUD & IDENTITIES
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- SECTION 3: Student CRUD, Identities & Verification ---");

    const testEnrollment = `TEST_ENROLL_${testId}`;
    const testStudent = await prisma.student.create({
      data: {
        enrollmentNumber: testEnrollment,
        name: "Audit Test Student",
        department: testDeptA,
        programme: "B.Tech Computer Science",
        gender: "Male",
        semester: 3,
        batch: "2025",
        academicYear: testYear,
        internalMarks: 45,
        externalMarks: 42,
        attendancePercent: 92,
        email: `${testEnrollment.toLowerCase()}@gdgu.org`,
        phone: "9988776655",
        phoneVerified: true,
      },
    });
    assert(!!testStudent.id, "Student record created with marks, attendance and phone");

    // Create StudentIdentity
    const identity = await prisma.studentIdentity.create({
      data: {
        studentId: testStudent.id,
        email: testStudent.email!,
        googleId: `google_${testStudent.email}`,
      },
    });
    assert(identity.studentId === testStudent.id, "Student Google identity mapped successfully");

    // Update marks and attendance
    const updatedStudent = await prisma.student.update({
      where: { id: testStudent.id },
      data: {
        internalMarks: 48,
        externalMarks: 46,
        attendancePercent: 95,
      },
    });
    assert(
      updatedStudent.internalMarks === 48 && updatedStudent.externalMarks === 46 && updatedStudent.attendancePercent === 95,
      "Student assessment marks and attendance percentage update verified"
    );

    // ─────────────────────────────────────────────────────────────
    // SECTION 4: PROJECT PROPOSALS & MANUSCRIPTS
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- SECTION 4: Project Proposals & Manuscript Tracking ---");

    const testProjectCode = `TEST_PRJ_${testId}`;
    const testProject = await prisma.project.create({
      data: {
        projectId: testProjectCode,
        title: "Autonomous Aerial Robotics",
        department: testDeptA,
        facultyId: testFaculty.id,
        theme: "Robotics & Automation",
        category: "IDP2502",
        academicYear: testYear,
        semester: 3,
        maxSeats: 4,
        sameDeptLimit: 2,
        otherDeptLimit: 2,
        submissionStatus: "PENDING",
      },
    });
    assert(!!testProject.id, "Project proposal created with specific seat quotas");

    // Update project manuscript tracking
    const updatedProjManuscript = await prisma.project.update({
      where: { id: testProject.id },
      data: {
        hasDraftManuscript: true,
        draftManuscriptFileName: "test_draft.pdf",
        draftManuscriptUrl: "/api/artifacts/test_draft.pdf",
        hasCommunicatedManuscript: true,
        journalName: "IEEE Transactions on Robotics",
        avishkarAffiliationCommunicated: true,
        manuscriptSimilarityPercent: 4.5,
        manuscriptAiPercent: 8.0,
      },
    });
    assert(
      updatedProjManuscript.hasCommunicatedManuscript &&
      updatedProjManuscript.journalName === "IEEE Transactions on Robotics" &&
      updatedProjManuscript.avishkarAffiliationCommunicated,
      "Project research manuscript tracking updated successfully"
    );

    // ─────────────────────────────────────────────────────────────
    // SECTION 5: ARTIFACT UPLOADS & SPOC REVIEW WORKFLOW
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- SECTION 5: Artifact Uploads & SPOC Review ---");

    const artifact = await prisma.projectArtifact.create({
      data: {
        projectId: testProject.id,
        type: "REPORT",
        title: "Interim Project Report",
        fileName: `${testYear}/sem3/${testProjectCode}/report.pdf`,
        fileUrl: `/api/artifacts/${testYear}/sem3/${testProjectCode}/report.pdf`,
        fileSize: 1024 * 300,
        mimeType: "application/pdf",
        academicYear: testYear,
        semester: 3,
        similarityPercent: 6.2,
        aiPercent: 12.5,
        similarityChecked: true,
        aiChecked: true,
        selfDeclaration: true,
        status: "PENDING",
      },
    });
    assert(!!artifact.id, "ProjectArtifact created with similarity and AI metrics");

    // SPOC Review: APPROVE
    const [reviewedArtifact, reviewedProject] = await prisma.$transaction([
      prisma.projectArtifact.update({
        where: { id: artifact.id },
        data: {
          status: "APPROVED",
          spocNote: "Excellent technical formulation and methodology.",
          reviewedAt: new Date(),
          reviewedById: testFaculty.id,
        },
      }),
      prisma.project.update({
        where: { id: testProject.id },
        data: {
          submissionStatus: "APPROVED",
          spocReviewNote: "Approved by Department SPOC",
          reviewedAt: new Date(),
          reviewedById: testFaculty.id,
        },
      }),
    ]);
    assert(
      reviewedArtifact.status === "APPROVED" && reviewedProject.submissionStatus === "APPROVED",
      "SPOC Review transaction updated both Artifact and Project status atomically"
    );

    // ─────────────────────────────────────────────────────────────
    // SECTION 6: REGISTRATION ENGINE, CONCURRENCY & LIMIT GUARDS
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- SECTION 6: Registration Engine & Seat Limit Guards ---");

    // 6a. Register student 1 (Same department: testDeptA)
    const regResult1 = await registerStudentForProject(testStudent.id, testProject.id, {
      name: testStudent.name,
      role: "STUDENT",
    });
    assert(regResult1.success && !!regResult1.registration, "Student 1 registered successfully");

    // 6b. Attempt duplicate registration for student 1
    let dupFailed = false;
    try {
      await registerStudentForProject(testStudent.id, testProject.id, {
        name: testStudent.name,
        role: "STUDENT",
      });
    } catch (err: any) {
      dupFailed = true;
      assert(
        err.message.includes("officially locked in"),
        "Duplicate registration blocked: Student cannot register more than once"
      );
    }
    if (!dupFailed) {
      assert(false, "Duplicate registration was NOT blocked!");
    }

    // 6c. Test same-dept limit guard:
    // Create Student 2 (Same dept)
    const student2 = await prisma.student.create({
      data: {
        enrollmentNumber: `ST2_${testId}`,
        name: "Student 2 SameDept",
        department: testDeptA,
        academicYear: testYear,
        phoneVerified: true,
      },
    });
    const regResult2 = await registerStudentForProject(student2.id, testProject.id);
    assert(regResult2.success, "Student 2 (Same department) registered (now 2/2 same dept filled)");

    // Create Student 3 (Same dept - should exceed sameDeptLimit = 2)
    const student3 = await prisma.student.create({
      data: {
        enrollmentNumber: `ST3_${testId}`,
        name: "Student 3 SameDept Excess",
        department: testDeptA,
        academicYear: testYear,
        phoneVerified: true,
      },
    });
    let sameDeptBlocked = false;
    try {
      await registerStudentForProject(student3.id, testProject.id);
    } catch (err: any) {
      sameDeptBlocked = true;
      assert(
        err.message.includes("Same department seat limit reached"),
        `Same-department limit enforced: ${err.message}`
      );
    }
    if (!sameDeptBlocked) {
      assert(false, "Same department limit was NOT enforced!");
    }

    // 6d. Test other-dept quota:
    // Create Student 4 (Other dept - testDeptB) -> should succeed
    const student4 = await prisma.student.create({
      data: {
        enrollmentNumber: `ST4_${testId}`,
        name: "Student 4 OtherDept",
        department: testDeptB,
        academicYear: testYear,
        phoneVerified: true,
      },
    });
    const regResult4 = await registerStudentForProject(student4.id, testProject.id);
    assert(regResult4.success, "Student 4 (Other department) registered successfully (1/2 other dept filled)");

    // Create Student 5 (Other dept - testDeptB) -> should succeed (now 2/2 other dept filled, total 4/4 maxSeats filled)
    const student5 = await prisma.student.create({
      data: {
        enrollmentNumber: `ST5_${testId}`,
        name: "Student 5 OtherDept",
        department: testDeptB,
        academicYear: testYear,
        phoneVerified: true,
      },
    });
    const regResult5 = await registerStudentForProject(student5.id, testProject.id);
    assert(regResult5.success, "Student 5 (Other department) registered successfully (total 4/4 project full)");

    // Create Student 6 (Other dept - should be rejected because project is full 4/4)
    const student6 = await prisma.student.create({
      data: {
        enrollmentNumber: `ST6_${testId}`,
        name: "Student 6 OtherDept Excess",
        department: testDeptB,
        academicYear: testYear,
        phoneVerified: true,
      },
    });
    let projectFullBlocked = false;
    try {
      await registerStudentForProject(student6.id, testProject.id);
    } catch (err: any) {
      projectFullBlocked = true;
      assert(
        err.message.includes("completely full") || err.message.includes("limit reached"),
        `Total project capacity limit enforced: ${err.message}`
      );
    }
    if (!projectFullBlocked) {
      assert(false, "Total capacity limit was NOT enforced!");
    }

    // 6e. Test Phone verification requirement
    const unverifiedStudent = await prisma.student.create({
      data: {
        enrollmentNumber: `ST_UNVER_${testId}`,
        name: "Unverified Student",
        department: testDeptB,
        academicYear: testYear,
        phoneVerified: false,
      },
    });
    let unverifiedBlocked = false;
    try {
      await registerStudentForProject(unverifiedStudent.id, testProject.id);
    } catch (err: any) {
      unverifiedBlocked = true;
      assert(
        err.message.includes("verify and confirm your mobile number"),
        "Unverified student registration blocked: Mobile declaration required"
      );
    }
    if (!unverifiedBlocked) {
      assert(false, "Unverified student registration was NOT blocked!");
    }

    // ─────────────────────────────────────────────────────────────
    // SECTION 7: ADMIN MANUAL MAPPING & DEREGISTRATION
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- SECTION 7: Admin Manual Mapping & Deregistration ---");

    // Admin manual unmap (deregister student 1)
    await prisma.registration.delete({
      where: { studentId: testStudent.id },
    });
    const verifyUnmapped = await prisma.registration.findUnique({
      where: { studentId: testStudent.id },
    });
    assert(!verifyUnmapped, "Admin deregistration / unmap student succeeded");

    // Admin manual map (re-register student 1 to project)
    const adminMapped = await prisma.registration.create({
      data: {
        studentId: testStudent.id,
        projectId: testProject.id,
        status: "Approved",
      },
    });
    assert(adminMapped.studentId === testStudent.id, "Admin manual registration mapping succeeded");

    // ─────────────────────────────────────────────────────────────
    // SECTION 8: FACULTY REASSIGNMENT & CASCADE SAFEGUARDS
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- SECTION 8: Mentor Reassignment & Cascade Safeguards ---");

    const replacementFaculty = await prisma.faculty.create({
      data: {
        name: `Dr. Replacement ${testId}`,
        email: `replacement_${testId}@gdgu.org`,
        department: testDeptA,
        passcodeHash: passHash,
      },
    });

    // Reassign project to replacement faculty
    const reassignedProj = await prisma.project.update({
      where: { id: testProject.id },
      data: { facultyId: replacementFaculty.id },
    });
    assert(reassignedProj.facultyId === replacementFaculty.id, "Project mentor reassigned to replacement faculty");

    // Clean up test registrations
    await prisma.registration.deleteMany({
      where: { projectId: testProject.id },
    });
    assert(true, "Test registrations cleaned up");

    // Clean up test artifacts
    await prisma.projectArtifact.deleteMany({
      where: { projectId: testProject.id },
    });
    assert(true, "Test artifacts cleaned up");

    // Clean up test project
    await prisma.project.delete({ where: { id: testProject.id } });
    assert(true, "Test project deleted cleanly");

    // Clean up test students
    const testStudentIds = [
      testStudent.id,
      student2.id,
      student3.id,
      student4.id,
      student5.id,
      student6.id,
      unverifiedStudent.id,
    ];
    await prisma.$transaction([
      prisma.studentIdentity.deleteMany({ where: { studentId: { in: testStudentIds } } }),
      prisma.studentPhoneOtp.deleteMany({ where: { studentId: { in: testStudentIds } } }),
      prisma.registration.deleteMany({ where: { studentId: { in: testStudentIds } } }),
      prisma.student.deleteMany({ where: { id: { in: testStudentIds } } }),
    ]);
    assert(true, "All test students and associated records cleaned up atomically");

    // Clean up faculties
    await prisma.faculty.deleteMany({
      where: { id: { in: [testFaculty.id, replacementFaculty.id] } },
    });
    assert(true, "Test faculties cleaned up");

    // ─────────────────────────────────────────────────────────────
    // SECTION 9: EXPORT ENGINE VERIFICATION
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- SECTION 9: Export Engine & Table Snapshot ---");

    const snapshot = await getTableSnapshot();
    assert(
      snapshot.students > 0 && snapshot.projects > 0 && snapshot.faculty > 0,
      `Database snapshot retrieved: ${snapshot.students} students, ${snapshot.projects} projects, ${snapshot.faculty} faculty`
    );

    const fullExport = await exportAllTables("AuditRunner", testYear);
    assert(
      fullExport.success && fullExport.fileBuffer && fullExport.fileBuffer.length > 1000,
      `Full Excel database export generated successfully (${(fullExport.fileBuffer.length / 1024).toFixed(1)} KB)`
    );

  } catch (error: any) {
    console.error("FATAL ERROR IN AUDIT RUNNER:", error);
    failed++;
  }

  console.log("\n================================================================================");
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveAudit()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
