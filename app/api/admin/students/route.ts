import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "25", 10)));
  const search = searchParams.get("search")?.trim() || "";
  const registeredFilter = searchParams.get("registered") || "all"; // all, yes, no

  const where: Prisma.StudentWhereInput = {};

  const academicYearFilter = searchParams.get("academicYear") || "";

  if (academicYearFilter && academicYearFilter !== "all") {
    where.academicYear = academicYearFilter;
  }

  if (search) {
    where.OR = [
      { enrollmentNumber: { contains: search } },
      { name: { contains: search } },
      { department: { contains: search } },
      { programme: { contains: search } },
    ];
  }

  if (registeredFilter === "yes") {
    where.registration = { isNot: null };
  } else if (registeredFilter === "no") {
    where.registration = null;
  }

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { enrollmentNumber: "asc" },
      include: {
        registration: {
          include: {
            project: {
              select: { projectId: true, title: true },
            },
          },
        },
      },
    }),
  ]);

  const rows = students.map((s) => ({
    id: s.id,
    enrollment: s.enrollmentNumber,
    name: s.name,
    department: s.department,
    program: s.programme || "N/A",
    sem: s.semester,
    batch: s.batch,
    academicYear: s.academicYear,
    admissionNumber: s.admissionNumber || "",
    registered: !!s.registration,
    projectCode: s.registration?.project?.projectId || "—",
    projectTitle: s.registration?.project?.title || "",
  }));

  return NextResponse.json({
    students: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// CREATE STUDENT
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { enrollmentNumber, name, department, programme, semester, batch, admissionNumber, academicYear } = await req.json();

    if (!enrollmentNumber || !name || !department) {
      return NextResponse.json(
        { error: "Enrollment number, name, and department are required." },
        { status: 400 }
      );
    }

    const cleanEnroll = enrollmentNumber.trim();
    const existing = await prisma.student.findUnique({ where: { enrollmentNumber: cleanEnroll } });
    if (existing) {
      return NextResponse.json(
        { error: `Student with enrollment ${cleanEnroll} already exists.` },
        { status: 400 }
      );
    }

    let year = academicYear?.trim();
    if (!year) {
      const config = await prisma.globalConfig.findUnique({ where: { id: "default" } });
      year = config?.activeAcademicYear || "2025-2026";
    }

    const email = `${cleanEnroll.toLowerCase()}@gdgu.org`;

    const student = await prisma.student.create({
      data: {
        enrollmentNumber: cleanEnroll,
        name: name.trim(),
        department: department.trim(),
        programme: programme?.trim() || null,
        semester: parseInt(semester, 10) || 3,
        batch: batch?.trim() || "2025",
        admissionNumber: admissionNumber?.trim() || null,
        email,
        academicYear: year,
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "CREATE_STUDENT",
        target: cleanEnroll,
        metadata: JSON.stringify(student),
      },
    });

    return NextResponse.json({ success: true, student });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create student." }, { status: 500 });
  }
}

// EDIT STUDENT
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id, name, department, programme, semester, batch, admissionNumber, academicYear } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Student ID is required." }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (department) updateData.department = department.trim();
    if (programme !== undefined) updateData.programme = programme?.trim() || null;
    if (semester !== undefined) updateData.semester = parseInt(semester, 10) || 3;
    if (batch) updateData.batch = batch.trim();
    if (admissionNumber !== undefined) updateData.admissionNumber = admissionNumber?.trim() || null;
    if (academicYear) updateData.academicYear = academicYear.trim();

    const updated = await prisma.student.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "UPDATE_STUDENT",
        target: updated.enrollmentNumber,
        metadata: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update student." }, { status: 500 });
  }
}

// DELETE STUDENT
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Student ID is required." }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    await prisma.student.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "DELETE_STUDENT",
        target: student.enrollmentNumber,
        metadata: JSON.stringify({ name: student.name, department: student.department }),
      },
    });

    return NextResponse.json({ success: true, message: `Student ${student.enrollmentNumber} deleted successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete student." }, { status: 500 });
  }
}
