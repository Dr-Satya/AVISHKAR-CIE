"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Download,
  Users,
} from "lucide-react";
import { ProjectData } from "@/types/spoc";

interface SpocProjectVerificationTabProps {
  projects: ProjectData[];
  onOpenReview: (project: ProjectData, action: "APPROVE" | "REJECT") => void;
}

export function SpocProjectVerificationTab({
  projects,
  onOpenReview,
}: SpocProjectVerificationTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const toggleExpand = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const filteredProjects = projects.filter((p) => {
    const matchesStatus =
      statusFilter === "ALL" ? true : p.submissionStatus === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.projectId.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.faculty.name.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search project ID, title, mentor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {(["ALL", "PENDING", "APPROVED", "REJECTED", "NOT_SUBMITTED"] as const).map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-[#0d2137] text-white border-[#0d2137]"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {st === "ALL"
                  ? "All"
                  : st === "PENDING"
                  ? "Pending Review"
                  : st === "APPROVED"
                  ? "Approved"
                  : st === "REJECTED"
                  ? "Rejected"
                  : "Not Submitted"}
              </button>
            )
          )}
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-500 text-xs border border-slate-200">
          No projects found matching the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((proj) => {
            const isExpanded = Boolean(expandedProjects[proj.id]);
            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#0d2137] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                          {proj.projectId}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Mentor: <strong className="text-slate-800">{proj.faculty.name}</strong> ({proj.faculty.email})
                        </span>

                        {/* Status badge */}
                        {proj.submissionStatus === "APPROVED" && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Approved
                          </span>
                        )}
                        {proj.submissionStatus === "PENDING" && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Review
                          </span>
                        )}
                        {proj.submissionStatus === "REJECTED" && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-600" />
                            Changes Requested / Rejected
                          </span>
                        )}
                        {proj.submissionStatus === "NOT_SUBMITTED" && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            Not Submitted
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#0d2137]">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {proj.category} · {proj.theme} · Enrolled Students:{" "}
                        <strong className="text-slate-700">{proj.studentsCount}</strong>
                      </p>
                    </div>

                    {/* SPOC Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                      {proj.artifacts.length > 0 && (
                        <>
                          <button
                            onClick={() => onOpenReview(proj, "APPROVE")}
                            className="px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => onOpenReview(proj, "REJECT")}
                            className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Reject with Note</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => toggleExpand(proj.id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1"
                      >
                        <span>{isExpanded ? "Hide Details" : "View Artifacts & Students"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* SPOC Note banner if exists */}
                  {proj.spocReviewNote && (
                    <div
                      className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 ${
                        proj.submissionStatus === "APPROVED"
                          ? "bg-green-50 border border-green-200 text-green-900"
                          : "bg-red-50 border border-red-200 text-red-900"
                      }`}
                    >
                      {proj.submissionStatus === "APPROVED" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-bold">SPOC Note:</span>{" "}
                        <span>{proj.spocReviewNote}</span>
                        {proj.reviewedAt && (
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            Reviewed: {proj.reviewedAt.split("T")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expandable Drawer: Artifacts + Students */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-5 sm:p-6 space-y-5">
                    {/* Uploaded Documents */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Uploaded Artifacts ({proj.artifacts.length})</span>
                      </h4>

                      {proj.artifacts.length === 0 ? (
                        <p className="text-xs text-slate-400">
                          No artifacts uploaded by mentor yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {proj.artifacts.map((art) => (
                            <div
                              key={art.id}
                              className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    art.type === "REPORT"
                                      ? "bg-blue-100 text-blue-800"
                                      : art.type === "PPT"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-slate-100 text-slate-800"
                                  }`}
                                >
                                  {art.type}
                                </span>
                                <div>
                                  <p className="font-semibold text-slate-800">{art.title}</p>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                                    <span>File: {art.fileName}</span>
                                    <span>·</span>
                                    <span>Submitted: {art.submittedAt.split("T")[0]}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Plagiarism & AI Integrity Badges */}
                              <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                                {art.type === "REPORT" && (
                                  <>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Similarity: {art.similarityPercent ?? 0}% (&lt;10% ✓)
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      AI: {art.aiPercent ?? 0}% (&lt;20% ✓)
                                    </span>
                                  </>
                                )}

                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    art.status === "APPROVED"
                                      ? "bg-green-100 text-green-800"
                                      : art.status === "REJECTED"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {art.status}
                                </span>

                                <a
                                  href={art.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Enrolled Students Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Enrolled Students ({proj.students.length})</span>
                      </h4>

                      {proj.students.length === 0 ? (
                        <p className="text-xs text-slate-400">No students enrolled.</p>
                      ) : (
                        <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/50">
                                <th className="py-2.5 px-3">Enrollment No.</th>
                                <th className="py-2.5 px-3">Name</th>
                                <th className="py-2.5 px-3">Department</th>
                                <th className="py-2.5 px-3">Programme</th>
                                <th className="py-2.5 px-3">Semester</th>
                                <th className="py-2.5 px-3">Batch</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {proj.students.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 font-mono font-bold text-[#0d2137]">
                                    {s.enrollment}
                                  </td>
                                  <td className="py-2 px-3 font-semibold text-slate-800">
                                    {s.name}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600">{s.department}</td>
                                  <td className="py-2 px-3 text-slate-600">{s.programme || "—"}</td>
                                  <td className="py-2 px-3 text-slate-600">Sem {s.semester}</td>
                                  <td className="py-2 px-3 text-slate-600">{s.batch}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
