import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";
import { handleApiError, apiSuccess, apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// LIST PROJECTS ASSIGNED TO FACULTY
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "FACULTY") {
      return apiError("Unauthorized. Faculty access required.", 401);
    }

    const projects = await prisma.project.findMany({
      where: { facultyId: session.id },
      include: {
        artifacts: true,
        registrations: {
          include: { student: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ projects });
  } catch (error) {
    return handleApiError(error, "Failed to retrieve projects.");
  }
}

// SUBMIT NEW PROJECT IDEA / PROPOSAL
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "FACULTY") {
      return apiError("Unauthorized. Faculty access required.", 401);
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id: session.id },
    });
    if (!faculty) {
      return apiError("Faculty profile not found.", 404);
    }

    const body = await req.json();
    const {
      title,
      description,
      category = "IDP2502",
      theme,
      sdgMapping,
      maxSeats,
      sameDeptLimit,
      otherDeptLimit,
      semester,
    } = body;

    if (!title || !title.trim()) {
      return apiError("Project Title is required.", 400);
    }

    if (!theme || !theme.trim()) {
      return apiError("Please select a project Theme.", 400);
    }

    // Determine current active academic year
    const config = await prisma.globalConfig.findUnique({ where: { id: "default" } });
    const activeAcademicYear = config?.activeAcademicYear || "2025-2026";
    const activeSemester = semester ? parseInt(semester, 10) : config?.activeSemester || 3;

    // Generate next sequential Project ID (e.g., P189, P190...)
    const allProjects = await prisma.project.findMany({ select: { projectId: true } });
    let maxNum = 0;
    for (const p of allProjects) {
      const match = p.projectId.match(/^P(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextProjectId = `P${String(maxNum + 1).padStart(3, "0")}`;

    // Parse seats / limits or fallback to defaults
    const seats = maxSeats ? parseInt(maxSeats, 10) : (config?.maxSeats || 10);
    const sameLimit = sameDeptLimit !== undefined ? parseInt(sameDeptLimit, 10) : (config?.sameDeptLimit || 4);
    const otherLimit = otherDeptLimit !== undefined ? parseInt(otherDeptLimit, 10) : (config?.otherDeptLimit || 6);

    const createdProject = await prisma.project.create({
      data: {
        projectId: nextProjectId,
        title: title.trim(),
        description: description ? description.trim() : null,
        facultyId: faculty.id,
        department: faculty.department,
        theme: theme.trim(),
        category: category.trim(),
        sdgMapping: sdgMapping ? sdgMapping.trim() : null,
        academicYear: activeAcademicYear,
        semester: activeSemester,
        maxSeats: seats,
        sameDeptLimit: sameLimit,
        otherDeptLimit: otherLimit,
        submissionStatus: "PENDING", // Pending review by department SPOC
        spocReviewNote: "Project proposal submitted by faculty. Pending SPOC review & approval.",
      },
      include: {
        faculty: { select: { name: true, email: true, department: true } },
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "FACULTY",
        action: "FACULTY_PROJECT_IDEA_SUBMITTED",
        target: `${nextProjectId}: ${title.trim()}`,
        metadata: JSON.stringify({
          projectId: createdProject.id,
          department: faculty.department,
          category,
          theme,
        }),
      },
    });

    // Broadcast SSE to inform SPOC in real-time
    broadcastEvent("submission.created", {
      projectId: createdProject.id,
      projectCode: createdProject.projectId,
      department: createdProject.department,
      facultyName: faculty.name,
      title: createdProject.title,
      status: "PENDING",
    });

    return apiSuccess({
      message: `Project proposal ${nextProjectId} submitted successfully. It is now awaiting review and approval by your Department SPOC (${faculty.department}).`,
      project: createdProject,
    }, 201);
  } catch (error) {
    return handleApiError(error, "Failed to submit project idea.");
  }
}

// EDIT PROJECT IDEA OR SHARE STUDENT ASSESSMENT MARKS
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "FACULTY") {
      return apiError("Unauthorized. Faculty access required.", 401);
    }

    const body = await req.json();
    const {
      action,
      projectId,
      id,
      studentMarks,
      title,
      description,
      category,
      theme,
      sdgMapping,
      maxSeats,
    } = body;

    const targetProjectId = projectId || id;
    if (!targetProjectId) {
      return apiError("Project ID is required.", 400);
    }

    // Faculty sharing marks for students enrolled in their project
    if (action === "SHARE_STUDENT_MARKS" || action === "UPDATE_MARKS") {
      const project = await prisma.project.findFirst({
        where: {
          id: targetProjectId,
          facultyId: session.id,
        },
        include: {
          registrations: {
            select: { studentId: true },
          },
        },
      });

      if (!project) {
        return apiError("Project not found or not owned by your profile.", 404);
      }

      if (!Array.isArray(studentMarks) || studentMarks.length === 0) {
        return apiError("No student marks provided.", 400);
      }

      const allowedStudentIds = new Set(project.registrations.map((r) => r.studentId));
      let updatedCount = 0;

      for (const item of studentMarks) {
        if (!item.studentId || !allowedStudentIds.has(item.studentId)) continue;

        const updateData: any = {};
        if (
          item.internalMarks !== undefined &&
          item.internalMarks !== null &&
          !isNaN(Number(item.internalMarks))
        ) {
          updateData.internalMarks = Math.max(0, Number(item.internalMarks));
        }
        if (
          item.externalMarks !== undefined &&
          item.externalMarks !== null &&
          !isNaN(Number(item.externalMarks))
        ) {
          updateData.externalMarks = Math.max(0, Number(item.externalMarks));
        }
        if (
          item.attendancePercent !== undefined &&
          item.attendancePercent !== null &&
          !isNaN(Number(item.attendancePercent))
        ) {
          updateData.attendancePercent = Math.min(100, Math.max(0, Number(item.attendancePercent)));
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.student.update({
            where: { id: item.studentId },
            data: updateData,
          });
          updatedCount++;
        }
      }

      await prisma.auditLog.create({
        data: {
          actor: session.name,
          actorRole: "FACULTY",
          action: "FACULTY_MARKS_SHARED",
          target: project.projectId,
          metadata: JSON.stringify({ count: updatedCount, projectId: project.id }),
        },
      });

      // Broadcast SSE so SPOC portal gets live notification
      broadcastEvent("submission.reviewed", {
        type: "MARKS_SHARED",
        projectId: project.id,
        department: project.department,
        count: updatedCount,
      });

      return apiSuccess({
        message: `Successfully shared assessment marks for ${updatedCount} student(s).`,
        updatedCount,
      });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: targetProjectId,
        facultyId: session.id,
      },
    });

    if (!project) {
      return apiError("Project not found or not owned by your profile.", 404);
    }

    const updateData: any = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (category) updateData.category = category.trim();
    if (theme) updateData.theme = theme.trim();
    if (sdgMapping !== undefined) updateData.sdgMapping = sdgMapping?.trim() || null;
    if (maxSeats) updateData.maxSeats = parseInt(maxSeats, 10);

    // If it was rejected, editing resets status back to PENDING for re-review
    if (project.submissionStatus === "REJECTED") {
      updateData.submissionStatus = "PENDING";
      updateData.spocReviewNote = "Revised proposal submitted by faculty mentor.";
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "FACULTY",
        action: "FACULTY_PROJECT_IDEA_UPDATED",
        target: project.projectId,
        metadata: JSON.stringify(updateData),
      },
    });

    return apiSuccess({
      message: "Project proposal updated successfully.",
      project: updated,
    });
  } catch (error) {
    return handleApiError(error, "Failed to update project idea.");
  }
}
