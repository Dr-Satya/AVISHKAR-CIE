"use client";

import React from "react";
import {
  X,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Archive,
  Layers,
} from "lucide-react";

interface ArtifactItem {
  id: string;
  type: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  semester?: number | null;
  academicYear?: string | null;
  similarityPercent?: number | null;
  aiPercent?: number | null;
  plagiarismReportUrl?: string | null;
  plagiarismReportFileName?: string | null;
  status?: string;
  spocNote?: string | null;
  submittedAt?: string;
}

interface ProjectFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    projectId: string;
    title: string;
    department?: string;
    semester?: number;
    academicYear?: string;
    submissionStatus?: string;
    faculty?: {
      name: string;
      email?: string;
      department?: string;
      phone?: string;
    };
    artifacts?: ArtifactItem[];
    // Research manuscript fields
    hasDraftManuscript?: boolean;
    hasCommunicatedManuscript?: boolean;
    draftManuscriptUrl?: string | null;
    draftManuscriptFileName?: string | null;
    journalName?: string | null;
    isManuscriptPublished?: boolean;
    publicationDoi?: string | null;
    publishedManuscriptUrl?: string | null;
    publishedManuscriptFileName?: string | null;
    manuscriptPlagiarismUrl?: string | null;
    manuscriptPlagiarismFileName?: string | null;
    manuscriptSimilarityPercent?: number | null;
    manuscriptAiPercent?: number | null;
  } | null;
  onDownloadZip?: (project: any) => void;
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFilesModal({
  isOpen,
  onClose,
  project,
  onDownloadZip,
}: ProjectFilesModalProps) {
  if (!isOpen || !project) return null;

  const artifacts = project.artifacts || [];
  const hasManuscripts = Boolean(
    project.draftManuscriptUrl ||
      project.publishedManuscriptUrl ||
      project.manuscriptPlagiarismUrl ||
      project.hasDraftManuscript ||
      project.hasCommunicatedManuscript ||
      project.isManuscriptPublished
  );

  const totalFilesCount =
    artifacts.length +
    (project.draftManuscriptUrl ? 1 : 0) +
    (project.publishedManuscriptUrl ? 1 : 0) +
    (project.manuscriptPlagiarismUrl ? 1 : 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="files-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#0a192f] text-white flex items-start justify-between gap-4 border-b border-[#c59b27]/30">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#c59b27] text-[#0a192f]">
                {project.projectId}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {project.department || "IDP Capstone Project"}
              </span>
              {project.submissionStatus && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    project.submissionStatus === "APPROVED"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : project.submissionStatus === "REJECTED"
                      ? "bg-red-500/20 text-red-300 border border-red-500/40"
                      : project.submissionStatus === "PENDING"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-white/10 text-slate-300 border border-white/15"
                  }`}
                >
                  Status: {project.submissionStatus}
                </span>
              )}
            </div>
            <h3
              id="files-modal-title"
              className="text-base sm:text-lg font-bold text-white truncate max-w-xl"
              title={project.title}
            >
              {project.title}
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-1.5">
              <span>Faculty Mentor:</span>
              <strong className="text-white font-semibold">
                {project.faculty?.name || "Not Assigned"}
              </strong>
              {project.faculty?.email && (
                <span className="text-slate-400 font-mono text-[11px]">
                  ({project.faculty.email})
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar & Quick Stats */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="font-bold">Total Uploaded Deliverables:</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[11px]">
              {totalFilesCount} file{totalFilesCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onDownloadZip && totalFilesCount > 0 && (
              <button
                type="button"
                onClick={() => onDownloadZip(project)}
                className="px-3 py-1.5 rounded-xl bg-[#0d2137] hover:bg-[#16365c] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                title="Download all submission files packaged as a ZIP archive"
              >
                <Archive className="w-3.5 h-3.5 text-[#cda34f]" />
                <span>Download All (.zip)</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 max-h-[calc(92vh-160px)]">
          {/* 1. PROJECT ARTIFACTS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Submitted Project Deliverables ({artifacts.length})</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Reports · Presentations · Consent Forms
              </span>
            </div>

            {artifacts.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center bg-slate-50/50 space-y-2">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  No deliverables or reports submitted yet.
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  The faculty mentor has not uploaded any files for this project. Once uploaded, documents will appear here with direct download links.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {artifacts.map((art) => (
                  <div
                    key={art.id}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              art.type === "CONSENT_FORM"
                                ? "bg-teal-100 text-teal-800 border border-teal-200"
                                : art.type === "REPORT"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : art.type === "PPT"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {art.type === "CONSENT_FORM"
                              ? "Consent Form"
                              : art.type === "REPORT"
                              ? "Project Report"
                              : art.type === "PPT"
                              ? "Presentation"
                              : art.type}
                          </span>
                          {art.semester && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Sem {art.semester}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              art.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : art.status === "REJECTED"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {art.status || "PENDING"}
                          </span>
                        </div>

                        <h5 className="text-sm font-bold text-[#0d2137] leading-snug">
                          {art.title}
                        </h5>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-mono">
                          <span className="text-slate-700 font-medium truncate max-w-xs" title={art.fileName}>
                            {art.fileName.split("/").pop()}
                          </span>
                          <span>·</span>
                          <span>{formatFileSize(art.fileSize)}</span>
                          {art.submittedAt && (
                            <>
                              <span>·</span>
                              <span className="font-sans">
                                Uploaded: {art.submittedAt.split("T")[0]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Download Links */}
                      <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                        <a
                          href={art.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#0d2137] hover:bg-[#16365c] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Download className="w-3.5 h-3.5 text-[#cda34f]" />
                          <span>View / Download</span>
                          <ExternalLink className="w-3 h-3 text-slate-300" />
                        </a>

                        {art.plagiarismReportUrl && (
                          <a
                            href={art.plagiarismReportUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                            title="Download official Turnitin / Urkund similarity report"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                            <span>Plagiarism PDF</span>
                            <ExternalLink className="w-3 h-3 text-amber-600" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Plagiarism & AI Details Strip */}
                    {(art.similarityPercent !== null || art.aiPercent !== null || art.spocNote) && (
                      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-3 flex-wrap">
                          {art.similarityPercent !== null && art.similarityPercent !== undefined && (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                art.similarityPercent <= 10
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-red-50 text-red-800 border border-red-200"
                              }`}
                            >
                              Turnitin: {art.similarityPercent}% ({art.similarityPercent <= 10 ? "✓ Pass <10%" : "Exceeds"})
                            </span>
                          )}

                          {art.aiPercent !== null && art.aiPercent !== undefined && (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                art.aiPercent <= 20
                                  ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
                                  : "bg-red-50 text-red-800 border border-red-200"
                              }`}
                            >
                              AI Content: {art.aiPercent}% ({art.aiPercent <= 20 ? "✓ Pass <20%" : "Exceeds"})
                            </span>
                          )}
                        </div>

                        {art.spocNote && (
                          <div className="text-[11px] text-slate-600 max-w-md truncate">
                            <strong className="text-slate-800">SPOC Note:</strong> {art.spocNote}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. RESEARCH MANUSCRIPTS & JOURNAL PUBLICATIONS (IF ANY) */}
          {hasManuscripts && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#c59b27]" />
                  <span>Research Manuscripts &amp; Publications (Avishkar CIE)</span>
                </h4>
                {project.journalName && (
                  <span className="text-[11px] text-slate-600 font-medium">
                    Journal: <strong className="text-slate-800">{project.journalName}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Draft Manuscript */}
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Draft Paper</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        project.draftManuscriptUrl
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {project.draftManuscriptUrl ? "Attached ✓" : "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Draft manuscript submitted for publication clearance.
                  </p>
                  {project.draftManuscriptUrl && (
                    <a
                      href={project.draftManuscriptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-700" />
                      <span>Download Draft</span>
                      <ExternalLink className="w-3 h-3 text-amber-600" />
                    </a>
                  )}
                </div>

                {/* Manuscript Similarity */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Turnitin Report</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        project.manuscriptSimilarityPercent !== null &&
                        project.manuscriptSimilarityPercent !== undefined &&
                        project.manuscriptSimilarityPercent <= 10
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {project.manuscriptSimilarityPercent !== null &&
                      project.manuscriptSimilarityPercent !== undefined
                        ? `${project.manuscriptSimilarityPercent}% Sim`
                        : "Not Attached"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Turnitin originality screening for research manuscript.
                  </p>
                  {project.manuscriptPlagiarismUrl && (
                    <a
                      href={project.manuscriptPlagiarismUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Download Report</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  )}
                </div>

                {/* Published Manuscript */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Published Paper</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        project.isManuscriptPublished || project.publishedManuscriptUrl
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {project.isManuscriptPublished ? "Published ✓" : "In Progress"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {project.publicationDoi
                      ? `DOI: ${project.publicationDoi}`
                      : "Official publication copy with Avishkar CIE attribution."}
                  </p>
                  {project.publishedManuscriptUrl && (
                    <a
                      href={project.publishedManuscriptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Published</span>
                      <ExternalLink className="w-3 h-3 text-emerald-600" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            All files are stored securely with institutional access controls.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
