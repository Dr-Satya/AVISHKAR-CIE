import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { resolveProjectLimits, normalizeDept } from "@/services/registration.service";

export const dynamic = "force-dynamic";

const projectQueryCache = new Map<string, { data: any[]; time: number }>();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const theme = searchParams.get("theme");

  if (!category || !theme) {
    return NextResponse.json({ error: "Category and theme are required." }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: session.id },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const studentDeptNorm = normalizeDept(student.department);

  const config = await prisma.globalConfig.findUnique({ where: { id: "default" } });
  const activeYear = config?.activeAcademicYear || "2025-2026";

  // Micro-cache projects query for 3 seconds per year+category+theme to absorb heavy traffic bursts
  const cacheKey = `${activeYear}:${category}:${theme}`;
  let projects = projectQueryCache.get(cacheKey)?.data;
  const cachedAt = projectQueryCache.get(cacheKey)?.time || 0;

  if (!projects || Date.now() - cachedAt > 3000) {
    projects = await prisma.project.findMany({
      where: {
        category: category,
        theme: theme,
        academicYear: activeYear,
      },
      include: {
        faculty: {
          select: { name: true, department: true, email: true, phone: true },
        },
        registrations: {
          include: {
            student: {
              select: { department: true },
            },
          },
        },
      },
      orderBy: {
        projectId: "asc",
      },
    });

    projectQueryCache.set(cacheKey, { data: projects, time: Date.now() });
  }

  const enrichedProjects = await Promise.all(
    projects.map(async (p: any) => {
      const limits = await resolveProjectLimits(
        p.id,
        p.department,
        p.maxSeats,
        p.sameDeptLimit,
        p.otherDeptLimit
      );

      const totalSeatsFilled = p.registrations.length;
      const isSameDept = studentDeptNorm === normalizeDept(p.department);

      const sameDeptCount = p.registrations.filter(
        (r: any) => normalizeDept(r.student.department) === normalizeDept(p.department)
      ).length;
      const otherDeptCount = totalSeatsFilled - sameDeptCount;

      let isEligible = true;
      let ineligibilityReason = "";

      if (totalSeatsFilled >= limits.maxSeats) {
        isEligible = false;
        ineligibilityReason = "Project is completely full";
      } else if (isSameDept && sameDeptCount >= limits.sameDeptLimit) {
        isEligible = false;
        ineligibilityReason = "Same department seat quota full";
      } else if (!isSameDept && otherDeptCount >= limits.otherDeptLimit) {
        isEligible = false;
        ineligibilityReason = "Other department seat quota full";
      }

      return {
        id: p.id,
        projectId: p.projectId,
        title: p.title,
        description: p.description,
        department: p.department,
        facultyName: p.faculty.name,
        facultyEmail: p.faculty.email,
        facultyPhone: p.faculty.phone,
        theme: p.theme,
        category: p.category,
        maxSeats: limits.maxSeats,
        seatsFilled: totalSeatsFilled,
        availableSeats: Math.max(0, limits.maxSeats - totalSeatsFilled),
        sameDeptQuota: `${sameDeptCount}/${limits.sameDeptLimit}`,
        otherDeptQuota: `${otherDeptCount}/${limits.otherDeptLimit}`,
        isSameDept,
        isEligible,
        ineligibilityReason,
      };
    })
  );

  return NextResponse.json({ projects: enrichedProjects });
}
