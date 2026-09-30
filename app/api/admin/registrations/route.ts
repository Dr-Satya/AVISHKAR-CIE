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
}
