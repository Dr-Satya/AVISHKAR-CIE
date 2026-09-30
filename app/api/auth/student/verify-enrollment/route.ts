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

    // Verify enrollment number exists in master records
    const student = await prisma.student.findUnique({
      where: { enrollmentNumber: cleanEnrollment },
      include: { registration: true, identities: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Enrollment number not found in student master records." },
        { status: 404 }
      );
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
    await prisma.$transaction([
      prisma.student.update({
        where: { id: student.id },
        data: {
          email: session.email,
        },
      }),
      prisma.studentIdentity.upsert({
        where: { email: session.email },
        update: { studentId: student.id },
        create: {
          studentId: student.id,
          email: session.email,
          googleId: `google_${session.email}`,
        },
      }),
    ]);

    // Issue permanent student session
    const permanentToken = await signSessionToken({
      role: "STUDENT",
      id: student.id,
      email: session.email,
      name: student.name,
      enrollmentNumber: student.enrollmentNumber,
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
    return NextResponse.json(
      { error: error.message || "Failed to verify enrollment." },
      { status: 500 }
    );
  }
}
