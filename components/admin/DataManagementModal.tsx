import React, { useState, useEffect, useMemo } from "react";
import {
  Database,
  Download,
  Trash2,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  FileSpreadsheet,
  Archive,
  Search,
  Plus,
  Edit2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Users,
  GraduationCap,
  FolderKanban,
  KeyRound,
  ShieldCheck,
  UserX,
  CheckSquare,
  Square,
  RefreshCw,
  FileText,
  Code,
  Sparkles,
  Filter,
  Check,
} from "lucide-react";
import {
  downloadFullDatabaseExport,
  exportToCsv,
  exportToXlsx,
  exportToJson,
  exportToPdf,
} from "@/lib/export";
import { cleanErrorMessage } from "@/lib/error-utils";
import { PaginationBar } from "@/components/common/PaginationBar";

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAcademicYear: string;
  onDataChanged?: () => void;
}

type TabType = "EXPORT" | "PURGE" | "EXPORT_AND_PURGE";
type PurgeScope =
  | "STUDENTS"
  | "STUDENTS_AND_UPLOADS"
  | "STUDENTS_PROJECTS_UPLOADS"
  | "REGISTRATIONS"
  | "PROJECTS"
  | "FACULTY"
  | "ALL";

interface Snapshot {
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

export function DataManagementModal({
  isOpen,
  onClose,
  activeAcademicYear,
  onDataChanged,
}: DataManagementModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("EXPORT");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);

  // Form states
  const [scope, setScope] = useState<PurgeScope>("STUDENTS");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSnapshot = async () => {
    setLoadingSnapshot(true);
    try {
      const res = await fetch("/api/admin/data-management");
      const data = await res.json();
      if (res.ok && data.snapshot) {
        setSnapshot(data.snapshot);
      }
    } catch {
      // Best effort
    } finally {
      setLoadingSnapshot(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMessage(null);
      setConfirmPhrase("");
      fetchSnapshot();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setProcessing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await downloadFullDatabaseExport(academicYearFilter !== "all" ? academicYearFilter : undefined);
      setSuccessMessage("Full database export downloaded and archived to Cloudflare R2 successfully.");
      await fetchSnapshot();
    } catch (err: any) {
      setError(cleanErrorMessage(err, "Export failed."));
    } finally {
      setProcessing(false);
    }
  };

  const handlePurge = async () => {
    if (confirmPhrase !== "PURGE_CONFIRMED") {
      setError('Please type "PURGE_CONFIRMED" exactly to proceed.');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/admin/data-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PURGE",
          scope,
          academicYear: academicYearFilter !== "all" ? academicYearFilter : undefined,
          confirmCode: "PURGE_CONFIRMED",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(cleanErrorMessage(data.error, "Purge failed."));
      }

      setSuccessMessage(`Purge completed for scope: ${scope}. Deleted records: ${JSON.stringify(data.deleted)}`);
      setConfirmPhrase("");
      await fetchSnapshot();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setError(cleanErrorMessage(err, "Failed to purge data."));
    } finally {
      setProcessing(false);
    }
  };

  const handleExportAndPurge = async () => {
    if (confirmPhrase !== "PURGE_CONFIRMED") {
      setError('Please type "PURGE_CONFIRMED" exactly to proceed.');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // 1. Download export to local browser
      await downloadFullDatabaseExport(academicYearFilter !== "all" ? academicYearFilter : undefined);

      // 2. Perform atomic purge via backend
      const res = await fetch("/api/admin/data-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EXPORT_AND_PURGE",
          scope,
          academicYear: academicYearFilter !== "all" ? academicYearFilter : undefined,
          confirmCode: "PURGE_CONFIRMED",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(cleanErrorMessage(data.error, "Export and purge failed."));
      }

      setSuccessMessage(
        `Export archived & purge completed. Scope: ${scope}. Deleted: ${JSON.stringify(data.purge?.deleted || {})}`
      );
      setConfirmPhrase("");
      await fetchSnapshot();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setError(cleanErrorMessage(err, "Atomic export and purge failed."));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1 bg-[#c59b27] rounded-full mb-3" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-[#0a192f] flex items-center gap-2.5">
              <Database className="w-6 h-6 text-[#c59b27]" />
              <span>Data Extraction &amp; Purge Control</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export complete student data to offline storage and clean Cloudflare database.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Database Snapshot Stats */}
        <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Live Cloudflare Database Records
            </span>
            {loadingSnapshot && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-subtle">
              <div className="text-lg font-black text-[#0a192f]">{snapshot?.students ?? "..."}</div>
              <div className="text-[10px] font-medium text-slate-500">Students</div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-subtle">
              <div className="text-lg font-black text-[#0a192f]">{snapshot?.registrations ?? "..."}</div>
              <div className="text-[10px] font-medium text-slate-500">Registrations</div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-subtle">
              <div className="text-lg font-black text-[#0a192f]">{snapshot?.projects ?? "..."}</div>
              <div className="text-[10px] font-medium text-slate-500">Projects</div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-subtle">
              <div className="text-lg font-black text-[#0a192f]">{snapshot?.faculty ?? "..."}</div>
              <div className="text-[10px] font-medium text-slate-500">Faculty</div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 text-red-700 text-xs rounded-2xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="break-all">{successMessage}</span>
          </div>
        )}

        {/* Action Tabs */}
        <div className="flex border-b border-slate-200 mb-5 overflow-x-auto scrollbar-none whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab("EXPORT")}
            className={`flex-1 py-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === "EXPORT"
                ? "border-[#c59b27] text-[#0a192f]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>1. Export All</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("EXPORT_AND_PURGE")}
            className={`flex-1 py-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === "EXPORT_AND_PURGE"
                ? "border-amber-600 text-amber-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>2. Export &amp; Delete (Recommended)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PURGE")}
            className={`flex-1 py-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === "PURGE"
                ? "border-red-600 text-red-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>3. Purge Only</span>
          </button>
        </div>

        {/* Tab 1: EXPORT ALL */}
        {activeTab === "EXPORT" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-emerald-950">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Full Database Snapshot (.xlsx)</span>
              </p>
              <p className="leading-relaxed text-emerald-800">
                Extracts all student records, allocations, projects, faculty profiles, and system metadata into a structured multi-sheet Excel workbook. Saves a verified backup copy to Cloudflare R2 bucket.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Filter by Academic Cohort
              </label>
              <select
                value={academicYearFilter}
                onChange={(e) => setAcademicYearFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f]"
              >
                <option value="all">All Academic Cohorts (Entire Database)</option>
                <option value={activeAcademicYear}>{activeAcademicYear} (Active Session Only)</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleExport}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Exporting Snapshot...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Full Export (.xlsx)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: EXPORT AND PURGE */}
        {activeTab === "EXPORT_AND_PURGE" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Safeguarded Extraction &amp; Wipe</span>
              </p>
              <p className="leading-relaxed text-amber-800">
                <strong>1.</strong> Exports and downloads full database snapshot (.xlsx) to your machine.
                <br />
                <strong>2.</strong> Archives verified snapshot to Cloudflare R2 bucket.
                <br />
                <strong>3.</strong> Only after extraction succeeds, permanently deletes the selected data from Cloudflare D1.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Scope to Purge
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as PurgeScope)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="STUDENTS_PROJECTS_UPLOADS">Students, Projects, Allocations &amp; Uploads (Clean Slate — Preserves Faculty Logins)</option>
                <option value="STUDENTS_AND_UPLOADS">Students, Allocations &amp; All Uploaded Artifacts (Preserves Project Proposals)</option>
                <option value="STUDENTS">Students &amp; Allocations Only (Preserves Uploads, Projects &amp; Faculty)</option>
                <option value="REGISTRATIONS">Registrations Only (Resets Project Allocations)</option>
                <option value="PROJECTS">Projects &amp; Submissions Only (Preserves Students &amp; Faculty)</option>
                <option value="FACULTY">Faculty &amp; Assigned Projects</option>
                <option value="ALL">ALL Cohort Data (Complete Database Wipe)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Cohort Scope
              </label>
              <select
                value={academicYearFilter}
                onChange={(e) => setAcademicYearFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="all">All Cohorts (Entire Database)</option>
                <option value={activeAcademicYear}>{activeAcademicYear} (Active Session Only)</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmation Phrase
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Type <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-red-600">PURGE_CONFIRMED</code> to unlock deletion:
              </p>
              <input
                type="text"
                placeholder="PURGE_CONFIRMED"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing || confirmPhrase !== "PURGE_CONFIRMED"}
                onClick={handleExportAndPurge}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-40"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting &amp; Purging...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Export Snapshot &amp; Purge Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: PURGE ONLY */}
        {activeTab === "PURGE" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-950 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-red-800">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Permanent Database Deletion</span>
              </p>
              <p className="leading-relaxed text-red-800">
                <strong>Warning:</strong> Deletion is irreversible. Audit logs will preserve record deletion counts, but deleted student and registration rows cannot be recovered without a previous export file.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Scope to Delete
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as PurgeScope)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="STUDENTS_PROJECTS_UPLOADS">Students, Projects, Allocations &amp; Uploads (Preserves Faculty)</option>
                <option value="STUDENTS_AND_UPLOADS">Students, Allocations &amp; Uploaded Artifacts</option>
                <option value="STUDENTS">Students &amp; Allocations Only</option>
                <option value="REGISTRATIONS">Registrations Only</option>
                <option value="PROJECTS">Projects &amp; Submissions Only</option>
                <option value="FACULTY">Faculty &amp; Projects</option>
                <option value="ALL">ALL Data (Full Reset)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Cohort Scope
              </label>
              <select
                value={academicYearFilter}
                onChange={(e) => setAcademicYearFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="all">All Cohorts (Entire Database)</option>
                <option value={activeAcademicYear}>{activeAcademicYear} (Active Session Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmation Phrase
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Type <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-red-600">PURGE_CONFIRMED</code> to authorize deletion:
              </p>
              <input
                type="text"
                placeholder="PURGE_CONFIRMED"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing || confirmPhrase !== "PURGE_CONFIRMED"}
                onClick={handlePurge}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-40"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Records...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Selected Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE DASHBOARD CARD — Live Master Console
// ─────────────────────────────────────────────────────────────────────────────

export interface DatabaseDashboardCardProps {
  activeAcademicYear: string;
  activeSemester: number;
  onOpenDataModal: () => void;
  onAddFaculty: () => void;
  onEditFaculty: (f: any) => void;
  onDeleteFaculty: (f: any) => void;
  onResetFacultyPasscode: (f: any) => void;
  onToggleFacultyAdmin: (id: string, currentIsAdmin: boolean) => void;
  onAddStudent: () => void;
  onEditStudent: (st: any) => void;
  onDeleteStudent: (st: any) => void;
  onDownloadCohorts?: () => void;
  onDataChanged?: () => void;
  onMapStudent?: (student?: any) => void;
  onUnmapStudent?: (student: any) => void;
}

type SubTab = "MAPPINGS" | "STUDENTS" | "FACULTY" | "PROJECTS";

export function DatabaseDashboardCard({
  activeAcademicYear,
  activeSemester,
  onOpenDataModal,
  onAddFaculty,
  onEditFaculty,
  onDeleteFaculty,
  onResetFacultyPasscode,
  onToggleFacultyAdmin,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onDownloadCohorts,
  onDataChanged,
  onMapStudent,
  onUnmapStudent,
}: DatabaseDashboardCardProps) {
  const [activeTab, setActiveTab] = useState<SubTab>("MAPPINGS");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingOneClick, setExportingOneClick] = useState(false);

  // Safe Wipe (Export First -> Delete Selected Scope)
  const [showSafeWipeModal, setShowSafeWipeModal] = useState(false);
  const [wipeCohort, setWipeCohort] = useState("all");
  const [wipeScope, setWipeScope] = useState<PurgeScope>("STUDENTS_PROJECTS_UPLOADS");
  const [wipeConfirmInput, setWipeConfirmInput] = useState("");
  const [wiping, setWiping] = useState(false);
  const [wipeError, setWipeError] = useState<string | null>(null);
  const [wipeSuccess, setWipeSuccess] = useState<string | null>(null);

  // Raw database data
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [snapshot, setSnapshot] = useState<any | null>(null);

  // Controls: Search, Filter, Sort, Selection, Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState<string>("default");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Fetch dataset per tab (on-demand to prevent OOM/timeouts on edge workers)
  const fetchDatabaseMaster = async (isRefresh = false, tabToFetch?: SubTab) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const targetTab = tabToFetch || activeTab;
      const res = await fetch(`/api/admin/data-management?action=DATABASE_MASTER&tab=${targetTab}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.students?.length) setStudents(json.data.students);
          if (json.data.faculty?.length) setFaculty(json.data.faculty);
          if (json.data.registrations?.length) setRegistrations(json.data.registrations);
          if (json.data.projects?.length) setProjects(json.data.projects);
          if (json.data.snapshot) setSnapshot(json.data.snapshot);
        }
      }
    } catch (err) {
      console.error("Failed to fetch database master records:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDatabaseMaster(false, "MAPPINGS");
  }, []);

  // Clear selections & reset page when switching tabs
  const handleTabChange = (newTab: SubTab) => {
    setActiveTab(newTab);
    setSelectedIds(new Set());
    setSearchQuery("");
    setSchoolFilter("all");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortColumn("default");
    setSortOrder("asc");
    setCurrentPage(1);

    if (
      (newTab === "MAPPINGS" && registrations.length === 0) ||
      (newTab === "STUDENTS" && students.length === 0) ||
      (newTab === "FACULTY" && faculty.length === 0) ||
      (newTab === "PROJECTS" && projects.length === 0)
    ) {
      fetchDatabaseMaster(false, newTab);
    }
  };

  // Distinct schools across all tables
  const distinctSchools = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.department && set.add(s.department));
    faculty.forEach((f) => f.department && set.add(f.department));
    projects.forEach((p) => p.department && set.add(p.department));
    registrations.forEach((r) => {
      if (r.student?.department) set.add(r.student.department);
      if (r.project?.department) set.add(r.project.department);
    });
    return Array.from(set).sort();
  }, [students, faculty, projects, registrations]);

  // 1-Click Export of the entire database
  const handleExportAllOneClick = async () => {
    try {
      setExportingOneClick(true);
      await downloadFullDatabaseExport();
    } catch (err: any) {
      alert(cleanErrorMessage(err, "Failed to export database."));
    } finally {
      setExportingOneClick(false);
    }
  };

  // Safe Wipe: Exports full database first, then deletes students and uploads
  const handleSafeWipe = async () => {
    const code = wipeConfirmInput.trim();
    if (code !== "WIPE_AND_EXPORT" && code !== "PURGE_CONFIRMED") {
      setWipeError('Please type "WIPE_AND_EXPORT" exactly to authorize this operation.');
      return;
    }

    setWiping(true);
    setWipeError(null);
    setWipeSuccess(null);

    try {
      // Step 1: Trigger full database export download to browser
      await downloadFullDatabaseExport(wipeCohort !== "all" ? wipeCohort : undefined);

      // Step 2: Request backend purge with selected scope
      const res = await fetch("/api/admin/data-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PURGE",
          scope: wipeScope,
          academicYear: wipeCohort !== "all" ? wipeCohort : undefined,
          confirmCode: "WIPE_AND_EXPORT",
        }),
      });

      let json: any = {};
      const text = await res.text();
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          res.ok
            ? "Invalid server response."
            : `Server error (${res.status}): ${text.slice(0, 120) || "Operation failed."}`
        );
      }

      if (!res.ok) {
        throw new Error(cleanErrorMessage(json.error, "Wipe operation failed."));
      }

      const deletedInfo = json.deleted || json.purge?.deleted || {};
      const studentCount = deletedInfo.students ?? 0;
      const projectCount = deletedInfo.projects ?? 0;
      const regCount = deletedInfo.registrations ?? 0;
      const artCount = deletedInfo.artifacts ?? 0;

      const summaryParts = [];
      if (studentCount > 0) summaryParts.push(`${studentCount} students`);
      if (projectCount > 0) summaryParts.push(`${projectCount} projects`);
      if (regCount > 0) summaryParts.push(`${regCount} allocations`);
      if (artCount > 0) summaryParts.push(`${artCount} uploaded documents`);
      const details = summaryParts.length > 0 ? summaryParts.join(", ") : "0 records (already clean)";

      setWipeSuccess(
        `Full database export was downloaded to your machine! Permanently deleted ${details}. Faculty accounts remain intact.`
      );
      setWipeConfirmInput("");
      setShowSafeWipeModal(false);
      await fetchDatabaseMaster(true);
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setWipeError(cleanErrorMessage(err, "Failed to complete export and wipe."));
    } finally {
      setWiping(false);
    }
  };

  // Handle column header sort toggle
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Selection helpers
  const handleToggleSelectAll = (filteredRows: any[]) => {
    if (selectedIds.size === filteredRows.length && filteredRows.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map((r) => r.id)));
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // ─── FILTER & SORT PER DATASET ─────────────────────────────────────────────

  // 1. MAPPINGS
  const filteredMappings = useMemo(() => {
    let result = [...registrations];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => {
        const s = r.student || {};
        const p = r.project || {};
        const f = p.faculty || {};
        return (
          s.name?.toLowerCase().includes(q) ||
          s.enrollmentNumber?.toLowerCase().includes(q) ||
          s.admissionNumber?.toLowerCase().includes(q) ||
          s.department?.toLowerCase().includes(q) ||
          s.programme?.toLowerCase().includes(q) ||
          p.projectId?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.theme?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          f.name?.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q)
        );
      });
    }

    if (schoolFilter !== "all") {
      result = result.filter(
        (r) => r.student?.department === schoolFilter || r.project?.department === schoolFilter
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((r) => r.project?.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    if (sortColumn !== "default") {
      result.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";
        switch (sortColumn) {
          case "enrollment":
            valA = a.student?.enrollmentNumber || "";
            valB = b.student?.enrollmentNumber || "";
            break;
          case "name":
            valA = a.student?.name || "";
            valB = b.student?.name || "";
            break;
          case "school":
            valA = a.student?.department || "";
            valB = b.student?.department || "";
            break;
          case "programme":
            valA = a.student?.programme || "";
            valB = b.student?.programme || "";
            break;
          case "projectCode":
            valA = a.project?.projectId || "";
            valB = b.project?.projectId || "";
            break;
          case "projectTitle":
            valA = a.project?.title || "";
            valB = b.project?.title || "";
            break;
          case "category":
            valA = a.project?.category || "";
            valB = b.project?.category || "";
            break;
          case "theme":
            valA = a.project?.theme || "";
            valB = b.project?.theme || "";
            break;
          case "facultyName":
            valA = a.project?.faculty?.name || "";
            valB = b.project?.faculty?.name || "";
            break;
          case "date":
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
            break;
          case "status":
            valA = a.status || "";
            valB = b.status || "";
            break;
        }
        if (valA === valB) return 0;
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }
        const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [registrations, searchQuery, schoolFilter, categoryFilter, statusFilter, sortColumn, sortOrder]);

  // 2. STUDENTS
  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const p = s.registration?.project || {};
        const f = p.faculty || {};
        return (
          s.name?.toLowerCase().includes(q) ||
          s.enrollmentNumber?.toLowerCase().includes(q) ||
          s.admissionNumber?.toLowerCase().includes(q) ||
          s.department?.toLowerCase().includes(q) ||
          s.programme?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.phone?.toLowerCase().includes(q) ||
          p.projectId?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          f.name?.toLowerCase().includes(q)
        );
      });
    }

    if (schoolFilter !== "all") {
      result = result.filter((s) => s.department === schoolFilter);
    }

    if (statusFilter === "registered") {
      result = result.filter((s) => Boolean(s.registration));
    } else if (statusFilter === "unregistered") {
      result = result.filter((s) => !s.registration);
    }

    if (sortColumn !== "default") {
      result.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";
        switch (sortColumn) {
          case "enrollment":
            valA = a.enrollmentNumber || "";
            valB = b.enrollmentNumber || "";
            break;
          case "admissionNo":
            valA = a.admissionNumber || "";
            valB = b.admissionNumber || "";
            break;
          case "name":
            valA = a.name || "";
            valB = b.name || "";
            break;
          case "school":
            valA = a.department || "";
            valB = b.department || "";
            break;
          case "programme":
            valA = a.programme || "";
            valB = b.programme || "";
            break;
          case "gender":
            valA = a.gender || "";
            valB = b.gender || "";
            break;
          case "internals":
            valA = a.internalMarks ?? 0;
            valB = b.internalMarks ?? 0;
            break;
          case "externals":
            valA = a.externalMarks ?? 0;
            valB = b.externalMarks ?? 0;
            break;
          case "attendance":
            valA = a.attendancePercent ?? 100;
            valB = b.attendancePercent ?? 100;
            break;
          case "total":
            valA = (a.internalMarks ?? 0) + (a.externalMarks ?? 0);
            valB = (b.internalMarks ?? 0) + (b.externalMarks ?? 0);
            break;
          case "status":
            valA = a.registration ? "Registered" : "Unregistered";
            valB = b.registration ? "Registered" : "Unregistered";
            break;
          case "project":
            valA = a.registration?.project?.projectId || "";
            valB = b.registration?.project?.projectId || "";
            break;
        }
        if (valA === valB) return 0;
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }
        const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [students, searchQuery, schoolFilter, statusFilter, sortColumn, sortOrder]);

  // 3. FACULTY
  const filteredFaculty = useMemo(() => {
    let result = [...faculty];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name?.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q) ||
          f.department?.toLowerCase().includes(q) ||
          f.phone?.toLowerCase().includes(q) ||
          f.spocDepartment?.toLowerCase().includes(q)
      );
    }

    if (schoolFilter !== "all") {
      result = result.filter((f) => f.department === schoolFilter);
    }

    if (statusFilter === "admin") {
      result = result.filter((f) => f.isAdmin);
    } else if (statusFilter === "spoc") {
      result = result.filter((f) => f.isSpoc);
    } else if (statusFilter === "regular") {
      result = result.filter((f) => !f.isAdmin && !f.isSpoc);
    }

    if (sortColumn !== "default") {
      result.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";
        switch (sortColumn) {
          case "name":
            valA = a.name || "";
            valB = b.name || "";
            break;
          case "email":
            valA = a.email || "";
            valB = b.email || "";
            break;
          case "school":
            valA = a.department || "";
            valB = b.department || "";
            break;
          case "phone":
            valA = a.phone || "";
            valB = b.phone || "";
            break;
          case "projectsCount":
            valA = a.projects?.length || 0;
            valB = b.projects?.length || 0;
            break;
          case "studentsCount":
            valA = a.projects?.reduce((acc: number, p: any) => acc + (p._count?.registrations || 0), 0) || 0;
            valB = b.projects?.reduce((acc: number, p: any) => acc + (p._count?.registrations || 0), 0) || 0;
            break;
          case "isAdmin":
            valA = a.isAdmin ? 1 : 0;
            valB = b.isAdmin ? 1 : 0;
            break;
          case "isSpoc":
            valA = a.isSpoc ? 1 : 0;
            valB = b.isSpoc ? 1 : 0;
            break;
        }
        if (valA === valB) return 0;
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }
        const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [faculty, searchQuery, schoolFilter, statusFilter, sortColumn, sortOrder]);

  // 4. PROJECTS
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.projectId?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.department?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.theme?.toLowerCase().includes(q) ||
          p.faculty?.name?.toLowerCase().includes(q) ||
          p.faculty?.email?.toLowerCase().includes(q)
      );
    }

    if (schoolFilter !== "all") {
      result = result.filter((p) => p.department === schoolFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.submissionStatus?.toLowerCase() === statusFilter.toLowerCase());
    }

    if (sortColumn !== "default") {
      result.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";
        switch (sortColumn) {
          case "projectCode":
            valA = a.projectId || "";
            valB = b.projectId || "";
            break;
          case "projectTitle":
            valA = a.title || "";
            valB = b.title || "";
            break;
          case "school":
            valA = a.department || "";
            valB = b.department || "";
            break;
          case "category":
            valA = a.category || "";
            valB = b.category || "";
            break;
          case "theme":
            valA = a.theme || "";
            valB = b.theme || "";
            break;
          case "facultyName":
            valA = a.faculty?.name || "";
            valB = b.faculty?.name || "";
            break;
          case "enrolledCount":
            valA = a._count?.registrations || 0;
            valB = b._count?.registrations || 0;
            break;
          case "status":
            valA = a.submissionStatus || "";
            valB = b.submissionStatus || "";
            break;
        }
        if (valA === valB) return 0;
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }
        const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [projects, searchQuery, schoolFilter, categoryFilter, statusFilter, sortColumn, sortOrder]);

  // Current active filtered list
  const activeFilteredRows = useMemo(() => {
    switch (activeTab) {
      case "MAPPINGS":
        return filteredMappings;
      case "STUDENTS":
        return filteredStudents;
      case "FACULTY":
        return filteredFaculty;
      case "PROJECTS":
        return filteredProjects;
    }
  }, [activeTab, filteredMappings, filteredStudents, filteredFaculty, filteredProjects]);

  // Pagination slice
  const paginatedRows = useMemo(() => {
    if (pageSize >= 99999) return activeFilteredRows;
    const start = (currentPage - 1) * pageSize;
    return activeFilteredRows.slice(start, start + pageSize);
  }, [activeFilteredRows, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(activeFilteredRows.length / (pageSize >= 99999 ? 1 : pageSize)));

  // Format dataset rows for export
  const formatRowsForExport = (rows: any[]) => {
    switch (activeTab) {
      case "MAPPINGS":
        return rows.map((r, i) => ({
          "Sr.": i + 1,
          "Enrollment Number": r.student?.enrollmentNumber || "",
          "Admission No.": r.student?.admissionNumber || "",
          "Student Name": r.student?.name || "",
          "Student School": r.student?.department || "",
          "Programme": r.student?.programme || "",
          "Project Code": r.project?.projectId || "",
          "Project Title": r.project?.title || "",
          "Category": r.project?.category || "",
          "Theme": r.project?.theme || "",
          "Faculty Mentor": r.project?.faculty?.name || "",
          "Faculty School": r.project?.faculty?.department || "",
          "Faculty Email": r.project?.faculty?.email || "",
          "Faculty Phone": r.project?.faculty?.phone || "",
          "Allocation Date": r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "",
          "Status": r.status || "Approved",
        }));
      case "STUDENTS":
        return rows.map((s, i) => ({
          "Sr.": i + 1,
          "Enrollment Number": s.enrollmentNumber,
          "Admission No.": s.admissionNumber || "",
          "Student Name": s.name,
          "School / Department": s.department,
          "Programme": s.programme || "",
          "Gender": s.gender || "",
          "Internal Marks": s.internalMarks ?? 0,
          "External Marks": s.externalMarks ?? 0,
          "Total Marks": (s.internalMarks ?? 0) + (s.externalMarks ?? 0),
          "Attendance %": s.attendancePercent ?? 100,
          "Semester": s.semester,
          "Batch": s.batch,
          "Academic Year": s.academicYear,
          "Email": s.email || "",
          "Phone": s.phone || "",
          "Status": s.registration ? "Registered" : "Unregistered",
          "Allocated Project Code": s.registration?.project?.projectId || "",
          "Allocated Project Title": s.registration?.project?.title || "",
          "Faculty Mentor": s.registration?.project?.faculty?.name || "",
        }));
      case "FACULTY":
        return rows.map((f, i) => ({
          "Sr.": i + 1,
          "Faculty Name": f.name,
          "Official Email": f.email,
          "School / Department": f.department,
          "Contact Phone": f.phone || "",
          "Is Admin": f.isAdmin ? "Yes" : "No",
          "Is SPOC": f.isSpoc ? "Yes" : "No",
          "SPOC Department": f.spocDepartment || "",
          "Total Projects": f.projects?.length || 0,
          "Mapped Students": f.projects?.reduce((acc: number, p: any) => acc + (p._count?.registrations || 0), 0) || 0,
          "Projects Offered": f.projects?.map((p: any) => p.projectId).join(", ") || "",
        }));
      case "PROJECTS":
        return rows.map((p, i) => ({
          "Sr.": i + 1,
          "Project Code": p.projectId,
          "Project Title": p.title,
          "Department": p.department,
          "Category": p.category,
          "Theme": p.theme,
          "Faculty Mentor": p.faculty?.name || "",
          "Mentor Email": p.faculty?.email || "",
          "Enrolled Students": p._count?.registrations || 0,
          "Capacity": p.maxSeats || "N/A",
          "Submission Status": p.submissionStatus,
        }));
    }
  };

  // Export handlers
  const handleExportSelection = (format: "xlsx" | "csv" | "json") => {
    if (selectedIds.size === 0) {
      alert("Please select at least one row using the checkboxes.");
      return;
    }
    const selectedRows = activeFilteredRows.filter((r) => selectedIds.has(r.id));
    const formatted = formatRowsForExport(selectedRows);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `GDGU_${activeTab}_Selected_${selectedRows.length}_Records_${dateStr}`;

    if (format === "xlsx") exportToXlsx(formatted, filename, activeTab);
    else if (format === "csv") exportToCsv(formatted, filename);
    else if (format === "json") exportToJson(formatted, filename);
  };

  const handleExportFiltered = (format: "xlsx" | "csv" | "json" | "pdf") => {
    if (activeFilteredRows.length === 0) {
      alert("No records to export with current filters.");
      return;
    }
    const formatted = formatRowsForExport(activeFilteredRows);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `GDGU_${activeTab}_Master_${formatted.length}_Records_${dateStr}`;

    if (format === "xlsx") exportToXlsx(formatted, filename, activeTab);
    else if (format === "csv") exportToCsv(formatted, filename);
    else if (format === "json") exportToJson(formatted, filename);
    else if (format === "pdf") exportToPdf(formatted, `GDGU IDP ${activeTab} Master Directory`);
  };

  const renderSortIndicator = (col: string) => {
    if (sortColumn !== col) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400 inline ml-1 opacity-60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#c59b27] inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#c59b27] inline ml-1" />
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card space-y-6 animate-in fade-in duration-200">
      {/* ── Top Header & Master Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#c59b27]/15 text-[#916d12] flex items-center gap-1 border border-[#c59b27]/30">
              <Sparkles className="w-3 h-3" />
              <span>Database Central Master</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Academic Session {activeAcademicYear}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0a192f] tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-[#c59b27]" />
            <span>Institutional Database &amp; Cross-Mappings Console</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full-spectrum query engine for student rosters, faculty credentials, project proposals, and mentor mappings with multi-format export and fine-grained CRUD.
          </p>
        </div>

        {/* 1-Click Master Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={exportingOneClick}
            onClick={handleExportAllOneClick}
            className="tactile-btn px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0a192f] to-[#162a45] text-white hover:from-[#162a45] hover:to-[#0a192f] text-xs font-extrabold flex items-center gap-2 shadow-elevated border border-[#c59b27]/40 transition-all disabled:opacity-50"
            title="Download complete university database across all tables in a single structured Excel workbook"
          >
            {exportingOneClick ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#c59b27]" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-[#c59b27]" />
            )}
            <span>Export All Database (1-Click)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWipeError(null);
              setWipeSuccess(null);
              setWipeConfirmInput("");
              setShowSafeWipeModal(true);
            }}
            className="tactile-btn px-3.5 py-2.5 rounded-2xl border border-rose-300 bg-rose-50/80 text-rose-900 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 shadow-subtle transition-all"
            title="Export complete database backup first, then safely wipe student records, projects, and/or uploaded files"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Safe Wipe &amp; Clean Slate (Export First)</span>
          </button>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => fetchDatabaseMaster(true)}
            className="tactile-btn px-3 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-subtle transition-all"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={onOpenDataModal}
            className="tactile-btn px-3 py-2.5 rounded-2xl border border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 shadow-subtle transition-all"
            title="Open Disaster Recovery & Data Purge Controls"
          >
            <Archive className="w-3.5 h-3.5 text-amber-700" />
            <span>Purge &amp; Archive</span>
          </button>
        </div>
      </div>

      {/* ── Safe Wipe Success Banner ── */}
      {wipeSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{wipeSuccess}</span>
          </div>
          <button
            onClick={() => setWipeSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Quick KPI Metric Badges ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => handleTabChange("MAPPINGS")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "MAPPINGS"
              ? "bg-[#0a192f] text-white border-[#0a192f] shadow-md"
              : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              Allocated Mappings
            </span>
            <Layers className={`w-3.5 h-3.5 ${activeTab === "MAPPINGS" ? "text-[#c59b27]" : "text-slate-400"}`} />
          </div>
          <div className="text-xl font-black mt-1 tabular-nums">
            {loading ? "..." : registrations.length.toLocaleString()}
          </div>
          <div className="text-[10px] opacity-70 mt-0.5">Student ⇄ Mentor pairs</div>
        </div>

        <div
          onClick={() => handleTabChange("STUDENTS")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "STUDENTS"
              ? "bg-[#0a192f] text-white border-[#0a192f] shadow-md"
              : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              Students Roster
            </span>
            <GraduationCap className={`w-3.5 h-3.5 ${activeTab === "STUDENTS" ? "text-[#c59b27]" : "text-slate-400"}`} />
          </div>
          <div className="text-xl font-black mt-1 tabular-nums">
            {loading ? "..." : students.length.toLocaleString()}
          </div>
          <div className="text-[10px] opacity-70 mt-0.5">Enrolled candidates</div>
        </div>

        <div
          onClick={() => handleTabChange("FACULTY")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "FACULTY"
              ? "bg-[#0a192f] text-white border-[#0a192f] shadow-md"
              : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              Faculty Directory
            </span>
            <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === "FACULTY" ? "text-[#c59b27]" : "text-slate-400"}`} />
          </div>
          <div className="text-xl font-black mt-1 tabular-nums">
            {loading ? "..." : faculty.length.toLocaleString()}
          </div>
          <div className="text-[10px] opacity-70 mt-0.5">Mentors &amp; SPOCs</div>
        </div>

        <div
          onClick={() => handleTabChange("PROJECTS")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "PROJECTS"
              ? "bg-[#0a192f] text-white border-[#0a192f] shadow-md"
              : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              Projects Catalog
            </span>
            <FolderKanban className={`w-3.5 h-3.5 ${activeTab === "PROJECTS" ? "text-[#c59b27]" : "text-slate-400"}`} />
          </div>
          <div className="text-xl font-black mt-1 tabular-nums">
            {loading ? "..." : projects.length.toLocaleString()}
          </div>
          <div className="text-[10px] opacity-70 mt-0.5">Proposals &amp; Themes</div>
        </div>
      </div>

      {/* ── Sub-Tab Segmented Selector ── */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto border border-slate-200/70">
        <button
          type="button"
          onClick={() => handleTabChange("MAPPINGS")}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "MAPPINGS"
              ? "bg-white text-[#0a192f] shadow-subtle border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#c59b27]" />
          <span>1. All Mappings &amp; Allocations</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700 font-bold">
            {registrations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("STUDENTS")}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "STUDENTS"
              ? "bg-white text-[#0a192f] shadow-subtle border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-[#c59b27]" />
          <span>2. Students Master</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700 font-bold">
            {students.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("FACULTY")}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "FACULTY"
              ? "bg-white text-[#0a192f] shadow-subtle border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#c59b27]" />
          <span>3. Faculty &amp; Credentials</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700 font-bold">
            {faculty.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("PROJECTS")}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "PROJECTS"
              ? "bg-white text-[#0a192f] shadow-subtle border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5 text-[#c59b27]" />
          <span>4. Projects Catalog</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700 font-bold">
            {projects.length}
          </span>
        </button>
      </div>

      {/* ── Search, Filters, Multi-Export, and Add Controls Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Universal Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()} across any field...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a192f]"
            />
          </div>

          {/* School Filter Dropdown */}
          <select
            value={schoolFilter}
            onChange={(e) => {
              setSchoolFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f]"
          >
            <option value="all">All Schools / Departments</option>
            {distinctSchools.map((sch) => (
              <option key={sch} value={sch}>
                {sch}
              </option>
            ))}
          </select>

          {/* Status / Category Filter Dropdowns */}
          {activeTab === "MAPPINGS" && (
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f]"
            >
              <option value="all">All Categories</option>
              <option value="IDP2501">IDP2501 (Engineering)</option>
              <option value="IDP2502">IDP2502 (Non-Eng / Design)</option>
            </select>
          )}

          {activeTab === "STUDENTS" && (
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f]"
            >
              <option value="all">All Allocation Status</option>
              <option value="registered">Registered / Mapped</option>
              <option value="unregistered">Unregistered</option>
            </select>
          )}

          {activeTab === "FACULTY" && (
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f]"
            >
              <option value="all">All Faculty Roles</option>
              <option value="admin">Administrators</option>
              <option value="spoc">SPOCs</option>
              <option value="regular">Regular Mentors</option>
            </select>
          )}

          {activeTab === "PROJECTS" && (
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f]"
            >
              <option value="all">All Categories</option>
              <option value="IDP2501">IDP2501</option>
              <option value="IDP2502">IDP2502</option>
            </select>
          )}
        </div>

        {/* Right side: Export filtered & Add Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Export Tab Dropdown */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleExportFiltered("xlsx")}
              className="tactile-btn px-2.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 shadow-subtle"
              title="Export filtered records as Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportFiltered("csv")}
              className="tactile-btn px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 shadow-subtle"
              title="Export filtered records as CSV (.csv)"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportFiltered("json")}
              className="tactile-btn px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 shadow-subtle"
              title="Export filtered records as JSON (.json)"
            >
              <Code className="w-3.5 h-3.5 text-slate-600" />
              <span>JSON</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportFiltered("pdf")}
              className="tactile-btn px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 shadow-subtle"
              title="Print or export as PDF report"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>PDF</span>
            </button>
          </div>

          {/* Add Faculty Action Button */}
          {activeTab === "FACULTY" && (
            <button
              type="button"
              onClick={onAddFaculty}
              className="tactile-btn px-3 py-2 rounded-xl bg-[#0a192f] text-white hover:bg-[#162a45] text-xs font-bold flex items-center gap-1.5 shadow-subtle ml-1"
            >
              <Plus className="w-3.5 h-3.5 text-[#c59b27]" />
              <span>Add Faculty</span>
            </button>
          )}

          {/* Map Student Action Button */}
          {activeTab === "MAPPINGS" && onMapStudent && (
            <button
              type="button"
              onClick={() => onMapStudent()}
              className="tactile-btn px-3 py-2 rounded-xl bg-[#0a192f] text-white hover:bg-[#162a45] text-xs font-bold flex items-center gap-1.5 shadow-subtle ml-1"
            >
              <Layers className="w-3.5 h-3.5 text-[#c59b27]" />
              <span>+ Map Student</span>
            </button>
          )}

          {/* Add Student Action Button */}
          {activeTab === "STUDENTS" && (
            <button
              type="button"
              onClick={onAddStudent}
              className="tactile-btn px-3 py-2 rounded-xl bg-[#0a192f] text-white hover:bg-[#162a45] text-xs font-bold flex items-center gap-1.5 shadow-subtle ml-1"
            >
              <Plus className="w-3.5 h-3.5 text-[#c59b27]" />
              <span>Add Student</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Selection Action Ribbon (Sticky when items selected) ── */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-amber-50/90 border border-amber-300/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#c59b27] text-white flex items-center justify-center text-xs font-bold font-mono">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold text-amber-950">
              {selectedIds.size} record{selectedIds.size > 1 ? "s" : ""} selected for custom export
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleExportSelection("xlsx")}
              className="tactile-btn px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-subtle"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Selected (Excel)</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportSelection("csv")}
              className="tactile-btn px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1 shadow-subtle"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Selected (CSV)</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportSelection("json")}
              className="tactile-btn px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1 shadow-subtle"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Export Selected (JSON)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="tactile-btn px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-amber-100/60 text-xs font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Table Container ── */}
      <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#c59b27]" />
            <p className="text-xs text-slate-500 font-medium">Loading unified database master records...</p>
          </div>
        ) : activeFilteredRows.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Database className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No matching records found.</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or resetting filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            {/* ── TAB 1: ALL MAPPINGS TABLE ── */}
            {activeTab === "MAPPINGS" && (
              <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                <thead className="sticky top-0 z-10 bg-[#0a192f] text-white">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectAll(activeFilteredRows)}
                        className="text-white hover:text-[#c59b27]"
                        title="Select / Deselect All Visible"
                      >
                        {selectedIds.size === activeFilteredRows.length && activeFilteredRows.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#c59b27]" />
                        ) : (
                          <Square className="w-4 h-4 opacity-70" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-2 text-slate-400 font-semibold w-12">#</th>
                    <th
                      onClick={() => handleSort("enrollment")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>ENROLLMENT</span>
                      {renderSortIndicator("enrollment")}
                    </th>
                    <th
                      onClick={() => handleSort("name")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>STUDENT NAME</span>
                      {renderSortIndicator("name")}
                    </th>
                    <th
                      onClick={() => handleSort("school")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>STUDENT SCHOOL</span>
                      {renderSortIndicator("school")}
                    </th>
                    <th
                      onClick={() => handleSort("projectCode")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>PROJECT CODE</span>
                      {renderSortIndicator("projectCode")}
                    </th>
                    <th
                      onClick={() => handleSort("projectTitle")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>PROJECT TITLE</span>
                      {renderSortIndicator("projectTitle")}
                    </th>
                    <th
                      onClick={() => handleSort("category")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>CATEGORY</span>
                      {renderSortIndicator("category")}
                    </th>
                    <th
                      onClick={() => handleSort("facultyName")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>FACULTY MENTOR</span>
                      {renderSortIndicator("facultyName")}
                    </th>
                    <th
                      onClick={() => handleSort("facultyDept")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>FACULTY SCHOOL</span>
                      {renderSortIndicator("facultyDept")}
                    </th>
                    <th
                      onClick={() => handleSort("date")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>ALLOCATED DATE</span>
                      {renderSortIndicator("date")}
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="py-3 px-3 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>STATUS</span>
                      {renderSortIndicator("status")}
                    </th>
                    {(onMapStudent || onUnmapStudent) && (
                      <th className="py-3 px-3 font-semibold text-center">ACTIONS</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedRows.map((r, idx) => {
                    const rowIdx = (currentPage - 1) * pageSize + idx + 1;
                    const isSelected = selectedIds.has(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          isSelected ? "bg-amber-50/50" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(r.id)}
                            className="rounded border-slate-300 text-[#0a192f] focus:ring-[#0a192f] w-3.5 h-3.5"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-slate-400 font-mono text-[11px]">{rowIdx}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0a192f]">
                          {r.student?.enrollmentNumber}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {r.student?.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[180px] truncate" title={r.student?.department}>
                          {r.student?.department}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#0a192f]/10 text-[#0a192f] border border-[#0a192f]/20">
                            {r.project?.projectId}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[220px] truncate" title={r.project?.title}>
                          {r.project?.title}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {r.project?.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#0a192f]">
                          {r.project?.faculty?.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[160px] truncate" title={r.project?.faculty?.department}>
                          {r.project?.faculty?.department}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {r.status || "Approved"}
                          </span>
                        </td>
                        {(onMapStudent || onUnmapStudent) && (
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {onMapStudent && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onMapStudent({
                                      id: r.student?.id,
                                      enrollment: r.student?.enrollmentNumber,
                                      name: r.student?.name,
                                      department: r.student?.department,
                                      projectCode: r.project?.projectId,
                                      projectId: r.project?.id,
                                      facultyName: r.project?.faculty?.name,
                                      registered: true,
                                      registrationId: r.id,
                                    })
                                  }
                                  className="p-1 rounded-lg text-slate-600 hover:text-[#0a192f] hover:bg-slate-100"
                                  title="Reassign Project Guide"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onUnmapStudent && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUnmapStudent({
                                      id: r.student?.id,
                                      enrollment: r.student?.enrollmentNumber,
                                      name: r.student?.name,
                                      projectCode: r.project?.projectId,
                                      registrationId: r.id,
                                      facultyName: r.project?.faculty?.name,
                                    })
                                  }
                                  className="p-1 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                  title="Unmap / Free Allocation"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* ── TAB 2: STUDENTS MASTER TABLE ── */}
            {activeTab === "STUDENTS" && (
              <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                <thead className="sticky top-0 z-10 bg-[#0a192f] text-white">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectAll(activeFilteredRows)}
                        className="text-white hover:text-[#c59b27]"
                        title="Select / Deselect All Visible"
                      >
                        {selectedIds.size === activeFilteredRows.length && activeFilteredRows.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#c59b27]" />
                        ) : (
                          <Square className="w-4 h-4 opacity-70" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-2 text-slate-400 font-semibold w-12">#</th>
                    <th
                      onClick={() => handleSort("enrollment")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>ENROLLMENT</span>
                      {renderSortIndicator("enrollment")}
                    </th>
                    <th
                      onClick={() => handleSort("name")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>NAME</span>
                      {renderSortIndicator("name")}
                    </th>
                    <th
                      onClick={() => handleSort("school")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>SCHOOL / DEPT</span>
                      {renderSortIndicator("school")}
                    </th>
                    <th
                      onClick={() => handleSort("programme")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>PROGRAMME</span>
                      {renderSortIndicator("programme")}
                    </th>
                    <th
                      onClick={() => handleSort("gender")}
                      className="py-3 px-2 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>GENDER</span>
                      {renderSortIndicator("gender")}
                    </th>
                    <th
                      onClick={() => handleSort("internals")}
                      className="py-3 px-2 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>INT (50)</span>
                      {renderSortIndicator("internals")}
                    </th>
                    <th
                      onClick={() => handleSort("externals")}
                      className="py-3 px-2 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>EXT (50)</span>
                      {renderSortIndicator("externals")}
                    </th>
                    <th
                      onClick={() => handleSort("total")}
                      className="py-3 px-2 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>TOT (100)</span>
                      {renderSortIndicator("total")}
                    </th>
                    <th
                      onClick={() => handleSort("attendance")}
                      className="py-3 px-2 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>ATT %</span>
                      {renderSortIndicator("attendance")}
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="py-3 px-3 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>ALLOCATION</span>
                      {renderSortIndicator("status")}
                    </th>
                    <th className="py-3 px-3 font-semibold">MENTOR</th>
                    <th className="py-3 px-3 font-semibold text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedRows.map((s, idx) => {
                    const rowIdx = (currentPage - 1) * pageSize + idx + 1;
                    const isSelected = selectedIds.has(s.id);
                    const totalMarks = (s.internalMarks ?? 0) + (s.externalMarks ?? 0);
                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          isSelected ? "bg-amber-50/50" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(s.id)}
                            className="rounded border-slate-300 text-[#0a192f] focus:ring-[#0a192f] w-3.5 h-3.5"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-slate-400 font-mono text-[11px]">{rowIdx}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0a192f]">
                          {s.enrollmentNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {s.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[160px] truncate" title={s.department}>
                          {s.department}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[180px] truncate" title={s.programme}>
                          {s.programme || "—"}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600 font-medium">
                          {s.gender || "—"}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                          {s.internalMarks ?? 0}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                          {s.externalMarks ?? 0}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-[#0a192f]">
                          {totalMarks}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              (s.attendancePercent ?? 100) >= 75
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {s.attendancePercent ?? 100}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {s.registration ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {s.registration.project?.projectId || "Allocated"}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Unregistered
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 max-w-[140px] truncate">
                          {s.registration?.project?.faculty?.name || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {onMapStudent && (
                              <button
                                type="button"
                                onClick={() =>
                                  onMapStudent({
                                    id: s.id,
                                    enrollment: s.enrollmentNumber,
                                    name: s.name,
                                    department: s.department,
                                    projectCode: s.registration?.project?.projectId,
                                    projectId: s.registration?.project?.id,
                                    facultyName: s.registration?.project?.faculty?.name,
                                    registered: !!s.registration,
                                    registrationId: s.registration?.id,
                                  })
                                }
                                className="p-1 rounded text-slate-600 hover:text-[#0a192f] hover:bg-slate-100"
                                title={s.registration ? "Reassign Project Guide" : "Map to Project Guide"}
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                onEditStudent({
                                  id: s.id,
                                  enrollment: s.enrollmentNumber,
                                  name: s.name,
                                  department: s.department,
                                  program: s.programme,
                                  gender: s.gender,
                                  internals: s.internalMarks,
                                  externals: s.externalMarks,
                                  attendance: s.attendancePercent,
                                  sem: s.semester,
                                  batch: s.batch,
                                  academicYear: s.academicYear,
                                })
                              }
                              className="p-1 rounded text-slate-600 hover:text-[#0a192f] hover:bg-slate-100"
                              title="Edit Student"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onDeleteStudent({
                                  id: s.id,
                                  enrollment: s.enrollmentNumber,
                                  name: s.name,
                                })
                              }
                              className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* ── TAB 3: FACULTY MASTER & CREDENTIALS TABLE ── */}
            {activeTab === "FACULTY" && (
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                <thead className="sticky top-0 z-10 bg-[#0a192f] text-white">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectAll(activeFilteredRows)}
                        className="text-white hover:text-[#c59b27]"
                        title="Select / Deselect All Visible"
                      >
                        {selectedIds.size === activeFilteredRows.length && activeFilteredRows.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#c59b27]" />
                        ) : (
                          <Square className="w-4 h-4 opacity-70" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-2 text-slate-400 font-semibold w-12">#</th>
                    <th
                      onClick={() => handleSort("name")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>FACULTY NAME</span>
                      {renderSortIndicator("name")}
                    </th>
                    <th
                      onClick={() => handleSort("email")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>OFFICIAL EMAIL</span>
                      {renderSortIndicator("email")}
                    </th>
                    <th
                      onClick={() => handleSort("school")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>DEPARTMENT / SCHOOL</span>
                      {renderSortIndicator("school")}
                    </th>
                    <th
                      onClick={() => handleSort("phone")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>PHONE</span>
                      {renderSortIndicator("phone")}
                    </th>
                    <th
                      onClick={() => handleSort("isAdmin")}
                      className="py-3 px-2 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>ADMIN ROLE</span>
                      {renderSortIndicator("isAdmin")}
                    </th>
                    <th
                      onClick={() => handleSort("isSpoc")}
                      className="py-3 px-2 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>SPOC STATUS</span>
                      {renderSortIndicator("isSpoc")}
                    </th>
                    <th
                      onClick={() => handleSort("projectsCount")}
                      className="py-3 px-2 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>PROJECTS</span>
                      {renderSortIndicator("projectsCount")}
                    </th>
                    <th
                      onClick={() => handleSort("studentsCount")}
                      className="py-3 px-2 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>MAPPED STUDENTS</span>
                      {renderSortIndicator("studentsCount")}
                    </th>
                    <th className="py-3 px-3 font-semibold text-center">CREDENTIALS &amp; ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedRows.map((f, idx) => {
                    const rowIdx = (currentPage - 1) * pageSize + idx + 1;
                    const isSelected = selectedIds.has(f.id);
                    const totalStudents =
                      f.projects?.reduce((acc: number, p: any) => acc + (p._count?.registrations || 0), 0) || 0;
                    return (
                      <tr
                        key={f.id}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          isSelected ? "bg-amber-50/50" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(f.id)}
                            className="rounded border-slate-300 text-[#0a192f] focus:ring-[#0a192f] w-3.5 h-3.5"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-slate-400 font-mono text-[11px]">{rowIdx}</td>
                        <td className="py-2.5 px-3 font-bold text-[#0a192f]">
                          {f.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {f.email}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[180px] truncate" title={f.department}>
                          {f.department}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {f.phone || "—"}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => onToggleFacultyAdmin(f.id, f.isAdmin)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                              f.isAdmin
                                ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                            title="Click to toggle Admin status"
                          >
                            {f.isAdmin ? "Admin (Revoke)" : "Grant"}
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {f.isSpoc ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                              SPOC: {f.spocDepartment || f.department}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                            {f.projects?.length || 0}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {totalStudents}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit Name & Profile */}
                            <button
                              type="button"
                              onClick={() => onEditFaculty(f)}
                              className="p-1 rounded-lg text-slate-600 hover:text-[#0a192f] hover:bg-slate-100"
                              title="Edit Faculty Name & Profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset / Edit Password */}
                            <button
                              type="button"
                              onClick={() => onResetFacultyPasscode(f)}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-[#0a192f]/5 text-[#0a192f] hover:bg-[#0a192f] hover:text-white transition-all flex items-center gap-1"
                              title="Edit or Reset Faculty Password"
                            >
                              <KeyRound className="w-3 h-3 text-[#c59b27]" />
                              <span>Password</span>
                            </button>

                            {/* Remove Faculty */}
                            <button
                              type="button"
                              onClick={() => onDeleteFaculty(f)}
                              className="p-1 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Remove Faculty"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* ── TAB 4: PROJECTS MASTER TABLE ── */}
            {activeTab === "PROJECTS" && (
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                <thead className="sticky top-0 z-10 bg-[#0a192f] text-white">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectAll(activeFilteredRows)}
                        className="text-white hover:text-[#c59b27]"
                        title="Select / Deselect All Visible"
                      >
                        {selectedIds.size === activeFilteredRows.length && activeFilteredRows.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#c59b27]" />
                        ) : (
                          <Square className="w-4 h-4 opacity-70" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-2 text-slate-400 font-semibold w-12">#</th>
                    <th
                      onClick={() => handleSort("projectCode")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>CODE</span>
                      {renderSortIndicator("projectCode")}
                    </th>
                    <th
                      onClick={() => handleSort("projectTitle")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>PROJECT TITLE</span>
                      {renderSortIndicator("projectTitle")}
                    </th>
                    <th
                      onClick={() => handleSort("school")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>DEPARTMENT</span>
                      {renderSortIndicator("school")}
                    </th>
                    <th
                      onClick={() => handleSort("category")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>CATEGORY</span>
                      {renderSortIndicator("category")}
                    </th>
                    <th
                      onClick={() => handleSort("theme")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>THEME</span>
                      {renderSortIndicator("theme")}
                    </th>
                    <th
                      onClick={() => handleSort("facultyName")}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>FACULTY MENTOR</span>
                      {renderSortIndicator("facultyName")}
                    </th>
                    <th
                      onClick={() => handleSort("enrolledCount")}
                      className="py-3 px-2 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>ENROLLED</span>
                      {renderSortIndicator("enrolledCount")}
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="py-3 px-3 font-semibold text-center cursor-pointer group hover:bg-[#162a45]"
                    >
                      <span>SUBMISSION</span>
                      {renderSortIndicator("status")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedRows.map((p, idx) => {
                    const rowIdx = (currentPage - 1) * pageSize + idx + 1;
                    const isSelected = selectedIds.has(p.id);
                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          isSelected ? "bg-amber-50/50" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(p.id)}
                            className="rounded border-slate-300 text-[#0a192f] focus:ring-[#0a192f] w-3.5 h-3.5"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-slate-400 font-mono text-[11px]">{rowIdx}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0a192f]">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] bg-[#0a192f]/10 text-[#0a192f] border border-[#0a192f]/20">
                            {p.projectId}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 max-w-[240px] truncate" title={p.title}>
                          {p.title}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[160px] truncate" title={p.department}>
                          {p.department}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-[180px] truncate" title={p.theme}>
                          {p.theme}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#0a192f]">
                          {p.faculty?.name}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-[#0a192f]">
                          {p._count?.registrations ?? 0}
                          {p.maxSeats ? ` / ${p.maxSeats}` : ""}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              p.submissionStatus === "SUBMITTED" || p.submissionStatus === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {p.submissionStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Pagination Bar ── */}
        {!loading && activeFilteredRows.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#0a192f]"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={999999}>All ({activeFilteredRows.length})</option>
              </select>
              <span>entries per page</span>
              <span className="text-slate-400 ml-2">
                (Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, activeFilteredRows.length)} of{" "}
                {activeFilteredRows.length.toLocaleString()})
              </span>
            </div>

            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              totalItems={activeFilteredRows.length}
              onPageChange={(p) => setCurrentPage(p)}
              disabled={loading}
            />
          </div>
        )}
      </div>

      {/* ── Safe Wipe Dialog (Export First -> Delete Students & Uploads) ── */}
      {showSafeWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <div className="w-12 h-1 bg-rose-500 rounded-full" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0a192f]">
                    Wipe Students &amp; Uploads
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automated Safe Mode: Full database backup is exported first.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSafeWipeModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Safety Guarantee Callout */}
            <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Safety First Guarantee</span>
              </div>
              <p className="leading-relaxed text-emerald-800">
                A verified full backup of all tables (Students, Faculty, Projects, Allocations, and Metadata) in <strong>.xlsx format</strong> will be automatically downloaded to your computer <strong>BEFORE</strong> any deletion happens. If the export fails, no records or files will be modified.
              </p>
            </div>

            {/* Scope Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data Scope to Wipe
              </label>
              <select
                value={wipeScope}
                onChange={(e) => setWipeScope(e.target.value as PurgeScope)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="STUDENTS_PROJECTS_UPLOADS">
                  Students + Projects + Uploads (Clean Slate — Preserves Faculty Logins)
                </option>
                <option value="PROJECTS">
                  Projects &amp; Submissions Only (Preserves Students &amp; Faculty)
                </option>
                <option value="STUDENTS_AND_UPLOADS">
                  Students &amp; Uploads Only (Preserves Project Proposals)
                </option>
                <option value="ALL">
                  Complete University Purge (Deletes Everything incl. Faculty)
                </option>
              </select>
            </div>

            {/* Records Impact Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Records Scheduled for Removal
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className={`p-2.5 rounded-2xl border ${wipeScope !== "PROJECTS" ? "bg-rose-50/70 border-rose-200/80" : "bg-slate-50 border-slate-200 opacity-50"}`}>
                  <div className={`text-lg font-black ${wipeScope !== "PROJECTS" ? "text-rose-900" : "text-slate-400"}`}>
                    {wipeScope !== "PROJECTS" ? (snapshot?.students ?? students.length) : "—"}
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${wipeScope !== "PROJECTS" ? "text-rose-700" : "text-slate-500"}`}>
                    Students
                  </div>
                </div>

                <div className={`p-2.5 rounded-2xl border ${wipeScope !== "PROJECTS" ? "bg-rose-50/70 border-rose-200/80" : "bg-slate-50 border-slate-200 opacity-50"}`}>
                  <div className={`text-lg font-black ${wipeScope !== "PROJECTS" ? "text-rose-900" : "text-slate-400"}`}>
                    {wipeScope !== "PROJECTS" ? (snapshot?.registrations ?? registrations.length) : "—"}
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${wipeScope !== "PROJECTS" ? "text-rose-700" : "text-slate-500"}`}>
                    Allocations
                  </div>
                </div>

                <div className={`p-2.5 rounded-2xl border ${wipeScope !== "STUDENTS_AND_UPLOADS" ? "bg-rose-50/70 border-rose-200/80" : "bg-slate-50 border-slate-200 opacity-50"}`}>
                  <div className={`text-lg font-black ${wipeScope !== "STUDENTS_AND_UPLOADS" ? "text-rose-900" : "text-slate-400"}`}>
                    {wipeScope !== "STUDENTS_AND_UPLOADS" ? (snapshot?.projects ?? projects.length) : "—"}
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${wipeScope !== "STUDENTS_AND_UPLOADS" ? "text-rose-700" : "text-slate-500"}`}>
                    Projects
                  </div>
                </div>

                <div className="bg-rose-50/70 p-2.5 rounded-2xl border border-rose-200/80">
                  <div className="text-lg font-black text-rose-900">
                    {snapshot?.artifacts ?? 0}
                  </div>
                  <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mt-0.5">
                    Uploaded Files
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
                <span>Faculty Accounts &amp; Logins:</span>
                {wipeScope === "ALL" ? (
                  <strong className="text-rose-700">Deleting ({faculty.length} Faculty)</strong>
                ) : (
                  <strong className="text-emerald-700">Preserved ({faculty.length} Faculty)</strong>
                )}
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
                <span>Project Master Catalog:</span>
                {wipeScope === "STUDENTS_AND_UPLOADS" ? (
                  <strong className="text-emerald-700">Preserved ({projects.length} Projects reset)</strong>
                ) : (
                  <strong className="text-rose-700">Deleting ({projects.length} Projects)</strong>
                )}
              </div>
            </div>

            {/* Academic Cohort Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Academic Cohort
              </label>
              <select
                value={wipeCohort}
                onChange={(e) => setWipeCohort(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Cohorts (Entire Student Database)</option>
                <option value={activeAcademicYear}>{activeAcademicYear} (Active Session Only)</option>
              </select>
            </div>

            {/* Error Message */}
            {wipeError && (
              <div className="p-3.5 bg-rose-50 text-rose-700 text-xs rounded-2xl flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{wipeError}</span>
              </div>
            )}

            {/* Confirmation Phrase */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirmation Required
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Type <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-rose-600">WIPE_AND_EXPORT</code> to confirm deletion:
              </p>
              <input
                type="text"
                placeholder="WIPE_AND_EXPORT"
                value={wipeConfirmInput}
                onChange={(e) => setWipeConfirmInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSafeWipeModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={wiping || (wipeConfirmInput.trim() !== "WIPE_AND_EXPORT" && wipeConfirmInput.trim() !== "PURGE_CONFIRMED")}
                onClick={handleSafeWipe}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-subtle flex items-center gap-2 disabled:opacity-40"
              >
                {wiping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting Backup &amp; Wiping...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>
                      {wipeScope === "STUDENTS_PROJECTS_UPLOADS"
                        ? "Download Backup & Wipe Students, Projects + Uploads"
                        : wipeScope === "PROJECTS"
                        ? "Download Backup & Delete Projects Only"
                        : wipeScope === "ALL"
                        ? "Download Backup & Purge Entire Database"
                        : "Download Backup & Delete Students + Uploads"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
