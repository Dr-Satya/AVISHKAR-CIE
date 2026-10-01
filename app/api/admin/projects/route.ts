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
  const statusFilter = searchParams.get("status") || "all";
  const schoolFilter = searchParams.get("school") || "all";

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

  if (statusFilter !== "all") {
    where.submissionStatus = statusFilter;
  }

  if (schoolFilter !== "all") {
    where.department = schoolFilter;
  }

  const [
    total,
    projects,
    totalProjectsCount,
    completedCount,
    pendingCount,
    rejectedCount,
    notSubmittedCount,
    allProjectsSample,
  ] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { projectId: "asc" },
      include: {
        faculty: { select: { name: true, department: true } },
        registrations: { select: { id: true } },
        artifacts: {
          select: {
            id: true,
            type: true,
            title: true,
            fileName: true,
            fileUrl: true,
            similarityPercent: true,
            aiPercent: true,
            plagiarismReportUrl: true,
            status: true,
            spocNote: true,
          },
        },
      },
    }),
    prisma.project.count(),
    prisma.project.count({ where: { submissionStatus: "APPROVED" } }),
    prisma.project.count({ where: { submissionStatus: "PENDING" } }),
    prisma.project.count({ where: { submissionStatus: "REJECTED" } }),
    prisma.project.count({ where: { submissionStatus: "NOT_SUBMITTED" } }),
    prisma.project.findMany({ select: { department: true, submissionStatus: true } }),
  ]);

  // Aggregate completion rates school-wise
  const schoolBreakdown: Record<string, { total: number; completed: number; pending: number }> = {};
  for (const p of allProjectsSample) {
    const d = p.department || "Other";
    if (!schoolBreakdown[d]) {
      schoolBreakdown[d] = { total: 0, completed: 0, pending: 0 };
    }
    schoolBreakdown[d].total += 1;
    if (p.submissionStatus === "APPROVED") {
      schoolBreakdown[d].completed += 1;
    } else if (p.submissionStatus === "PENDING") {
      schoolBreakdown[d].pending += 1;
    }
  }

  const rows = await Promise.all(
    projects.map(async (p) => {
      const limits = await resolveProjectLimits(
        p.id,
        p.department,
        p.maxSeats,
        p.sameDeptLimit,
        p.otherDeptLimit
      );

      const artifacts = p.artifacts || [];
      const reportArtifact = artifacts.find((a) => a.type === "REPORT") || artifacts[0];

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
        submissionStatus: p.submissionStatus || "NOT_SUBMITTED",
        spocReviewNote: p.spocReviewNote || null,
        reviewedAt: p.reviewedAt || null,
        artifactsCount: artifacts.length,
        artifacts: artifacts.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          similarityPercent: a.similarityPercent,
          aiPercent: a.aiPercent,
          status: a.status,
          spocNote: a.spocNote,
        })),
        similarityPercent: reportArtifact?.similarityPercent ?? null,
        aiPercent: reportArtifact?.aiPercent ?? null,
        plagiarismReportUrl: reportArtifact?.plagiarismReportUrl ?? null,
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
    completionStats: {
      total: totalProjectsCount,
      completed: completedCount,
      pending: pendingCount,
      rejected: rejectedCount,
      notSubmitted: notSubmittedCount,
      completionPercentage:
        totalProjectsCount > 0 ? Math.round((completedCount / totalProjectsCount) * 100) : 0,
      schoolBreakdown,
    },
  });
}
