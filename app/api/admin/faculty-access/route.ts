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
      phone: true,
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

  const body = await req.json();
  const { action, name, email, department, phone, passcode, facultyId, isAdmin, isSpoc, spocDepartment, newPasscode } = body;

  // ACTION: CREATE NEW FACULTY
  if (action === "CREATE") {
    if (!name || !email || !department) {
      return NextResponse.json(
        { error: "Faculty name, email, and department are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.faculty.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json(
        { error: `Faculty with email ${cleanEmail} already exists.` },
        { status: 400 }
      );
    }

    const defaultPass = passcode && passcode.trim().length >= 6 ? passcode.trim() : (process.env.DEFAULT_FACULTY_PASSCODE || "gdgu@2026");
    const passcodeHash = await bcrypt.hash(defaultPass, 10);

    const created = await prisma.faculty.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        department: department.trim(),
        phone: phone?.trim() || null,
        passcodeHash,
        isAdmin: Boolean(isAdmin),
        isSpoc: Boolean(isSpoc),
        spocDepartment: isSpoc ? spocDepartment?.trim() || department.trim() : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "CREATE_FACULTY",
        target: cleanEmail,
        metadata: JSON.stringify({ name: created.name, department: created.department }),
      },
    });

    return NextResponse.json({ success: true, faculty: created });
  }

  // DEFAULT: UPDATE PERMISSIONS OR RESET PASSCODE
  if (!facultyId) {
    return NextResponse.json({ error: "Faculty ID is required." }, { status: 400 });
  }

  const updateData: any = {};
  if (isAdmin !== undefined) updateData.isAdmin = Boolean(isAdmin);
  if (isSpoc !== undefined) {
    updateData.isSpoc = Boolean(isSpoc);
    updateData.spocDepartment = isSpoc ? spocDepartment || null : null;
  }
  if (name) updateData.name = name.trim();
  if (department) updateData.department = department.trim();
  if (phone !== undefined) updateData.phone = phone?.trim() || null;

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

// EDIT FACULTY (PUT)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id, name, department, phone, isAdmin, isSpoc, spocDepartment, newPasscode } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Faculty ID is required." }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (department) updateData.department = department.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (isAdmin !== undefined) updateData.isAdmin = Boolean(isAdmin);
    if (isSpoc !== undefined) {
      updateData.isSpoc = Boolean(isSpoc);
      updateData.spocDepartment = isSpoc ? spocDepartment || department : null;
    }
    if (newPasscode && newPasscode.trim().length >= 6) {
      updateData.passcodeHash = await bcrypt.hash(newPasscode.trim(), 10);
    }

    const updated = await prisma.faculty.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "UPDATE_FACULTY",
        target: updated.email,
        metadata: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ success: true, faculty: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update faculty." }, { status: 500 });
  }
}

// DELETE FACULTY (DELETE)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Faculty ID is required." }, { status: 400 });
    }

    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found." }, { status: 404 });
    }

    await prisma.faculty.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "DELETE_FACULTY",
        target: faculty.email,
        metadata: JSON.stringify({ name: faculty.name, department: faculty.department }),
      },
    });

    return NextResponse.json({ success: true, message: `Faculty ${faculty.name} deleted successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete faculty." }, { status: 500 });
  }
}
