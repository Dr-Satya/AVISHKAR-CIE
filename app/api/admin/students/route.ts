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
  const schoolFilter = searchParams.get("school") || searchParams.get("department") || "all";
  const branchFilter = searchParams.get("branch") || searchParams.get("programme") || "all";
  const genderFilter = searchParams.get("gender") || "all";
  const sortBy = searchParams.get("sortBy") || "enrollmentNumber";
  const sortOrder = (searchParams.get("sortOrder") || "asc").toLowerCase() === "desc" ? "desc" : "asc";

  const where: Prisma.StudentWhereInput = {};

  const academicYearFilter = searchParams.get("academicYear") || "";

  if (academicYearFilter && academicYearFilter !== "all") {
    where.academicYear = academicYearFilter;
  }

  if (schoolFilter && schoolFilter !== "all") {
    where.department = schoolFilter;
  }

  if (branchFilter && branchFilter !== "all") {
    where.programme = branchFilter;
  }

  if (genderFilter && genderFilter !== "all") {
    where.gender = genderFilter;
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

  // Determine Prisma orderBy
  let orderByClause: Prisma.StudentOrderByWithRelationInput = { enrollmentNumber: "asc" };
  if (sortBy === "name") {
    orderByClause = { name: sortOrder };
  } else if (sortBy === "department" || sortBy === "school") {
    orderByClause = { department: sortOrder };
  } else if (sortBy === "programme" || sortBy === "branch") {
    orderByClause = { programme: sortOrder };
  } else if (sortBy === "gender") {
    orderByClause = { gender: sortOrder };
  } else if (sortBy === "internals" || sortBy === "internalMarks") {
    orderByClause = { internalMarks: sortOrder };
  } else if (sortBy === "externals" || sortBy === "externalMarks") {
    orderByClause = { externalMarks: sortOrder };
  } else if (sortBy === "attendance" || sortBy === "attendancePercent") {
    orderByClause = { attendancePercent: sortOrder };
  } else if (sortBy === "semester") {
    orderByClause = { semester: sortOrder };
  } else if (sortBy === "batch") {
    orderByClause = { batch: sortOrder };
  } else {
    orderByClause = { enrollmentNumber: sortOrder };
  }

  // Filter for unregistered aggregates
  const unregWhere: Prisma.StudentWhereInput = {
    registration: null,
    ...(academicYearFilter && academicYearFilter !== "all" ? { academicYear: academicYearFilter } : {}),
  };

  const [total, students, unregisteredTotal, unregStudentsSample, allSchoolsRaw, allBranchesRaw] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: orderByClause,
      include: {
        registration: {
          include: {
            project: {
              select: {
                projectId: true,
                title: true,
                category: true,
                faculty: {
                  select: { name: true, email: true, phone: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.student.count({ where: unregWhere }),
    prisma.student.findMany({
      where: unregWhere,
      select: { department: true, programme: true, gender: true },
    }),
    prisma.student.findMany({
      distinct: ["department"],
      select: { department: true },
      orderBy: { department: "asc" },
    }),
    prisma.student.findMany({
      where: { programme: { not: null } },
      distinct: ["programme"],
      select: { programme: true },
      orderBy: { programme: "asc" },
    }),
  ]);

  // Aggregate unregistered analytics
  const unregBySchool: Record<string, number> = {};
  const unregByBranch: Record<string, number> = {};
  const unregByGender: Record<string, number> = { Male: 0, Female: 0, Other: 0, Unspecified: 0 };

  for (const s of unregStudentsSample) {
    const d = s.department || "Other";
    unregBySchool[d] = (unregBySchool[d] || 0) + 1;

    const b = s.programme || "Unassigned";
    unregByBranch[b] = (unregByBranch[b] || 0) + 1;

    const g = s.gender || "Unspecified";
    if (g in unregByGender) {
      unregByGender[g] += 1;
    } else {
      unregByGender[g] = 1;
    }
  }

  const rows = students.map((s) => ({
    id: s.id,
    enrollment: s.enrollmentNumber,
    name: s.name,
    email: s.email || null,
    department: s.department,
    program: s.programme || "N/A",
    gender: s.gender || "Unspecified",
    internals: s.internalMarks ?? 0,
    externals: s.externalMarks ?? 0,
    attendance: s.attendancePercent ?? 100,
    sem: s.semester,
    batch: s.batch,
    academicYear: s.academicYear,
    admissionNumber: s.admissionNumber || "",
    phone: s.phone || null,
    phoneVerified: Boolean(s.phoneVerified),
    registered: !!s.registration,
    projectCode: s.registration?.project?.projectId || "—",
    projectTitle: s.registration?.project?.title || "",
    projectCategory: s.registration?.project?.category || "",
    facultyName: s.registration?.project?.faculty?.name || "—",
    facultyEmail: s.registration?.project?.faculty?.email || "",
    facultyPhone: s.registration?.project?.faculty?.phone || "",
    registeredAt: s.registration?.createdAt ? s.registration.createdAt.toISOString() : null,
  }));

  return NextResponse.json({
    students: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    unregisteredStats: {
      totalUnregistered: unregisteredTotal,
      bySchool: unregBySchool,
      byBranch: unregByBranch,
      byGender: unregByGender,
    },
    filterOptions: {
      schools: allSchoolsRaw.map((x) => x.department).filter(Boolean),
      branches: allBranchesRaw.map((x) => x.programme).filter(Boolean) as string[],
      genders: ["Male", "Female", "Other"],
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
    const {
      enrollmentNumber,
      name,
      department,
      programme,
      gender,
      internalMarks,
      externalMarks,
      attendancePercent,
      semester,
      batch,
      admissionNumber,
      academicYear,
    } = await req.json();

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
        gender: gender?.trim() || "Male",
        internalMarks: internalMarks !== undefined ? parseFloat(internalMarks) : 32,
        externalMarks: externalMarks !== undefined ? parseFloat(externalMarks) : 48,
        attendancePercent: attendancePercent !== undefined ? parseFloat(attendancePercent) : 85,
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
    const {
      id,
      name,
      department,
      programme,
      gender,
      internalMarks,
      externalMarks,
      attendancePercent,
      semester,
      batch,
      admissionNumber,
      academicYear,
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Student ID is required." }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (department) updateData.department = department.trim();
    if (programme !== undefined) updateData.programme = programme?.trim() || null;
    if (gender !== undefined) updateData.gender = gender?.trim() || null;
    if (internalMarks !== undefined) updateData.internalMarks = parseFloat(internalMarks) || 0;
    if (externalMarks !== undefined) updateData.externalMarks = parseFloat(externalMarks) || 0;
    if (attendancePercent !== undefined) updateData.attendancePercent = parseFloat(attendancePercent) || 0;
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
