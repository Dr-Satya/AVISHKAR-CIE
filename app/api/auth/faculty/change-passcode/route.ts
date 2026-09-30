import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "FACULTY") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { currentPasscode, newPasscode, confirmPasscode } = await req.json();

    if (!currentPasscode || !newPasscode) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (newPasscode !== confirmPasscode) {
      return NextResponse.json({ error: "New passcodes do not match." }, { status: 400 });
    }

    if (newPasscode.length < 6) {
      return NextResponse.json(
        { error: "New passcode must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id: session.id },
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty member not found." }, { status: 404 });
    }

    const isCurrentValid = await bcrypt.compare(currentPasscode, faculty.passcodeHash);
    if (!isCurrentValid) {
      return NextResponse.json({ error: "Current passcode is incorrect." }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPasscode, 10);
    await prisma.faculty.update({
      where: { id: faculty.id },
      data: { passcodeHash: newHash },
    });

    await prisma.auditLog.create({
      data: {
        actor: faculty.name,
        actorRole: "FACULTY",
        action: "FACULTY_PASSWORD_CHANGE",
        target: faculty.email,
      },
    });

    return NextResponse.json({ success: true, message: "Passcode updated successfully." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update passcode." },
      { status: 500 }
    );
  }
}
