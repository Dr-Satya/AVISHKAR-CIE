import React from "react";
import { Calendar, RefreshCw, Download, Upload, Shield, FileSpreadsheet } from "lucide-react";

interface AdminBannerProps {
  activeAcademicYear: string;
  activeSemester: number;
  onToggleSemester: () => void;
  onOpenTemplates: () => void;
  onOpenImport: () => void;
  onOpenRollover: () => void;
  onDownloadCohorts?: () => void;
}

export function AdminBanner({
  activeAcademicYear,
  activeSemester,
  onToggleSemester,
  onOpenTemplates,
  onOpenImport,
  onOpenRollover,
  onDownloadCohorts,
}: AdminBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#0d2137] via-[#163456] to-[#0d2137] rounded-2xl p-6 sm:p-7 text-white shadow-lg border border-[#cda34f]/30 relative overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#cda34f]/15 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#cda34f] text-[#0d2137]">
              Active Cohort Session
            </span>
            <span className="text-xs text-slate-300">
              {activeSemester === 3
                ? "Semester 1 Milestone (Sem 3 - PPT Submission)"
                : "Semester 2 Milestone (Sem 4 - Final Report)"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#cda34f]" />
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
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-1.5 shadow-sm"
            title="Switch active semester milestone between Semester 1 (Sem 3 PPT) and Semester 2 (Sem 4 Report)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#cda34f]" />
            <span>Switch to Sem {activeSemester === 3 ? "4 (Report)" : "3 (PPT)"}</span>
          </button>
          {onDownloadCohorts && (
            <button
              type="button"
              onClick={onDownloadCohorts}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-700/80 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-sm border border-emerald-500/40"
              title="Download full student cohorts spreadsheet in official IDP Cohorts Details (.xlsx) format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>Download Cohorts (.xlsx)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenTemplates}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#cda34f]" />
            <span>XLSX Templates</span>
          </button>
          <button
            type="button"
            onClick={onOpenImport}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#cda34f] hover:bg-[#dfb55f] text-[#0d2137] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Direct XLSX Import</span>
          </button>
          <button
            type="button"
            onClick={onOpenRollover}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-600/90 hover:bg-red-700 text-white transition-all flex items-center gap-1.5 shadow-sm border border-red-500/50"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Rollover Academic Year</span>
          </button>
        </div>
      </div>
    </div>
  );
}
