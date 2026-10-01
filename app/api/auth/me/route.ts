import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (session.role === "STUDENT") {
    const [student, globalConfig] = await Promise.all([
      prisma.student.findUnique({
        where: { id: session.id },
        include: {
          registration: {
            include: {
              project: {
                include: { faculty: true },
              },
            },
          },
        },
      }),
      prisma.globalConfig.findUnique({
        where: { id: "default" },
      }),
    ]);

    if (!student) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        role: "STUDENT",
        id: student.id,
        name: student.name,
        enrollmentNumber: student.enrollmentNumber,
        department: student.department,
        programme: student.programme,
        semester: student.semester,
        batch: student.batch,
        email: student.email,
        phone: student.phone,
        phoneVerified: Boolean(student.phoneVerified),
        registration: student.registration,
      },
      smsOtpEnabled: Boolean(globalConfig?.smsOtpEnabled),
    });
  }

  if (session.role === "FACULTY") {
    const faculty = await prisma.faculty.findUnique({
      where: { id: session.id },
    });
    return NextResponse.json({
      authenticated: true,
      user: {
        role: "FACULTY",
        id: faculty?.id,
        name: faculty?.name,
        email: faculty?.email,
        department: faculty?.department,
        isAdmin: faculty?.isAdmin,
        isSpoc: faculty?.isSpoc || false,
        spocDepartment: faculty?.spocDepartment || null,
      },
    });
  }

  if (session.role === "SPOC") {
    const spoc = await prisma.spoc.findUnique({
      where: { id: session.id },
      include: { faculty: true },
    });

    let faculty = spoc?.faculty;
    if (!faculty) {
      faculty = await prisma.faculty.findUnique({
        where: { id: session.id },
      });
    }

    const dept = spoc?.department || faculty?.spocDepartment || session.spocDepartment || session.department;

    return NextResponse.json({
      authenticated: true,
      user: {
        role: "SPOC",
        id: session.id,
        name: faculty?.name || spoc?.name || session.name,
        email: faculty?.email || spoc?.email || session.email,
        department: dept,
        spocDepartment: dept,
        isSpoc: true,
        faculty: faculty
          ? { id: faculty.id, name: faculty.name, email: faculty.email }
          : null,
      },
    });
  }

  if (session.role === "ADMIN") {
    return NextResponse.json({
      authenticated: true,
      user: {
        role: "ADMIN",
        id: session.id,
        name: session.name,
        email: session.email,
      },
    });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const student = await prisma.student.findUnique({
    where: { id: session.id },
  });
  if (!student) {
    return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  }

  const body = await req.json();
  const { action, phone, confirmPhone, otp, consent } = body;

  const globalConfig = await prisma.globalConfig.findUnique({
    where: { id: "default" },
  });
  const smsOtpEnabled = Boolean(globalConfig?.smsOtpEnabled);

  // Normalize phone (strip non-digits)
  const cleanPhone = phone?.toString().trim().replace(/\D/g, "");
  if (!cleanPhone || cleanPhone.length !== 10) {
    return NextResponse.json(
      { error: "Please enter a valid 10-digit mobile number." },
      { status: 400 }
    );
  }

  // ACTION 1: SEND_OTP (When SMS OTP is ON)
  if (action === "SEND_OTP") {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete older OTPs for this student
    await prisma.studentPhoneOtp.deleteMany({
      where: { studentId: student.id },
    });

    await prisma.studentPhoneOtp.create({
      data: {
        studentId: student.id,
        phone: cleanPhone,
        otp: generatedOtp,
        expiresAt,
      },
    });

    console.log(`[SMS 2FA OTP] Sent to student ${student.enrollmentNumber} (${cleanPhone}): ${generatedOtp}`);

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}.`,
      // For local testing & environments without active carrier gateway
      devOtp: generatedOtp,
    });
  }

  // ACTION 2: VERIFY_OTP (When SMS OTP is ON)
  if (action === "VERIFY_OTP") {
    if (!consent) {
      return NextResponse.json(
        { error: "Consent is required: please tick 'this will be used for further communication'." },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return NextResponse.json(
        { error: "Please enter the valid 6-digit OTP received on your mobile." },
        { status: 400 }
      );
    }

    const cleanOtp = otp.trim();
    const otpRecord = await prisma.studentPhoneOtp.findFirst({
      where: {
        studentId: student.id,
        phone: cleanPhone,
        otp: cleanOtp,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP. Please request a new code." },
        { status: 400 }
      );
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        phone: cleanPhone,
        phoneVerified: true,
        phoneConsentAt: new Date(),
      },
    });

    // Cleanup OTPs
    await prisma.studentPhoneOtp.deleteMany({
      where: { studentId: student.id },
    });

    return NextResponse.json({
      success: true,
      message: "Mobile number verified successfully.",
      student: {
        phone: updated.phone,
        phoneVerified: updated.phoneVerified,
      },
    });
  }

  // ACTION 3: SAVE_PHONE (When SMS OTP is OFF)
  if (action === "SAVE_PHONE") {
    if (smsOtpEnabled) {
      return NextResponse.json(
        { error: "SMS 2FA OTP mode is currently active. Please verify using OTP." },
        { status: 400 }
      );
    }

    const cleanConfirm = confirmPhone?.toString().trim().replace(/\D/g, "");
    if (!cleanConfirm || cleanConfirm !== cleanPhone) {
      return NextResponse.json(
        { error: "Mobile numbers do not match. Please re-enter to confirm." },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { error: "Consent is required: please tick 'this will be used for further communication'." },
        { status: 400 }
      );
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        phone: cleanPhone,
        phoneVerified: true,
        phoneConsentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Mobile number saved successfully.",
      student: {
        phone: updated.phone,
        phoneVerified: updated.phoneVerified,
      },
    });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}

