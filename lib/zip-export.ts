import JSZip from "jszip";

export interface ProjectExportData {
  id?: string;
  projectId: string;
  title: string;
  department?: string;
  category?: string;
  theme?: string;
  submissionStatus?: string;
  faculty?: {
    name?: string;
    email?: string;
    department?: string;
  };
  artifacts?: Array<{
    id?: string;
    type: string;
    title: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    semester?: number | null;
    similarityPercent?: number | null;
    aiPercent?: number | null;
    plagiarismReportFileName?: string | null;
    plagiarismReportUrl?: string | null;
    status?: string;
  }>;
  hasDraftManuscript?: boolean | null;
  hasCommunicatedManuscript?: boolean | null;
  draftManuscriptUrl?: string | null;
  draftManuscriptFileName?: string | null;
  journalName?: string | null;
  isManuscriptPublished?: boolean | null;
  publicationDoi?: string | null;
  publishedManuscriptUrl?: string | null;
  publishedManuscriptFileName?: string | null;
  manuscriptPlagiarismUrl?: string | null;
  manuscriptPlagiarismFileName?: string | null;
  manuscriptSimilarityPercent?: number | null;
  students?: Array<{
    enrollment?: string;
    enrollmentNumber?: string;
    name: string;
    department?: string;
    programme?: string;
    semester?: number;
    batch?: string;
    attendancePercent?: number | null;
    internalMarks?: number | null;
    externalMarks?: number | null;
  }>;
}

export interface ProgressInfo {
  current: number;
  total: number;
  percent: number;
  message: string;
}

function sanitizeFolderName(str: string): string {
  return str
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function sanitizeFileName(str: string): string {
  const clean = str.replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, " ").trim();
  return clean.length > 0 ? clean : "file";
}

function extractFileBasename(filePathOrUrl: string): string {
  const withoutQuery = filePathOrUrl.split("?")[0];
  const lastPart = withoutQuery.split("/").pop() || "document";
  // Remove numeric timestamp prefix like "1712345678_report.pdf" -> "report.pdf"
  return lastPart.replace(/^\d+(_(sem\d+|draft|published|plag)_)?/, "");
}

function generateStudentsCsv(
  students: ProjectExportData["students"] = [],
  project?: { projectId: string; title: string; facultyName?: string }
): string {
  const headers = [
    "Sr. No",
    ...(project ? ["Project ID", "Project Title", "Faculty Mentor"] : []),
    "Enrollment Number",
    "Student Name",
    "Department",
    "Programme",
    "Semester",
    "Batch",
    "Attendance (%)",
    "Internal Marks (/50)",
    "External Marks (/50)",
    "Total Marks (/100)",
    "Marks Status",
  ];

  const rows = students.map((s, idx) => {
    const hasInt = s.internalMarks !== null && s.internalMarks !== undefined;
    const hasExt = s.externalMarks !== null && s.externalMarks !== undefined;
    const isSubmitted = hasInt || hasExt;
    const intMarks = s.internalMarks ?? 0;
    const extMarks = s.externalMarks ?? 0;
    const totMarks = intMarks + extMarks;
    return [
      idx + 1,
      ...(project
        ? [
            `"${project.projectId}"`,
            `"${project.title.replace(/"/g, '""')}"`,
            `"${(project.facultyName || "").replace(/"/g, '""')}"`,
          ]
        : []),
      `"${s.enrollment || s.enrollmentNumber || ""}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.department || "").replace(/"/g, '""')}"`,
      `"${(s.programme || "").replace(/"/g, '""')}"`,
      s.semester ?? "",
      `"${s.batch || ""}"`,
      s.attendancePercent !== undefined && s.attendancePercent !== null
        ? `${s.attendancePercent}%`
        : "N/A",
      hasInt ? intMarks : "Pending",
      hasExt ? extMarks : "Pending",
      isSubmitted ? totMarks : "Pending",
      isSubmitted ? "Submitted" : "Pending",
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

async function fetchFileBlob(url: string, signal?: AbortSignal): Promise<Blob | null> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return await res.blob();
  } catch (err: any) {
    if (signal?.aborted) throw err;
    return null;
  }
}

interface FileDownloadTask {
  url: string;
  folderPath: string[];
  suggestedName: string;
  projectCode: string;
  label: string;
}

function collectProjectTasks(
  proj: ProjectExportData,
  rootPrefix: string[] = []
): { tasks: FileDownloadTask[]; textFiles: Array<{ folderPath: string[]; name: string; content: string }> } {
  const tasks: FileDownloadTask[] = [];
  const textFiles: Array<{ folderPath: string[]; name: string; content: string }> = [];

  const projFolder = [...rootPrefix];

  // 1. Process Artifacts (Reports, PPTs, Plagiarism files)
  const artifacts = proj.artifacts || [];
  artifacts.forEach((art, idx) => {
    const semName = art.semester === 2 ? "Semester 2" : art.semester === 1 ? "Semester 1" : "General Artifacts";
    const semFolder = [...projFolder, semName];

    // Primary File
    if (art.fileUrl) {
      const base = extractFileBasename(art.fileName || art.fileUrl);
      const typeLabel = art.type === "REPORT" ? "Report" : art.type === "PPT" ? "Presentation" : "Document";
      const fileName = sanitizeFileName(`${typeLabel}_${idx + 1}_${base}`);
      tasks.push({
        url: art.fileUrl,
        folderPath: semFolder,
        suggestedName: fileName,
        projectCode: proj.projectId,
        label: `${proj.projectId} - ${art.title || typeLabel}`,
      });
    }

    // Plagiarism Report File
    if (art.plagiarismReportUrl) {
      const plagBase = extractFileBasename(art.plagiarismReportFileName || art.plagiarismReportUrl);
      const plagFileName = sanitizeFileName(`Plagiarism_Report_${idx + 1}_${plagBase}`);
      tasks.push({
        url: art.plagiarismReportUrl,
        folderPath: [...projFolder, "Plagiarism Reports"],
        suggestedName: plagFileName,
        projectCode: proj.projectId,
        label: `${proj.projectId} - Turnitin Report`,
      });
    }
  });

  // 2. Process Research Manuscript & Publication
  const hasManuscript =
    proj.hasCommunicatedManuscript ||
    proj.isManuscriptPublished ||
    proj.draftManuscriptUrl ||
    proj.publishedManuscriptUrl;

  if (hasManuscript) {
    const msFolder = [...projFolder, "Research Manuscript"];

    if (proj.draftManuscriptUrl) {
      const base = extractFileBasename(proj.draftManuscriptFileName || proj.draftManuscriptUrl);
      tasks.push({
        url: proj.draftManuscriptUrl,
        folderPath: msFolder,
        suggestedName: sanitizeFileName(`Draft_Manuscript_${base}`),
        projectCode: proj.projectId,
        label: `${proj.projectId} - Draft Manuscript`,
      });
    }

    if (proj.publishedManuscriptUrl) {
      const base = extractFileBasename(proj.publishedManuscriptFileName || proj.publishedManuscriptUrl);
      tasks.push({
        url: proj.publishedManuscriptUrl,
        folderPath: msFolder,
        suggestedName: sanitizeFileName(`Published_Paper_${base}`),
        projectCode: proj.projectId,
        label: `${proj.projectId} - Published Paper`,
      });
    }

    if (proj.manuscriptPlagiarismUrl) {
      const base = extractFileBasename(proj.manuscriptPlagiarismFileName || proj.manuscriptPlagiarismUrl);
      tasks.push({
        url: proj.manuscriptPlagiarismUrl,
        folderPath: msFolder,
        suggestedName: sanitizeFileName(`Manuscript_Plagiarism_Report_${base}`),
        projectCode: proj.projectId,
        label: `${proj.projectId} - Manuscript Plagiarism Report`,
      });
    }

    const pubMeta = [
      `PROJECT: ${proj.projectId} - ${proj.title}`,
      `FACULTY MENTOR: ${proj.faculty?.name || "N/A"} (${proj.faculty?.email || ""})`,
      `COMMUNICATED MANUSCRIPT: ${proj.hasCommunicatedManuscript ? "YES" : "NO"}`,
      `TARGET JOURNAL: ${proj.journalName || "N/A"}`,
      `AVISHKAR AFFILIATION (COMMUNICATED): CONFIRMED`,
      `PUBLICATION STATUS: ${proj.isManuscriptPublished ? "PUBLISHED / IN-PRINT" : "PENDING"}`,
      `DOI: ${proj.publicationDoi || "N/A"}`,
      `SIMILARITY PERCENTAGE: ${proj.manuscriptSimilarityPercent ?? "N/A"}%`,
    ].join("\n");

    textFiles.push({
      folderPath: msFolder,
      name: "Publication_Details.txt",
      content: pubMeta,
    });
  }

  // 3. Project Summary & Enrolled Students CSV
  const summaryContent = [
    `========================================================================`,
    `G.D. GOENKA UNIVERSITY - INTER-DISCIPLINARY PROJECT (IDP) PORTAL`,
    `PROJECT DOSSIER`,
    `========================================================================`,
    `Project Code:       ${proj.projectId}`,
    `Title:              ${proj.title}`,
    `Department:         ${proj.department || "N/A"}`,
    `Category:           ${proj.category || "N/A"}`,
    `Theme:              ${proj.theme || "N/A"}`,
    `Faculty Mentor:     ${proj.faculty?.name || "N/A"} <${proj.faculty?.email || ""}>`,
    `Submission Status:  ${proj.submissionStatus || "NOT_SUBMITTED"}`,
    `Enrolled Students:  ${(proj.students || []).length}`,
    `Uploaded Files:     ${artifacts.length}`,
    `Export Timestamp:   ${new Date().toLocaleString()}`,
    `========================================================================`,
  ].join("\n");

  textFiles.push({
    folderPath: projFolder,
    name: "Project_Dossier.txt",
    content: summaryContent,
  });

  if (proj.students && proj.students.length > 0) {
    const csvContent = generateStudentsCsv(proj.students, {
      projectId: proj.projectId,
      title: proj.title,
      facultyName: proj.faculty?.name,
    });
    textFiles.push({
      folderPath: projFolder,
      name: "Enrolled_Students_and_Marks.csv",
      content: csvContent,
    });
  }

  return { tasks, textFiles };
}

function resolveZipFolder(zip: JSZip, folderPath: string[]): JSZip {
  let curr = zip;
  for (const part of folderPath) {
    if (part) curr = curr.folder(part)!;
  }
  return curr;
}

/**
 * Download all submitted files for a SINGLE project into a cleanly organized ZIP archive.
 */
export async function downloadSingleProjectZip(
  project: ProjectExportData,
  options?: {
    onProgress?: (info: ProgressInfo) => void;
    signal?: AbortSignal;
  }
): Promise<void> {
  const zip = new JSZip();
  const cleanTitle = sanitizeFolderName(project.title);
  const archiveName = `${project.projectId}_${cleanTitle}_Files`;

  const { tasks, textFiles } = collectProjectTasks(project, []);

  // Write text files immediately
  for (const tf of textFiles) {
    const f = resolveZipFolder(zip, tf.folderPath);
    f.file(tf.name, tf.content);
  }

  const totalTasks = tasks.length;
  let downloadedCount = 0;

  options?.onProgress?.({
    current: 0,
    total: totalTasks,
    percent: 0,
    message: totalTasks === 0 ? "Packaging dossier..." : `Starting download (0 / ${totalTasks})...`,
  });

  // Download files sequentially with progress
  for (let i = 0; i < tasks.length; i++) {
    if (options?.signal?.aborted) throw new Error("Download cancelled by user.");
    const task = tasks[i];

    options?.onProgress?.({
      current: i,
      total: totalTasks,
      percent: Math.round((i / (totalTasks || 1)) * 90),
      message: `Fetching ${task.label}... (${i + 1}/${totalTasks})`,
    });

    const blob = await fetchFileBlob(task.url, options?.signal);
    const folder = resolveZipFolder(zip, task.folderPath);

    if (blob) {
      folder.file(task.suggestedName, blob);
      downloadedCount++;
    } else {
      folder.file(
        `UNAVAILABLE_${task.suggestedName}.txt`,
        `The file at ${task.url} was unavailable or could not be loaded.`
      );
    }
  }

  options?.onProgress?.({
    current: totalTasks,
    total: totalTasks,
    percent: 92,
    message: "Compressing archive (.zip)...",
  });

  const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
    options?.onProgress?.({
      current: totalTasks,
      total: totalTasks,
      percent: 90 + Math.round(metadata.percent * 0.1),
      message: `Compressing archive (${Math.round(metadata.percent)}%)...`,
    });
  });

  triggerBrowserDownload(zipBlob, `${archiveName}.zip`);

  options?.onProgress?.({
    current: totalTasks,
    total: totalTasks,
    percent: 100,
    message: `Download ready! (${downloadedCount} files bundled)`,
  });
}

/**
 * Download all submitted files across MULTIPLE projects (Department SPOC or University Admin)
 * into a hierarchical, cleanly structured archive.
 */
export async function downloadMultipleProjectsZip(
  projects: ProjectExportData[],
  options: {
    archiveName: string;
    groupByDepartment?: boolean;
    onProgress?: (info: ProgressInfo) => void;
    signal?: AbortSignal;
  }
): Promise<{ totalFiles: number; totalProjects: number }> {
  const zip = new JSZip();
  const allTasks: FileDownloadTask[] = [];
  const allTextFiles: Array<{ folderPath: string[]; name: string; content: string }> = [];
  const allStudentsMasterList: Array<any> = [];

  // Group and structure
  projects.forEach((proj) => {
    const deptFolder = options.groupByDepartment !== false ? sanitizeFolderName(proj.department || "General") : "";
    const projFolder = `${proj.projectId} - ${sanitizeFolderName(proj.title)}`;
    const rootPrefix = deptFolder ? [deptFolder, projFolder] : [projFolder];

    const { tasks, textFiles } = collectProjectTasks(proj, rootPrefix);
    allTasks.push(...tasks);
    allTextFiles.push(...textFiles);

    if (proj.students) {
      proj.students.forEach((s) => {
        allStudentsMasterList.push({
          ...s,
          projectId: proj.projectId,
          projectTitle: proj.title,
          facultyMentor: proj.faculty?.name || "N/A",
        });
      });
    }
  });

  // Write all generated project text files & dossier CSVs
  for (const tf of allTextFiles) {
    const f = resolveZipFolder(zip, tf.folderPath);
    f.file(tf.name, tf.content);
  }

  // Create Root Master Students Sheet
  if (allStudentsMasterList.length > 0) {
    const masterCsv = generateStudentsCsv(allStudentsMasterList);
    zip.file("ALL_STUDENTS_MASTER_MARKS.csv", masterCsv);
  }

  // Create Root MANIFEST
  const manifest = [
    `========================================================================`,
    `G.D. GOENKA UNIVERSITY - IDP PORTAL SUBMISSION REPOSITORY`,
    `ORGANIZED SUBMISSIONS ARCHIVE`,
    `========================================================================`,
    `Archive Name:       ${options.archiveName}`,
    `Generated On:       ${new Date().toLocaleString()}`,
    `Total Projects:     ${projects.length}`,
    `Total Enrolled:     ${allStudentsMasterList.length}`,
    `Total Files:        ${allTasks.length}`,
    `========================================================================`,
    ``,
    `PROJECT DIRECTORY INDEX:`,
    ...projects.map(
      (p, i) =>
        `[${i + 1}] ${p.projectId} | ${p.title} | ${p.department || ""} | Mentor: ${p.faculty?.name || "N/A"} (${(p.artifacts || []).length} files)`
    ),
  ].join("\n");
  zip.file("README_MANIFEST.txt", manifest);

  const totalTasks = allTasks.length;
  let downloadedCount = 0;

  options?.onProgress?.({
    current: 0,
    total: totalTasks,
    percent: 0,
    message: totalTasks === 0 ? "Building project dossiers..." : `Starting download (0 / ${totalTasks})...`,
  });

  // Download files sequentially with progress updates
  for (let i = 0; i < allTasks.length; i++) {
    if (options?.signal?.aborted) throw new Error("Download cancelled by user.");
    const task = allTasks[i];

    options?.onProgress?.({
      current: i,
      total: totalTasks,
      percent: Math.round((i / (totalTasks || 1)) * 90),
      message: `Downloading (${i + 1}/${totalTasks}): ${task.label}`,
    });

    const blob = await fetchFileBlob(task.url, options?.signal);
    const folder = resolveZipFolder(zip, task.folderPath);

    if (blob) {
      folder.file(task.suggestedName, blob);
      downloadedCount++;
    } else {
      folder.file(
        `UNAVAILABLE_${task.suggestedName}.txt`,
        `The file at ${task.url} was unavailable or could not be loaded.`
      );
    }
  }

  options?.onProgress?.({
    current: totalTasks,
    total: totalTasks,
    percent: 92,
    message: "Generating compressed archive (.zip)... This may take a few seconds.",
  });

  const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
    options?.onProgress?.({
      current: totalTasks,
      total: totalTasks,
      percent: 90 + Math.round(metadata.percent * 0.1),
      message: `Compressing archive (${Math.round(metadata.percent)}%)...`,
    });
  });

  triggerBrowserDownload(zipBlob, `${options.archiveName}.zip`);

  options?.onProgress?.({
    current: totalTasks,
    total: totalTasks,
    percent: 100,
    message: `Complete! Bundled ${downloadedCount} submitted files across ${projects.length} projects.`,
  });

  return { totalFiles: downloadedCount, totalProjects: projects.length };
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
