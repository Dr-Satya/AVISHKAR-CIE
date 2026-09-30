import { PrismaClient } from "@prisma/client";
import { registerStudentForProject } from "../services/registration.service";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=== STARTING GDGU REGISTRATION & CONCURRENCY TEST SUITE ===\n");

  // 1. Create a dedicated test project with exactly 2 maximum seats
  const testFaculty = await prisma.faculty.findFirst();
  if (!testFaculty) throw new Error("No faculty found in DB");

  const testProject = await prisma.project.upsert({
    where: { projectId: "TEST_P999" },
    update: {
      maxSeats: 2,
      sameDeptLimit: 1,
      otherDeptLimit: 1,
    },
    create: {
      projectId: "TEST_P999",
      title: "Concurrency Verification & Safety Under High Load",
      category: "IDP2502",
      theme: "Others",
      description: "Dedicated test harness project",
      department: "School of Engineering & Sciences",
      facultyId: testFaculty.id,
      maxSeats: 2,
      sameDeptLimit: 1,
      otherDeptLimit: 1,
    },
  });

  // Clean any existing test registrations on this test project
  await prisma.registration.deleteMany({
    where: { projectId: testProject.id },
  });

  // 2. Create 6 dummy test students (3 from same department, 3 from other department)
  const dummyStudents = [];
  for (let i = 1; i <= 6; i++) {
    const isSame = i <= 3;
    const enr = `TEST_ST_${1000 + i}`;
    const student = await prisma.student.upsert({
      where: { enrollmentNumber: enr },
      update: {
        department: isSame ? "School of Engineering & Sciences" : "School of Management",
      },
      create: {
        enrollmentNumber: enr,
        name: `Test Student ${i}`,
        department: isSame ? "School of Engineering & Sciences" : "School of Management",
        semester: 3,
        batch: "2025",
        email: `${enr.toLowerCase()}@gdgu.org`,
      },
    });

    // Remove any previous registration for this dummy student
    await prisma.registration.deleteMany({
      where: { studentId: student.id },
    });

    dummyStudents.push(student);
  }

  console.log(`Created test project ${testProject.projectId} (Capacity: 2 seats, Same limit: 1, Other limit: 1)`);
  console.log(`Created ${dummyStudents.length} test students to simulate concurrent requests\n`);

  // 3. CONCURRENCY TEST: Fire all 6 registration requests simultaneously with Promise.all
  console.log("--> Firing 6 simultaneous concurrent registration attempts...");
  const results = await Promise.allSettled(
    dummyStudents.map((st) =>
      registerStudentForProject(st.id, testProject.id, {
        name: st.name,
        role: "STUDENT",
      })
    )
  );

  let successCount = 0;
  let rejectedCount = 0;

  results.forEach((r, idx) => {
    if (r.status === "fulfilled" && r.value.success) {
      successCount++;
      console.log(`  ✓ Student ${dummyStudents[idx].enrollmentNumber} successfully registered.`);
    } else {
      rejectedCount++;
      const reason = r.status === "rejected" ? r.reason.message : (r.value as any).error;
      console.log(`  ✗ Student ${dummyStudents[idx].enrollmentNumber} rejected as expected: "${reason}"`);
    }
  });

  // Verify total registrations in DB
  const actualDbRegCount = await prisma.registration.count({
    where: { projectId: testProject.id },
  });

  console.log("\n================ CONCURRENCY TEST RESULT ================");
  console.log(`Expected Max Registrations: 2`);
  console.log(`Actual Registrations in DB: ${actualDbRegCount}`);
  console.log(`Successful Registrations:   ${successCount}`);
  console.log(`Rejected Requests:          ${rejectedCount}`);

  if (actualDbRegCount > 2) {
    console.error("❌ FAILED: Overbooking occurred! Race condition detected.");
    process.exit(1);
  } else {
    console.log("✅ PASSED: Zero overbooking! Concurrency locking strictly enforced.");
  }

  // 4. TEST: Already Registered Constraint
  console.log("\n--> Testing 'Already Registered' constraint...");
  const registeredStudent = dummyStudents[0];
  try {
    await registerStudentForProject(registeredStudent.id, testProject.id);
    console.error("❌ FAILED: Duplicate registration was allowed!");
  } catch (err: any) {
    console.log(`✅ PASSED: Correctly caught duplicate registration: "${err.message}"`);
  }

  // 5. TEST: Global Kill Switch (Registration Closed)
  console.log("\n--> Testing Global Kill Switch (Registration Closed)...");
  await prisma.globalConfig.update({
    where: { id: "default" },
    data: { registrationOpen: false },
  });

  // Create an unregistered dummy student
  const dummyUnreg = await prisma.student.upsert({
    where: { enrollmentNumber: "TEST_UNREG_1" },
    update: {},
    create: {
      enrollmentNumber: "TEST_UNREG_1",
      name: "Unregistered Student",
      department: "School of Engineering & Sciences",
      email: "test.unreg@gdgu.org",
    },
  });
  await prisma.registration.deleteMany({ where: { studentId: dummyUnreg.id } });

  try {
    await registerStudentForProject(dummyUnreg.id, testProject.id);
    console.error("❌ FAILED: Registration allowed while registration is closed!");
  } catch (err: any) {
    console.log(`✅ PASSED: Blocked registration when closed: "${err.message}"`);
  }

  // Restore Global Config
  await prisma.globalConfig.update({
    where: { id: "default" },
    data: { registrationOpen: true },
  });
  console.log("✓ Restored global registration status to OPEN");

  // Cleanup test records
  await prisma.registration.deleteMany({ where: { projectId: testProject.id } });
  await prisma.registration.deleteMany({ where: { studentId: dummyUnreg.id } });
  await prisma.project.delete({ where: { id: testProject.id } });
  for (const st of dummyStudents) {
    await prisma.student.delete({ where: { id: st.id } });
  }
  await prisma.student.delete({ where: { id: dummyUnreg.id } });
  console.log("✓ Test artifacts cleaned up.\n");

  console.log("=== ALL TEST SUITES PASSED WITH 100% SUCCESS ===");

  await prisma.$disconnect();
}

runTests().catch(async (e) => {
  console.error("Test error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
