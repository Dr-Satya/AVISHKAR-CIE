import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { cleanErrorMessage } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "25", 10)));
    const search = searchParams.get("search")?.trim() || "";

    const where: Prisma.RegistrationWhereInput = {};

    if (search) {
      where.OR = [
        { student: { enrollmentNumber: { contains: search } } },
        { student: { name: { contains: search } } },
        { student: { department: { contains: search } } },
        { project: { projectId: { contains: search } } },
        { project: { title: { contains: search } } },
        { project: { faculty: { name: { contains: search } } } },
        { project: { theme: { contains: search } } },
      ];
    }

    const [total, registrations] = await Promise.all([
      prisma.registration.count({ where }),
      prisma.registration.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          student: true,
          project: {
            include: { faculty: true },
          },
        },
      }),
    ]);

    const rows = registrations.map((r) => {
      const d = new Date(r.createdAt);
      const formattedTimestamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

      return {
        id: r.id,
        studentId: r.studentId,
        projectId: r.projectId,
        timestamp: formattedTimestamp,
        enrollment: r.student.enrollmentNumber,
        studentName: r.student.name,
        department: r.student.department,
        projectCode: r.project.projectId,
        projectTitle: r.project.title,
        facultyName: r.project.faculty.name,
        status: r.status,
        theme: r.project.theme,
      };
    });

    return NextResponse.json({
      registrations: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: cleanErrorMessage(err, "Failed to load registrations.") },
      { status: 500 }
    );
  }
}

// POST: MAP STUDENT TO PROJECT / FACULTY
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { studentId, enrollmentNumber, projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project / Faculty selection is required." }, { status: 400 });
    }

    if (!studentId && !enrollmentNumber) {
      return NextResponse.json({ error: "Student ID or enrollment number is required." }, { status: 400 });
    }

    // Resolve Student
    let student = null;
    if (studentId) {
      student = await prisma.student.findUnique({ where: { id: studentId } });
    } else if (enrollmentNumber) {
      student = await prisma.student.findUnique({ where: { enrollmentNumber: enrollmentNumber.trim() } });
    }

    if (!student) {
      return NextResponse.json({ error: "Student not found in database." }, { status: 404 });
    }

    // Resolve Project
    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id: projectId }, { projectId: projectId }],
      },
      include: {
        faculty: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Upsert registration for this student
    const registration = await prisma.registration.upsert({
      where: { studentId: student.id },
      update: {
        projectId: project.id,
        status: "Approved",
      },
      create: {
        studentId: student.id,
        projectId: project.id,
        status: "Approved",
      },
      include: {
        student: true,
        project: {
          include: { faculty: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "MAP_STUDENT_TO_PROJECT",
        target: student.enrollmentNumber,
        metadata: JSON.stringify({
          studentName: student.name,
          projectCode: project.projectId,
          projectTitle: project.title,
          facultyName: project.faculty.name,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully mapped ${student.name} (${student.enrollmentNumber}) to ${project.faculty.name} (${project.projectId}).`,
      registration,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: cleanErrorMessage(err, "Failed to map student to project.") },
      { status: 500 }
    );
  }
}

// DELETE: UNMAP / REMOVE STUDENT FROM PROJECT
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const studentId = searchParams.get("studentId");
    const enrollment = searchParams.get("enrollment");

    let registration = null;
    if (id) {
      registration = await prisma.registration.findUnique({
        where: { id },
        include: { student: true, project: { include: { faculty: true } } },
      });
    } else if (studentId) {
      registration = await prisma.registration.findUnique({
        where: { studentId },
        include: { student: true, project: { include: { faculty: true } } },
      });
    } else if (enrollment) {
      const student = await prisma.student.findUnique({ where: { enrollmentNumber: enrollment.trim() } });
      if (student) {
        registration = await prisma.registration.findUnique({
          where: { studentId: student.id },
          include: { student: true, project: { include: { faculty: true } } },
        });
      }
    }

    if (!registration) {
      return NextResponse.json({ error: "Registration record not found." }, { status: 404 });
    }

    await prisma.registration.delete({
      where: { id: registration.id },
    });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "UNMAP_STUDENT_FROM_PROJECT",
        target: registration.student.enrollmentNumber,
        metadata: JSON.stringify({
          studentName: registration.student.name,
          projectCode: registration.project.projectId,
          facultyName: registration.project.faculty.name,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Student ${registration.student.name} (${registration.student.enrollmentNumber}) has been unmapped from project ${registration.project.projectId}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: cleanErrorMessage(err, "Failed to unmap student from project.") },
      { status: 500 }
    );
  }
}
