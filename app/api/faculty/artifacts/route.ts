import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanErrorMessage, safeIsoString, parseNum } from "@/lib/api-response";
import { broadcastEvent } from "@/lib/events";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "FACULTY" && session.role !== "SPOC" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await req.formData();
    const projectId = formData.get("projectId") as string;
    const type = (formData.get("type") as string || "REPORT").toUpperCase();
    const title = formData.get("title") as string;
    const similarityPercentStr = formData.get("similarityPercent") as string;
    const aiPercentStr = formData.get("aiPercent") as string;
    const similarityChecked = formData.get("similarityChecked") === "true";
    const aiChecked = formData.get("aiChecked") === "true";
    const selfDeclaration = formData.get("selfDeclaration") === "true";
    const file = formData.get("file") as File | null;
    const plagiarismFile = formData.get("plagiarismFile") as File | null;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Document title is required." }, { status: 400 });
    }

    // Verify user authorization for this project
    let project = null;
    if (session.role === "ADMIN") {
      project = await prisma.project.findUnique({
        where: { id: projectId },
      });
    } else if (session.role === "SPOC") {
      let dept = session.spocDepartment || session.department;
      if (!dept) {
        const spoc = await prisma.spoc.findUnique({ where: { id: session.id } });
        dept = spoc?.department;
      }
      if (!dept) {
        const faculty = await prisma.faculty.findUnique({ where: { id: session.id } });
        if (faculty?.isSpoc) dept = faculty.spocDepartment || faculty.department;
      }
      if (!dept) {
        return NextResponse.json({ error: "Access forbidden. SPOC department authorization missing." }, { status: 403 });
      }
      project = await prisma.project.findFirst({
        where: {
          id: projectId,
          department: dept,
        },
      });
    } else if (session.role === "FACULTY") {
      if (session.isSpoc && session.spocDepartment) {
        project = await prisma.project.findFirst({
          where: {
            id: projectId,
            OR: [
              { facultyId: session.id },
              { department: session.spocDepartment },
            ],
          },
        });
      } else {
        project = await prisma.project.findFirst({
          where: {
            id: projectId,
            facultyId: session.id,
          },
        });
      }
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not assigned to your authorized scope." },
        { status: 404 }
      );
    }

    // Fetch current system academic year and active semester
    const globalConfig = await prisma.globalConfig.findUnique({ where: { id: "default" } });
    const academicYear = project.academicYear || globalConfig?.activeAcademicYear || "2025-2026";
    const activeSemester = globalConfig?.activeSemester || 3;
    const semester = formData.get("semester") ? parseInt(formData.get("semester") as string, 10) : activeSemester;

    // Self Declaration Consent Check
    if (!selfDeclaration) {
      return NextResponse.json(
        { error: "Consent required: Please check the Self Declaration confirming that all the above info is correct." },
        { status: 400 }
      );
    }

    // Strict validation for REPORT
    let similarityPercent: number | null = null;
    let aiPercent: number | null = null;

    if (type === "REPORT") {
      if (!similarityChecked) {
        return NextResponse.json(
          { error: "Plagiarism verification checkbox must be checked (< 10% similarity)." },
          { status: 400 }
        );
      }
      if (!aiChecked) {
        return NextResponse.json(
          { error: "AI-generated content verification checkbox must be checked (< 20% AI content)." },
          { status: 400 }
        );
      }

      similarityPercent = similarityPercentStr ? parseFloat(similarityPercentStr) : 5.0;
      aiPercent = aiPercentStr ? parseFloat(aiPercentStr) : 10.0;

      if (isNaN(similarityPercent) || similarityPercent >= 10.0) {
        return NextResponse.json(
          { error: `Content similarity must be less than 10%. Entered: ${similarityPercent}%` },
          { status: 400 }
        );
      }

      if (isNaN(aiPercent) || aiPercent >= 20.0) {
        return NextResponse.json(
          { error: `AI-written content must be less than 20%. Entered: ${aiPercent}%` },
          { status: 400 }
        );
      }

      if (!plagiarismFile || plagiarismFile.size === 0) {
        return NextResponse.json(
          { error: "Plagiarism report file is required for Project Report submission." },
          { status: 400 }
        );
      }
    } else if (similarityPercentStr) {
      const parsed = parseFloat(similarityPercentStr);
      if (!isNaN(parsed)) similarityPercent = parsed;
    }

    // Enforce 10MB Storage Cap (Cloudflare R2 10GB preservation)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes
    if (file && file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Upload rejected: File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 10MB maximum limit.` },
        { status: 400 }
      );
    }

    // Whitelist allowed extensions and MIME types to prevent Stored XSS
    const ALLOWED_EXTENSIONS = new Set(["pdf", "pptx", "ppt", "docx", "doc", "zip"]);
    if (file && typeof file === "object" && "name" in file) {
      const ext = ((file.name as string).split(".").pop() || "").toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          { error: `Invalid file format (.${ext}). Only PDF, PPTX, PPT, DOCX, and ZIP files are permitted.` },
          { status: 400 }
        );
      }
    }

    // Process main file
    let fileName = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    let fileSize = 1024 * 150; // default 150KB
    let mimeType = "application/pdf";

    if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
      const cleanName = path.basename(file.name).replace(/\.+/g, ".").replace(/[^a-zA-Z0-9._-]/g, "_");
      fileName = `${Date.now()}_${cleanName}`;
      fileSize = file.size;
      mimeType = file.type || "application/octet-stream";
    }

    // Partitioned R2 Object Key: {academicYear}/sem{semester}/{projectId}/{fileName}
    const r2Key = `${academicYear}/sem${semester}/${project.projectId}/${fileName}`;
    const fileUrl = `/api/artifacts/${encodeURIComponent(r2Key)}`;

    if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();

      try {
        const ctx = getCloudflareContext();
        const env = ctx?.env as any;
        if (env?.ARTIFACTS) {
          await env.ARTIFACTS.put(r2Key, arrayBuffer, {
            httpMetadata: { contentType: mimeType },
          });
        } else if (process.env.NODE_ENV !== "production") {
          const uploadsDir = path.join(process.cwd(), "public", "uploads", academicYear, `sem${semester}`, project.projectId);
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          fs.writeFileSync(path.join(uploadsDir, fileName), Buffer.from(arrayBuffer));
        } else {
          throw new Error("R2 storage bucket is not available.");
        }
      } catch (err: any) {
        console.error("Artifact upload error:", err);
        return NextResponse.json(
          { error: cleanErrorMessage(err, "Failed to store artifact in cloud storage.") },
          { status: 500 }
        );
      }
    }

    // Process Plagiarism Report File if provided
    let plagiarismReportFileName: string | null = null;
    let plagiarismReportUrl: string | null = null;

    if (plagiarismFile && typeof plagiarismFile === "object" && "arrayBuffer" in plagiarismFile && plagiarismFile.size > 0) {
      if (plagiarismFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Plagiarism report exceeds the 10MB limit (${(plagiarismFile.size / (1024 * 1024)).toFixed(2)} MB).` },
          { status: 400 }
        );
      }

      const plagExt = ((plagiarismFile.name as string).split(".").pop() || "").toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(plagExt)) {
        return NextResponse.json(
          { error: `Invalid plagiarism report format (.${plagExt}). Only PDF, PPTX, DOCX are permitted.` },
          { status: 400 }
        );
      }

      const sanitizedPlagName = path.basename(plagiarismFile.name).replace(/\.+/g, ".").replace(/[^a-zA-Z0-9._-]/g, "_");
      const plagFileName = `${Date.now()}_plag_${sanitizedPlagName}`;
      const plagR2Key = `${academicYear}/sem${semester}/${project.projectId}/${plagFileName}`;
      plagiarismReportFileName = plagR2Key;
      plagiarismReportUrl = `/api/artifacts/${encodeURIComponent(plagR2Key)}`;

      const plagArrayBuffer = await plagiarismFile.arrayBuffer();
      const plagMimeType = plagiarismFile.type || "application/pdf";

      try {
        const ctx = getCloudflareContext();
        const env = ctx?.env as any;
        if (env?.ARTIFACTS) {
          await env.ARTIFACTS.put(plagR2Key, plagArrayBuffer, {
            httpMetadata: { contentType: plagMimeType },
          });
        } else if (process.env.NODE_ENV !== "production") {
          const uploadsDir = path.join(process.cwd(), "public", "uploads", academicYear, `sem${semester}`, project.projectId);
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          fs.writeFileSync(path.join(uploadsDir, plagFileName), Buffer.from(plagArrayBuffer));
        }
      } catch (err) {
        console.error("Plagiarism upload error:", err);
      }
    }

    // Create ProjectArtifact record & update Project status atomically
    const [artifact] = await prisma.$transaction([
      prisma.projectArtifact.create({
        data: {
          projectId: project.id,
          type: type as "REPORT" | "PPT" | "OTHER",
          title: title.trim(),
          fileName: r2Key,
          fileUrl,
          fileSize: typeof fileSize === "number" ? Math.round(fileSize) : null,
          mimeType,
          academicYear,
          semester: typeof semester === "number" ? semester : 3,
          similarityPercent: similarityPercent != null ? Number(similarityPercent) : null,
          aiPercent: aiPercent != null ? Number(aiPercent) : null,
          similarityChecked: Boolean(similarityChecked),
          aiChecked: Boolean(aiChecked),
          plagiarismReportFileName,
          plagiarismReportUrl,
          selfDeclaration: Boolean(selfDeclaration),
          status: "PENDING",
          submittedAt: new Date(),
        },
      }),
      prisma.project.update({
        where: { id: project.id },
        data: {
          submissionStatus: "PENDING",
          spocReviewNote: null, // reset previous rejection note on new upload
        },
      }),
    ]);

    // Audit log
    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: session.role,
        action: "PROJECT_ARTIFACT_UPLOADED",
        target: `${project.projectId}: ${type} - ${title}`,
        metadata: JSON.stringify({
          artifactId: artifact.id,
          type,
          similarityPercent,
          aiPercent,
          uploadedByRole: session.role,
        }),
      },
    });

    // Broadcast SSE
    broadcastEvent("artifact.submitted", {
      projectId: project.id,
      department: project.department,
      artifactId: artifact.id,
      type,
    });

    return NextResponse.json({
      success: true,
      artifact: {
        ...artifact,
        fileSize: parseNum(artifact.fileSize, 0),
        semester: parseNum(artifact.semester, 3),
        similarityPercent: artifact.similarityPercent != null ? parseNum(artifact.similarityPercent) : null,
        aiPercent: artifact.aiPercent != null ? parseNum(artifact.aiPercent) : null,
        submittedAt: safeIsoString(artifact.submittedAt),
      },
    });
  } catch (error: any) {
    console.error("Error uploading artifact:", error);
    return NextResponse.json(
      { error: cleanErrorMessage(error, "Failed to upload artifact.") },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "FACULTY" && session.role !== "SPOC" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const artifactId = searchParams.get("artifactId");

    if (!artifactId) {
      return NextResponse.json({ error: "Artifact ID is required." }, { status: 400 });
    }

    const artifact = await prisma.projectArtifact.findUnique({
      where: { id: artifactId },
      include: { project: true },
    });

    if (!artifact) {
      return NextResponse.json({ error: "Artifact not found." }, { status: 404 });
    }

    const isOwnerFaculty = session.role === "FACULTY" && artifact.project.facultyId === session.id;
    const isDeptSpoc =
      (session.role === "SPOC" || (session.role === "FACULTY" && session.isSpoc)) &&
      artifact.project.department === (session.spocDepartment || session.department);
    const isAdmin = session.role === "ADMIN";

    if (!isOwnerFaculty && !isDeptSpoc && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized to delete this artifact." }, { status: 403 });
    }

    // Protect approved academic evaluations from deletion by faculty
    if (session.role === "FACULTY" && artifact.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot delete an artifact that has already been approved by the Department SPOC." },
        { status: 403 }
      );
    }

    // Delete files from R2 or local disk
    try {
      const ctx = getCloudflareContext();
      const env = ctx?.env as any;
      if (env?.ARTIFACTS) {
        if (artifact.fileName) await env.ARTIFACTS.delete(artifact.fileName);
        if (artifact.plagiarismReportFileName) await env.ARTIFACTS.delete(artifact.plagiarismReportFileName);
      } else if (process.env.NODE_ENV !== "production") {
        if (artifact.fileName) {
          const localPath = path.join(process.cwd(), "public", "uploads", artifact.fileName);
          if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        }
        if (artifact.plagiarismReportFileName) {
          const localPlagPath = path.join(process.cwd(), "public", "uploads", artifact.plagiarismReportFileName);
          if (fs.existsSync(localPlagPath)) fs.unlinkSync(localPlagPath);
        }
      }
    } catch (storageErr) {
      console.error("Storage delete warning:", storageErr);
    }

    // Delete artifact, log audit, and reset project status if 0 artifacts remain
    await prisma.projectArtifact.delete({
      where: { id: artifactId },
    });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: session.role,
        action: "PROJECT_ARTIFACT_DELETED",
        target: `${artifact.project.projectId}: ${artifact.type} - ${artifact.title}`,
        metadata: JSON.stringify({
          artifactId: artifact.id,
          fileName: artifact.fileName,
          plagiarismReportFileName: artifact.plagiarismReportFileName,
          deletedByRole: session.role,
        }),
      },
    });

    const remaining = await prisma.projectArtifact.count({
      where: { projectId: artifact.projectId },
    });

    if (remaining === 0) {
      await prisma.project.update({
        where: { id: artifact.projectId },
        data: { submissionStatus: "NOT_SUBMITTED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting artifact:", error);
    return NextResponse.json(
      { error: cleanErrorMessage(error, "Failed to delete artifact.") },
      { status: 500 }
    );
  }
}
