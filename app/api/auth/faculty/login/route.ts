import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, passcode } = await req.json();

    if (!email || !passcode) {
      return NextResponse.json(
        { error: "Faculty email and passcode are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const faculty = await prisma.faculty.findUnique({
      where: { email: cleanEmail },
    });

    if (!faculty) {
      return NextResponse.json(
        { error: "Invalid faculty credentials." },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(passcode, faculty.passcodeHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid faculty credentials." },
        { status: 401 }
      );
    }

    const token = await signSessionToken({
      role: "FACULTY",
      id: faculty.id,
      email: faculty.email,
      name: faculty.name,
      isAdmin: faculty.isAdmin,
      isSpoc: faculty.isSpoc,
      spocDepartment: faculty.spocDepartment,
    });

    const response = NextResponse.json({
      success: true,
      faculty: {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        isAdmin: faculty.isAdmin,
        isSpoc: faculty.isSpoc,
        spocDepartment: faculty.spocDepartment,
      },
    });

    setSessionCookie(response, token);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Login failed." },
      { status: 500 }
    );
  }
}
