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

    let cleanInput = rawInput.replace(/\s+/g, "");
    let isEmail = rawInput.includes("@");
    let normalizedEmail = isEmail ? rawInput.toLowerCase() : "";
    let cleanEnrollment = "";
    let prefixDigits = "";

    if (isEmail) {
      const rawUsername = normalizedEmail.split("@")[0];
      const matchDigits = rawUsername.match(/^\d+/);
      prefixDigits = matchDigits ? matchDigits[0] : "";
      cleanEnrollment = prefixDigits || rawUsername;
    } else {
      cleanEnrollment = cleanInput;
      normalizedEmail = `${cleanEnrollment.toLowerCase()}@gdgu.org`;
    }

    const upperEnrollment = cleanEnrollment.toUpperCase();
    const lowerEnrollment = cleanEnrollment.toLowerCase();
    const phoneDigits = cleanInput.replace(/\D/g, "");

    // Verify student exists in official master records across enrollment, admission number, email, or phone
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { enrollmentNumber: cleanEnrollment },
          { enrollmentNumber: upperEnrollment },
          { enrollmentNumber: lowerEnrollment },
          { admissionNumber: cleanEnrollment },
          { admissionNumber: upperEnrollment },
          { email: normalizedEmail },
          { identities: { some: { email: normalizedEmail } } },
          ...(prefixDigits
            ? [
                { enrollmentNumber: prefixDigits },
                { admissionNumber: prefixDigits },
              ]
            : []),
          ...(phoneDigits.length >= 10
            ? [
                { phone: cleanInput },
                { phone: phoneDigits.slice(-10) },
              ]
            : []),
        ],
      },
      include: { registration: true },
    });

    if (!student) {
      if (isEmail && !normalizedEmail.endsWith("@gdgu.org") && !normalizedEmail.endsWith("@gmail.com")) {
        const response = NextResponse.json(
          {
            error: "Please sign in using your official GDGU account (@gdgu.org) or authorized test account.",
            unauthorizedDomain: true,
          },
          { status: 403 }
        );
        clearSessionCookie(response);
        return response;
      }

      // Reject unauthorized enrollment / email immediately.
      // Clear any existing session cookie so no previous session leaks.
      const response = NextResponse.json(
        {
          error: `Identifier '${rawInput}' was not found in official university IDP student records. Please verify your Enrollment Number or Admission ID.`,
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
      department: student.department,
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
    console.error("Student Google auth error:", error);
    return NextResponse.json(
      { error: "Google authentication failed. Please sign in with your official @gdgu.org student account." },
      { status: 500 }
    );
  }
}

