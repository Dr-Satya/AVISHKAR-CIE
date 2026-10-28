import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { resolveProjectLimits } from "@/services/registration.service";
import { cleanErrorMessage, safeIsoString, parseNum } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);

    if (searchParams.get("all") === "true") {
      const allProjects = await prisma.project.findMany({
        orderBy: { projectId: "asc" },
        include: {
          faculty: { select: { name: true, department: true } },
          registrations: { select: { id: true } },
        },
      });

      const simpleList = allProjects.map((p) => ({
        id: p.id,
        projectId: p.projectId,
        title: p.title,
        facultyName: p.faculty.name,
        department: p.department,
        seatsFilled: p.registrations.length,
        maxSeats: parseNum(p.maxSeats, 10),
      }));

      return NextResponse.json({ projects: simpleList });
    }

    // Bulk File Download for Admin: Fetch all projects with artifacts, manuscripts, and enrolled student marks
    if (searchParams.get("exportFiles") === "true") {
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
      if (categoryFilter !== "all") where.category = categoryFilter;
      if (statusFilter !== "all") where.submissionStatus = statusFilter;
      if (schoolFilter !== "all") where.department = schoolFilter;

      const projectsWithFiles = await prisma.project.findMany({
        where,
        orderBy: [{ department: "asc" }, { projectId: "asc" }],
        include: {
          faculty: { select: { name: true, email: true, department: true } },
          artifacts: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              type: true,
              title: true,
              fileName: true,
              fileUrl: true,
              fileSize: true,
              semester: true,
              similarityPercent: true,
              aiPercent: true,
              plagiarismReportFileName: true,
              plagiarismReportUrl: true,
              status: true,
              submittedAt: true,
            },
          },
          registrations: {
            include: {
              student: {
                select: {
                  id: true,
                  enrollmentNumber: true,
                  name: true,
                  department: true,
                  programme: true,
                  semester: true,
                  batch: true,
                  attendancePercent: true,
                  internalMarks: true,
                  externalMarks: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        projects: projectsWithFiles.map((p) => ({
          id: p.id,
          projectId: p.projectId,
          title: p.title,
          department: p.department,
          category: p.category,
          theme: p.theme,
          submissionStatus: p.submissionStatus,
          hasDraftManuscript: Boolean(p.hasDraftManuscript || p.draftManuscriptUrl),
          hasCommunicatedManuscript: Boolean(p.hasCommunicatedManuscript),
          draftManuscriptUrl: p.draftManuscriptUrl,
          draftManuscriptFileName: p.draftManuscriptFileName,
          journalName: p.journalName,
          isManuscriptPublished: Boolean(p.isManuscriptPublished),
          publicationDoi: p.publicationDoi,
          publishedManuscriptUrl: p.publishedManuscriptUrl,
          publishedManuscriptFileName: p.publishedManuscriptFileName,
          manuscriptPlagiarismUrl: p.manuscriptPlagiarismUrl,
          manuscriptPlagiarismFileName: p.manuscriptPlagiarismFileName,
          manuscriptSimilarityPercent: p.manuscriptSimilarityPercent != null ? parseNum(p.manuscriptSimilarityPercent) : null,
          faculty: p.faculty,
          artifacts: p.artifacts.map((a) => ({
            ...a,
            fileSize: parseNum(a.fileSize, 0),
            semester: parseNum(a.semester, 3),
            similarityPercent: a.similarityPercent != null ? parseNum(a.similarityPercent) : null,
            aiPercent: a.aiPercent != null ? parseNum(a.aiPercent) : null,
            submittedAt: safeIsoString((a as any).submittedAt) || "",
          })),
          students: p.registrations.map((r) => ({
            enrollmentNumber: r.student.enrollmentNumber,
            name: r.student.name,
            department: r.student.department,
            programme: r.student.programme,
            semester: parseNum(r.student.semester, 3),
            batch: r.student.batch,
            attendancePercent: parseNum(r.student.attendancePercent, 100),
            internalMarks: parseNum(r.student.internalMarks, 0),
            externalMarks: parseNum(r.student.externalMarks, 0),
          })),
        })),
      });
    }

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
        registrations: {
          select: {
            id: true,
            student: {
              select: {
                id: true,
                enrollmentNumber: true,
                name: true,
                department: true,
                programme: true,
                attendancePercent: true,
                internalMarks: true,
                externalMarks: true,
              },
            },
          },
        },
        artifacts: {
          select: {
            id: true,
            type: true,
            title: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            semester: true,
            academicYear: true,
            similarityPercent: true,
            aiPercent: true,
            plagiarismReportUrl: true,
            plagiarismReportFileName: true,
            status: true,
            spocNote: true,
            submittedAt: true,
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
        sem1Similarity: sem1Report?.similarityPercent != null ? parseNum(sem1Report.similarityPercent) : null,
        sem2Similarity: sem2Report?.similarityPercent != null ? parseNum(sem2Report.similarityPercent) : null,
        artifacts: artifacts.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: parseNum(a.fileSize, 0),
          semester: parseNum(a.semester, 3),
          academicYear: a.academicYear,
          similarityPercent: a.similarityPercent != null ? parseNum(a.similarityPercent) : null,
          aiPercent: a.aiPercent != null ? parseNum(a.aiPercent) : null,
          status: a.status,
          spocNote: a.spocNote,
          plagiarismReportUrl: a.plagiarismReportUrl,
          plagiarismReportFileName: a.plagiarismReportFileName,
          submittedAt: safeIsoString(a.submittedAt) || "",
        })),
        students: (p.registrations || []).map((r) => ({
          id: r.student.id,
          enrollmentNumber: r.student.enrollmentNumber,
          name: r.student.name,
          department: r.student.department,
          programme: r.student.programme,
          attendancePercent: parseNum(r.student.attendancePercent, 100),
          internalMarks: parseNum(r.student.internalMarks, 0),
          externalMarks: parseNum(r.student.externalMarks, 0),
          totalMarks: parseNum(r.student.internalMarks, 0) + parseNum(r.student.externalMarks, 0),
        })),
        hasDraftManuscript: Boolean(p.hasDraftManuscript || p.draftManuscriptUrl),
        hasCommunicatedManuscript: Boolean(p.hasCommunicatedManuscript),
        draftManuscriptUrl: p.draftManuscriptUrl,
        draftManuscriptFileName: p.draftManuscriptFileName,
        journalName: p.journalName,
        avishkarAffiliationCommunicated: Boolean(p.avishkarAffiliationCommunicated),
        isManuscriptPublished: Boolean(p.isManuscriptPublished),
        publicationDoi: p.publicationDoi,
        publishedManuscriptUrl: p.publishedManuscriptUrl,
        publishedManuscriptFileName: p.publishedManuscriptFileName,
        avishkarAffiliationPublished: Boolean(p.avishkarAffiliationPublished),
        manuscriptPlagiarismUrl: p.manuscriptPlagiarismUrl,
        manuscriptPlagiarismFileName: p.manuscriptPlagiarismFileName,
        manuscriptSimilarityPercent: p.manuscriptSimilarityPercent != null ? parseNum(p.manuscriptSimilarityPercent) : null,
        manuscriptAiPercent: p.manuscriptAiPercent != null ? parseNum(p.manuscriptAiPercent) : null,
        manuscriptSubmittedAt: safeIsoString(p.manuscriptSubmittedAt) || null,
        similarityPercent: reportArtifact?.similarityPercent != null ? parseNum(reportArtifact.similarityPercent) : null,
        aiPercent: reportArtifact?.aiPercent != null ? parseNum(reportArtifact.aiPercent) : null,
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
  } catch (err: any) {
    return NextResponse.json(
      { error: cleanErrorMessage(err, "Failed to load projects.") },
      { status: 500 }
    );
  }
}

// REASSIGN / REPLACE FACULTY MENTOR ON A PROJECT (PATCH)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, newFacultyId } = body;

    if (!projectId || !newFacultyId) {
      return NextResponse.json(
        { error: "Both projectId and newFacultyId are required." },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id: projectId }, { projectId: projectId }],
      },
      include: {
        faculty: { select: { id: true, name: true, email: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const newFaculty = await prisma.faculty.findUnique({
      where: { id: newFacultyId },
      select: { id: true, name: true, email: true, department: true },
    });

    if (!newFaculty) {
      return NextResponse.json({ error: "Replacement faculty not found." }, { status: 404 });
    }

    if (project.facultyId === newFacultyId) {
      return NextResponse.json(
        { error: `Project is already assigned to ${newFaculty.name}.` },
        { status: 400 }
      );
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { facultyId: newFacultyId },
      include: {
        faculty: { select: { id: true, name: true, email: true, department: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "REPLACE_PROJECT_MENTOR",
        target: project.projectId,
        metadata: JSON.stringify({
          projectTitle: project.title,
          previousFaculty: project.faculty.name,
          newFaculty: newFaculty.name,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Project ${project.projectId} mentor successfully updated to ${newFaculty.name}.`,
      project: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: cleanErrorMessage(err, "Failed to reassign project mentor.") },
      { status: 500 }
    );
  }
}

// DELETE PROJECT (DELETE)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { OR: [{ id }, { projectId: id }] },
      include: { registrations: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.registration.deleteMany({ where: { projectId: project.id } }),
      prisma.projectArtifact.deleteMany({ where: { projectId: project.id } }),
      prisma.project.delete({ where: { id: project.id } }),
    ]);

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "DELETE_PROJECT",
        target: project.projectId,
        metadata: JSON.stringify({ title: project.title }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Project ${project.projectId} removed successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: cleanErrorMessage(err, "Failed to delete project.") },
      { status: 500 }
    );
  }
}
