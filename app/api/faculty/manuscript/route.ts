import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { handleApiError, apiSuccess, apiError } from "@/lib/api-response";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes max cap

// Helper to save a file to R2 or local disk
async function saveFile(
  file: File,
  prefix: string,
  academicYear: string,
  projectId: string
): Promise<{ fileName: string; fileUrl: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 10MB maximum limit.`
    );
  }

  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}_${prefix}_${sanitized}`;
  const r2Key = `${academicYear}/manuscripts/${projectId}/${fileName}`;
  const fileUrl = `/api/artifacts/${encodeURIComponent(r2Key)}`;
  const arrayBuffer = await file.arrayBuffer();
  const mimeType = file.type || "application/pdf";

  try {
    const ctx = getCloudflareContext();
    const env = ctx?.env as any;
    if (env?.ARTIFACTS) {
      await env.ARTIFACTS.put(r2Key, arrayBuffer, {
        httpMetadata: { contentType: mimeType },
      });
      return { fileName, fileUrl };
    }
  } catch (e) {
    // Cloudflare context unavailable in local node run
  }

  // Fallback to local uploads directory
  const uploadsDir = path.join(process.cwd(), "public", "uploads", academicYear, "manuscripts", projectId);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(uploadsDir, fileName), Buffer.from(arrayBuffer));
  return { fileName, fileUrl };
}

// GET MANUSCRIPT DETAILS FOR PROJECT
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "FACULTY" && session.role !== "SPOC" && session.role !== "ADMIN")) {
      return apiError("Unauthorized.", 401);
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return apiError("Project ID is required.", 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectId: true,
        title: true,
        facultyId: true,
        hasCommunicatedManuscript: true,
        draftManuscriptUrl: true,
        draftManuscriptFileName: true,
        journalName: true,
        avishkarAffiliationCommunicated: true,
        isManuscriptPublished: true,
        publicationDoi: true,
        publishedManuscriptUrl: true,
        publishedManuscriptFileName: true,
        avishkarAffiliationPublished: true,
        manuscriptPlagiarismUrl: true,
        manuscriptPlagiarismFileName: true,
        manuscriptSimilarityPercent: true,
        manuscriptAiPercent: true,
        manuscriptSubmittedAt: true,
      },
    });

    if (!project) {
      return apiError("Project not found.", 404);
    }

    return apiSuccess({ project });
  } catch (error) {
    return handleApiError(error, "Failed to retrieve manuscript details.");
  }
}

// SUBMIT / UPDATE MANUSCRIPT
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "FACULTY") {
      return apiError("Unauthorized. Faculty access required.", 401);
    }

    const formData = await req.formData();
    const projectId = formData.get("projectId") as string;
    if (!projectId) {
      return apiError("Project ID is required.", 400);
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        facultyId: session.id,
      },
    });

    if (!project) {
      return apiError("Project not found or not assigned to your profile.", 404);
    }

    const globalConfig = await prisma.globalConfig.findUnique({ where: { id: "default" } });
    const academicYear = project.academicYear || globalConfig?.activeAcademicYear || "2025-2026";

    // Parse options
    const hasCommunicatedManuscript = formData.get("hasCommunicatedManuscript") === "true";
    const isManuscriptPublished = formData.get("isManuscriptPublished") === "true";

    const updateData: any = {
      hasCommunicatedManuscript,
      isManuscriptPublished,
      manuscriptSubmittedAt: new Date(),
    };

    // 1. Process Communicated Manuscript
    if (hasCommunicatedManuscript) {
      const journalName = formData.get("journalName") as string;
      const avishkarAffiliationCommunicated = formData.get("avishkarAffiliationCommunicated") === "true";
      const similarityPercentStr = formData.get("manuscriptSimilarityPercent") as string;
      const aiPercentStr = formData.get("manuscriptAiPercent") as string;

      if (!journalName || !journalName.trim()) {
        return apiError("Journal name is required when manuscript is marked as communicated.", 400);
      }
      if (!avishkarAffiliationCommunicated) {
        return apiError("Confirmation required: Please verify that Avishkar / CIE affiliation was added in the paper.", 400);
      }

      updateData.journalName = journalName.trim();
      updateData.avishkarAffiliationCommunicated = true;

      if (similarityPercentStr) {
        const sim = parseFloat(similarityPercentStr);
        if (!isNaN(sim)) updateData.manuscriptSimilarityPercent = sim;
      }
      if (aiPercentStr) {
        const ai = parseFloat(aiPercentStr);
        if (!isNaN(ai)) updateData.manuscriptAiPercent = ai;
      }

      // Draft file
      const draftFile = formData.get("draftFile") as File | null;
      if (draftFile && typeof draftFile === "object" && draftFile.size > 0) {
        const { fileName, fileUrl } = await saveFile(draftFile, "draft", academicYear, project.projectId);
        updateData.draftManuscriptFileName = fileName;
        updateData.draftManuscriptUrl = fileUrl;
      }

      // Plagiarism 3-5 pages file
      const plagiarismFile = formData.get("plagiarismFile") as File | null;
      if (plagiarismFile && typeof plagiarismFile === "object" && plagiarismFile.size > 0) {
        const { fileName, fileUrl } = await saveFile(plagiarismFile, "plag_summary", academicYear, project.projectId);
        updateData.manuscriptPlagiarismFileName = fileName;
        updateData.manuscriptPlagiarismUrl = fileUrl;
      }
    } else {
      updateData.journalName = null;
      updateData.avishkarAffiliationCommunicated = false;
    }

    // 2. Process Published Manuscript
    if (isManuscriptPublished) {
      const publicationDoi = formData.get("publicationDoi") as string;
      const avishkarAffiliationPublished = formData.get("avishkarAffiliationPublished") === "true";

      if (!publicationDoi || !publicationDoi.trim()) {
        return apiError("Publication DOI link or identifier is required when manuscript is marked as published.", 400);
      }
      if (!avishkarAffiliationPublished) {
        return apiError("Confirmation required: Please verify that Avishkar / CIE affiliation is in the published paper.", 400);
      }

      updateData.publicationDoi = publicationDoi.trim();
      updateData.avishkarAffiliationPublished = true;

      // Published paper file
      const publishedFile = formData.get("publishedFile") as File | null;
      if (publishedFile && typeof publishedFile === "object" && publishedFile.size > 0) {
        const { fileName, fileUrl } = await saveFile(publishedFile, "published", academicYear, project.projectId);
        updateData.publishedManuscriptFileName = fileName;
        updateData.publishedManuscriptUrl = fileUrl;
      }
    } else {
      updateData.publicationDoi = null;
      updateData.avishkarAffiliationPublished = false;
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "FACULTY",
        action: "FACULTY_MANUSCRIPT_TRACKING_UPDATED",
        target: `${project.projectId}: ${project.title}`,
        metadata: JSON.stringify({
          hasCommunicatedManuscript,
          journalName: updateData.journalName,
          isManuscriptPublished,
          publicationDoi: updateData.publicationDoi,
        }),
      },
    });

    broadcastEvent("project.updated", {
      projectId: updated.id,
      projectCode: updated.projectId,
      hasCommunicatedManuscript: updated.hasCommunicatedManuscript,
      isManuscriptPublished: updated.isManuscriptPublished,
    });

    return apiSuccess({
      message: "Research manuscript tracking updated successfully.",
      project: updated,
    });
  } catch (error) {
    return handleApiError(error, "Failed to update manuscript tracking.");
  }
}
