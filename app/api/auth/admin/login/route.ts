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
        { error: "Email and passcode are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`admin_login:${cleanEmail}:${ip}`, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,                   // max 5 attempts per account from this IP
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Too many login attempts for this account. Access temporarily locked for security. Please try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minute(s).`,
        },
        { status: 429 }
      );
    }

    // Check system admin table
    const admin = await prisma.admin.findUnique({
      where: { email: cleanEmail },
    });

    if (admin) {
      const isValid = admin.passcodeHash ? await bcrypt.compare(passcode, admin.passcodeHash) : false;
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid admin credentials." },
          { status: 401 }
        );
      }

      const token = await signSessionToken({
        role: "ADMIN",
        id: admin.id,
        email: admin.email,
        name: admin.name,
      });

      const response = NextResponse.json({
        success: true,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      });

      setSessionCookie(response, token);
      return response;
    }

    // 2. Check Faculty record (Faculty using their own credentials for Admin access)
    const faculty = await prisma.faculty.findUnique({
      where: { email: cleanEmail },
    });

    if (faculty) {
      // Step A: Verify faculty passcode
      const isValid = faculty.passcodeHash ? await bcrypt.compare(passcode, faculty.passcodeHash) : false;
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid credentials. Incorrect passcode." },
          { status: 401 }
        );
      }

      // Step B: Explicit permission confirmation
      if (!faculty.isAdmin) {
        return NextResponse.json(
          {
            error: "Access Denied: Your faculty account does not have administrator privileges. Please contact the system administrator.",
          },
          { status: 403 }
        );
      }

      // Step C: Access confirmed - Issue session token
      const token = await signSessionToken({
        role: "ADMIN",
        id: faculty.id,
        email: faculty.email,
        name: faculty.name,
        isAdmin: true,
      });

      const response = NextResponse.json({
        success: true,
        admin: {
          id: faculty.id,
          name: faculty.name,
          email: faculty.email,
          role: "FACULTY_ADMIN",
        },
      });

      setSessionCookie(response, token);
      return response;
    }

    return NextResponse.json(
      { error: "Account not found. Please verify your official administrator or faculty email." },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Admin authentication failed. Please try again or verify your credentials." },
      { status: 500 }
    );
  }
}
