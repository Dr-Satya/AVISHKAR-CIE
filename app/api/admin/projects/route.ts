import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { resolveProjectLimits } from "@/services/registration.service";
import { cleanErrorMessage, safeIsoString, parseNum } from "@/lib/api-response";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

interface GlobalProjectStats {
  totalProjectsCount: number;
  completedCount: number;
  pendingCount: number;
  rejectedCount: number;
  notSubmittedCount: number;
  bothSemestersCompletedCount: number;
  sem1OnlyCount: number;
  sem2PendingCount: number;
  schoolBreakdown: Record<string, { total: number; completed: number; pending: number }>;
}

let cachedGlobalProjectStats: { data: GlobalProjectStats; time: number } | null = null;
const STATS_TTL_MS = 15 * 1000;

function invalidateAdminProjectStatsCache() {
  cachedGlobalProjectStats = null;
}

async function getAdminProjectGlobalStats(): Promise<GlobalProjectStats> {
  const now = Date.now();
  if (cachedGlobalProjectStats && now - cachedGlobalProjectStats.time < STATS_TTL_MS) {
    return cachedGlobalProjectStats.data;
  }

  const [
    totalProjectsCount,
    completedCount,
    pendingCount,
    rejectedCount,
    notSubmittedCount,
    allProjectsSample,
  ] = await Promise.all([
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

  const data: GlobalProjectStats = {
    totalProjectsCount,
    completedCount,
    pendingCount,
    rejectedCount,
    notSubmittedCount,
    bothSemestersCompletedCount,
    sem1OnlyCount,
    sem2PendingCount,
    schoolBreakdown,
  };

  cachedGlobalProjectStats = { data, time: now };
  return data;
}

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

      let cfDb: any = null;
      try {
        const cfCtx = getCloudflareContext();
        if (cfCtx?.env?.DB) cfDb = cfCtx.env.DB;
      } catch (e) {}

      if (cfDb) {
        // Fast direct D1 execution bypassing Wasm serialization bottleneck
        let sql = `
          SELECT 
            p.id, p.projectId, p.title, p.department, p.category, p.theme, p.submissionStatus,
            p.hasDraftManuscript, p.hasCommunicatedManuscript, p.draftManuscriptUrl, p.draftManuscriptFileName,
            p.journalName, p.isManuscriptPublished, p.publicationDoi, p.publishedManuscriptUrl,
            p.publishedManuscriptFileName, p.manuscriptPlagiarismUrl, p.manuscriptPlagiarismFileName,
            p.manuscriptSimilarityPercent,
            f.name as facultyName, f.email as facultyEmail, f.department as facultyDepartment
          FROM Project p
          LEFT JOIN Faculty f ON p.facultyId = f.id
          WHERE 1=1
        `;
        const params: any[] = [];
        if (search) {
          sql += ` AND (p.projectId LIKE ? OR p.title LIKE ? OR p.department LIKE ? OR p.theme LIKE ? OR f.name LIKE ?)`;
          const s = `%${search}%`;
          params.push(s, s, s, s, s);
        }
        if (categoryFilter !== "all") {
          sql += ` AND p.category = ?`;
          params.push(categoryFilter);
        }
        if (statusFilter !== "all") {
          sql += ` AND p.submissionStatus = ?`;
          params.push(statusFilter);
        }
        if (schoolFilter !== "all") {
          sql += ` AND p.department = ?`;
          params.push(schoolFilter);
        }
        sql += ` ORDER BY p.department ASC, p.projectId ASC`;

        const [projectsRes, artifactsRes, studentsRes] = await Promise.all([
          cfDb.prepare(sql).bind(...params).all(),
          cfDb.prepare(`
            SELECT id, projectId, type, title, fileName, fileUrl, fileSize, semester, similarityPercent, aiPercent, plagiarismReportFileName, plagiarismReportUrl, status, submittedAt
            FROM ProjectArtifact
            ORDER BY createdAt DESC
          `).all(),
          cfDb.prepare(`
            SELECT 
              r.projectId, 
              s.enrollmentNumber, 
              s.name, 
              s.department, 
              s.programme, 
              s.semester, 
              s.batch, 
              s.attendancePercent, 
              s.internalMarks, 
              s.externalMarks 
            FROM Registration r 
            JOIN Student s ON r.studentId = s.id
          `).all(),
        ]);

        const artifactsByProject: Record<string, any[]> = {};
        for (const a of artifactsRes.results || []) {
          if (!artifactsByProject[a.projectId]) artifactsByProject[a.projectId] = [];
          artifactsByProject[a.projectId].push({
            ...a,
            fileSize: parseNum(a.fileSize, 0),
            semester: parseNum(a.semester, 3),
            similarityPercent: a.similarityPercent != null ? parseNum(a.similarityPercent) : null,
            aiPercent: a.aiPercent != null ? parseNum(a.aiPercent) : null,
            submittedAt: safeIsoString(a.submittedAt) || "",
          });
        }

        const studentsByProject: Record<string, any[]> = {};
        for (const s of studentsRes.results || []) {
          if (!studentsByProject[s.projectId]) studentsByProject[s.projectId] = [];
          studentsByProject[s.projectId].push({
            enrollmentNumber: s.enrollmentNumber,
            name: s.name,
            department: s.department,
            programme: s.programme,
            semester: parseNum(s.semester, 3),
            batch: s.batch,
            attendancePercent: parseNum(s.attendancePercent, 100),
            internalMarks: parseNum(s.internalMarks, 0),
            externalMarks: parseNum(s.externalMarks, 0),
          });
        }

        const projects = (projectsRes.results || []).map((p: any) => ({
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
          faculty: {
            name: p.facultyName,
            email: p.facultyEmail,
            department: p.facultyDepartment,
          },
          artifacts: artifactsByProject[p.id] || [],
          students: studentsByProject[p.id] || [],
        }));

        return NextResponse.json({ projects });
      }

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

      const [projectsWithFiles, enrolledStudentsRaw] = await Promise.all([
        prisma.project.findMany({
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
          },
        }),
        prisma.$queryRaw<Array<{
          projectId: string;
          enrollmentNumber: string;
          name: string;
          department: string;
          programme: string;
          semester: number | null;
          batch: string;
          attendancePercent: number | null;
          internalMarks: number | null;
          externalMarks: number | null;
        }>>`
          SELECT 
            r.projectId, 
            s.enrollmentNumber, 
            s.name, 
            s.department, 
            s.programme, 
            s.semester, 
            s.batch, 
            s.attendancePercent, 
            s.internalMarks, 
            s.externalMarks 
          FROM Registration r 
          JOIN Student s ON r.studentId = s.id
        `,
      ]);

      const studentsByProject: Record<string, any[]> = {};
      for (const s of enrolledStudentsRaw) {
        if (!studentsByProject[s.projectId]) {
          studentsByProject[s.projectId] = [];
        }
        studentsByProject[s.projectId].push({
          enrollmentNumber: s.enrollmentNumber,
          name: s.name,
          department: s.department,
          programme: s.programme,
          semester: parseNum(s.semester, 3),
          batch: s.batch,
          attendancePercent: parseNum(s.attendancePercent, 100),
          internalMarks: parseNum(s.internalMarks, 0),
          externalMarks: parseNum(s.externalMarks, 0),
        });
      }

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
          students: studentsByProject[p.id] || [],
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

  const [total, projects, stats] = await Promise.all([
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
    getAdminProjectGlobalStats(),
  ]);

  const {
    totalProjectsCount,
    completedCount,
    pendingCount,
    rejectedCount,
    notSubmittedCount,
    bothSemestersCompletedCount,
    sem1OnlyCount,
    sem2PendingCount,
    schoolBreakdown,
  } = stats;

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
    console.error("ADMIN_PROJECTS_GET_ERROR:", err);
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

    invalidateAdminProjectStatsCache();
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

    invalidateAdminProjectStatsCache();
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
