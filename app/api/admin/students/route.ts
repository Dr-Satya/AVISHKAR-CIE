import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { cleanErrorMessage, safeIsoString, parseNum } from "@/lib/api-response";

export const dynamic = "force-dynamic";

interface StudentAnalyticsCache {
  unregisteredTotal: number;
  unregBySchool: Record<string, number>;
  unregByBranch: Record<string, number>;
  unregByGender: Record<string, number>;
  allSchools: string[];
  allBranches: string[];
}

const studentAnalyticsCache = new Map<string, { data: StudentAnalyticsCache; time: number }>();
const STUDENT_ANALYTICS_TTL_MS = 15 * 1000;

function invalidateStudentAnalyticsCache() {
  studentAnalyticsCache.clear();
}

async function getStudentAnalyticsAndDropdowns(academicYearFilter: string): Promise<StudentAnalyticsCache> {
  const cacheKey = academicYearFilter || "all";
  const now = Date.now();
  const cached = studentAnalyticsCache.get(cacheKey);
  if (cached && now - cached.time < STUDENT_ANALYTICS_TTL_MS) {
    return cached.data;
  }

  const unregWhere: Prisma.StudentWhereInput = {
    registration: null,
    ...(academicYearFilter && academicYearFilter !== "all" ? { academicYear: academicYearFilter } : {}),
  };

  const [unregisteredTotal, schoolCounts, branchCounts, genderCounts, allSchoolsRaw, allBranchesRaw] = await Promise.all([
    prisma.student.count({ where: unregWhere }),
    prisma.student.groupBy({
      by: ["department"],
      where: unregWhere,
      _count: { id: true },
    }),
    prisma.student.groupBy({
      by: ["programme"],
      where: unregWhere,
      _count: { id: true },
    }),
    prisma.student.groupBy({
      by: ["gender"],
      where: unregWhere,
      _count: { id: true },
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

  const unregBySchool: Record<string, number> = {};
  for (const s of schoolCounts) {
    const d = s.department || "Other";
    unregBySchool[d] = (unregBySchool[d] || 0) + s._count.id;
  }

  const unregByBranch: Record<string, number> = {};
  for (const b of branchCounts) {
    const p = b.programme || "Unassigned";
    unregByBranch[p] = (unregByBranch[p] || 0) + b._count.id;
  }

  const unregByGender: Record<string, number> = { Male: 0, Female: 0, Other: 0, Unspecified: 0 };
  for (const g of genderCounts) {
    const key = g.gender || "Unspecified";
    if (key in unregByGender) {
      unregByGender[key] += g._count.id;
    } else {
      unregByGender[key] = g._count.id;
    }
  }

  const result: StudentAnalyticsCache = {
    unregisteredTotal,
    unregBySchool,
    unregByBranch,
    unregByGender,
    allSchools: allSchoolsRaw.map((s) => s.department).filter(Boolean),
    allBranches: allBranchesRaw.map((b) => b.programme).filter(Boolean) as string[],
  };

  studentAnalyticsCache.set(cacheKey, { data: result, time: now });
  return result;
}

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

  const [total, students, analytics] = await Promise.all([
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
                id: true,
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
    getStudentAnalyticsAndDropdowns(academicYearFilter),
  ]);

  const {
    unregisteredTotal,
    unregBySchool,
    unregByBranch,
    unregByGender,
    allSchools,
    allBranches,
  } = analytics;

  const rows = students.map((s) => ({
    id: s.id,
    enrollment: s.enrollmentNumber,
    name: s.name,
    email: s.email || null,
    department: s.department,
    program: s.programme || "N/A",
    gender: s.gender || "Unspecified",
    internals: parseNum(s.internalMarks, 0),
    externals: parseNum(s.externalMarks, 0),
    attendance: parseNum(s.attendancePercent, 100),
    sem: parseNum(s.semester, 3),
    batch: s.batch,
    academicYear: s.academicYear,
    admissionNumber: s.admissionNumber || "",
    phone: s.phone || null,
    phoneVerified: Boolean(s.phoneVerified),
    registered: !!s.registration,
    registrationId: s.registration?.id || null,
    projectId: s.registration?.project?.id || s.registration?.projectId || null,
    registrationStatus: s.registration?.status || null,
    projectCode: s.registration?.project?.projectId || "—",
    projectTitle: s.registration?.project?.title || "",
    projectCategory: s.registration?.project?.category || "",
    facultyName: s.registration?.project?.faculty?.name || "—",
    facultyEmail: s.registration?.project?.faculty?.email || "",
    facultyPhone: s.registration?.project?.faculty?.phone || "",
    registeredAt: safeIsoString(s.registration?.createdAt),
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
      schools: allSchools,
      branches: allBranches,
      genders: ["Male", "Female", "Other"],
    },
  });
  } catch (err: any) {
    return NextResponse.json(
      { error: cleanErrorMessage(err, "Failed to load students.") },
      { status: 500 }
    );
  }
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
      phone,
      phoneVerified,
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
    const cleanPhone = phone ? phone.toString().trim().replace(/\D/g, "").slice(-10) : null;

    const student = await prisma.student.create({
      data: {
        enrollmentNumber: cleanEnroll,
        name: name.trim(),
        department: department.trim(),
        programme: programme?.trim() || null,
        phone: cleanPhone || null,
        phoneVerified: phoneVerified !== undefined ? Boolean(phoneVerified) : Boolean(cleanPhone && cleanPhone.length === 10),
        gender: gender?.trim() || "Male",
        internalMarks: internalMarks !== undefined ? Math.min(50, Math.max(0, parseFloat(internalMarks))) : 40,
        externalMarks: externalMarks !== undefined ? Math.min(50, Math.max(0, parseFloat(externalMarks))) : 40,
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

    invalidateStudentAnalyticsCache();
    return NextResponse.json({ success: true, student });
  } catch (err: any) {
    console.error("Student create error:", err);
    return NextResponse.json({ error: cleanErrorMessage(err, "Failed to create student.") }, { status: 500 });
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
      phone,
      phoneVerified,
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
    if (phone !== undefined) {
      const cleanPhone = phone ? phone.toString().trim().replace(/\D/g, "").slice(-10) : null;
      updateData.phone = cleanPhone || null;
      if (phoneVerified !== undefined) {
        updateData.phoneVerified = Boolean(phoneVerified);
      } else if (cleanPhone && cleanPhone.length === 10) {
        updateData.phoneVerified = true;
      } else if (!cleanPhone) {
        updateData.phoneVerified = false;
      }
    } else if (phoneVerified !== undefined) {
      updateData.phoneVerified = Boolean(phoneVerified);
    }
    if (gender !== undefined) updateData.gender = gender?.trim() || null;
    if (internalMarks !== undefined) updateData.internalMarks = Math.min(50, Math.max(0, parseFloat(internalMarks) || 0));
    if (externalMarks !== undefined) updateData.externalMarks = Math.min(50, Math.max(0, parseFloat(externalMarks) || 0));
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

    invalidateStudentAnalyticsCache();
    return NextResponse.json({ success: true, student: updated });
  } catch (err: any) {
    console.error("Student update error:", err);
    return NextResponse.json({ error: cleanErrorMessage(err, "Failed to update student.") }, { status: 500 });
  }
}

// DELETE STUDENT (SINGLE OR BULK)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const idsParam = searchParams.get("ids");

    let targetIds: string[] = [];
    if (idsParam) {
      targetIds = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (id) {
      targetIds = [id.trim()];
    } else {
      try {
        const body = await req.json();
        if (Array.isArray(body.ids)) {
          targetIds = body.ids.map((s: any) => String(s).trim()).filter(Boolean);
        } else if (body.id) {
          targetIds = [String(body.id).trim()];
        }
      } catch {
        // Body is optional
      }
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ error: "Student ID is required." }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: { id: { in: targetIds } },
      select: { id: true, enrollmentNumber: true, name: true, department: true },
    });

    if (students.length === 0) {
      return NextResponse.json({ error: "Student(s) not found." }, { status: 404 });
    }

    const matchedIds = students.map((s) => s.id);

    // Atomically remove phone OTPs, Google identities, project registrations, and student profiles
    await prisma.$transaction([
      prisma.studentPhoneOtp.deleteMany({ where: { studentId: { in: matchedIds } } }),
      prisma.studentIdentity.deleteMany({ where: { studentId: { in: matchedIds } } }),
      prisma.registration.deleteMany({ where: { studentId: { in: matchedIds } } }),
      prisma.student.deleteMany({ where: { id: { in: matchedIds } } }),
    ]);

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: matchedIds.length > 1 ? "BULK_DELETE_STUDENTS" : "DELETE_STUDENT",
        target: matchedIds.length === 1 ? students[0].enrollmentNumber : `${matchedIds.length} students`,
        metadata: JSON.stringify({
          count: matchedIds.length,
          enrollments: students.map((s) => s.enrollmentNumber).slice(0, 50),
        }),
      },
    });

    invalidateStudentAnalyticsCache();
    return NextResponse.json({
      success: true,
      message:
        matchedIds.length === 1
          ? `Student ${students[0].enrollmentNumber} deleted successfully.`
          : `${matchedIds.length} student records deleted successfully.`,
      deletedCount: matchedIds.length,
    });
  } catch (err: any) {
    console.error("Student delete error:", err);
    return NextResponse.json({ error: cleanErrorMessage(err, "Failed to delete student.") }, { status: 500 });
  }
}
