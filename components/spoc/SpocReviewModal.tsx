"use client";

import React, { useState } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { ProjectData } from "@/types/spoc";

interface SpocReviewModalProps {
  project: ProjectData;
  action: "APPROVE" | "REJECT";
  artifactId?: string;
  artifactTitle?: string;
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

export function SpocReviewModal({
  project,
  action,
  artifactId,
  artifactTitle,
  onClose,
  onSuccess,
}: SpocReviewModalProps) {
  const [reviewNote, setReviewNote] = useState(
    action === "APPROVE"
      ? artifactTitle
        ? `Approved by Department SPOC: "${artifactTitle}" meets all university guidelines.`
        : "Approved by Department SPOC. Project documents meet all guidelines."
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (action === "REJECT" && (!reviewNote || reviewNote.trim().length === 0)) {
      setError("A review note explaining the rejection reason is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/spoc/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          artifactId,
          action,
          note: reviewNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Review submission failed.");
        setLoading(false);
        return;
      }

      const targetArtifact = artifactId
        ? project.artifacts.find((a) => a.id === artifactId)
        : null;
      const label = targetArtifact ? `${targetArtifact.type} (${targetArtifact.title})` : "Project";
      const confirmMsg = `${label} has been ${action === "APPROVE" ? "approved" : "rejected"} successfully!`;
      setSuccess(confirmMsg);
      onSuccess(confirmMsg);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError("Network error submitting review.");
    } finally {
      setLoading(false);
    }
  };

  const targetArtifact = artifactId
    ? project.artifacts.find((a) => a.id === artifactId)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0d2137]">
              {artifactId
                ? action === "APPROVE"
                  ? "Approve Document Submission"
                  : "Reject Document Submission"
                : action === "APPROVE"
                ? "Approve Project Application"
                : "Reject Project Application"}
            </h3>
            <p className="text-xs text-slate-500">
              {artifactTitle ? (
                <span>
                  Document: <strong className="text-slate-700">{artifactTitle}</strong> · {project.projectId}
                </span>
              ) : (
                <span>
                  {project.projectId} · Mentor: {project.faculty.name}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* TARGET ARTIFACT PREVIEW (When reviewing a specific file) */}
        {targetArtifact ? (
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-200 text-blue-900">
                  {targetArtifact.type}
                </span>
                <h4 className="font-bold text-slate-800 text-xs mt-1">{targetArtifact.title}</h4>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{targetArtifact.fileName.split("/").pop()}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 flex-shrink-0">
                <a
                  href={targetArtifact.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-white border border-blue-300 hover:bg-blue-100 text-blue-800 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  <span>View File</span>
                  <ExternalLink className="w-3 h-3 text-blue-500" />
                </a>
                {targetArtifact.plagiarismReportUrl && (
                  <a
                    href={targetArtifact.plagiarismReportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                    title="View Turnitin/Urkund plagiarism report"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Plagiarism</span>
                    <ExternalLink className="w-3 h-3 text-amber-600" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-blue-200/60 text-[11px]">
              {targetArtifact.similarityPercent !== null && targetArtifact.similarityPercent !== undefined && (
                <span className="font-medium text-slate-700">
                  Turnitin:{" "}
                  <strong className={targetArtifact.similarityPercent <= 10 ? "text-emerald-700" : "text-red-700"}>
                    {targetArtifact.similarityPercent}% ({targetArtifact.similarityPercent <= 10 ? "✓ Pass" : "Exceeds"})
                  </strong>
                </span>
              )}
              {targetArtifact.aiPercent !== null && targetArtifact.aiPercent !== undefined && (
                <span className="font-medium text-slate-700">
                  AI Score:{" "}
                  <strong className={targetArtifact.aiPercent <= 20 ? "text-indigo-700" : "text-red-700"}>
                    {targetArtifact.aiPercent}% ({targetArtifact.aiPercent <= 20 ? "✓ Pass" : "Exceeds"})
                  </strong>
                </span>
              )}
              {targetArtifact.selfDeclaration && (
                <span className="text-emerald-800 font-semibold flex items-center gap-1 ml-auto">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Faculty Declaration Verified</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          /* PROJECT-LEVEL ARTIFACTS ROSTER (When reviewing overall project) */
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Uploaded Files:</span>
                <span className="font-bold text-slate-800">{project.artifacts.length} document(s)</span>
              </div>
              {project.artifacts.some((a) => a.similarityPercent !== null && a.similarityPercent !== undefined) && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Max Plagiarism Count:</span>
                  <span className="font-bold text-emerald-700">
                    {Math.max(...project.artifacts.map((a) => a.similarityPercent || 0))}% (&lt;10% ✓)
                  </span>
                </div>
              )}
              {project.hasCommunicatedManuscript ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Research Manuscript:</span>
                  <span className="font-bold text-blue-700">Communicated to Journal ✓</span>
                </div>
              ) : project.draftManuscriptUrl ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Research Manuscript:</span>
                  <span className="font-bold text-amber-700">Manuscript in Draft ✓</span>
                </div>
              ) : null}
            </div>

            {project.artifacts.length > 0 && (
              <div className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-1.5 max-h-36 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-600 px-1">Attached Project Documents:</div>
                {project.artifacts.map((art) => (
                  <div
                    key={art.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-800 truncate block">{art.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {art.fileName.split("/").pop()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={art.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>View</span>
                      </a>
                      {art.plagiarismReportUrl && (
                        <a
                          href={art.plagiarismReportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold flex items-center gap-1"
                          title="View Plagiarism Report"
                        >
                          <ShieldCheck className="w-3 h-3 text-amber-700" />
                          <span>Plagiarism</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Research Manuscript Files if attached */}
            {(project.draftManuscriptUrl || project.manuscriptPlagiarismUrl || project.publishedManuscriptUrl) && (
              <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1 text-xs">
                <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>Research Manuscript Files:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {project.draftManuscriptUrl && (
                    <a
                      href={project.draftManuscriptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Draft Paper</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                    </a>
                  )}
                  {project.manuscriptPlagiarismUrl && (
                    <a
                      href={project.manuscriptPlagiarismUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-amber-900 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3 text-amber-700" />
                      <span>Turnitin Summary</span>
                      <ExternalLink className="w-2.5 h-2.5 text-amber-600" />
                    </a>
                  )}
                  {project.publishedManuscriptUrl && (
                    <a
                      href={project.publishedManuscriptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>Published Paper</span>
                      <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {action === "APPROVE"
                ? "Review Note / Feedback (Optional)"
                : "Rejection Reason & Feedback Note (Mandatory)"}
            </label>
            <textarea
              rows={4}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder={
                action === "APPROVE"
                  ? "Enter approval remarks..."
                  : "Enter specific reasons for rejection and requested corrections..."
              }
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
              required={action === "REJECT"}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-sm flex items-center gap-1.5 ${
                action === "APPROVE"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Review...</span>
                </>
              ) : action === "APPROVE" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Approval</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Submit Rejection Note</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
