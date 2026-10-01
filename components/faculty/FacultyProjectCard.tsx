"use client";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Upload,
  FileText,
  Download,
  Trash2,
  Users,
  Phone,
} from "lucide-react";
import { AssignedProject } from "@/types/faculty";

interface FacultyProjectCardProps {
  project: AssignedProject;
  onOpenUpload: (proj: AssignedProject) => void;
  onDeleteArtifact: (artifactId: string) => void;
  onExportStudents: (proj: AssignedProject, format: "csv" | "xlsx" | "pdf") => void;
}

export function FacultyProjectCard({
  project: proj,
  onOpenUpload,
  onDeleteArtifact,
  onExportStudents,
}: FacultyProjectCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Project Header Bar */}
      <div className="p-6 sm:p-7 border-b border-slate-100">
        <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#0d2137] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                {proj.projectId}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {proj.category} · {proj.theme}
              </span>

              {/* Submission Status Pill */}
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
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Not Submitted
                </span>
              )}

              {/* Plagiarism summary badge */}
              {proj.artifacts?.some((a) => a.similarityPercent !== null && a.similarityPercent !== undefined) && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  Plagiarism: {proj.artifacts.find((a) => a.similarityPercent !== null && a.similarityPercent !== undefined)?.similarityPercent}% (&lt;10% ✓)
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
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
            <div className="text-left sm:text-right">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Seats Filled
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#0d2137]">
                {proj.currentRegistrations} / {proj.maxSeats}
              </div>
              <span className="inline-block mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {proj.availableSeats} Available
              </span>
            </div>

            <button
              onClick={() => onOpenUpload(proj)}
              className="px-4 py-2 rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Artifacts</span>
            </button>
          </div>
        </div>

        {/* SPOC Rejection Note Alert */}
        {proj.submissionStatus === "REJECTED" && proj.spocReviewNote && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-900">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">SPOC Review Feedback:</p>
              <p className="mt-0.5 text-red-800">{proj.spocReviewNote}</p>
              <p className="mt-1 text-[11px] text-red-700 font-medium">
                Please update your documents accordingly and re-upload to resubmit for verification.
              </p>
            </div>
          </div>
        )}

        {/* SPOC Approved Note Alert */}
        {proj.submissionStatus === "APPROVED" && (
          <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 text-xs text-green-900 font-medium">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>
              {proj.spocReviewNote ||
                "All project artifacts have been reviewed and approved by the department SPOC."}
            </span>
          </div>
        )}
      </div>

      {/* Artifacts Uploaded Section */}
      {proj.artifacts && proj.artifacts.length > 0 && (
        <div className="px-6 sm:px-7 py-4 bg-slate-50/70 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Uploaded Documents & Verification ({proj.artifacts.length})</span>
            </h4>
          </div>

          <div className="space-y-2">
            {proj.artifacts.map((art) => (
              <div
                key={art.id}
                className="bg-white p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
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
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                      <span>{art.fileName}</span>
                      <span>·</span>
                      <span>Submitted: {art.submittedAt.split("T")[0]}</span>
                      {art.similarityPercent !== null && art.similarityPercent !== undefined && (
                        <>
                          <span>·</span>
                          <span className="text-slate-700 font-semibold">
                            Plagiarism Count: {art.similarityPercent}% (&lt;10% ✓)
                          </span>
                        </>
                      )}
                      {art.aiPercent !== null && art.aiPercent !== undefined && (
                        <>
                          <span>·</span>
                          <span className="text-slate-700 font-semibold">
                            AI Written: {art.aiPercent}% (&lt;20% ✓)
                          </span>
                        </>
                      )}
                      {art.selfDeclaration && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold">
                            Self-Declaration: Verified ✓
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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
                    <span>View File</span>
                  </a>

                  {art.plagiarismReportUrl && (
                    <a
                      href={art.plagiarismReportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3 text-amber-700" />
                      <span>Plagiarism Report</span>
                    </a>
                  )}

                  {art.status !== "APPROVED" && (
                    <button
                      onClick={() => onDeleteArtifact(art.id)}
                      className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Remove artifact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registered Students Table & Export */}
      <div className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Registered Students ({proj.students.length})</span>
          </h4>

          {/* Project-specific Export */}
          {proj.students.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Download:</span>
              <button
                onClick={() => onExportStudents(proj, "csv")}
                className="px-2 py-0.5 text-xs font-medium rounded border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                CSV
              </button>
              <button
                onClick={() => onExportStudents(proj, "xlsx")}
                className="px-2 py-0.5 text-xs font-medium rounded border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                XLSX
              </button>
              <button
                onClick={() => onExportStudents(proj, "pdf")}
                className="px-2 py-0.5 text-xs font-medium rounded border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                PDF
              </button>
            </div>
          )}
        </div>

        {proj.students.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">
            No students have registered for this project yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-500 font-semibold">
                  <th className="pb-3 pr-4">Enrollment No.</th>
                  <th className="pb-3 px-4">Student Name</th>
                  <th className="pb-3 px-4">Mobile No.</th>
                  <th className="pb-3 px-4">Department</th>
                  <th className="pb-3 px-4">Programme</th>
                  <th className="pb-3 px-4">Semester</th>
                  <th className="pb-3 px-4">Batch</th>
                  <th className="pb-3 pl-4 text-right">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proj.students.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50/60">
                    <td className="py-3 pr-4 font-mono font-bold text-[#0d2137]">
                      {std.enrollment}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {std.name}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {std.phone ? (
                        <a
                          href={`tel:${std.phone}`}
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-[#0d2137] hover:text-[#cda34f] font-semibold transition-colors"
                          title="Click to call"
                        >
                          <Phone className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>+91 {std.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not provided</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{std.department}</td>
                    <td className="py-3 px-4 text-slate-600">{std.programme || "—"}</td>
                    <td className="py-3 px-4 text-slate-600">Sem {std.semester}</td>
                    <td className="py-3 px-4 text-slate-600">{std.batch}</td>
                    <td className="py-3 pl-4 text-right text-slate-500 font-mono text-[11px]">
                      {std.registeredAt.split("T")[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
