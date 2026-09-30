import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const faculties = await prisma.faculty.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      isAdmin: true,
      isSpoc: true,
      spocDepartment: true,
    },
    orderBy: [{ isSpoc: "desc" }, { isAdmin: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ faculties });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { facultyId, isAdmin, isSpoc, spocDepartment, newPasscode } = await req.json();

  if (!facultyId) {
    return NextResponse.json({ error: "Faculty ID is required." }, { status: 400 });
  }

  const updateData: any = {};
  if (isAdmin !== undefined) updateData.isAdmin = Boolean(isAdmin);
  if (isSpoc !== undefined) {
    updateData.isSpoc = Boolean(isSpoc);
    updateData.spocDepartment = isSpoc ? spocDepartment || null : null;
  }
  if (newPasscode) {
    if (typeof newPasscode !== "string" || newPasscode.length < 6) {
      return NextResponse.json(
        { error: "New passcode must be at least 6 characters long." },
        { status: 400 }
      );
    }
    updateData.passcodeHash = await bcrypt.hash(newPasscode, 10);
  }

  const updated = await prisma.faculty.update({
    where: { id: facultyId },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      actor: session.name,
      actorRole: "ADMIN",
      action: newPasscode ? "ADMIN_PASSWORD_RESET" : "FACULTY_ACCESS_UPDATE",
      target: updated.email,
      metadata: JSON.stringify({
        ...updateData,
        passcodeHash: updateData.passcodeHash ? "[REDACTED]" : undefined,
      }),
    },
  });

  return NextResponse.json({ success: true, faculty: updated });
}
