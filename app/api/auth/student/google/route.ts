import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInput = (body.identifier || body.email || body.enrollmentNumber || "").trim();

    if (!rawInput) {
      return NextResponse.json(
        { error: "Enrollment number or official GDGU email is required." },
        { status: 400 }
      );
    }

    let cleanEnrollment = "";
    let normalizedEmail = "";

    if (rawInput.includes("@")) {
      normalizedEmail = rawInput.toLowerCase();
      if (!normalizedEmail.endsWith("@gdgu.org")) {
        const response = NextResponse.json(
          {
            error: "Please sign in using your official GDGU account (@gdgu.org).",
            unauthorizedDomain: true,
          },
          { status: 403 }
        );
        clearSessionCookie(response);
        return response;
      }
      const username = normalizedEmail.split("@")[0];
      cleanEnrollment = username;
    } else {
      cleanEnrollment = rawInput.replace(/\s+/g, "");
      normalizedEmail = `${cleanEnrollment.toLowerCase()}@gdgu.org`;
    }

    // Verify student exists in official master records
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { enrollmentNumber: cleanEnrollment },
          { email: normalizedEmail },
          { identities: { some: { email: normalizedEmail } } },
        ],
      },
      include: { registration: true },
    });

    if (!student) {
      // Reject unauthorized enrollment / email immediately.
      // Clear any existing session cookie so no previous session leaks.
      const response = NextResponse.json(
        {
          error: `Enrollment number / Email '${rawInput}' is not found in the official university IDP student records. Access denied. You must be an officially enrolled student to access this portal.`,
          notFound: true,
        },
        { status: 404 }
      );
      clearSessionCookie(response);
      return response;
    }

    // Update email on student record if not yet linked
    if (!student.email) {
      await prisma.student.update({
        where: { id: student.id },
        data: { email: normalizedEmail },
      });
    }

    // Issue permanent student session strictly bound to THIS student record
    const token = await signSessionToken({
      role: "STUDENT",
      id: student.id,
      email: student.email || normalizedEmail,
      name: student.name,
      enrollmentNumber: student.enrollmentNumber,
    });

    const response = NextResponse.json({
      success: true,
      requiresEnrollment: false,
      student: {
        id: student.id,
        name: student.name,
        enrollmentNumber: student.enrollmentNumber,
        department: student.department,
        programme: student.programme,
        batch: student.batch,
        isRegistered: !!student.registration,
      },
    });

    setSessionCookie(response, token);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Authentication failed." },
      { status: 500 }
    );
  }
}

