import React from "react";
import { Calendar, RefreshCw, Download, Upload, Shield, FileSpreadsheet, Database } from "lucide-react";

interface AdminBannerProps {
  activeAcademicYear: string;
  activeSemester: number;
  onToggleSemester: () => void;
  onOpenTemplates: () => void;
  onOpenImport: () => void;
  onOpenRollover: () => void;
  onDownloadCohorts?: () => void;
  onOpenDataManagement?: () => void;
}

export function AdminBanner({
  activeAcademicYear,
  activeSemester,
  onToggleSemester,
  onOpenTemplates,
  onOpenImport,
  onOpenRollover,
  onDownloadCohorts,
  onOpenDataManagement,
}: AdminBannerProps) {
  return (
    <div className="bg-[#0a192f] rounded-3xl p-7 sm:p-8 text-white shadow-elevated border border-[#c59b27]/25 relative overflow-hidden">
      {/* Subtle warm ambient highlight */}
      <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#c59b27]/12 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#c59b27] text-[#0a192f] shadow-subtle">
              Active Cohort Session
            </span>
            <span className="text-xs text-slate-300 font-medium">
              {activeSemester === 3
                ? "Semester 1 Milestone (Sem 3 · PPT Submission)"
                : "Semester 2 Milestone (Sem 4 · Final Report)"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Calendar className="w-6 h-6 text-[#c59b27]" />
            <span>Academic Year {activeAcademicYear}</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Student applications, mentor allocations, and project submissions are strictly scoped to this session. Older cohorts are archived and isolated.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleSemester}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all tactile-btn flex items-center gap-1.5 shadow-subtle"
            title="Switch active semester milestone"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#c59b27]" />
            <span>Switch to Sem {activeSemester === 3 ? "4 (Report)" : "3 (PPT)"}</span>
          </button>
          {onDownloadCohorts && (
            <button
              type="button"
              onClick={onDownloadCohorts}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-600 text-white transition-all tactile-btn flex items-center gap-1.5 shadow-subtle border border-emerald-500/40"
              title="Download full student cohorts spreadsheet in official IDP Cohorts Details (.xlsx) format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Download Cohorts (.xlsx)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenTemplates}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all tactile-btn flex items-center gap-1.5 shadow-subtle"
          >
            <Download className="w-3.5 h-3.5 text-[#c59b27]" />
            <span>XLSX Templates</span>
          </button>
          <button
            type="button"
            onClick={onOpenImport}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#c59b27] hover:bg-[#d4af37] text-[#0a192f] transition-all tactile-btn flex items-center gap-1.5 shadow-gold"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Direct XLSX Import</span>
          </button>
          {onOpenDataManagement && (
            <button
              type="button"
              onClick={onOpenDataManagement}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-indigo-600/90 hover:bg-indigo-600 text-white transition-all tactile-btn flex items-center gap-1.5 shadow-subtle border border-indigo-500/40"
              title="Full Database Export, R2 Archiving & Cloudflare D1 Purge Controls"
            >
              <Database className="w-3.5 h-3.5 text-indigo-200" />
              <span>Data &amp; Purge</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenRollover}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-red-600/90 hover:bg-red-600 text-white transition-all tactile-btn flex items-center gap-1.5 shadow-subtle border border-red-500/40"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Rollover Year</span>
          </button>
        </div>
      </div>
    </div>
  );
}
