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
