import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, signSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT" || !session.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please authenticate with your GDGU Google account first." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { enrollmentNumber } = body;

    if (!enrollmentNumber || typeof enrollmentNumber !== "string") {
      return NextResponse.json({ error: "Enrollment number is required." }, { status: 400 });
    }

    const cleanEnrollment = enrollmentNumber.trim();
    const upperEnrollment = cleanEnrollment.toUpperCase();
    const lowerEnrollment = cleanEnrollment.toLowerCase();

    // Verify enrollment number exists in master records (checking enrollmentNumber and admissionNumber)
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { enrollmentNumber: cleanEnrollment },
          { enrollmentNumber: upperEnrollment },
          { enrollmentNumber: lowerEnrollment },
          { admissionNumber: cleanEnrollment },
          { admissionNumber: upperEnrollment },
        ],
      },
      include: { registration: true, identities: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Enrollment number or Admission ID not found in student master records." },
        { status: 404 }
      );
    }

    // Security check: Check if email prefix enrollment/admission matches requested student
    const emailPrefixDigits = session.email.split("@")[0].match(/^\d+/);
    if (emailPrefixDigits) {
      const p = emailPrefixDigits[0];
      const isMatch =
        p === student.enrollmentNumber ||
        p === student.admissionNumber ||
        upperEnrollment === (student.enrollmentNumber || "").toUpperCase() ||
        upperEnrollment === (student.admissionNumber || "").toUpperCase();

      if (!isMatch) {
        return NextResponse.json(
          {
            error: `Account Mismatch: Your university account (${session.email}) does not match this student record. You cannot claim another student's account.`,
          },
          { status: 403 }
        );
      }
    }

    // Security check: Check if this enrollment is already linked to another email
    if (student.email && student.email !== session.email && student.identities.length > 0) {
      const isLinkedToOther = student.identities.some((id) => id.email !== session.email);
      if (isLinkedToOther) {
        return NextResponse.json(
          { error: "This enrollment number is already registered to another student account." },
          { status: 403 }
        );
      }
    }

    // Link the student to this Google email identity
    await prisma.student.update({
      where: { id: student.id },
      data: {
        email: session.email,
      },
    });

    await prisma.studentIdentity.upsert({
      where: { email: session.email },
      update: { studentId: student.id },
      create: {
        studentId: student.id,
        email: session.email,
        googleId: `google_${session.email}`,
      },
    });

    // Issue permanent student session
    const permanentToken = await signSessionToken({
      role: "STUDENT",
      id: student.id,
      email: session.email,
      name: student.name,
      enrollmentNumber: student.enrollmentNumber,
      department: student.department,
    });

    const response = NextResponse.json({
      success: true,
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

    setSessionCookie(response, permanentToken);
    return response;
  } catch (error: any) {
    console.error("Enrollment verification error:", error);
    return NextResponse.json(
      { error: "Enrollment verification failed. Please check your enrollment number and try again." },
      { status: 500 }
    );
  }
}
