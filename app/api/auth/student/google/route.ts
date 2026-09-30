import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, googleId, name, credential } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check allowed domain: primary is @gdgu.org
    if (!normalizedEmail.endsWith("@gdgu.org")) {
      return NextResponse.json(
        {
          error: "Please sign in using your official GDGU email account (@gdgu.org).",
          unauthorizedDomain: true,
        },
        { status: 403 }
      );
    }

    // Check if this Google identity or email is already linked to a student
    let student = await prisma.student.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          googleId ? { googleId: googleId } : {},
          { identities: { some: { email: normalizedEmail } } },
        ],
      },
      include: { registration: true },
    });

    if (student) {
      // Student is recognized and linked! Create full session
      const token = await signSessionToken({
        role: "STUDENT",
        id: student.id,
        email: normalizedEmail,
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
    }

    // Google email is valid GDGU domain, but not yet linked to an enrollment number
    // Issue a temporary verification token to permit the enrollment verification step
    const tempToken = await signSessionToken({
      role: "STUDENT",
      id: "pending",
      email: normalizedEmail,
      name: name || "GDGU Student",
    });

    const response = NextResponse.json({
      success: true,
      requiresEnrollment: true,
      email: normalizedEmail,
    });

    setSessionCookie(response, tempToken);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Authentication failed." },
      { status: 500 }
    );
  }
}
