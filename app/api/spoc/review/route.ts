import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let reviewerFacultyId: string | null = null;
    let authorizedDepartment: string | null = null;

    if (session.role === "SPOC") {
      const spoc = await prisma.spoc.findUnique({
        where: { id: session.id },
      });
      if (spoc) {
        reviewerFacultyId = spoc.facultyId || spoc.id;
        authorizedDepartment = spoc.department;
      } else {
        const faculty = await prisma.faculty.findUnique({
          where: { id: session.id },
        });
        if (faculty && faculty.isSpoc) {
          reviewerFacultyId = faculty.id;
          authorizedDepartment = faculty.spocDepartment || faculty.department;
        } else {
          return NextResponse.json(
            { error: "Access forbidden. SPOC authorization not found." },
            { status: 403 }
          );
        }
      }
    } else if (session.role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({
        where: { id: session.id },
      });
      if (!faculty || !faculty.isSpoc || !faculty.spocDepartment) {
        return NextResponse.json(
          { error: "Access forbidden. Only assigned SPOC can review." },
          { status: 403 }
        );
      }
      reviewerFacultyId = faculty.id;
      authorizedDepartment = faculty.spocDepartment;
    } else if (session.role === "ADMIN") {
      authorizedDepartment = "*"; // admin can review any
    } else {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { projectId, artifactId, action, note } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE or REJECT." },
        { status: 400 }
      );
    }

    if (action === "REJECT" && (!note || note.trim().length === 0)) {
      return NextResponse.json(
        { error: "A note/reason is required when rejecting a submission." },
        { status: 400 }
      );
    }

    // Verify project belongs to SPOC's department
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { artifacts: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (authorizedDepartment !== "*" && project.department !== authorizedDepartment) {
      return NextResponse.json(
        { error: "You can only review submissions for your assigned department." },
        { status: 403 }
      );
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    const reviewNote = note ? note.trim() : action === "APPROVE" ? "Approved by Department SPOC" : "";

    // If specific artifact ID is provided, update that artifact
    if (artifactId) {
      await prisma.projectArtifact.update({
        where: { id: artifactId },
        data: {
          status: newStatus,
          spocNote: reviewNote,
          reviewedAt: new Date(),
          reviewedById: reviewerFacultyId,
        },
      });
    } else {
      // Update all pending artifacts for this project
      await prisma.projectArtifact.updateMany({
        where: { projectId: project.id },
        data: {
          status: newStatus,
          spocNote: reviewNote,
          reviewedAt: new Date(),
          reviewedById: reviewerFacultyId,
        },
      });
    }

    // Update overall Project submission status
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        submissionStatus: newStatus,
        spocReviewNote: reviewNote,
        reviewedAt: new Date(),
        reviewedById: reviewerFacultyId,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: session.role === "ADMIN" ? "ADMIN" : "SPOC",
        action: `PROJECT_SUBMISSION_${action}D`,
        target: `${project.projectId}: ${project.title}`,
        metadata: JSON.stringify({
          projectId: project.id,
          artifactId,
          action,
          note: reviewNote,
          department: project.department,
        }),
      },
    });

    // Broadcast SSE
    broadcastEvent("submission.reviewed", {
      projectId: project.id,
      department: project.department,
      status: newStatus,
      note: reviewNote,
    });

    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error: any) {
    console.error("SPOC review error:", error);
    return handleApiError(error, "Failed to process review.");
  }
}

// SPOC EDIT PROJECT PROPOSAL DETAILS
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let authorizedDepartment: string | null = null;
    if (session.role === "SPOC") {
      const spoc = await prisma.spoc.findUnique({ where: { id: session.id } });
      authorizedDepartment = spoc?.department || null;
      if (!authorizedDepartment) {
        const faculty = await prisma.faculty.findUnique({ where: { id: session.id } });
        if (faculty?.isSpoc) authorizedDepartment = faculty.spocDepartment || faculty.department;
      }
    } else if (session.role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({ where: { id: session.id } });
      if (faculty?.isSpoc && faculty.spocDepartment) authorizedDepartment = faculty.spocDepartment;
    } else if (session.role === "ADMIN") {
      authorizedDepartment = "*";
    }

    if (!authorizedDepartment) {
      return NextResponse.json({ error: "Forbidden. SPOC or Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      projectId,
      title,
      description,
      category,
      theme,
      sdgMapping,
      maxSeats,
      sameDeptLimit,
      otherDeptLimit,
      submissionStatus,
      spocReviewNote,
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    }

    const existingProject = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    if (authorizedDepartment !== "*" && existingProject.department !== authorizedDepartment) {
      return NextResponse.json({ error: "Forbidden. You can only edit projects in your assigned department." }, { status: 403 });
    }

    const updateData: any = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (category) updateData.category = category.trim();
    if (theme) updateData.theme = theme.trim();
    if (sdgMapping !== undefined) updateData.sdgMapping = sdgMapping ? sdgMapping.trim() : null;
    if (maxSeats !== undefined) updateData.maxSeats = parseInt(maxSeats, 10);
    if (sameDeptLimit !== undefined) updateData.sameDeptLimit = parseInt(sameDeptLimit, 10);
    if (otherDeptLimit !== undefined) updateData.otherDeptLimit = parseInt(otherDeptLimit, 10);
    if (submissionStatus) {
      updateData.submissionStatus = submissionStatus;
      updateData.reviewedAt = new Date();
      updateData.reviewedById = session.id;
    }
    if (spocReviewNote !== undefined) updateData.spocReviewNote = spocReviewNote ? spocReviewNote.trim() : null;

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        faculty: { select: { name: true, email: true, department: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: session.role === "ADMIN" ? "ADMIN" : "SPOC",
        action: "SPOC_EDIT_PROJECT_PROPOSAL",
        target: `${updated.projectId}: ${updated.title}`,
        metadata: JSON.stringify({
          projectId: updated.id,
          department: updated.department,
          changes: updateData,
        }),
      },
    });

    broadcastEvent("submission.reviewed", {
      projectId: updated.id,
      department: updated.department,
      status: updated.submissionStatus,
      note: updated.spocReviewNote,
    });

    return NextResponse.json({
      success: true,
      message: `Project ${updated.projectId} updated successfully.`,
      project: updated,
    });
  } catch (error: any) {
    console.error("SPOC project edit error:", error);
    return handleApiError(error, "Failed to update project.");
  }
}

