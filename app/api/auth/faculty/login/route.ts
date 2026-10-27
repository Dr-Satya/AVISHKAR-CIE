import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signSessionToken, setSessionCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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

    const cleanInput = email.trim();
    const cleanEmail = cleanInput.toLowerCase();
    const phoneDigits = cleanInput.replace(/\D/g, "");
    const searchEmail = cleanEmail.includes("@") ? cleanEmail : `${cleanEmail}@gdgu.org`;

    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`faculty_login:${cleanEmail}:${ip}`, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,                  // max 10 attempts per account from this IP
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many login attempts for this account. Access temporarily locked for security. Please try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minute(s).`,
        },
        { status: 429 }
      );
    }

    const faculty = await prisma.faculty.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { email: searchEmail },
          ...(phoneDigits.length >= 10
            ? [
                { phone: cleanInput },
                { phone: `91-${phoneDigits.slice(-10)}` },
                { phone: phoneDigits },
              ]
            : []),
        ],
      },
    });

    if (!faculty || !faculty.passcodeHash) {
      return NextResponse.json(
        { error: `Faculty account '${email}' not found. Please verify your official faculty email.` },
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
      department: faculty.department,
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
    console.error("Faculty login error:", error);
    return NextResponse.json(
      { error: "Faculty authentication failed. Please check your credentials and try again." },
      { status: 500 }
    );
  }
}
