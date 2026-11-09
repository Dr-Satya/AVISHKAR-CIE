import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ [PASS] ${message}`);
}

async function runTest() {
  console.log("================================================================================");
  console.log("🧪 TESTING: MULTIPLE SPOCS PER SCHOOL & ISOLATED CRUD WORKFLOW");
  console.log("================================================================================");

  const testDept = "School of Engineering & Sciences";
  const email1 = `test_spoc_alpha_${Date.now()}@gdgu.org`;
  const email2 = `test_spoc_beta_${Date.now()}@gdgu.org`;
  let spoc1Id: string | null = null;
  let spoc2Id: string | null = null;

  try {
    const hash = await bcrypt.hash("test@spoc2026", 8);

    // 1. Create 1st SPOC for Engineering
    console.log("\n--- 1. Creating 1st SPOC for School of Engineering & Sciences ---");
    const spoc1 = await prisma.spoc.create({
      data: {
        name: "Dr. Alpha Coordinator",
        email: email1,
        department: testDept,
        passcodeHash: hash,
      },
    });
    spoc1Id = spoc1.id;
    assert(!!spoc1.id, `Created 1st SPOC (ID: ${spoc1.id}, Email: ${spoc1.email})`);

    // 2. Create 2nd SPOC for the SAME Engineering department
    console.log("\n--- 2. Creating 2nd SPOC for the SAME School ---");
    const spoc2 = await prisma.spoc.create({
      data: {
        name: "Prof. Beta Coordinator",
        email: email2,
        department: testDept,
        passcodeHash: hash,
      },
    });
    spoc2Id = spoc2.id;
    assert(!!spoc2.id, `Created 2nd SPOC (ID: ${spoc2.id}, Email: ${spoc2.email})`);

    // 3. Verify BOTH SPOCs exist for the same department simultaneously
    console.log("\n--- 3. Verifying Multiple SPOCs Query by Department ---");
    const deptsSpocs = await prisma.spoc.findMany({
      where: { department: testDept },
      orderBy: { name: "asc" },
    });
    const found1 = deptsSpocs.find((s) => s.id === spoc1.id);
    const found2 = deptsSpocs.find((s) => s.id === spoc2.id);
    assert(!!found1, `1st SPOC still exists and was NOT overwritten`);
    assert(!!found2, `2nd SPOC exists simultaneously in the same department`);
    assert(deptsSpocs.filter((s) => s.id === spoc1.id || s.id === spoc2.id).length === 2, `Both SPOCs retrieved for '${testDept}'`);

    // 4. Test Editing 1st SPOC without altering 2nd SPOC
    console.log("\n--- 4. Editing 1st SPOC without Affecting 2nd SPOC ---");
    const updatedSpoc1 = await prisma.spoc.update({
      where: { id: spoc1.id },
      data: { name: "Dr. Alpha Coordinator (Lead)" },
    });
    assert(updatedSpoc1.name === "Dr. Alpha Coordinator (Lead)", `1st SPOC updated successfully`);

    const recheckSpoc2 = await prisma.spoc.findUnique({ where: { id: spoc2.id } });
    assert(recheckSpoc2?.name === "Prof. Beta Coordinator", `2nd SPOC remained completely untouched`);

    // 5. Test Password Reset for Specific SPOC
    console.log("\n--- 5. Resetting Password for 2nd SPOC ---");
    const newHash = await bcrypt.hash("new_passcode_2026", 8);
    const updatedSpoc2 = await prisma.spoc.update({
      where: { id: spoc2.id },
      data: { passcodeHash: newHash },
    });
    assert(updatedSpoc2.passcodeHash === newHash, `2nd SPOC passcode updated individually`);

    // 6. Test Email Conflict Prevention
    console.log("\n--- 6. Testing Email Conflict Prevention ---");
    let conflictCaught = false;
    try {
      await prisma.spoc.create({
        data: {
          name: "Dr. Duplicate",
          email: email1, // Same as spoc1
          department: "School of Management",
          passcodeHash: hash,
        },
      });
    } catch {
      conflictCaught = true;
    }
    assert(conflictCaught, `Prevented creating duplicate SPOC with existing email`);

    // 7. Test Deleting Only 1 SPOC from the School
    console.log("\n--- 7. Removing 1st SPOC from School ---");
    await prisma.spoc.delete({ where: { id: spoc1.id } });
    spoc1Id = null;

    const remainingSpocs = await prisma.spoc.findMany({ where: { department: testDept } });
    const stillFound2 = remainingSpocs.find((s) => s.id === spoc2.id);
    assert(!!stillFound2, `2nd SPOC remains active after 1st SPOC was deleted`);

  } finally {
    console.log("\n--- Cleanup ---");
    if (spoc1Id) {
      await prisma.spoc.deleteMany({ where: { id: spoc1Id } });
    }
    if (spoc2Id) {
      await prisma.spoc.deleteMany({ where: { id: spoc2Id } });
    }
    console.log("  ✅ [PASS] Cleaned up test SPOC records");
  }

  console.log("\n================================================================================");
  console.log("ALL MULTIPLE SPOC TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================================");
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
