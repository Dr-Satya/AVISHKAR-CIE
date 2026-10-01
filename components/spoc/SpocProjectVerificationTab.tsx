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
  ShieldCheck,
  Calendar,
  ExternalLink,
  Phone,
  Mail,
} from "lucide-react";
import { ProjectData } from "@/types/spoc";

interface SpocProjectVerificationTabProps {
  projects: ProjectData[];
  onOpenReview: (
    project: ProjectData,
    action: "APPROVE" | "REJECT",
    artifactId?: string,
    artifactTitle?: string
  ) => void;
}

export function SpocProjectVerificationTab({
  projects,
  onOpenReview,
}: SpocProjectVerificationTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [semesterFilter, setSemesterFilter] = useState<string>("ALL");
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const toggleExpand = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  // Distinct semesters across projects
  const availableSemesters = Array.from(
    new Set(projects.map((p) => p.semester).filter(Boolean))
  ).sort() as number[];

  const filteredProjects = projects.filter((p) => {
    const matchesStatus =
      statusFilter === "ALL" ? true : p.submissionStatus === statusFilter;
    const matchesSemester =
      semesterFilter === "ALL" ? true : String(p.semester) === semesterFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.projectId.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.faculty.name.toLowerCase().includes(q) ||
      p.faculty.email.toLowerCase().includes(q);
    return matchesStatus && matchesSemester && matchesSearch;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "File attached";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search project ID, title, mentor name/email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-72 text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Semester Filter */}
          {availableSemesters.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Semester:
              </span>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Semesters</option>
                {availableSemesters.map((sem) => (
                  <option key={sem} value={String(sem)}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
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
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-500 text-xs border border-slate-200">
          No projects found matching the selected filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((proj) => {
            const isExpanded = Boolean(expandedProjects[proj.id]);
            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all"
              >
                {/* Project Overview Card */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#0d2137] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                          {proj.projectId}
                        </span>

                        {proj.semester && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Sem {proj.semester} · {proj.academicYear || "2025-2026"}
                          </span>
                        )}

                        <span className="text-xs font-semibold text-slate-500">
                          {proj.category} · {proj.theme}
                        </span>

                        {/* Status badge */}
                        {proj.submissionStatus === "APPROVED" && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Approved by SPOC
                          </span>
                        )}
                        {proj.submissionStatus === "PENDING" && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending SPOC Review
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

                      <h3 className="text-base sm:text-lg font-bold text-[#0d2137]">
                        {proj.title}
                      </h3>

                      {proj.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {proj.description}
                        </p>
                      )}

                      {/* Mentor and Student Summary */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                        <span className="flex items-center gap-1">
                          <strong className="text-slate-800">Faculty Mentor:</strong>{" "}
                          <span>{proj.faculty.name}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{proj.faculty.email}</span>
                        </span>
                        {proj.faculty.phone && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{proj.faculty.phone}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>
                            Enrolled: <strong className="text-slate-800">{proj.studentsCount}</strong>
                          </span>
                        </span>
                      </div>

                      {/* Faculty Uploaded Files & Plagiarism Summary */}
                      {proj.artifacts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1.5">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-blue-600" />
                            {proj.artifacts.length} {proj.artifacts.length === 1 ? "File Uploaded" : "Files Uploaded"}
                          </span>

                          {proj.artifacts.some((a) => a.similarityPercent !== null && a.similarityPercent !== undefined) && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Plagiarism Count: {proj.artifacts.find((a) => a.similarityPercent !== null && a.similarityPercent !== undefined)?.similarityPercent}% (&lt;10% ✓)
                            </span>
                          )}

                          {proj.artifacts.some((a) => a.plagiarismReportUrl) && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Download className="w-3 h-3 text-amber-600" />
                              Plagiarism Report Attached
                            </span>
                          )}

                          {proj.artifacts.some((a) => a.selfDeclaration) && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                              ✓ Faculty Declared Info Correct
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Top Right Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                      {proj.artifacts.length > 0 && (
                        <>
                          <button
                            onClick={() => onOpenReview(proj, "APPROVE")}
                            className="px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                            title="Approve entire project application"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Application</span>
                          </button>
                          <button
                            onClick={() => onOpenReview(proj, "REJECT")}
                            className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 transition-all"
                            title="Reject and request modifications from faculty mentor"
                          >
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Reject with Note</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => toggleExpand(proj.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isExpanded
                            ? "bg-[#0d2137] text-white border-[#0d2137]"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>
                          {isExpanded
                            ? "Hide Inspection"
                            : `Inspect Documents (${proj.artifacts.length})`}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* SPOC Feedback banner if exists */}
                  {proj.spocReviewNote && (
                    <div
                      className={`mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
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
                        <span className="font-bold">SPOC Review Verdict & Remarks:</span>{" "}
                        <p className="mt-0.5 text-slate-800">{proj.spocReviewNote}</p>
                        {proj.reviewedAt && (
                          <span className="block text-[11px] text-slate-500 mt-1">
                            Reviewed on: {proj.reviewedAt.split("T")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* EXPANDABLE INSPECTION DRAWER: ALL SEMESTER DOCUMENTS & DETAILS */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-7 space-y-6">
                    {/* SECTION 1: DOCUMENTS UPLOADED IN THIS SEMESTER */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>
                              Semester {proj.semester || 3} Faculty Uploads ({proj.artifacts.length})
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Examine full document contents, Turnitin similarity, and AI generation parameters before approving or rejecting.
                          </p>
                        </div>
                      </div>

                      {proj.artifacts.length === 0 ? (
                        <div className="bg-white rounded-xl p-6 text-center text-xs text-slate-500 border border-slate-200">
                          <p className="font-medium text-slate-700">No documents uploaded yet.</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            The faculty mentor has not submitted any reports or presentations for this project yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {proj.artifacts.map((art) => (
                            <div
                              key={art.id}
                              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div className="flex items-start gap-3">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                      art.type === "REPORT"
                                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                                        : art.type === "PPT"
                                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                                        : "bg-slate-100 text-slate-800 border border-slate-200"
                                    }`}
                                  >
                                    {art.type === "REPORT"
                                      ? "Project Report"
                                      : art.type === "PPT"
                                      ? "Presentation Slide"
                                      : "Project Document"}
                                  </span>
                                  <div>
                                    <h5 className="font-bold text-sm text-[#0d2137]">
                                      {art.title}
                                    </h5>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-1">
                                      <span className="font-mono text-slate-700 font-medium">
                                        {art.fileName}
                                      </span>
                                      <span>·</span>
                                      <span>Size: {formatFileSize(art.fileSize)}</span>
                                      <span>·</span>
                                      <span>
                                        Submitted: {art.submittedAt.split("T")[0]}
                                      </span>
                                      {art.mimeType && (
                                        <>
                                          <span>·</span>
                                          <span className="text-slate-400">{art.mimeType}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Status and View link */}
                                <div className="flex items-center gap-2 self-start lg:self-center">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      art.status === "APPROVED"
                                        ? "bg-green-100 text-green-800 border border-green-200"
                                        : art.status === "REJECTED"
                                        ? "bg-red-100 text-red-800 border border-red-200"
                                        : "bg-amber-100 text-amber-800 border border-amber-200"
                                    }`}
                                  >
                                    {art.status}
                                  </span>

                                  <a
                                    href={art.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                                  >
                                    <Download className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Download File</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                  </a>

                                  {art.plagiarismReportUrl && (
                                    <a
                                      href={art.plagiarismReportUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                                      title="Download official plagiarism report"
                                    >
                                      <Download className="w-3.5 h-3.5 text-amber-700" />
                                      <span>Plagiarism Report</span>
                                      <ExternalLink className="w-3 h-3 text-amber-600" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Academic Integrity Inspection Metrics */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {/* Similarity check */}
                                <div
                                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                    art.similarityPercent !== null &&
                                    art.similarityPercent !== undefined &&
                                    art.similarityPercent <= 10
                                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                                      : "bg-red-50/70 border-red-200 text-red-900"
                                  }`}
                                >
                                  <div>
                                    <div className="font-bold flex items-center gap-1.5">
                                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                                      <span>Plagiarism Count / Similarity</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-0.5">
                                      Turnitin / Urkund Verification (&lt; 10% Required)
                                    </p>
                                    {art.plagiarismReportUrl && (
                                      <p className="text-[10px] text-amber-800 font-semibold mt-1 flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> Report File Attached
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className="text-base font-bold font-mono">
                                      {art.similarityPercent ?? "N/A"}%
                                    </span>
                                    <span className="block text-[10px] font-semibold">
                                      {art.similarityPercent !== null &&
                                      art.similarityPercent !== undefined &&
                                      art.similarityPercent <= 10
                                        ? "✓ Pass (<10%)"
                                        : "⚠ Exceeds Limit"}
                                    </span>
                                  </div>
                                </div>

                                {/* AI generation check */}
                                <div
                                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                    art.aiPercent !== null &&
                                    art.aiPercent !== undefined &&
                                    art.aiPercent <= 20
                                      ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                                      : "bg-red-50/70 border-red-200 text-red-900"
                                  }`}
                                >
                                  <div>
                                    <div className="font-bold flex items-center gap-1.5">
                                      <ShieldCheck className="w-4 h-4 text-indigo-700" />
                                      <span>AI-Generated Content Score</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-0.5">
                                      Passage Detection (&lt; 20% Permitted)
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-base font-bold font-mono">
                                      {art.aiPercent ?? "N/A"}%
                                    </span>
                                    <span className="block text-[10px] font-semibold">
                                      {art.aiPercent !== null &&
                                      art.aiPercent !== undefined &&
                                      art.aiPercent <= 20
                                        ? "✓ Pass (<20%)"
                                        : "⚠ Exceeds Limit"}
                                    </span>
                                  </div>
                                </div>

                                {/* Faculty Self Declaration Card */}
                                <div
                                  className={`p-3 rounded-xl border text-xs flex items-center justify-between sm:col-span-2 ${
                                    art.selfDeclaration
                                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                                      : "bg-slate-50 border-slate-200 text-slate-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2
                                      className={`w-4 h-4 ${
                                        art.selfDeclaration ? "text-emerald-600" : "text-slate-400"
                                      }`}
                                    />
                                    <div>
                                      <span className="font-bold">Faculty Self-Declaration:</span>
                                      <p className="text-[11px] text-slate-600 mt-0.5">
                                        {art.selfDeclaration
                                          ? 'Faculty verified: "All the above info is correct, genuine, and verified in compliance with academic integrity guidelines."'
                                          : "No self-declaration recorded for this artifact."}
                                      </p>
                                    </div>
                                  </div>
                                  {art.selfDeclaration && (
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                                      Consent Verified ✓
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Per-document SPOC action triggers */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                                <div className="text-[11px] text-slate-500">
                                  {art.spocNote && (
                                    <span>
                                      <strong>Note:</strong> {art.spocNote}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      onOpenReview(proj, "APPROVE", art.id, art.title)
                                    }
                                    className="px-3 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 font-semibold text-xs flex items-center gap-1 transition-colors"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                                    <span>Approve Document</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      onOpenReview(proj, "REJECT", art.id, art.title)
                                    }
                                    className="px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-semibold text-xs flex items-center gap-1 transition-colors"
                                  >
                                    <XCircle className="w-3 h-3 text-red-600" />
                                    <span>Reject Document</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: APPLICATION VERDICT & DECISION PANEL */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#0d2137]">
                            Final Application Decision for {proj.projectId}
                          </h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              proj.submissionStatus === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : proj.submissionStatus === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            Status: {proj.submissionStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 max-w-xl">
                          Confirm that all documents uploaded for this semester satisfy department quality, plagiarism, and AI guidelines. Rejecting will prompt the faculty mentor with your required feedback.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <button
                          onClick={() => onOpenReview(proj, "APPROVE")}
                          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Entire Project</span>
                        </button>
                        <button
                          onClick={() => onOpenReview(proj, "REJECT")}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject Application</span>
                        </button>
                      </div>
                    </div>

                    {/* SECTION 3: ENROLLED STUDENTS IN THIS PROJECT */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span>
                          Enrolled Students in {proj.projectId} ({proj.students.length})
                        </span>
                      </h4>

                      {proj.students.length === 0 ? (
                        <p className="text-xs text-slate-400 bg-white p-4 rounded-xl border border-slate-200">
                          No students have registered for this project yet.
                        </p>
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
