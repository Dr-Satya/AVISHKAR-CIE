import { prisma } from "../lib/prisma";

async function runVerification() {
  console.log("=== STARTING FACULTY/STUDENT CRUD & REPLACEMENT VERIFICATION ===");

  // 1. Setup test faculties
  const facA = await prisma.faculty.create({
    data: {
      name: "Test Faculty Alpha",
      email: `test_fac_alpha_${Date.now()}@gdgu.org`,
      department: "School of Engineering & Sciences",
      passcodeHash: "dummyhash",
    },
  });

  const facB = await prisma.faculty.create({
    data: {
      name: "Test Faculty Beta",
      email: `test_fac_beta_${Date.now()}@gdgu.org`,
      department: "School of Engineering & Sciences",
      passcodeHash: "dummyhash",
    },
  });

  // 2. Setup test project assigned to Faculty A
  const proj = await prisma.project.create({
    data: {
      projectId: `TEST_PRJ_${Date.now()}`,
      title: "AI Autonomous Systems Lab",
      department: "School of Engineering & Sciences",
      category: "IDP",
      theme: "AI/ML",
      facultyId: facA.id,
      maxSeats: 5,
    },
  });

  // 3. Setup test student registered to this project
  const student = await prisma.student.create({
    data: {
      enrollmentNumber: `TEST_ST_${Date.now()}`,
      name: "Test Student John",
      department: "School of Engineering & Sciences",
      programme: "B.Tech CSE",
      academicYear: "2025-2026",
    },
  });

  const reg = await prisma.registration.create({
    data: {
      studentId: student.id,
      projectId: proj.id,
      status: "Approved",
    },
  });

  const otp = await prisma.studentPhoneOtp.create({
    data: {
      studentId: student.id,
      phone: "9876543210",
      otp: "123456",
      expiresAt: new Date(Date.now() + 600000),
    },
  });

  console.log("✓ Test setup created: 2 faculties, 1 project (assigned to Faculty A), 1 student (registered with OTP)");

  // --- TEST A: Project Mentor Reassignment (PATCH) ---
  console.log("\n--> Testing Project Mentor Reassignment...");
  const updatedProj = await prisma.project.update({
    where: { id: proj.id },
    data: { facultyId: facB.id },
  });
  if (updatedProj.facultyId === facB.id) {
    console.log("✅ PASSED: Project mentor swapped from Faculty A to Faculty B.");
  } else {
    throw new Error("Project mentor swap failed!");
  }

  // Swap it back to Faculty A for next tests
  await prisma.project.update({
    where: { id: proj.id },
    data: { facultyId: facA.id },
  });

  // --- TEST B: Replace Faculty (Batch Transfer Projects) ---
  console.log("\n--> Testing Batch Faculty Project Transfer...");
  const transferCount = await prisma.project.updateMany({
    where: { facultyId: facA.id },
    data: { facultyId: facB.id },
  });
  if (transferCount.count === 1) {
    console.log("✅ PASSED: Transferred all projects from Faculty A to Faculty B.");
  } else {
    throw new Error("Batch project transfer failed!");
  }

  // --- TEST C: Faculty Deletion with Replacement Safeguard ---
  console.log("\n--> Testing Faculty Deletion with Replacement Safeguard...");
  // Reassign project back to Faculty A
  await prisma.project.update({
    where: { id: proj.id },
    data: { facultyId: facA.id },
  });

  // Simulate delete with replacement logic:
  const activeCount = await prisma.project.count({ where: { facultyId: facA.id } });
  if (activeCount > 0) {
    await prisma.$transaction([
      prisma.project.updateMany({
        where: { facultyId: facA.id },
        data: { facultyId: facB.id },
      }),
      prisma.faculty.delete({ where: { id: facA.id } }),
    ]);
  }
  const deletedFacA = await prisma.faculty.findUnique({ where: { id: facA.id } });
  const projAfterDelete = await prisma.project.findUnique({ where: { id: proj.id } });
  if (!deletedFacA && projAfterDelete?.facultyId === facB.id) {
    console.log("✅ PASSED: Faculty A deleted and project successfully reassigned to Faculty B.");
  } else {
    throw new Error("Faculty deletion with replacement failed!");
  }

  // --- TEST D: Student Deletion with Cascade Cleanup ---
  console.log("\n--> Testing Student Deletion (with Registration & OTP cleanup)...");
  await prisma.$transaction([
    prisma.studentPhoneOtp.deleteMany({ where: { studentId: student.id } }),
    prisma.studentIdentity.deleteMany({ where: { studentId: student.id } }),
    prisma.registration.deleteMany({ where: { studentId: student.id } }),
    prisma.student.delete({ where: { id: student.id } }),
  ]);

  const checkStudent = await prisma.student.findUnique({ where: { id: student.id } });
  const checkReg = await prisma.registration.findUnique({ where: { id: reg.id } });
  const checkOtp = await prisma.studentPhoneOtp.findUnique({ where: { id: otp.id } });

  if (!checkStudent && !checkReg && !checkOtp) {
    console.log("✅ PASSED: Student, registration, and OTP cleaned up atomically without errors.");
  } else {
    throw new Error("Student deletion failed or left orphan records!");
  }

  // Cleanup remaining test records
  await prisma.project.delete({ where: { id: proj.id } });
  await prisma.faculty.delete({ where: { id: facB.id } });

  console.log("✓ All test artifacts cleaned up.");
  console.log("\n=== ALL CRUD & REPLACEMENT TESTS PASSED WITH 100% SUCCESS ===\n");
}

runVerification()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
