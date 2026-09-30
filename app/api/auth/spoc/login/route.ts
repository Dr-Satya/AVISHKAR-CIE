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
        { error: "SPOC email and passcode are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Faculty record (Primary: Faculty using their own faculty credentials)
    const faculty = await prisma.faculty.findUnique({
      where: { email: cleanEmail },
      include: { spocProfile: true },
    });

    if (faculty) {
      // Step A: Check faculty passcode
      const isValid = await bcrypt.compare(passcode, faculty.passcodeHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid credentials. Incorrect passcode." },
          { status: 401 }
        );
      }

      // Step B: Explicit permission confirmation
      if (!faculty.isSpoc) {
        return NextResponse.json(
          {
            error: "Access Denied: You do not have Department SPOC permissions. Only faculty members designated as SPOC by the administrator can access this dashboard.",
          },
          { status: 403 }
        );
      }

      const assignedDepartment = faculty.spocDepartment || faculty.department;
      if (!assignedDepartment) {
        return NextResponse.json(
          { error: "Access Denied: No department assigned to your SPOC profile. Please contact the administrator." },
          { status: 403 }
        );
      }

      // Step C: Access confirmed - Issue session token
      const token = await signSessionToken({
        role: "SPOC",
        id: faculty.spocProfile?.id || faculty.id,
        email: faculty.email,
        name: faculty.name,
        department: assignedDepartment,
        spocDepartment: assignedDepartment,
        isSpoc: true,
      });

      const response = NextResponse.json({
        success: true,
        spoc: {
          id: faculty.spocProfile?.id || faculty.id,
          name: faculty.name,
          email: faculty.email,
          department: assignedDepartment,
          facultyName: faculty.name,
        },
      });

      setSessionCookie(response, token);
      return response;
    }

    // 2. Fallback: Check dedicated SPOC table (backwards compatibility)
    const spoc = await prisma.spoc.findUnique({
      where: { email: cleanEmail },
      include: { faculty: true },
    });

    if (spoc) {
      const isValid = await bcrypt.compare(passcode, spoc.passcodeHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid credentials. Incorrect passcode." },
          { status: 401 }
        );
      }

      const token = await signSessionToken({
        role: "SPOC",
        id: spoc.id,
        email: spoc.email,
        name: spoc.name,
        department: spoc.department,
        spocDepartment: spoc.department,
        isSpoc: true,
      });

      const response = NextResponse.json({
        success: true,
        spoc: {
          id: spoc.id,
          name: spoc.name,
          email: spoc.email,
          department: spoc.department,
          facultyName: spoc.faculty?.name || spoc.name,
        },
      });

      setSessionCookie(response, token);
      return response;
    }

    return NextResponse.json(
      { error: "Account not found. Please verify your official faculty email address." },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("SPOC login error:", error);
    return NextResponse.json(
      { error: error.message || "SPOC login failed." },
      { status: 500 }
    );
  }
}
