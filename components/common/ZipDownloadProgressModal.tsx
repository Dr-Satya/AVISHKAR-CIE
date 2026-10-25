"use client";

import React from "react";
import { Loader2, Download, CheckCircle2, AlertCircle, X, Archive } from "lucide-react";
import { ProgressInfo } from "@/lib/zip-export";

interface ZipDownloadProgressModalProps {
  isOpen: boolean;
  progress: ProgressInfo | null;
  archiveTitle?: string;
  onCancel?: () => void;
  onClose?: () => void;
  error?: string | null;
  isComplete?: boolean;
}

export function ZipDownloadProgressModal({
  isOpen,
  progress,
  archiveTitle = "Submitted Files Package (.zip)",
  onCancel,
  onClose,
  error,
  isComplete,
}: ZipDownloadProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                isComplete
                  ? "bg-emerald-100 text-emerald-700"
                  : error
                  ? "bg-rose-100 text-rose-700"
                  : "bg-[#0d2137] text-[#cda34f]"
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : error ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Archive className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0d2137]">
                {isComplete
                  ? "Download Complete"
                  : error
                  ? "Download Failed"
                  : "Packaging Submissions Archive"}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[160px] xs:max-w-[200px] sm:max-w-[260px]" title={archiveTitle}>
                {archiveTitle}
              </p>
            </div>
          </div>

          {(isComplete || error) && onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        {error ? (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error packaging files</p>
              <p className="text-[11px] mt-0.5 text-rose-700">{error}</p>
            </div>
          </div>
        ) : isComplete ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Archive created successfully!</span>
              </p>
              <p className="text-[11px] text-emerald-700">
                All submitted reports, presentations, Turnitin summaries, and student mark rosters have been bundled into an organized ZIP archive. Your browser download should start automatically.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#0d2137] hover:bg-[#162a45] text-white text-xs font-bold transition-all shadow-xs"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  {progress?.percent || 0}% Complete
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {progress ? `${progress.current} / ${progress.total} files` : "Preparing..."}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-[#0d2137] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, progress?.percent || 0)}%` }}
                />
              </div>
            </div>

            {/* Current status label */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-[#0d2137] flex-shrink-0" />
              <p className="text-xs text-slate-600 truncate font-mono">
                {progress?.message || "Collecting project artifacts..."}
              </p>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Files are being fetched directly and organized into clean semester folders. Please keep this tab open.
            </p>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
              >
                Cancel Download
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
