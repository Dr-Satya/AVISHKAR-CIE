import React from "react";
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
} from "lucide-react";
import { PaginationBar } from "@/components/common/PaginationBar";

interface CompletionStats {
  total: number;
  completed: number;
  pending: number;
  rejected: number;
  notSubmitted: number;
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
}: ProjectsTableCardProps) {
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
            Monitor real-time project milestone completion, SPOC verification status, and Turnitin similarity compliance.
          </p>
        </div>
        {completionStats && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <BarChart3 className="w-4 h-4 text-[#cda34f]" />
            <span className="font-semibold text-slate-700">Overall Completion:</span>
            <span className="font-bold text-emerald-700">{completionStats.completionPercentage}%</span>
          </div>
        )}
      </div>

      {/* Completion KPI Feedback Tiles */}
      {completionStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Projects */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Projects
            </span>
            <div className="text-2xl font-bold text-[#0d2137]">{completionStats.total}</div>
            <p className="text-[10px] text-slate-400">All registered projects</p>
          </div>

          {/* Completed (Approved) */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Completed
            </span>
            <div className="text-2xl font-bold text-emerald-900">{completionStats.completed}</div>
            <div className="w-full bg-emerald-200/60 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full"
                style={{
                  width: `${completionStats.completionPercentage}%`,
                }}
              />
            </div>
          </div>

          {/* Pending SPOC Review */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Pending Review
            </span>
            <div className="text-2xl font-bold text-amber-900">{completionStats.pending}</div>
            <p className="text-[10px] text-amber-700">Awaiting SPOC verification</p>
          </div>

          {/* Changes Requested / Rejected */}
          <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-1">
            <span className="text-[11px] font-semibold text-red-800 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              Changes Needed
            </span>
            <div className="text-2xl font-bold text-red-900">{completionStats.rejected}</div>
            <p className="text-[10px] text-red-700">Flagged by SPOC</p>
          </div>

          {/* Not Submitted / In Progress */}
          <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <FileUp className="w-3.5 h-3.5 text-slate-500" />
              Not Submitted
            </span>
            <div className="text-2xl font-bold text-slate-700">{completionStats.notSubmitted}</div>
            <p className="text-[10px] text-slate-400">Documentation pending</p>
          </div>
        </div>
      )}

      {/* School-wise Completion Progress Bars */}
      {completionStats && Object.keys(completionStats.schoolBreakdown).length > 0 && (
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#0d2137] flex items-center gap-1.5">
              <School className="w-4 h-4 text-slate-600" />
              <span>School-wise Completion Rate</span>
            </span>
            <span className="text-[11px] text-slate-500">Progress toward semester submission deadline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(completionStats.schoolBreakdown).map(([schoolName, data]) => {
              const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
              return (
                <div key={schoolName} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={schoolName}>
                      {schoolName.replace("School of ", "So")}
                    </span>
                    <span className="font-bold text-slate-900">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        pct >= 80 ? "bg-emerald-600" : pct >= 40 ? "bg-amber-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Total: {data.total}</span>
                    <span className="text-emerald-700 font-medium">Completed: {data.completed}</span>
                    <span className="text-amber-700 font-medium">Pending: {data.pending}</span>
                  </div>
                </div>
              );
            })}
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
              onChange={(e) => {
                setProjectSearch(e.target.value);
                onFetchProjects(1, e.target.value, projectCategoryFilter, projectStatusFilter, projectSchoolFilter);
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
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#0d2137] text-white">
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">PROJECT ID</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">TITLE</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">FACULTY MENTOR</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">SCHOOL</th>
              <th className="py-2.5 px-2.5 font-semibold text-center whitespace-nowrap">DOCS</th>
              <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">SIMILARITY</th>
              <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">SUBMISSION STATUS</th>
              <th className="py-2.5 px-3 font-semibold whitespace-nowrap">SPOC REMARKS</th>
              <th className="py-2.5 px-3 font-semibold text-center whitespace-nowrap">SEATS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loadingProjects ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0d2137]" />
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-slate-400">
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

                    {/* Uploaded Docs */}
                    <td className="py-3 px-2.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        <FileText className="w-3 h-3 text-slate-500" />
                        <span>{p.artifactsCount || 0}</span>
                      </span>
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

                    {/* Submission Status */}
                    <td className="py-3 px-3 text-center">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Approved</span>
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

                    {/* SPOC Remarks */}
                    <td className="py-3 px-3 text-slate-600 max-w-[180px] truncate" title={p.spocReviewNote || "No remarks"}>
                      {p.spocReviewNote ? (
                        <span className="italic text-slate-700">"{p.spocReviewNote}"</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Seats */}
                    <td className="py-3 px-3 font-semibold text-slate-800 text-center whitespace-nowrap">
                      {p.seatsRatio}
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
    </div>
  );
}
