import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const config = await prisma.globalConfig.findUnique({
    where: { id: "default" },
  });

  return NextResponse.json({ config });
}

import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json();
  const {
    action,
    targetYear,
    startingSemester,
    confirmationPhrase,
    adminPasscode,
    registrationOpen,
    maxSeats,
    sameDeptLimit,
    otherDeptLimit,
    activeSemester,
  } = body;

  // ACTION: DOUBLE-VERIFIED ACADEMIC YEAR ACTIVATION
  if (action === "ACTIVATE_ACADEMIC_YEAR") {
    if (!targetYear || typeof targetYear !== "string" || !/^\d{4}-\d{4}$/.test(targetYear.trim())) {
      return NextResponse.json(
        { error: "Invalid academic year format. Expected format: YYYY-YYYY (e.g., 2026-2027)." },
        { status: 400 }
      );
    }

    const cleanYear = targetYear.trim();

    // 1st Verification: Confirmation phrase
    const expectedPhrase = `CONFIRM ${cleanYear}`;
    if (confirmationPhrase?.trim() !== expectedPhrase) {
      return NextResponse.json(
        { error: `Verification failure: You must type '${expectedPhrase}' exactly to proceed.` },
        { status: 400 }
      );
    }

    // 2nd Verification: Admin Security Passcode Check
    if (!adminPasscode) {
      return NextResponse.json(
        { error: "Verification failure: Admin passcode is required for cohort rollover." },
        { status: 400 }
      );
    }

    const adminUser = await prisma.admin.findUnique({
      where: { email: session.email },
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Admin profile not found." }, { status: 404 });
    }

    const passcodeValid = await bcrypt.compare(adminPasscode, adminUser.passcodeHash);
    if (!passcodeValid) {
      return NextResponse.json({ error: "Invalid admin passcode. Operation aborted." }, { status: 401 });
    }

    const sem = parseInt(startingSemester, 10) === 4 ? 4 : 3;

    const updated = await prisma.globalConfig.upsert({
      where: { id: "default" },
      update: {
        activeAcademicYear: cleanYear,
        activeSemester: sem,
      },
      create: {
        id: "default",
        activeAcademicYear: cleanYear,
        activeSemester: sem,
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "ACADEMIC_YEAR_ACTIVATED",
        metadata: JSON.stringify({
          previousYear: (await prisma.globalConfig.findUnique({ where: { id: "default" } }))?.activeAcademicYear,
          activatedYear: cleanYear,
          startingSemester: sem,
        }),
      },
    });

    broadcastEvent("configuration.updated", updated);

    return NextResponse.json({
      success: true,
      message: `Academic year ${cleanYear} (Semester ${sem === 3 ? "1 (Sem 3)" : "2 (Sem 4)"}) is now active.`,
      config: updated,
    });
  }

  // STANDARD LIMITS & CONFIGURATION UPDATE
  const numMaxSeats = parseInt(maxSeats, 10);
  const numSameDept = parseInt(sameDeptLimit, 10);
  const numOtherDept = parseInt(otherDeptLimit, 10);
  const numSem = activeSemester !== undefined ? (parseInt(activeSemester, 10) === 4 ? 4 : 3) : undefined;

  if (isNaN(numMaxSeats) || isNaN(numSameDept) || isNaN(numOtherDept)) {
    return NextResponse.json({ error: "Invalid numeric limits provided." }, { status: 400 });
  }

  if (numMaxSeats < 1 || numSameDept < 0 || numOtherDept < 0) {
    return NextResponse.json({ error: "Limits must be non-negative values." }, { status: 400 });
  }

  const updateData: any = {
    registrationOpen: Boolean(registrationOpen),
    maxSeats: numMaxSeats,
    sameDeptLimit: numSameDept,
    otherDeptLimit: numOtherDept,
  };
  if (numSem !== undefined) {
    updateData.activeSemester = numSem;
  }

  const updated = await prisma.globalConfig.upsert({
    where: { id: "default" },
    update: updateData,
    create: {
      id: "default",
      registrationOpen: Boolean(registrationOpen),
      maxSeats: numMaxSeats,
      sameDeptLimit: numSameDept,
      otherDeptLimit: numOtherDept,
      activeSemester: numSem || 3,
    },
  });

  await prisma.auditLog.create({
    data: {
      actor: session.name,
      actorRole: "ADMIN",
      action: "CONFIGURATION_UPDATE",
      metadata: JSON.stringify(updated),
    },
  });

  broadcastEvent("configuration.updated", updated);

  return NextResponse.json({ success: true, config: updated });
}
