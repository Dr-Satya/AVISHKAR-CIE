import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  if (session.role === "STUDENT") {
    const student = await prisma.student.findUnique({
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
    });

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
        registration: student.registration,
      },
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
