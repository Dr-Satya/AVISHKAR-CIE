import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { resolveProjectLimits } from "@/services/registration.service";

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
  const categoryFilter = searchParams.get("category") || "all";

  const where: Prisma.ProjectWhereInput = {};

  if (search) {
    where.OR = [
      { projectId: { contains: search } },
      { title: { contains: search } },
      { department: { contains: search } },
      { theme: { contains: search } },
      { faculty: { name: { contains: search } } },
    ];
  }

  if (categoryFilter !== "all") {
    where.category = categoryFilter;
  }

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { projectId: "asc" },
      include: {
        faculty: { select: { name: true, department: true } },
        registrations: { select: { id: true } },
      },
    }),
  ]);

  const rows = await Promise.all(
    projects.map(async (p) => {
      const limits = await resolveProjectLimits(
        p.id,
        p.department,
        p.maxSeats,
        p.sameDeptLimit,
        p.otherDeptLimit
      );
      return {
        id: p.id,
        projectId: p.projectId,
        title: p.title,
        faculty: p.faculty.name,
        department: p.department,
        theme: p.theme,
        category: p.category,
        seatsFilled: p.registrations.length,
        maxSeats: limits.maxSeats,
        seatsRatio: `${p.registrations.length} / ${limits.maxSeats}`,
        isFull: p.registrations.length >= limits.maxSeats,
      };
    })
  );

  return NextResponse.json({
    projects: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
