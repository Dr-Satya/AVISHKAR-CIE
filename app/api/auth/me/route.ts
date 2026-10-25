import { NextRequest, NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCachedGlobalConfig } from "@/services/registration.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
        getCachedGlobalConfig(),
      ]);

      if (!student) {
        const response = NextResponse.json({ authenticated: false }, { status: 401 });
        clearSessionCookie(response);
        return response;
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
        smsOtpEnabled: false,
        registrationOpen: globalConfig ? Boolean(globalConfig.registrationOpen) : true,
      });
    }

    if (session.role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({
        where: { id: session.id },
      });

      if (!faculty) {
        const response = NextResponse.json({ authenticated: false }, { status: 401 });
        clearSessionCookie(response);
        return response;
      }

      return NextResponse.json({
        authenticated: true,
        user: {
          role: "FACULTY",
          id: faculty.id,
          name: faculty.name,
          email: faculty.email,
          department: faculty.department,
          phone: faculty.phone || null,
          isAdmin: faculty.isAdmin,
          isSpoc: faculty.isSpoc || false,
          spocDepartment: faculty.spocDepartment || null,
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

      if (!spoc && (!faculty || !faculty.isSpoc)) {
        const response = NextResponse.json({ authenticated: false }, { status: 401 });
        clearSessionCookie(response);
        return response;
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
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ authenticated: false, error: "Authentication verification failed." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
    const { phone, confirmPhone, consent } = body;

    // Normalize phone (strip non-digits)
    const cleanPhone = phone?.toString().trim().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
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
      message: "Mobile number saved and declared successfully.",
      student: {
        phone: updated.phone,
        phoneVerified: updated.phoneVerified,
      },
    });
  } catch (error) {
    console.error("Update phone error:", error);
    return NextResponse.json({ error: "Failed to update phone declaration." }, { status: 500 });
  }
}

