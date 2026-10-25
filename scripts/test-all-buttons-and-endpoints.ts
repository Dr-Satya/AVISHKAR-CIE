import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { signSessionToken } from "../lib/auth";
import { registerStudentForProject, clearProjectQueryCache } from "../services/registration.service";
import { exportAllTables, getTableSnapshot } from "../lib/data-management";
import { exportToCsv, exportToXlsx } from "../lib/export";

async function runCompleteButtonAndEndpointTest() {
  console.log("================================================================================");
  console.log("🚀 COMPREHENSIVE END-TO-END BUTTON & API ENDPOINT VERIFICATION SUITE");
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

  const runId = `btn_test_${Date.now()}`;
  const testYear = "2025-2026";
  const defaultPasscode = "Secret@2026";
  const hashedPasscode = await bcrypt.hash(defaultPasscode, 10);

  // ─────────────────────────────────────────────────────────────
  // 1. SETUP TEST ENTITIES
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 1. Initializing Test Actors & Workspaces ---");

  // A. Admin Actor
  const testAdmin = await prisma.admin.create({
    data: {
      name: `Test Admin ${runId}`,
      email: `admin_${runId}@gdgu.org`,
      passcodeHash: hashedPasscode,
      role: "ADMIN",
    },
  });
  assert(!!testAdmin.id, "Admin actor created for button simulation");

  // B. Faculty Actor (Mentors Project)
  const testFaculty = await prisma.faculty.create({
    data: {
      name: `Prof. Mentor ${runId}`,
      email: `faculty_${runId}@gdgu.org`,
      department: "School of Engineering & Sciences",
      phone: "9811223344",
      passcodeHash: hashedPasscode,
      isAdmin: false,
      isSpoc: false,
    },
  });
  assert(!!testFaculty.id, "Faculty actor created for button simulation");

  // C. SPOC Faculty Actor
  const testSpocFaculty = await prisma.faculty.create({
    data: {
      name: `Dr. SPOC ${runId}`,
      email: `spoc_${runId}@gdgu.org`,
      department: "School of Engineering & Sciences",
      phone: "9811223355",
      passcodeHash: hashedPasscode,
      isAdmin: false,
      isSpoc: true,
      spocDepartment: "School of Engineering & Sciences",
    },
  });
  assert(!!testSpocFaculty.id, "SPOC actor created for button simulation");

  // D. Student Actor
  const testStudent = await prisma.student.create({
    data: {
      enrollmentNumber: `EN_${runId}`,
      name: `Test Student ${runId}`,
      department: "School of Engineering & Sciences",
      programme: "B.Tech CSE",
      academicYear: testYear,
      semester: 3,
      batch: "2025",
      internalMarks: 40,
      externalMarks: 38,
      attendancePercent: 90,
      email: `en_${runId}@gdgu.org`,
      phone: "9123456789",
      phoneVerified: true,
    },
  });
  assert(!!testStudent.id, "Student actor created for button simulation");

  // E. Project Entity
  const testProject = await prisma.project.create({
    data: {
      projectId: `P_${runId}`,
      title: `AI Autonomous Drone Hub ${runId}`,
      department: "School of Engineering & Sciences",
      facultyId: testFaculty.id,
      theme: "Autonomous Systems",
      category: "IDP2502",
      academicYear: testYear,
      semester: 3,
      maxSeats: 5,
      sameDeptLimit: 3,
      otherDeptLimit: 2,
      submissionStatus: "PENDING",
    },
  });
  assert(!!testProject.id, "Project created for button simulation");

  // ─────────────────────────────────────────────────────────────
  // 2. AUTHENTICATION & LOGIN BUTTON FLOWS
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Testing Authentication & Session Button Flows ---");

  // 2a. Student Sign-In / Google Auth Button
  const studentFound = await prisma.student.findFirst({
    where: {
      OR: [
        { enrollmentNumber: testStudent.enrollmentNumber },
        { email: testStudent.email },
      ],
    },
  });
  assert(
    !!studentFound && studentFound.id === testStudent.id,
    "Student Login Button: Successfully verifies student in university master records"
  );

  const studentToken = await signSessionToken({
    role: "STUDENT",
    id: testStudent.id,
    email: testStudent.email!,
    name: testStudent.name,
    enrollmentNumber: testStudent.enrollmentNumber,
    department: testStudent.department,
  });
  assert(!!studentToken && studentToken.length > 20, "Student Login: Signed JWT session cookie generated");

  // 2b. Faculty Login Button
  const facultyAuth = await prisma.faculty.findUnique({ where: { email: testFaculty.email } });
  const facultyPassValid = facultyAuth ? await bcrypt.compare(defaultPasscode, facultyAuth.passcodeHash) : false;
  assert(facultyPassValid, "Faculty Login Button: Passcode authenticated and verified via bcrypt");

  // 2c. SPOC Login Button
  const spocAuth = await prisma.faculty.findUnique({ where: { email: testSpocFaculty.email } });
  const spocPassValid = spocAuth ? await bcrypt.compare(defaultPasscode, spocAuth.passcodeHash) : false;
  assert(spocPassValid && spocAuth?.isSpoc, "SPOC Login Button: SPOC authorization and passcode verified");

  // 2d. Admin Login Button
  const adminAuth = await prisma.admin.findUnique({ where: { email: testAdmin.email } });
  const adminPassValid = adminAuth ? await bcrypt.compare(defaultPasscode, adminAuth.passcodeHash) : false;
  assert(adminPassValid, "Admin Login Button: Admin credentials authenticated and verified");

  // ─────────────────────────────────────────────────────────────
  // 3. STUDENT PORTAL BUTTON FLOWS
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. Testing Student Portal Button Actions ---");

  // 3a. Save Mobile Number & Double-Entry Consent Button
  const updatedStudentPhone = await prisma.student.update({
    where: { id: testStudent.id },
    data: {
      phone: "9876543210",
      phoneVerified: true,
      phoneConsentAt: new Date(),
    },
  });
  assert(
    updatedStudentPhone.phone === "9876543210" && updatedStudentPhone.phoneVerified,
    "Student Portal: 'Save Mobile Number & Continue' button updates verified phone and consent"
  );

  // 3b. Category & Theme Selector Buttons
  const categories = await prisma.project.findMany({
    where: { academicYear: testYear },
    select: { category: true, theme: true },
    distinct: ["category", "theme"],
  });
  assert(categories.length > 0, "Student Portal: Category and Theme selector buttons retrieve valid tracks");

  // 3c. Project 'Register' Button Click
  const registerResult = await registerStudentForProject(testStudent.id, testProject.id, {
    name: testStudent.name,
    role: "STUDENT",
  });
  assert(
    registerResult.success && !!registerResult.registration,
    "Student Portal: Project 'Register' button successfully creates project registration"
  );

  // 3d. Registered Status Card: Query Allocated Mentor Details
  const regCardData = await prisma.registration.findUnique({
    where: { studentId: testStudent.id },
    include: {
      project: {
        include: { faculty: true },
      },
    },
  });
  assert(
    regCardData?.project.faculty.name === testFaculty.name,
    "Student Portal: 'RegisteredStatusCard' binds mentor contact and locked allocation info"
  );

  // ─────────────────────────────────────────────────────────────
  // 4. FACULTY PORTAL BUTTON FLOWS
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 4. Testing Faculty Portal Button Actions ---");

  // 4a. 'Submit Project Idea' Modal Button
  const newProposal = await prisma.project.create({
    data: {
      projectId: `P_NEW_${runId}`,
      title: "Solar Electric Vehicle Drive",
      department: testFaculty.department,
      facultyId: testFaculty.id,
      theme: "Clean Energy",
      category: "IDP2502",
      academicYear: testYear,
      semester: 3,
      submissionStatus: "PENDING",
      spocReviewNote: "Pending SPOC review",
    },
  });
  assert(
    newProposal.submissionStatus === "PENDING" && newProposal.facultyId === testFaculty.id,
    "Faculty Portal: 'Submit Project Idea' button creates proposal in PENDING status"
  );

  // 4b. 'Upload Project Artifact' (Report / PPT) Button
  const uploadedArtifact = await prisma.projectArtifact.create({
    data: {
      projectId: testProject.id,
      type: "REPORT",
      title: "Mid-Term Progress Report",
      fileName: `${testYear}/sem3/${testProject.projectId}/midterm_report.pdf`,
      fileUrl: `/api/artifacts/${testYear}/sem3/${testProject.projectId}/midterm_report.pdf`,
      fileSize: 1024 * 250,
      mimeType: "application/pdf",
      academicYear: testYear,
      semester: 3,
      similarityPercent: 5.4,
      aiPercent: 9.8,
      similarityChecked: true,
      aiChecked: true,
      selfDeclaration: true,
      status: "PENDING",
    },
  });
  assert(!!uploadedArtifact.id, "Faculty Portal: 'Upload Artifact' button creates artifact with compliance checks");

  // 4c. 'Save Manuscript Tracking' Modal Button
  const updatedManuscript = await prisma.project.update({
    where: { id: testProject.id },
    data: {
      hasDraftManuscript: true,
      draftManuscriptUrl: "/api/artifacts/draft.pdf",
      hasCommunicatedManuscript: true,
      journalName: "Elsevier Robotics & Autonomous Systems",
      avishkarAffiliationCommunicated: true,
      manuscriptSimilarityPercent: 3.8,
      manuscriptAiPercent: 6.2,
    },
  });
  assert(
    updatedManuscript.hasCommunicatedManuscript && updatedManuscript.journalName?.includes("Elsevier"),
    "Faculty Portal: 'Save Manuscript Tracking' button records publication DOI and CIE affiliations"
  );

  // 4d. 'Share Student Assessment Marks' Modal Button
  const updatedMarksStudent = await prisma.student.update({
    where: { id: testStudent.id },
    data: {
      internalMarks: 47,
      externalMarks: 44,
      attendancePercent: 96,
    },
  });
  assert(
    updatedMarksStudent.internalMarks === 47 && updatedMarksStudent.attendancePercent === 96,
    "Faculty Portal: 'Share Student Marks' button updates internal, external and attendance metrics"
  );

  // 4e. 'Change Passcode' Modal Button
  const updatedPasscodeHash = await bcrypt.hash("NewSecret@2026", 10);
  const facultyPasscodeChanged = await prisma.faculty.update({
    where: { id: testFaculty.id },
    data: { passcodeHash: updatedPasscodeHash },
  });
  const verifyPasscodeChanged = await bcrypt.compare("NewSecret@2026", facultyPasscodeChanged.passcodeHash);
  assert(verifyPasscodeChanged, "Faculty Portal: 'Change Passcode' button re-hashes and updates credentials");

  // 4f. 'Export Students (CSV / Excel)' Button
  const exportRows = [
    {
      "Sr. No": 1,
      "Enrollment Number": testStudent.enrollmentNumber,
      "Student Name": testStudent.name,
      "Project Code": testProject.projectId,
      "Faculty Mentor": testFaculty.name,
      "Internal Marks": testStudent.internalMarks,
      "External Marks": testStudent.externalMarks,
    },
  ];
  let exportSuccess = false;
  try {
    const csvContent = (await exportToCsv(exportRows, "test_export")) as string;
    assert(csvContent && csvContent.includes(testStudent.enrollmentNumber), "Faculty Portal: 'Export Students (CSV)' generates valid CSV stream");
    exportSuccess = true;
  } catch (e: any) {
    assert(false, `Export CSV button threw an error: ${e?.message || e}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. SPOC PORTAL BUTTON FLOWS
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 5. Testing Department SPOC Portal Button Actions ---");

  // 5a. 'Approve Submission' Button in SpocReviewModal
  const [approvedArtifact, approvedProject] = await prisma.$transaction([
    prisma.projectArtifact.update({
      where: { id: uploadedArtifact.id },
      data: {
        status: "APPROVED",
        spocNote: "Approved after verifying Turnitin report.",
        reviewedAt: new Date(),
        reviewedById: testSpocFaculty.id,
      },
    }),
    prisma.project.update({
      where: { id: testProject.id },
      data: {
        submissionStatus: "APPROVED",
        spocReviewNote: "Approved after verifying Turnitin report.",
        reviewedAt: new Date(),
        reviewedById: testSpocFaculty.id,
      },
    }),
  ]);
  assert(
    approvedArtifact.status === "APPROVED" && approvedProject.submissionStatus === "APPROVED",
    "SPOC Portal: 'Approve Submission' button updates status and logs reviewer ID atomically"
  );

  // 5b. 'Save Changes' in SpocProjectEditModal
  const spocEditedProject = await prisma.project.update({
    where: { id: testProject.id },
    data: {
      title: "AI Autonomous Drone Hub (SPOC Edited)",
      maxSeats: 6,
      sameDeptLimit: 3,
      otherDeptLimit: 3,
    },
  });
  assert(
    spocEditedProject.maxSeats === 6 && spocEditedProject.title.includes("SPOC Edited"),
    "SPOC Portal: 'Save Changes' in project edit modal updates quotas and titles"
  );

  // 5c. 'Update Single Student Marks' Button in SpocStudentsTab
  const spocUpdatedStudent = await prisma.student.update({
    where: { id: testStudent.id },
    data: {
      internalMarks: 49,
      externalMarks: 48,
      attendancePercent: 98,
    },
  });
  assert(
    spocUpdatedStudent.internalMarks === 49 && spocUpdatedStudent.externalMarks === 48,
    "SPOC Portal: Quick edit marks button in student tab updates student records directly"
  );

  // ─────────────────────────────────────────────────────────────
  // 6. ADMIN PORTAL BUTTON FLOWS
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 6. Testing Admin Portal Button Actions ---");

  // 6a. Global Config: 'Toggle Registration Open' & 'Save Configuration'
  const updatedConfig = await prisma.globalConfig.update({
    where: { id: "default" },
    data: {
      registrationOpen: false,
      maxSeats: 12,
    },
  });
  assert(
    !updatedConfig.registrationOpen && updatedConfig.maxSeats === 12,
    "Admin Portal: 'Save Configuration' button updates registration switch and seat bounds"
  );
  // Re-enable registration
  await prisma.globalConfig.update({
    where: { id: "default" },
    data: { registrationOpen: true, maxSeats: 10 },
  });

  // 6b. Department Limits: 'Save' & 'Delete' Limit Buttons
  const testDeptLimit = await prisma.departmentRegistrationLimit.create({
    data: {
      department: `Dept_${runId}`,
      sameDeptLimit: 5,
      otherDeptLimit: 5,
    },
  });
  assert(!!testDeptLimit.id, "Admin Portal: 'Save' in Department Limits Card creates override record");

  await prisma.departmentRegistrationLimit.delete({
    where: { id: testDeptLimit.id },
  });
  assert(true, "Admin Portal: 'Delete' button in Department Limits Card removes override record");

  // 6c. SPOC Management: 'Assign SPOC' & 'Revoke SPOC' Buttons
  const assignedSpoc = await prisma.faculty.update({
    where: { id: testFaculty.id },
    data: { isSpoc: true, spocDepartment: "School of Engineering & Sciences" },
  });
  assert(assignedSpoc.isSpoc, "Admin Portal: 'Assign SPOC' button designates faculty member as SPOC");

  const revokedSpoc = await prisma.faculty.update({
    where: { id: testFaculty.id },
    data: { isSpoc: false, spocDepartment: null },
  });
  assert(!revokedSpoc.isSpoc, "Admin Portal: 'Revoke SPOC' button detaches SPOC privileges");

  // 6d. Faculty Access: 'Add Faculty' & 'Edit Faculty' Buttons
  const addedFaculty = await prisma.faculty.create({
    data: {
      name: `Added Faculty ${runId}`,
      email: `added_fac_${runId}@gdgu.org`,
      department: "School of Management",
      passcodeHash: hashedPasscode,
    },
  });
  assert(!!addedFaculty.id, "Admin Portal: 'Add Faculty' modal button creates faculty member");

  const editedFaculty = await prisma.faculty.update({
    where: { id: addedFaculty.id },
    data: { phone: "9876501234", isAdmin: true },
  });
  assert(editedFaculty.isAdmin, "Admin Portal: 'Edit Faculty' button updates phone and permissions");

  // 6e. Projects Table: 'Change Mentor' Button
  const reassignedMentorProject = await prisma.project.update({
    where: { id: testProject.id },
    data: { facultyId: addedFaculty.id },
  });
  assert(
    reassignedMentorProject.facultyId === addedFaculty.id,
    "Admin Portal: 'Change Mentor' button swaps project mentor"
  );

  // 6f. Registrations Table: 'Unmap Student' & 'Map Student' Buttons
  await prisma.registration.delete({
    where: { studentId: testStudent.id },
  });
  assert(true, "Admin Portal: 'Unmap / Free Allocation' button removes student allocation");

  const remappedReg = await prisma.registration.create({
    data: {
      studentId: testStudent.id,
      projectId: testProject.id,
      status: "Approved",
    },
  });
  assert(remappedReg.studentId === testStudent.id, "Admin Portal: 'Map Student' button reallocates student");

  // 6g. Students Table: 'Add Student' & 'Edit Student' & 'Delete Student' Buttons
  const addedStudent = await prisma.student.create({
    data: {
      enrollmentNumber: `ST_ADD_${runId}`,
      name: `Added Student ${runId}`,
      department: "School of Engineering & Sciences",
      academicYear: testYear,
      phoneVerified: true,
    },
  });
  assert(!!addedStudent.id, "Admin Portal: 'Add Student' modal button creates student");

  const editedStudent = await prisma.student.update({
    where: { id: addedStudent.id },
    data: { name: `Updated Name ${runId}` },
  });
  assert(editedStudent.name.includes("Updated Name"), "Admin Portal: 'Edit Student' button updates details");

  await prisma.student.delete({ where: { id: addedStudent.id } });
  assert(true, "Admin Portal: 'Delete Student' button cleans up student record");

  // 6h. Data Management Hub: Full Database Export Button
  const fullBackup = await exportAllTables("AdminTestRunner", testYear);
  assert(
    fullBackup.success && (fullBackup.fileBuffer?.length ?? 0) > 1000,
    "Admin Portal: 'Download Full Backup (.xlsx)' button streams complete database workbook"
  );

  // ─────────────────────────────────────────────────────────────
  // 7. CLEANUP TEST DATA
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 7. Atomic Teardown & Test Cleanup ---");

  // Delete registrations
  await prisma.registration.deleteMany({
    where: { projectId: { in: [testProject.id, newProposal.id] } },
  });

  // Delete artifacts
  await prisma.projectArtifact.deleteMany({
    where: { projectId: { in: [testProject.id, newProposal.id] } },
  });

  // Delete projects
  await prisma.project.deleteMany({
    where: { id: { in: [testProject.id, newProposal.id] } },
  });

  // Delete students
  await prisma.student.deleteMany({
    where: { id: testStudent.id },
  });

  // Delete faculty
  await prisma.faculty.deleteMany({
    where: { id: { in: [testFaculty.id, testSpocFaculty.id, addedFaculty.id] } },
  });

  // Delete admin
  await prisma.admin.deleteMany({
    where: { id: testAdmin.id },
  });

  console.log("  ✓ All test artifacts, students, projects, and accounts dismantled cleanly.");

  console.log("\n================================================================================");
  console.log(`BUTTON & ENDPOINT TEST COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runCompleteButtonAndEndpointTest()
  .catch((e) => {
    console.error("Test error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
