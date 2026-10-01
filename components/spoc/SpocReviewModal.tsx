"use client";

import React, { useState } from "react";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { ProjectData } from "@/types/spoc";

interface SpocReviewModalProps {
  project: ProjectData;
  action: "APPROVE" | "REJECT";
  artifactId?: string;
  artifactTitle?: string;
  onClose: () => void;
  onSuccess: () => void;
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

      onSuccess();
      onClose();
    } catch (err) {
      setError("Network error submitting review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
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

        {/* Verification Summary for SPOC */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Uploaded Artifacts:</span>
            <span className="font-semibold text-slate-800">{project.artifacts.length} file(s)</span>
          </div>
          {project.artifacts.some((a) => a.similarityPercent !== null && a.similarityPercent !== undefined) && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Plagiarism Count:</span>
              <span className="font-bold text-emerald-700">
                {project.artifacts.find((a) => a.similarityPercent !== null && a.similarityPercent !== undefined)?.similarityPercent}% (&lt;10% ✓)
              </span>
            </div>
          )}
          {project.artifacts.some((a) => a.plagiarismReportUrl) && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Plagiarism Report:</span>
              <span className="font-semibold text-amber-800">Attached ✓</span>
            </div>
          )}
          {project.artifacts.some((a) => a.selfDeclaration) && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Self-Declaration:</span>
              <span className="font-semibold text-emerald-800">Verified by Faculty ✓</span>
            </div>
          )}
        </div>

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
