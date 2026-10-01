import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStudentOtp, verifyStudentOtp } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { action = "SEND", enrollmentNumber, otp } = await req.json();

    if (!enrollmentNumber || enrollmentNumber.trim().length === 0) {
      return NextResponse.json({ error: "Enrollment number is required." }, { status: 400 });
    }

    const cleanEnroll = enrollmentNumber.trim();

    // Verify student exists in system
    const student = await prisma.student.findUnique({
      where: { enrollmentNumber: cleanEnroll },
      select: { id: true, enrollmentNumber: true, name: true, department: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student with this enrollment number is not registered." },
        { status: 404 }
      );
    }

    // 1. ACTION: SEND OTP
    if (action === "SEND") {
      const result = await sendStudentOtp(cleanEnroll);
      return NextResponse.json({
        success: true,
        message: "OTP sent to student registered phone number.",
        debugOtp: result.debugOtp,
      });
    }

    // 2. ACTION: VERIFY OTP
    if (action === "VERIFY") {
      if (!otp || otp.trim().length === 0) {
        return NextResponse.json({ error: "Please enter the 6-digit OTP code." }, { status: 400 });
      }

      const isValid = verifyStudentOtp(cleanEnroll, otp);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid or expired OTP code. Please request a new one." },
          { status: 400 }
        );
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
