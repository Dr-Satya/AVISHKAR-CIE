import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  FileText,
  BarChart3,
  School,
  FileUp,
  Download,
  Eye,
  X,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Sparkles,
  Archive,
  UserCog,
  UserCheck,
} from "lucide-react";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ZipDownloadProgressModal } from "@/components/common/ZipDownloadProgressModal";
import {
  downloadSingleProjectZip,
  downloadMultipleProjectsZip,
  ProgressInfo,
  ProjectExportData,
} from "@/lib/zip-export";
import { cleanErrorMessage } from "@/lib/error-utils";

interface CompletionStats {
  total: number;
  completed: number;
  pending: number;
  rejected: number;
  notSubmitted: number;
  bothSemestersCompleted?: number;
  sem1Only?: number;
  sem2Pending?: number;
  completionPercentage: number;
  schoolBreakdown: Record<string, { total: number; completed: number; pending: number }>;
}

interface ProjectsTableCardProps {
  projects: any[];
  projectTotal: number;
  projectSearch: string;
  setProjectSearch: (v: string) => void;
  projectCategoryFilter: string;
  setProjectCategoryFilter: (v: string) => void;
  projectStatusFilter?: string;
  setProjectStatusFilter?: (v: string) => void;
  projectSchoolFilter?: string;
  setProjectSchoolFilter?: (v: string) => void;
  completionStats?: CompletionStats | null;
  projectPage: number;
  projectTotalPages: number;
  loadingProjects: boolean;
  onFetchProjects: (page: number, search?: string, cat?: string, status?: string, school?: string) => void;
  faculties?: any[];
  onChangeMentor?: (projectId: string, newFacultyId: string) => Promise<boolean>;
}

export function ProjectsTableCard({
  projects,
  projectTotal,
  projectSearch,
  setProjectSearch,
  projectCategoryFilter,
  setProjectCategoryFilter,
  projectStatusFilter = "all",
  setProjectStatusFilter,
  projectSchoolFilter = "all",
  setProjectSchoolFilter,
  completionStats,
  projectPage,
  projectTotalPages,
  loadingProjects,
  onFetchProjects,
  faculties = [],
  onChangeMentor,
}: ProjectsTableCardProps) {
  // Modal state for project inspection
  const [inspectProject, setInspectProject] = useState<any | null>(null);

  // Modal state for changing faculty mentor
  const [changingMentorProject, setChangingMentorProject] = useState<any | null>(null);
  const [selectedNewFacultyId, setSelectedNewFacultyId] = useState<string>("");
  const [changeMentorLoading, setChangeMentorLoading] = useState<boolean>(false);
  const [changeMentorError, setChangeMentorError] = useState<string | null>(null);

  // ZIP download states
  const [zipModalOpen, setZipModalOpen] = useState(false);
  const [zipProgress, setZipProgress] = useState<ProgressInfo>({
    current: 0,
    total: 0,
    percent: 0,
    message: "Initializing...",
  });
  const [zipComplete, setZipComplete] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const zipAbortRef = useRef<AbortController | null>(null);
  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleSearchChange = (val: string) => {
    setProjectSearch(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      onFetchProjects(1, val, projectCategoryFilter, projectStatusFilter, projectSchoolFilter);
    }, 300);
  };

  const handleCancelZip = () => {
    if (zipAbortRef.current) {
      zipAbortRef.current.abort();
      zipAbortRef.current = null;
    }
    setZipModalOpen(false);
  };

  const handleDownloadSingleZip = async (project: any) => {
    try {
      setZipError(null);
      setZipComplete(false);
      setZipProgress({
        current: 0,
        total: 1,
        percent: 0,
        message: `Packaging dossier for ${project.projectId}...`,
      });
      setZipModalOpen(true);

      const controller = new AbortController();
      zipAbortRef.current = controller;

      await downloadSingleProjectZip(project as ProjectExportData, {
        onProgress: (p) => setZipProgress(p),
        signal: controller.signal,
      });

      setZipComplete(true);
    } catch (err: any) {
      if (err.message?.includes("cancelled")) {
        setZipModalOpen(false);
      } else {
        setZipError(cleanErrorMessage(err, "Failed to download project dossier."));
      }
    } finally {
      zipAbortRef.current = null;
    }
  };

  const handleDownloadBulkZip = async () => {
    try {
      setDownloadingBulk(true);
      setZipError(null);
      setZipComplete(false);
      setZipProgress({
        current: 0,
        total: 1,
        percent: 0,
        message: "Querying projects and submitted files from server...",
      });
      setZipModalOpen(true);

      // Fetch all projects matching current filters from the admin exportFiles endpoint
      const params = new URLSearchParams({
        exportFiles: "true",
        search: projectSearch || "",
        category: projectCategoryFilter || "all",
        status: projectStatusFilter || "all",
        school: projectSchoolFilter || "all",
      });

      const res = await fetch(`/api/admin/projects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load project files manifest from server.");
      const data = await res.json();
      const exportList: ProjectExportData[] = data.projects || [];

      if (exportList.length === 0) {
        setZipModalOpen(false);
        alert("No projects matched the selected filters to download.");
        return;
      }

      const controller = new AbortController();
      zipAbortRef.current = controller;

      const dateStr = new Date().toISOString().slice(0, 10);
      await downloadMultipleProjectsZip(exportList, {
        archiveName: `IDP_University_All_Submissions_${dateStr}`,
        groupByDepartment: true,
        onProgress: (p) => setZipProgress(p),
        signal: controller.signal,
      });

      setZipComplete(true);
    } catch (err: any) {
      if (err.message?.includes("cancelled")) {
        setZipModalOpen(false);
      } else {
        setZipError(cleanErrorMessage(err, "Failed to download all project files."));
      }
    } finally {
      setDownloadingBulk(false);
      zipAbortRef.current = null;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative space-y-6">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full" />

      {/* Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
            Projects & Submissions Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time project milestone completion across both semesters, SPOC verification status, and Turnitin similarity compliance.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadBulkZip}
            disabled={downloadingBulk}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0d2137] text-white hover:bg-[#16365c] text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            title="Download all submitted files, reports, manuscripts, and marks organized cleanly in a .zip archive"
          >
            {downloadingBulk ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#cda34f]" />
            ) : (
              <Archive className="w-4 h-4 text-[#cda34f]" />
            )}
            <span>Download All Files (.zip)</span>
          </button>

          {completionStats && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <BarChart3 className="w-4 h-4 text-[#cda34f]" />
              <span className="font-semibold text-slate-700">Overall Completion:</span>
              <span className="font-bold text-emerald-700">{completionStats.completionPercentage}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Completion KPI Feedback Tiles */}
      {completionStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Projects */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Projects
            </span>
            <div className="text-2xl font-bold text-[#0d2137]">{completionStats.total}</div>
            <p className="text-[10px] text-slate-400">All registered projects</p>
          </div>

          {/* Both Semesters Completed */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
            <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" /> Both Sems Done
            </span>
            <div className="text-2xl font-bold text-blue-900">
              {completionStats.bothSemestersCompleted ?? 0}
            </div>
            <p className="text-[10px] text-blue-700">Sem 1 & Sem 2 reports submitted</p>
          </div>

          {/* Completed / Approved */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Approved
            </span>
            <div className="text-2xl font-bold text-emerald-900">{completionStats.completed}</div>
            <p className="text-[10px] text-emerald-700">SPOC verified & accepted</p>
          </div>

          {/* Under Review */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Under Review
            </span>
            <div className="text-2xl font-bold text-amber-900">{completionStats.pending}</div>
            <p className="text-[10px] text-amber-700">Awaiting SPOC verification</p>
          </div>

          {/* Changes Requested */}
          <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-1">
            <span className="text-[11px] font-semibold text-red-800 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Changes Req.
            </span>
            <div className="text-2xl font-bold text-red-900">{completionStats.rejected}</div>
            <p className="text-[10px] text-red-700">Rejected by SPOC</p>
          </div>

          {/* Not Submitted */}
          <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Not Submitted
            </span>
            <div className="text-2xl font-bold text-slate-700">{completionStats.notSubmitted}</div>
            <p className="text-[10px] text-slate-500">No reports uploaded yet</p>
          </div>
        </div>
      )}

      {/* Filters Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search project ID, title, mentor..."
              aria-label="Search projects by ID, title, or mentor"
              value={projectSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                  onFetchProjects(1, projectSearch, projectCategoryFilter, projectStatusFilter, projectSchoolFilter);
                }
              }}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137] w-48 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Category Filter */}
          <select
            value={projectCategoryFilter}
            aria-label="Filter projects by category"
            onChange={(e) => {
              setProjectCategoryFilter(e.target.value);
              onFetchProjects(1, projectSearch, e.target.value, projectStatusFilter, projectSchoolFilter);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none bg-white text-slate-700"
          >
            <option value="all">All Categories</option>
            <option value="IDP2501">IDP2501</option>
            <option value="IDP2502">IDP2502</option>
          </select>

          {/* Submission Status Filter */}
          {setProjectStatusFilter && (
            <select
              value={projectStatusFilter}
              aria-label="Filter projects by submission status"
              onChange={(e) => {
                setProjectStatusFilter(e.target.value);
                onFetchProjects(1, projectSearch, projectCategoryFilter, e.target.value, projectSchoolFilter);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none bg-white text-slate-700 font-medium"
            >
              <option value="all">All Submissions</option>
              <option value="APPROVED">Completed (Approved)</option>
              <option value="PENDING">Pending Review</option>
              <option value="REJECTED">Changes Requested</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
            </select>
          )}

          {/* School Filter */}
          {setProjectSchoolFilter && completionStats && (
            <select
              value={projectSchoolFilter}
              aria-label="Filter projects by school"
              onChange={(e) => {
                setProjectSchoolFilter(e.target.value);
                onFetchProjects(1, projectSearch, projectCategoryFilter, projectStatusFilter, e.target.value);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none bg-white text-slate-700 font-medium"
            >
              <option value="all">All Schools</option>
              {Object.keys(completionStats.schoolBreakdown).map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{projects.length}</strong> of <strong>{projectTotal}</strong> project(s)
        </div>
      </div>

      {/* Submissions & Projects Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs min-w-[950px]">
          <thead>
            <tr className="bg-[#0d2137] text-white">
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">PROJECT ID</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">TITLE</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">FACULTY MENTOR</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">SCHOOL</th>
              <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">SEM 1 (INTERIM)</th>
              <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">SEM 2 (FINAL)</th>
              <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">SIMILARITY</th>
              <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">SUBMISSION STATUS</th>
              <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">SEATS</th>
              <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loadingProjects ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0d2137]" />
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-slate-400">
                  No project records found.
                </td>
              </tr>
            ) : (
              projects.map((p) => {
                const status = p.submissionStatus || "NOT_SUBMITTED";
                const isApproved = status === "APPROVED";
                const isPending = status === "PENDING";
                const isRejected = status === "REJECTED";

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Project ID */}
                    <td className="py-3 px-3 font-mono font-bold text-[#0d2137] whitespace-nowrap">
                      {p.projectId}
                    </td>

                    {/* Title */}
                    <td className="py-3 px-3 font-medium text-slate-800 max-w-xs truncate" title={p.title}>
                      {p.title}
                    </td>

                    {/* Faculty */}
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">{p.faculty}</td>

                    {/* School */}
                    <td className="py-3 px-3 text-slate-600 max-w-[150px] truncate" title={p.department}>
                      {p.department}
                    </td>

                    {/* Semester 1 (Interim) */}
                    <td className="py-3 px-2.5 text-center whitespace-nowrap">
                      {p.sem1HasReport ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Report ✓ ({p.sem1DocsCount} docs)</span>
                        </span>
                      ) : p.sem1DocsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{p.sem1DocsCount} docs · Report pending</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                          Not Uploaded
                        </span>
                      )}
                    </td>

                    {/* Semester 2 (Final Defense) */}
                    <td className="py-3 px-2.5 text-center whitespace-nowrap">
                      {p.sem2HasReport ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                          <CheckCircle2 className="w-3 h-3 text-purple-600" />
                          <span>Final Report ✓ ({p.sem2DocsCount} docs)</span>
                        </span>
                      ) : p.sem2DocsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{p.sem2DocsCount} docs · Report pending</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                          Not Uploaded
                        </span>
                      )}
                    </td>

                    {/* Plagiarism & AI */}
                    <td className="py-3 px-3 text-center">
                      {p.similarityPercent !== null && p.similarityPercent !== undefined ? (
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              p.similarityPercent <= 10
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            Sim: {p.similarityPercent}%
                          </span>
                          {p.aiPercent !== null && p.aiPercent !== undefined && (
                            <span className="text-[9px] text-slate-500 mt-0.5">AI: {p.aiPercent}%</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>

                    {/* Submission Status & Dual-Sem Compliance */}
                    <td className="py-3 px-3 text-center">
                      {isApproved && p.bothSemestersSubmitted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Both Sems Approved</span>
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Approved</span>
                        </span>
                      ) : p.bothSemestersSubmitted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>Both Sems Submitted</span>
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Under Review</span>
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                          <AlertCircle className="w-3 h-3 text-red-600" />
                          <span>Changes Req.</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                          Not Submitted
                        </span>
                      )}
                    </td>

                    {/* Seats */}
                    <td className="py-3 px-3 font-semibold text-slate-800 text-center whitespace-nowrap">
                      {p.seatsRatio}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setInspectProject(p)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                          title="Inspect all marks, uploaded artifacts, and manuscripts"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0d2137]" />
                          <span>Inspect</span>
                        </button>
                        {onChangeMentor && (
                          <button
                            onClick={() => {
                              setChangingMentorProject(p);
                              setSelectedNewFacultyId("");
                              setChangeMentorError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200 transition-colors"
                            title="Replace / Reassign Faculty Mentor"
                          >
                            <UserCog className="w-3.5 h-3.5 text-amber-700" />
                            <span>Replace Mentor</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadSingleZip(p)}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 transition-colors"
                          title="Download project dossier (.zip)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={projectPage}
        totalPages={projectTotalPages}
        totalItems={projectTotal}
        disabled={loadingProjects}
        onPageChange={(newPage) =>
          onFetchProjects(newPage, projectSearch, projectCategoryFilter, projectStatusFilter, projectSchoolFilter)
        }
      />

      {/* ======================================================== */}
      {/* ADMIN PROJECT INSPECTION MODAL: Marks, Files & Manuscripts */}
      {/* ======================================================== */}
      {inspectProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0d2137] text-white flex items-center justify-between border-b border-[#0d2137]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#cda34f] text-[#0d2137] font-bold">
                    {inspectProject.projectId}
                  </span>
                  <span className="text-xs text-slate-300">
                    {inspectProject.department} · {inspectProject.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 line-clamp-1">
                  {inspectProject.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadSingleZip(inspectProject)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#cda34f] hover:bg-[#d8b05c] text-[#0d2137] text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Dossier (.zip)</span>
                </button>
                <button
                  onClick={() => setInspectProject(null)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Faculty Mentor</span>
                  <span className="font-bold text-slate-800">{inspectProject.faculty || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Submission Status</span>
                  <span className="font-bold text-slate-800">{inspectProject.submissionStatus || "NOT_SUBMITTED"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Enrolled Students</span>
                  <span className="font-bold text-slate-800">
                    {inspectProject.students?.length || 0} / {inspectProject.maxSeats || 10}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">SPOC Review Note</span>
                  <span className="font-medium text-slate-700 italic">
                    {inspectProject.spocReviewNote || "None"}
                  </span>
                </div>
              </div>

              {/* 1. STUDENT MARKS ROSTER (Admin Full Visibility: Internal /50, External /50) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#0d2137] flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#cda34f]" />
                    <span>Enrolled Students & Marks Breakdown (Full Admin View)</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Internal (/50) + External (/50)
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <th className="py-2 px-3">ENROLLMENT #</th>
                        <th className="py-2 px-3">STUDENT NAME</th>
                        <th className="py-2 px-3">DEPT / PROG</th>
                        <th className="py-2 px-2.5 text-center">ATTENDANCE</th>
                        <th className="py-2 px-2.5 text-center bg-blue-50/60 text-blue-900">INTERNAL (/50)</th>
                        <th className="py-2 px-2.5 text-center bg-purple-50/60 text-purple-900">EXTERNAL (/50)</th>
                        <th className="py-2 px-2.5 text-center bg-emerald-50/60 text-emerald-900">TOTAL (/100)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!inspectProject.students || inspectProject.students.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-slate-400">
                            No students registered under this project.
                          </td>
                        </tr>
                      ) : (
                        inspectProject.students.map((s: any, idx: number) => {
                          const internal = s.internalMarks ?? 0;
                          const external = s.externalMarks ?? 0;
                          const total = internal + external;
                          return (
                            <tr key={s.id || idx} className="hover:bg-slate-50/80">
                              <td className="py-2 px-3 font-mono font-medium text-slate-800">
                                {s.enrollmentNumber || s.enrollment || "N/A"}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900">{s.name}</td>
                              <td className="py-2 px-3 text-slate-600">
                                {s.department || s.programme || "—"}
                              </td>
                              <td className="py-2 px-2.5 text-center font-medium text-slate-700">
                                {s.attendancePercent ?? 100}%
                              </td>
                              <td className="py-2 px-2.5 text-center font-bold text-blue-800 bg-blue-50/30">
                                {internal} / 50
                              </td>
                              <td className="py-2 px-2.5 text-center font-bold text-purple-800 bg-purple-50/30">
                                {external} / 50
                              </td>
                              <td className="py-2 px-2.5 text-center font-extrabold text-emerald-800 bg-emerald-50/40">
                                {total} / 100
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. SUBMITTED ARTIFACTS & TURNITIN REPORTS */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#0d2137] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#cda34f]" />
                  <span>Submitted Project Reports & Files ({inspectProject.artifacts?.length || 0})</span>
                </h4>

                {!inspectProject.artifacts || inspectProject.artifacts.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                    No artifacts or reports uploaded by faculty yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {inspectProject.artifacts.map((art: any) => (
                      <div
                        key={art.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800 truncate" title={art.title}>
                            {art.title || art.fileName}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap">
                            Sem {art.semester || 1} · {art.type}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate max-w-[200px]" title={art.fileName}>
                            {art.fileName}
                          </span>
                          {art.similarityPercent !== null && art.similarityPercent !== undefined && (
                            <span
                              className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                art.similarityPercent <= 10
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              Turnitin: {art.similarityPercent}%
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          {art.plagiarismReportUrl ? (
                            <a
                              href={art.plagiarismReportUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Similarity Report</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">No similarity PDF</span>
                          )}

                          {art.fileUrl && (
                            <a
                              href={art.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0d2137] text-white hover:bg-[#16365c] text-[11px] font-semibold transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>View File</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. RESEARCH MANUSCRIPT STATUS */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#0d2137] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#cda34f]" />
                  <span>Research Manuscript & Publications</span>
                </h4>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Draft / Communicated Manuscript */}
                    <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Manuscript Status</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inspectProject.hasCommunicatedManuscript
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : inspectProject.draftManuscriptUrl
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {inspectProject.hasCommunicatedManuscript
                            ? "Communicated ✓"
                            : inspectProject.draftManuscriptUrl
                            ? "In Draft ✓"
                            : "Not Linked"}
                        </span>
                      </div>
                      {inspectProject.journalName && (
                        <p className="text-[11px] text-slate-600">
                          Target Journal: <strong className="text-slate-800">{inspectProject.journalName}</strong>
                        </p>
                      )}
                      {inspectProject.draftManuscriptUrl && (
                        <div className="pt-1">
                          <a
                            href={inspectProject.draftManuscriptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{inspectProject.draftManuscriptFileName || "View Communicated Manuscript"}</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Published Paper */}
                    <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Published Article</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inspectProject.isManuscriptPublished
                              ? "bg-purple-50 text-purple-800 border border-purple-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {inspectProject.isManuscriptPublished ? "Published 🎉" : "Pending"}
                        </span>
                      </div>
                      {inspectProject.publicationDoi && (
                        <p className="text-[11px] text-slate-600">
                          DOI: <strong className="text-slate-800">{inspectProject.publicationDoi}</strong>
                        </p>
                      )}
                      {inspectProject.publishedManuscriptUrl && (
                        <div className="pt-1">
                          <a
                            href={inspectProject.publishedManuscriptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{inspectProject.publishedManuscriptFileName || "View Published Paper"}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Admin Audit & File Access: Read-only access to all faculty submissions & student marks.
              </span>
              <button
                onClick={() => setInspectProject(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CHANGE / REPLACE FACULTY MENTOR MODAL                    */}
      {/* ======================================================== */}
      {changingMentorProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative">
            <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0d2137]">Replace Faculty Mentor</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reassign project mentorship to another faculty member.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChangingMentorProject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {changeMentorError && (
              <div className="mt-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {changeMentorError}
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#cda34f] text-[#0d2137]">
                    {changingMentorProject.projectId}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {changingMentorProject.department}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#0d2137] line-clamp-2">
                  {changingMentorProject.title}
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  <strong>Current Mentor:</strong> {changingMentorProject.faculty}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select New Faculty Mentor *
                </label>
                <select
                  value={selectedNewFacultyId}
                  onChange={(e) => setSelectedNewFacultyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                >
                  <option value="">-- Choose New Faculty Mentor --</option>
                  {(faculties || []).map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.department} ({f.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-[11px] text-amber-900 leading-relaxed">
                All registered students ({changingMentorProject.seatsFilled || 0} enrolled) and submitted milestone artifacts will immediately transfer to the new mentor&apos;s portal dashboard.
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setChangingMentorProject(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={changeMentorLoading || !selectedNewFacultyId}
                onClick={async () => {
                  if (!onChangeMentor || !selectedNewFacultyId) return;
                  setChangeMentorLoading(true);
                  setChangeMentorError(null);
                  try {
                    const ok = await onChangeMentor(changingMentorProject.id, selectedNewFacultyId);
                    if (ok) {
                      setChangingMentorProject(null);
                    }
                  } catch (err: any) {
                    setChangeMentorError(err?.message || "Failed to change mentor.");
                  } finally {
                    setChangeMentorLoading(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {changeMentorLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                <span>Confirm Reassignment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ZIP Download Progress Modal */}
      <ZipDownloadProgressModal
        isOpen={zipModalOpen}
        progress={zipProgress}
        isComplete={zipComplete}
        error={zipError}
        onCancel={handleCancelZip}
        onClose={() => setZipModalOpen(false)}
      />
    </div>
  );
}
