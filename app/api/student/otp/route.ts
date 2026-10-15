import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStudentOtp, verifyStudentOtp } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { action = "SEND", enrollmentNumber, otp, phone } = await req.json();

    if (!enrollmentNumber || enrollmentNumber.trim().length === 0) {
      return NextResponse.json({ error: "Enrollment number is required." }, { status: 400 });
    }

    const cleanEnroll = enrollmentNumber.trim();

    // Verify student exists in system
    const student = await prisma.student.findUnique({
      where: { enrollmentNumber: cleanEnroll },
      select: { id: true, enrollmentNumber: true, name: true, department: true, phone: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student with this enrollment number is not registered." },
        { status: 404 }
      );
    }

    // 1. ACTION: SEND OTP
    if (action === "SEND") {
      const targetPhone = phone
        ? phone.replace(/[^\d]/g, "").slice(-10)
        : student.phone
        ? student.phone.replace(/[^\d]/g, "").slice(-10)
        : "";

      if (!targetPhone || targetPhone.length < 10) {
        return NextResponse.json(
          {
            error: "Please enter your 10-digit mobile number to receive the verification OTP.",
            phoneRequired: true,
          },
          { status: 400 }
        );
      }

      const result = await sendStudentOtp(cleanEnroll, targetPhone, student.id);
      return NextResponse.json({
        success: true,
        message: result.message,
        phoneRequired: false,
        debugOtp: result.debugOtp,
      });
    }

    // 2. ACTION: VERIFY OTP
    if (action === "VERIFY") {
      if (!otp || otp.trim().length === 0) {
        return NextResponse.json({ error: "Please enter the 6-digit OTP code." }, { status: 400 });
      }

      const targetPhone = phone
        ? phone.replace(/[^\d]/g, "").slice(-10)
        : student.phone
        ? student.phone.replace(/[^\d]/g, "").slice(-10)
        : undefined;

      const isValid = await verifyStudentOtp(cleanEnroll, otp, targetPhone);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid or expired OTP code. Please request a new one." },
          { status: 400 }
        );
      }

      // Update student phone verification status
      if (targetPhone && targetPhone.length === 10) {
        await prisma.student.update({
          where: { id: student.id },
          data: {
            phone: targetPhone,
            phoneVerified: true,
            phoneConsentAt: new Date(),
          },
        });
      } else {
        await prisma.student.update({
          where: { id: student.id },
          data: { phoneVerified: true },
        });
      }

      return NextResponse.json({
        success: true,
        verified: true,
        student,
        message: "Student OTP verified successfully.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process OTP." }, { status: 500 });
  }
}
