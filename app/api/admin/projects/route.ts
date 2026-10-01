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
            semester: true,
            academicYear: true,
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
    prisma.project.findMany({
      select: {
        department: true,
        submissionStatus: true,
        semester: true,
        artifacts: { select: { semester: true, type: true } },
      },
    }),
  ]);

  // Aggregate completion rates school-wise and dual-semester compliance
  let bothSemestersCompletedCount = 0;
  let sem1OnlyCount = 0;
  let sem2PendingCount = 0;

  for (const p of allProjectsSample) {
    const baseSem = p.semester || 3;
    const nextSem = baseSem + 1;
    const hasSem1Report = p.artifacts.some((a) => (a.semester || baseSem) === baseSem && a.type === "REPORT");
    const hasSem2Report = p.artifacts.some((a) => a.semester === nextSem && a.type === "REPORT");

    if (hasSem1Report && hasSem2Report) {
      bothSemestersCompletedCount += 1;
    } else if (hasSem1Report && !hasSem2Report) {
      sem1OnlyCount += 1;
      sem2PendingCount += 1;
    }
  }

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
      const baseSem = p.semester || 3;
      const nextSem = baseSem + 1;

      const sem1Artifacts = artifacts.filter((a) => (a.semester || baseSem) === baseSem);
      const sem2Artifacts = artifacts.filter((a) => a.semester === nextSem);

      const sem1Report = sem1Artifacts.find((a) => a.type === "REPORT");
      const sem2Report = sem2Artifacts.find((a) => a.type === "REPORT");

      const sem1HasReport = Boolean(sem1Report);
      const sem2HasReport = Boolean(sem2Report);
      const bothSemestersSubmitted = sem1HasReport && sem2HasReport;

      const reportArtifact = sem2Report || sem1Report || artifacts[0];

      return {
        id: p.id,
        projectId: p.projectId,
        title: p.title,
        faculty: p.faculty.name,
        department: p.department,
        theme: p.theme,
        category: p.category,
        baseSem,
        nextSem,
        seatsFilled: p.registrations.length,
        maxSeats: limits.maxSeats,
        seatsRatio: `${p.registrations.length} / ${limits.maxSeats}`,
        isFull: p.registrations.length >= limits.maxSeats,
        submissionStatus: p.submissionStatus || "NOT_SUBMITTED",
        spocReviewNote: p.spocReviewNote || null,
        reviewedAt: p.reviewedAt || null,
        artifactsCount: artifacts.length,
        sem1DocsCount: sem1Artifacts.length,
        sem2DocsCount: sem2Artifacts.length,
        sem1HasReport,
        sem2HasReport,
        bothSemestersSubmitted,
        sem1Similarity: sem1Report?.similarityPercent ?? null,
        sem2Similarity: sem2Report?.similarityPercent ?? null,
        artifacts: artifacts.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          semester: a.semester,
          academicYear: a.academicYear,
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
      bothSemestersCompleted: bothSemestersCompletedCount,
      sem1Only: sem1OnlyCount,
      sem2Pending: sem2PendingCount,
      completionPercentage:
        totalProjectsCount > 0 ? Math.round((completedCount / totalProjectsCount) * 100) : 0,
      schoolBreakdown,
    },
  });
}
