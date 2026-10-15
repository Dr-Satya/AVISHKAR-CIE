import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let department: string | null = null;

    if (session.role === "SPOC") {
      let dept = session.spocDepartment || session.department;
      if (!dept) {
        const spoc = await prisma.spoc.findUnique({
          where: { id: session.id },
        });
        if (spoc) {
          dept = spoc.department;
        } else {
          const faculty = await prisma.faculty.findUnique({
            where: { id: session.id },
          });
          if (faculty?.isSpoc) {
            dept = faculty.spocDepartment || faculty.department;
          }
        }
      }
      department = dept || null;
      if (!department) {
        return NextResponse.json(
          { error: "SPOC department authorization not found." },
          { status: 404 }
        );
      }
    } else if (session.role === "ADMIN") {
      const { searchParams } = new URL(req.url);
      department = searchParams.get("department");
    } else if (session.role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({
        where: { id: session.id },
      });
      if (!faculty || !faculty.isSpoc || !faculty.spocDepartment) {
        return NextResponse.json(
          { error: "Access forbidden. You are not designated as a Department SPOC." },
          { status: 403 }
        );
      }
      department = faculty.spocDepartment;
    } else {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!department) {
      return NextResponse.json({ error: "Department is required." }, { status: 400 });
    }

    // 1. Fetch Faculty in this department
    const facultyList = await prisma.faculty.findMany({
      where: { department },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        phone: true,
        isSpoc: true,
        projects: {
          select: {
            id: true,
            projectId: true,
            title: true,
            submissionStatus: true,
            registrations: {
              include: {
                student: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // 2. Fetch Projects in this department with full artifacts & registrations
    const projects = await prisma.project.findMany({
      where: { department },
      include: {
        faculty: {
          select: { id: true, name: true, email: true, department: true, phone: true },
        },
        artifacts: {
          orderBy: { createdAt: "desc" },
          include: {
            reviewedBy: {
              select: { name: true, email: true },
            },
          },
        },
        registrations: {
          include: {
            student: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { projectId: "asc" },
    });

    // 3. Flatten list of enrolled students in this department's projects
    const studentsMap = new Map<string, any>();
    projects.forEach((proj) => {
      proj.registrations.forEach((reg) => {
        if (!studentsMap.has(reg.student.id)) {
          studentsMap.set(reg.student.id, {
            id: reg.student.id,
            enrollmentNumber: reg.student.enrollmentNumber,
            name: reg.student.name,
            department: reg.student.department,
            programme: reg.student.programme,
            semester: reg.student.semester,
            batch: reg.student.batch,
            email: reg.student.email,
            phone: reg.student.phone,
            internalMarks: reg.student.internalMarks,
            externalMarks: reg.student.externalMarks,
            attendancePercent: reg.student.attendancePercent,
            projectId: proj.projectId,
            projectTitle: proj.title,
            facultyName: proj.faculty.name,
            facultyEmail: proj.faculty.email,
            registeredAt: reg.createdAt.toISOString(),
          });
        }
      });
    });

    const students = Array.from(studentsMap.values());

    // 4. Compute Faculty Marks Submission Metrics
    let facultyMarksSharedCount = 0;
    let facultyMarksPartialCount = 0;
    let facultyMarksPendingCount = 0;

    const formattedFaculty = facultyList.map((f) => {
      const facultyStudentsMap = new Map<string, any>();
      f.projects.forEach((proj) => {
        proj.registrations.forEach((reg) => {
          if (!facultyStudentsMap.has(reg.student.id)) {
            const internalMarks = reg.student.internalMarks ?? 0;
            const externalMarks = reg.student.externalMarks ?? 0;
            const attendancePercent = reg.student.attendancePercent ?? 100;
            const marksShared = internalMarks > 0 || externalMarks > 0;
            facultyStudentsMap.set(reg.student.id, {
              studentId: reg.student.id,
              enrollmentNumber: reg.student.enrollmentNumber,
              name: reg.student.name,
              programme: reg.student.programme || undefined,
              internalMarks,
              externalMarks,
              attendancePercent,
              marksShared,
              projectTitle: proj.title,
              projectId: proj.projectId,
            });
          }
        });
      });

      const studentsWithMarks = Array.from(facultyStudentsMap.values());
      const studentsCount = studentsWithMarks.length;
      const sharedCount = studentsWithMarks.filter((s) => s.marksShared).length;
      const pendingCount = studentsCount - sharedCount;

      let marksStatus: "SHARED" | "PARTIAL" | "NOT_SHARED" | "NO_STUDENTS" = "NO_STUDENTS";
      if (studentsCount === 0) {
        marksStatus = "NO_STUDENTS";
      } else if (sharedCount === studentsCount) {
        marksStatus = "SHARED";
        facultyMarksSharedCount++;
      } else if (sharedCount > 0) {
        marksStatus = "PARTIAL";
        facultyMarksPartialCount++;
      } else {
        marksStatus = "NOT_SHARED";
        facultyMarksPendingCount++;
      }

      return {
        id: f.id,
        name: f.name,
        email: f.email,
        phone: f.phone,
        isSpoc: f.isSpoc,
        projectsCount: f.projects.length,
        studentsCount,
        marksStatus,
        marksSharedCount: sharedCount,
        marksPendingCount: pendingCount,
        studentsWithMarks,
        projects: f.projects.map((p) => ({
          id: p.id,
          projectId: p.projectId,
          title: p.title,
          submissionStatus: p.submissionStatus,
        })),
      };
    });

    // 5. Compute KPIs
    const totalProjects = projects.length;
    const totalFaculty = facultyList.length;
    const totalStudents = students.length;

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let notSubmittedCount = 0;

    projects.forEach((p) => {
      if (p.submissionStatus === "PENDING") pendingCount++;
      else if (p.submissionStatus === "APPROVED") approvedCount++;
      else if (p.submissionStatus === "REJECTED") rejectedCount++;
      else notSubmittedCount++;
    });

    return NextResponse.json({
      department,
      kpis: {
        totalProjects,
        totalFaculty,
        totalStudents,
        pendingCount,
        approvedCount,
        rejectedCount,
        notSubmittedCount,
        facultyMarksSharedCount,
        facultyMarksPartialCount,
        facultyMarksPendingCount,
      },
      faculty: formattedFaculty,
      projects: projects.map((p) => ({
        id: p.id,
        projectId: p.projectId,
        title: p.title,
        description: p.description,
        theme: p.theme,
        category: p.category,
        semester: p.semester,
        academicYear: p.academicYear,
        submissionStatus: p.submissionStatus,
        spocReviewNote: p.spocReviewNote,
        reviewedAt: p.reviewedAt?.toISOString() || null,
        // Research Manuscript & Publication (Optional)
        hasCommunicatedManuscript: p.hasCommunicatedManuscript,
        draftManuscriptUrl: p.draftManuscriptUrl,
        draftManuscriptFileName: p.draftManuscriptFileName,
        journalName: p.journalName,
        avishkarAffiliationCommunicated: p.avishkarAffiliationCommunicated,
        isManuscriptPublished: p.isManuscriptPublished,
        publicationDoi: p.publicationDoi,
        publishedManuscriptUrl: p.publishedManuscriptUrl,
        publishedManuscriptFileName: p.publishedManuscriptFileName,
        avishkarAffiliationPublished: p.avishkarAffiliationPublished,
        manuscriptPlagiarismUrl: p.manuscriptPlagiarismUrl,
        manuscriptPlagiarismFileName: p.manuscriptPlagiarismFileName,
        manuscriptSimilarityPercent: p.manuscriptSimilarityPercent,
        manuscriptAiPercent: p.manuscriptAiPercent,
        manuscriptSubmittedAt: p.manuscriptSubmittedAt?.toISOString() || null,
        faculty: p.faculty,
        studentsCount: p.registrations.length,
        artifacts: p.artifacts.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
          semester: a.semester,
          academicYear: a.academicYear,
          similarityPercent: a.similarityPercent,
          aiPercent: a.aiPercent,
          similarityChecked: a.similarityChecked,
          aiChecked: a.aiChecked,
          plagiarismReportFileName: a.plagiarismReportFileName,
          plagiarismReportUrl: a.plagiarismReportUrl,
          selfDeclaration: a.selfDeclaration,
          status: a.status,
          spocNote: a.spocNote,
          submittedAt: a.submittedAt.toISOString(),
          reviewedAt: a.reviewedAt?.toISOString() || null,
          reviewedBy: a.reviewedBy?.name || null,
        })),
        students: p.registrations.map((r) => ({
          id: r.student.id,
          enrollment: r.student.enrollmentNumber,
          name: r.student.name,
          department: r.student.department,
          programme: r.student.programme,
          semester: r.student.semester,
          batch: r.student.batch,
        })),
      })),
      students,
    });
  } catch (error: any) {
    console.error("SPOC department API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load SPOC department data." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SPOC" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. SPOC or Admin access required." }, { status: 401 });
    }

    const body = await req.json();
    const { action, updates, studentId, attendancePercent, internalMarks, externalMarks } = body;

    if (action === "UPDATE_STUDENT_MARKS" || action === "BULK_UPDATE_MARKS") {
      let recordsToUpdate: Array<{
        studentId?: string;
        enrollmentNumber?: string;
        attendancePercent?: number | null;
        internalMarks?: number | null;
        externalMarks?: number | null;
      }> = [];

      if (Array.isArray(updates) && updates.length > 0) {
        recordsToUpdate = updates;
      } else if (studentId) {
        recordsToUpdate = [
          {
            studentId,
            attendancePercent: attendancePercent !== undefined ? Number(attendancePercent) : undefined,
            internalMarks: internalMarks !== undefined ? Number(internalMarks) : undefined,
            externalMarks: externalMarks !== undefined ? Number(externalMarks) : undefined,
          },
        ];
      } else {
        return NextResponse.json({ error: "No student update data provided." }, { status: 400 });
      }

      let updatedCount = 0;
      for (const item of recordsToUpdate) {
        const updateData: any = {};
        if (item.attendancePercent !== undefined && item.attendancePercent !== null && !isNaN(Number(item.attendancePercent))) {
          updateData.attendancePercent = Math.min(100, Math.max(0, Number(item.attendancePercent)));
        }
        if (item.internalMarks !== undefined && item.internalMarks !== null && !isNaN(Number(item.internalMarks))) {
          updateData.internalMarks = Math.max(0, Number(item.internalMarks));
        }
        if (item.externalMarks !== undefined && item.externalMarks !== null && !isNaN(Number(item.externalMarks))) {
          updateData.externalMarks = Math.max(0, Number(item.externalMarks));
        }

        if (Object.keys(updateData).length === 0) continue;

        if (item.studentId) {
          await prisma.student.update({
            where: { id: item.studentId },
            data: updateData,
          });
          updatedCount++;
        } else if (item.enrollmentNumber) {
          const res = await prisma.student.updateMany({
            where: { enrollmentNumber: String(item.enrollmentNumber).trim() },
            data: updateData,
          });
          if (res.count > 0) updatedCount += res.count;
        }
      }

      await prisma.auditLog.create({
        data: {
          actor: session.name,
          actorRole: session.role,
          action: "SPOC_STUDENT_MARKS_UPLOADED",
          metadata: JSON.stringify({ count: updatedCount }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated attendance & assessment for ${updatedCount} student(s).`,
        updatedCount,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("SPOC marks update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update student assessments." },
      { status: 500 }
    );
  }
}

