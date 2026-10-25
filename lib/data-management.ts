import { prisma } from "@/lib/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DataAction = "EXPORT_ALL" | "PURGE" | "EXPORT_AND_PURGE";

export type PurgeScope =
  | "STUDENTS"
  | "STUDENTS_AND_UPLOADS"
  | "STUDENTS_PROJECTS_UPLOADS"
  | "REGISTRATIONS"
  | "PROJECTS"
  | "FACULTY"
  | "ALL";

export interface DataManagementOptions {
  action: DataAction;
  scope?: PurgeScope;
  academicYear?: string;
  confirmCode?: string;
}

export interface TableSnapshot {
  students: number;
  registrations: number;
  projects: number;
  faculty: number;
  artifacts: number;
  spocs: number;
  identities: number;
  otps: number;
  auditLogs: number;
}

export interface ExportResult {
  success: boolean;
  archiveKey: string;
  archiveUrl: string;
  snapshot: TableSnapshot;
  exportedAt: string;
  fileBuffer?: Buffer;
}

export interface PurgeResult {
  success: boolean;
  scope: PurgeScope;
  preSnapshot: TableSnapshot;
  deleted: Record<string, number>;
  r2FilesDeleted: number;
  purgedAt: string;
}

export interface ExportAndPurgeResult {
  export: ExportResult;
  purge: PurgeResult;
}

const CONFIRM_CODE = "PURGE_CONFIRMED";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function getTableSnapshot(): Promise<TableSnapshot> {
  const students = await prisma.student.count();
  const registrations = await prisma.registration.count();
  const projects = await prisma.project.count();
  const faculty = await prisma.faculty.count();
  const artifacts = await prisma.projectArtifact.count();
  const spocs = await prisma.spoc.count();
  const identities = await prisma.studentIdentity.count();
  const otps = await prisma.studentPhoneOtp.count();
  const auditLogs = await prisma.auditLog.count();

  return { students, registrations, projects, faculty, artifacts, spocs, identities, otps, auditLogs };
}

function getR2Bucket(): any | null {
  try {
    const ctx = getCloudflareContext();
    return (ctx?.env as any)?.ARTIFACTS ?? null;
  } catch {
    return null;
  }
}

// ─── EXPORT_ALL ──────────────────────────────────────────────────────────────

export async function exportAllTables(
  actorName: string,
  academicYearFilter?: string
): Promise<ExportResult> {
  const snapshot = await getTableSnapshot();

  const yearWhere = academicYearFilter && academicYearFilter !== "all"
    ? { academicYear: academicYearFilter }
    : {};

  // Fetch data sequentially to avoid SQLite/D1 connection deadlocks and runtime timeouts
  const students = await prisma.student.findMany({
    where: yearWhere,
    include: { registration: { include: { project: { select: { projectId: true, title: true } } } } },
    orderBy: { enrollmentNumber: "asc" },
  });

  const registrations = await prisma.registration.findMany({
    include: {
      student: { select: { enrollmentNumber: true, name: true, department: true } },
      project: { select: { projectId: true, title: true, department: true, faculty: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const projects = await prisma.project.findMany({
    ...(academicYearFilter && academicYearFilter !== "all" ? { where: { academicYear: academicYearFilter } } : {}),
    include: {
      faculty: { select: { name: true, email: true, department: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { projectId: "asc" },
  });

  const faculties = await prisma.faculty.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { name: "asc" },
  });

  const artifacts = await prisma.projectArtifact.findMany({
    include: { project: { select: { projectId: true, title: true } } },
    orderBy: { submittedAt: "asc" },
  });

  const spocs = await prisma.spoc.findMany({ orderBy: { department: "asc" } });
  const identities = await prisma.studentIdentity.findMany({ orderBy: { createdAt: "asc" } });
  const configs = await prisma.globalConfig.findMany();
  const deptLimits = await prisma.departmentRegistrationLimit.findMany({ orderBy: { department: "asc" } });
  const auditLogs = await prisma.auditLog.findMany({ orderBy: { timestamp: "desc" }, take: 100 });

  // Build XLSX workbook
  const wb = XLSX.utils.book_new();

  // Sheet: Students
  const studentRows = students.map((s, i) => ({
    "Sr.": i + 1,
    "Enrollment": s.enrollmentNumber,
    "Admission No.": s.admissionNumber || "",
    "Name": s.name,
    "Department": s.department,
    "Programme": s.programme || "",
    "Gender": s.gender || "",
    "Internal Marks": s.internalMarks ?? 0,
    "External Marks": s.externalMarks ?? 0,
    "Attendance %": s.attendancePercent ?? 100,
    "Semester": s.semester,
    "Batch": s.batch,
    "Academic Year": s.academicYear,
    "Email": s.email || "",
    "Phone": s.phone || "",
    "Phone Verified": s.phoneVerified ? "Yes" : "No",
    "Registered": s.registration ? "Yes" : "No",
    "Project Code": s.registration?.project?.projectId || "",
    "Project Title": s.registration?.project?.title || "",
    "Created At": s.createdAt?.toISOString?.() || "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentRows), "Students");

  // Sheet: Registrations
  const regRows = registrations.map((r, i) => ({
    "Sr.": i + 1,
    "Student Enrollment": r.student.enrollmentNumber,
    "Student Name": r.student.name,
    "Student Department": r.student.department,
    "Project Code": r.project.projectId,
    "Project Title": r.project.title,
    "Project Department": r.project.department,
    "Faculty Mentor": r.project.faculty.name,
    "Faculty Email": r.project.faculty.email,
    "Status": r.status,
    "Registered At": r.createdAt?.toISOString?.() || "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(regRows), "Registrations");

  // Sheet: Projects
  const projRows = projects.map((p, i) => ({
    "Sr.": i + 1,
    "Project ID": p.projectId,
    "Title": p.title,
    "Description": p.description || "",
    "Department": p.department,
    "Category": p.category,
    "Theme": p.theme,
    "SDG Mapping": p.sdgMapping || "",
    "Academic Year": p.academicYear,
    "Semester": p.semester,
    "Faculty Name": p.faculty.name,
    "Faculty Email": p.faculty.email,
    "Faculty Department": p.faculty.department,
    "Seats Filled": p._count.registrations,
    "Max Seats": p.maxSeats || "",
    "Submission Status": p.submissionStatus,
    "SPOC Review Note": p.spocReviewNote || "",
    "Reviewed At": p.reviewedAt?.toISOString?.() || "",
    "Manuscript in Draft": (p.draftManuscriptUrl || (p as any).hasDraftManuscript) ? "Yes" : "No",
    "Manuscript Communicated": p.hasCommunicatedManuscript ? "Yes" : "No",
    "Journal Name": p.journalName || "",
    "Avishkar Affiliation (Draft)": p.avishkarAffiliationCommunicated ? "Confirmed" : "No",
    "Draft Manuscript URL": p.draftManuscriptUrl || "",
    "Plagiarism Summary (3-5 pp) URL": p.manuscriptPlagiarismUrl || "",
    "Turnitin Similarity %": p.manuscriptSimilarityPercent ?? "",
    "AI Content %": p.manuscriptAiPercent ?? "",
    "Manuscript Published": p.isManuscriptPublished ? "Yes" : "No",
    "Publication DOI": p.publicationDoi || "",
    "Avishkar Affiliation (Published)": p.avishkarAffiliationPublished ? "Confirmed" : "No",
    "Published Paper URL": p.publishedManuscriptUrl || "",
    "Created At": p.createdAt?.toISOString?.() || "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projRows), "Projects");

  // Sheet: Faculty
  const facRows = faculties.map((f, i) => ({
    "Sr.": i + 1,
    "Name": f.name,
    "Email": f.email,
    "Department": f.department,
    "Phone": f.phone || "",
    "Is Admin": f.isAdmin ? "Yes" : "No",
    "Is SPOC": f.isSpoc ? "Yes" : "No",
    "SPOC Department": f.spocDepartment || "",
    "Total Projects": f._count.projects,
    "Created At": f.createdAt?.toISOString?.() || "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(facRows), "Faculty");

  // Sheet: Artifacts
  if (artifacts.length > 0) {
    const artRows = artifacts.map((a, i) => ({
      "Sr.": i + 1,
      "Project Code": a.project.projectId,
      "Project Title": a.project.title,
      "Type": a.type,
      "Title": a.title,
      "File Name": a.fileName,
      "File Size": a.fileSize || 0,
      "MIME Type": a.mimeType || "",
      "Academic Year": a.academicYear,
      "Semester": a.semester,
      "Similarity %": a.similarityPercent ?? "",
      "AI %": a.aiPercent ?? "",
      "Status": a.status,
      "SPOC Note": a.spocNote || "",
      "Submitted At": a.submittedAt?.toISOString?.() || "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(artRows), "Artifacts");
  }

  // Sheet: SPOCs
  if (spocs.length > 0) {
    const spocRows = spocs.map((s, i) => ({
      "Sr.": i + 1,
      "Name": s.name,
      "Email": s.email,
      "Department": s.department,
      "Created At": s.createdAt?.toISOString?.() || "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(spocRows), "SPOCs");
  }

  // Sheet: Config
  const configRows = configs.map((c) => ({
    "Registration Open": c.registrationOpen ? "Yes" : "No",
    "SMS OTP Enabled": c.smsOtpEnabled ? "Yes" : "No",
    "Max Seats": c.maxSeats,
    "Same Dept Limit": c.sameDeptLimit,
    "Other Dept Limit": c.otherDeptLimit,
    "Active Academic Year": c.activeAcademicYear,
    "Active Semester": c.activeSemester,
  }));
  if (configRows.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(configRows), "Config");
  }

  // Sheet: Department Limits
  if (deptLimits.length > 0) {
    const limRows = deptLimits.map((d, i) => ({
      "Sr.": i + 1,
      "Department": d.department,
      "Same Dept Limit": d.sameDeptLimit,
      "Other Dept Limit": d.otherDeptLimit,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(limRows), "Dept Limits");
  }

  // Sheet: Metadata
  const metaRows = [{
    "Exported By": actorName,
    "Exported At": new Date().toISOString(),
    "Academic Year Filter": academicYearFilter || "ALL",
    "Students": snapshot.students,
    "Registrations": snapshot.registrations,
    "Projects": snapshot.projects,
    "Faculty": snapshot.faculty,
    "Artifacts": snapshot.artifacts,
    "SPOCs": snapshot.spocs,
    "Audit Logs (capped 100)": auditLogs.length,
  }];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metaRows), "_Metadata");

  // Generate buffer
  const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  // Upload to R2
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-").split("T");
  const archiveKey = `archives/${dateStr[0]}_${dateStr[1].slice(0, 8)}_full_export.xlsx`;

  const r2 = getR2Bucket();
  if (r2) {
    await r2.put(archiveKey, xlsxBuffer, {
      httpMetadata: {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      customMetadata: {
        exportedBy: actorName,
        exportedAt: now.toISOString(),
        recordCounts: JSON.stringify(snapshot),
      },
    });
  } else {
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "archives");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(process.cwd(), "public", "uploads", archiveKey), xlsxBuffer);
    } catch {
      // Local write best-effort
    }
  }

  const archiveUrl = `/api/artifacts/${encodeURIComponent(archiveKey)}`;

  // Audit
  await prisma.auditLog.create({
    data: {
      actor: actorName,
      actorRole: "ADMIN",
      action: "EXPORT_ALL_DATA",
      metadata: JSON.stringify({
        archiveKey,
        snapshot,
        academicYearFilter: academicYearFilter || "ALL",
      }),
    },
  });

  return {
    success: true,
    archiveKey,
    archiveUrl,
    snapshot,
    exportedAt: now.toISOString(),
    fileBuffer: xlsxBuffer,
  };
}

// ─── PURGE ───────────────────────────────────────────────────────────────────

export async function purgeData(
  scope: PurgeScope,
  actorName: string,
  confirmCode: string,
  academicYearFilter?: string
): Promise<PurgeResult> {
  if (confirmCode !== CONFIRM_CODE && confirmCode !== "WIPE_AND_EXPORT") {
    throw new Error(`Safety check failed. Send confirmCode: "${CONFIRM_CODE}" or "WIPE_AND_EXPORT" to proceed.`);
  }

  const preSnapshot = await getTableSnapshot();
  const deleted: Record<string, number> = {};
  let r2FilesDeleted = 0;
  const r2 = getR2Bucket();

  const yearWhere = academicYearFilter && academicYearFilter !== "all"
    ? { academicYear: academicYearFilter }
    : undefined;

  // Pre-purge audit
  await prisma.auditLog.create({
    data: {
      actor: actorName,
      actorRole: "ADMIN",
      action: "PURGE_INITIATED",
      metadata: JSON.stringify({ scope, academicYearFilter: academicYearFilter || "ALL", preSnapshot }),
    },
  });

  // Delete R2 and local disk artifact files for relevant scopes
  async function deleteArtifactFiles(artifactWhere?: any) {
    const artifacts = await prisma.projectArtifact.findMany({
      where: artifactWhere,
      select: { fileName: true, plagiarismReportFileName: true },
    });

    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    // Gather all file keys
    const keysToDelete: string[] = [];
    for (const a of artifacts) {
      if (a.fileName) keysToDelete.push(a.fileName);
      if (a.plagiarismReportFileName) keysToDelete.push(a.plagiarismReportFileName);
    }

    // Also clean any project-level manuscript uploads
    const projectsWithFiles = await prisma.project.findMany({
      where: artifactWhere ? { academicYear: artifactWhere.project?.academicYear } : undefined,
      select: {
        draftManuscriptFileName: true,
        publishedManuscriptFileName: true,
        manuscriptPlagiarismFileName: true,
      },
    });

    for (const p of projectsWithFiles) {
      if (p.draftManuscriptFileName) keysToDelete.push(p.draftManuscriptFileName);
      if (p.publishedManuscriptFileName) keysToDelete.push(p.publishedManuscriptFileName);
      if (p.manuscriptPlagiarismFileName) keysToDelete.push(p.manuscriptPlagiarismFileName);
    }

    if (keysToDelete.length > 0) {
      if (r2) {
        // Chunk R2 deletes into batches to avoid exceeding subrequest limits
        for (let i = 0; i < keysToDelete.length; i += 50) {
          const chunk = keysToDelete.slice(i, i + 50);
          try {
            await r2.delete(chunk);
            r2FilesDeleted += chunk.length;
          } catch {
            for (const fn of chunk) {
              try { await r2.delete(fn); r2FilesDeleted++; } catch {}
            }
          }
        }
      }

      if (!r2 && process.env.NODE_ENV !== "production") {
        for (const fn of keysToDelete) {
          try {
            const lp = path.join(uploadsDir, fn);
            if (fs.existsSync(lp)) {
              fs.unlinkSync(lp);
              r2FilesDeleted++;
            }
          } catch {}
        }
      }
    }

    return artifacts.length;
  }

  // Cascade-aware deletion per scope
  if (
    scope === "STUDENTS_AND_UPLOADS" ||
    scope === "STUDENTS_PROJECTS_UPLOADS" ||
    scope === "STUDENTS" ||
    scope === "ALL"
  ) {
    const studentWhere = yearWhere ? { student: yearWhere } : undefined;
    const studentDirectWhere = yearWhere || undefined;

    // OTPs & Identities
    if (studentDirectWhere) {
      const students = await prisma.student.findMany({ where: studentDirectWhere, select: { id: true } });
      const studentIds = students.map((s) => s.id);
      if (studentIds.length > 0) {
        let otpCount = 0;
        let idCount = 0;
        for (let i = 0; i < studentIds.length; i += 400) {
          const chunk = studentIds.slice(i, i + 400);
          const otpDel = await prisma.studentPhoneOtp.deleteMany({ where: { studentId: { in: chunk } } });
          otpCount += otpDel.count;
          const idDel = await prisma.studentIdentity.deleteMany({ where: { studentId: { in: chunk } } });
          idCount += idDel.count;
        }
        deleted.studentPhoneOtps = otpCount;
        deleted.studentIdentities = idCount;
      }
    } else {
      const otpDel = await prisma.studentPhoneOtp.deleteMany();
      deleted.studentPhoneOtps = otpDel.count;
      const idDel = await prisma.studentIdentity.deleteMany();
      deleted.studentIdentities = idDel.count;
    }

    // Registrations (Cascades from Student, but explicit for accurate count)
    const regDel = await prisma.registration.deleteMany({ where: studentWhere });
    deleted.registrations = regDel.count;

    // Students
    const stuDel = await prisma.student.deleteMany({ where: studentDirectWhere });
    deleted.students = stuDel.count;
  }

  if (scope === "REGISTRATIONS") {
    const regWhere = yearWhere
      ? { project: { academicYear: yearWhere.academicYear } }
      : undefined;
    const regDel = await prisma.registration.deleteMany({ where: regWhere });
    deleted.registrations = regDel.count;
  }

  // Uploads/Artifacts deletion for STUDENTS_AND_UPLOADS (Keeps Projects)
  if (scope === "STUDENTS_AND_UPLOADS") {
    const projectWhere = yearWhere || undefined;
    const artifactFileWhere = projectWhere
      ? { academicYear: projectWhere.academicYear }
      : undefined;

    await deleteArtifactFiles(artifactFileWhere);
    const artDel = await prisma.projectArtifact.deleteMany({ where: artifactFileWhere });
    deleted.artifacts = artDel.count;

    // Reset project submission status and clear manuscript URLs
    await prisma.project.updateMany({
      where: projectWhere,
      data: {
        submissionStatus: "NOT_SUBMITTED",
        spocReviewNote: null,
        reviewedAt: null,
        draftManuscriptUrl: null,
        draftManuscriptFileName: null,
        manuscriptPlagiarismUrl: null,
        manuscriptPlagiarismFileName: null,
        publishedManuscriptUrl: null,
        publishedManuscriptFileName: null,
        hasCommunicatedManuscript: false,
        isManuscriptPublished: false,
      },
    });
  }

  // Projects deletion for PROJECTS, STUDENTS_PROJECTS_UPLOADS, or ALL
  if (scope === "PROJECTS" || scope === "STUDENTS_PROJECTS_UPLOADS" || scope === "ALL") {
    const projectWhere = yearWhere || undefined;

    // Delete R2 and disk files first
    const artifactFileWhere = projectWhere
      ? { academicYear: projectWhere.academicYear }
      : undefined;
    await deleteArtifactFiles(artifactFileWhere);

    // Artifacts
    const artDel = await prisma.projectArtifact.deleteMany({ where: artifactFileWhere });
    deleted.artifacts = (deleted.artifacts || 0) + artDel.count;

    // Registrations under these projects (if not already deleted by STUDENTS scope)
    if (scope === "PROJECTS") {
      const regDel = await prisma.registration.deleteMany({
        where: projectWhere ? { project: { academicYear: projectWhere.academicYear } } : undefined,
      });
      deleted.registrations = (deleted.registrations || 0) + regDel.count;
    }

    // Projects
    const projDel = await prisma.project.deleteMany({ where: projectWhere });
    deleted.projects = projDel.count;
  }

  if (scope === "FACULTY" || scope === "ALL") {
    // SPOCs
    const spocDel = await prisma.spoc.deleteMany();
    deleted.spocs = spocDel.count;

    // Faculty (Projects cascade via onDelete: Cascade on Faculty)
    if (scope === "FACULTY") {
      // Delete artifacts first since projects will cascade
      await deleteArtifactFiles();
      const artDel = await prisma.projectArtifact.deleteMany();
      deleted.artifacts = (deleted.artifacts || 0) + artDel.count;
      // Registrations will cascade when projects are deleted
      const regDel = await prisma.registration.deleteMany();
      deleted.registrations = (deleted.registrations || 0) + regDel.count;
      const projDel = await prisma.project.deleteMany();
      deleted.projects = (deleted.projects || 0) + projDel.count;
    }

    const facDel = await prisma.faculty.deleteMany();
    deleted.faculty = facDel.count;
  }

  // Post-purge audit
  await prisma.auditLog.create({
    data: {
      actor: actorName,
      actorRole: "ADMIN",
      action: "PURGE_COMPLETED",
      metadata: JSON.stringify({ scope, academicYearFilter: academicYearFilter || "ALL", deleted, r2FilesDeleted }),
    },
  });

  return {
    success: true,
    scope,
    preSnapshot,
    deleted,
    r2FilesDeleted,
    purgedAt: new Date().toISOString(),
  };
}

// ─── EXPORT_AND_PURGE (Atomic) ───────────────────────────────────────────────

export async function exportAndPurge(
  scope: PurgeScope,
  actorName: string,
  confirmCode: string,
  academicYearFilter?: string
): Promise<ExportAndPurgeResult> {
  // Step 1: Export
  const exportResult = await exportAllTables(actorName, academicYearFilter);

  if (!exportResult.success) {
    throw new Error("Export failed — purge aborted. No data was deleted.");
  }

  // Step 2: Verify archive exists in R2
  const r2 = getR2Bucket();
  if (r2) {
    const head = await r2.head(exportResult.archiveKey);
    if (!head) {
      throw new Error(
        `Archive verification failed — R2 object "${exportResult.archiveKey}" not found after upload. Purge aborted.`
      );
    }
  }

  // Step 3: Purge
  const purgeResult = await purgeData(scope, actorName, confirmCode, academicYearFilter);

  // Step 4: Final audit linking both operations
  await prisma.auditLog.create({
    data: {
      actor: actorName,
      actorRole: "ADMIN",
      action: "EXPORT_AND_PURGE_COMPLETED",
      metadata: JSON.stringify({
        archiveKey: exportResult.archiveKey,
        purgeScope: scope,
        purgeDeleted: purgeResult.deleted,
      }),
    },
  });

  return { export: exportResult, purge: purgeResult };
}
