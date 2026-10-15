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
  BookOpen,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  GraduationCap,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { AssignedProject } from "@/types/faculty";
import { ManuscriptModal } from "@/components/faculty/ManuscriptModal";

interface FacultyProjectCardProps {
  project: AssignedProject;
  onOpenUpload: (proj: AssignedProject, semester?: number) => void;
  onDeleteArtifact: (artifactId: string) => void;
  onExportStudents: (proj: AssignedProject, format: "csv" | "xlsx" | "pdf") => void;
  onRefresh?: () => void;
}

export function FacultyProjectCard({
  project: proj,
  onOpenUpload,
  onDeleteArtifact,
  onExportStudents,
  onRefresh,
}: FacultyProjectCardProps) {
  const [showManuscriptModal, setShowManuscriptModal] = React.useState(false);
  const [showMarksModal, setShowMarksModal] = React.useState(false);
  const [isSavingMarks, setIsSavingMarks] = React.useState(false);
  const [marksData, setMarksData] = React.useState<
    Record<string, { internalMarks: number; externalMarks: number; attendancePercent: number }>
  >({});

  const handleOpenMarksModal = () => {
    const initial: Record<
      string,
      { internalMarks: number; externalMarks: number; attendancePercent: number }
    > = {};
    proj.students.forEach((s) => {
      initial[s.id] = {
        internalMarks: s.internalMarks ?? 0,
        externalMarks: s.externalMarks ?? 0,
        attendancePercent: s.attendancePercent ?? 100,
      };
    });
    setMarksData(initial);
    setShowMarksModal(true);
  };

  const handleSaveAndShareMarks = async () => {
    setIsSavingMarks(true);
    try {
      const studentMarks = Object.entries(marksData).map(([studentId, data]) => ({
        studentId,
        internalMarks: Number(data.internalMarks),
        externalMarks: Number(data.externalMarks),
        attendancePercent: Number(data.attendancePercent),
      }));

      const res = await fetch("/api/faculty/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SHARE_STUDENT_MARKS",
          projectId: proj.id,
          studentMarks,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to share marks.");
        return;
      }

      alert(json.message || "Marks shared successfully with Department SPOC!");
      setShowMarksModal(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setIsSavingMarks(false);
    }
  };

  const baseSem = proj.semester || 3;
  const nextSem = baseSem + 1;

  // Separate artifacts by semester
  const allArtifacts = proj.artifacts || [];
  const sem1Artifacts = allArtifacts.filter((a) => (a.semester || baseSem) === baseSem);
  const sem2Artifacts = allArtifacts.filter((a) => a.semester === nextSem);

  const sem1HasReport = sem1Artifacts.some((a) => a.type === "REPORT");
  const sem1HasPpt = sem1Artifacts.some((a) => a.type === "PPT");
  const sem2HasReport = sem2Artifacts.some((a) => a.type === "REPORT");
  const sem2HasPpt = sem2Artifacts.some((a) => a.type === "PPT");

  // Determine status per semester
  const getSemStatus = (artifacts: typeof allArtifacts, hasReport: boolean) => {
    if (artifacts.length === 0) return "NOT_SUBMITTED";
    if (artifacts.some((a) => a.status === "REJECTED")) return "REJECTED";
    if (artifacts.some((a) => a.status === "PENDING")) return "PENDING";
    if (hasReport && artifacts.every((a) => a.status === "APPROVED")) return "APPROVED";
    return "PARTIAL";
  };

  const sem1Status = getSemStatus(sem1Artifacts, sem1HasReport);
  const sem2Status = getSemStatus(sem2Artifacts, sem2HasReport);
  const bothCompleted = sem1HasReport && sem2HasReport && sem1Status === "APPROVED" && sem2Status === "APPROVED";

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            Under Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" />
            Changes Needed
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Pending Docs
          </span>
        );
    }
  };

  const renderArtifactItem = (art: typeof allArtifacts[0]) => (
    <div
      key={art.id}
      className="bg-white p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
    >
      <div className="flex items-center gap-3">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            art.type === "REPORT"
              ? "bg-blue-100 text-blue-800 border border-blue-200"
              : art.type === "PPT"
              ? "bg-purple-100 text-purple-800 border border-purple-200"
              : "bg-slate-100 text-slate-800 border border-slate-200"
          }`}
        >
          {art.type === "REPORT" ? "Project Report" : art.type === "PPT" ? "Presentation PPT" : "Supporting Doc"}
        </span>
        <div>
          <p className="font-semibold text-slate-800">{art.title}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
            <span className="font-mono text-slate-700">{art.fileName.split("/").pop()}</span>
            <span>·</span>
            <span>Submitted: {art.submittedAt.split("T")[0]}</span>
            {art.similarityPercent !== null && art.similarityPercent !== undefined && (
              <>
                <span>·</span>
                <span className="text-emerald-700 font-semibold">
                  Turnitin Similarity: {art.similarityPercent}% (&lt;10% ✓)
                </span>
              </>
            )}
            {art.aiPercent !== null && art.aiPercent !== undefined && (
              <>
                <span>·</span>
                <span className="text-slate-700 font-semibold">
                  AI: {art.aiPercent}% (&lt;20% ✓)
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
            title="Download official plagiarism report"
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
  );

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

              {/* Dual-Semester Overall Status */}
              {bothCompleted ? (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Both Semesters Approved
                </span>
              ) : sem1HasReport && sem2HasReport ? (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-600" />
                  Both Semesters Submitted
                </span>
              ) : sem1HasReport && !sem2HasReport ? (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Sem {baseSem} Done · Sem {nextSem} Report Pending
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Submissions Required for Both Semesters
                </span>
              )}

              {/* Plagiarism summary badge */}
              {allArtifacts.some((a) => a.similarityPercent !== null && a.similarityPercent !== undefined) && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  Plagiarism: {allArtifacts.find((a) => a.similarityPercent !== null && a.similarityPercent !== undefined)?.similarityPercent}% (&lt;10% ✓)
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowManuscriptModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#0d2137] border border-amber-300/80 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                title="Manage research manuscript communication & publication details"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#c59b27]" />
                <span>Manuscript</span>
              </button>
              <button
                onClick={() => onOpenUpload(proj)}
                className="px-4 py-2 rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Documents</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dual-Semester Compliance Quick-Bar */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Semester {baseSem} (Interim):</span>
              {renderStatusBadge(sem1Status)}
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Semester {nextSem} (Final):</span>
              {renderStatusBadge(sem2Status)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Requirement: Report (Turnitin &lt; 10%), PPT & Docs for both semesters
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
                Please revise your document(s) and re-upload to resubmit for verification.
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

      {/* Dual-Semester Submissions Container */}
      <div className="p-6 sm:p-7 bg-slate-50/50 border-b border-slate-100 space-y-6">
        {/* SEMESTER 1 (ODD / INTERIM) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[#0d2137] uppercase tracking-wider">
                  Semester {baseSem} Submissions (Phase I · Interim)
                </h4>
                {renderStatusBadge(sem1Status)}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Interim Project Report with Turnitin plagiarism check, presentation slides, and evaluation logbook.
              </p>
            </div>

            <button
              onClick={() => onOpenUpload(proj, baseSem)}
              className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0d2137] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Upload className="w-3 h-3 text-[#0d2137]" />
              <span>+ Upload for Sem {baseSem}</span>
            </button>
          </div>

          {/* Checklist Pills for Sem 1 */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 ${
                sem1HasReport
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {sem1HasReport ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-red-500" />}
              <span>Interim Report {sem1HasReport ? "(Uploaded)" : "(Required)"}</span>
            </span>

            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 ${
                sem1HasPpt
                  ? "bg-purple-50 text-purple-800 border-purple-200"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {sem1HasPpt ? <CheckCircle2 className="w-3 h-3 text-purple-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
              <span>Presentation PPT {sem1HasPpt ? "(Uploaded)" : "(Required)"}</span>
            </span>
          </div>

          {/* Sem 1 Artifacts List */}
          {sem1Artifacts.length > 0 ? (
            <div className="space-y-2 pt-1">
              {sem1Artifacts.map(renderArtifactItem)}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
              <p className="text-xs text-slate-600 font-medium">No documents uploaded for Semester {baseSem} yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click &ldquo;+ Upload for Sem {baseSem}&rdquo; to attach the required Interim Report and PPT.
              </p>
            </div>
          )}
        </div>

        {/* SEMESTER 2 (EVEN / FINAL) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[#0d2137] uppercase tracking-wider">
                  Semester {nextSem} Submissions (Phase II · Final Defense)
                </h4>
                {renderStatusBadge(sem2Status)}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Final Capstone Project Report with Turnitin plagiarism check, defense slides, and final deliverables.
              </p>
            </div>

            <button
              onClick={() => onOpenUpload(proj, nextSem)}
              className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0d2137] text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Upload className="w-3 h-3 text-[#0d2137]" />
              <span>+ Upload for Sem {nextSem}</span>
            </button>
          </div>

          {/* Checklist Pills for Sem 2 */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 ${
                sem2HasReport
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {sem2HasReport ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-red-500" />}
              <span>Final Report {sem2HasReport ? "(Uploaded)" : "(Required)"}</span>
            </span>

            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 ${
                sem2HasPpt
                  ? "bg-purple-50 text-purple-800 border-purple-200"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {sem2HasPpt ? <CheckCircle2 className="w-3 h-3 text-purple-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
              <span>Defense PPT {sem2HasPpt ? "(Uploaded)" : "(Required)"}</span>
            </span>
          </div>

          {/* Sem 2 Artifacts List */}
          {sem2Artifacts.length > 0 ? (
            <div className="space-y-2 pt-1">
              {sem2Artifacts.map(renderArtifactItem)}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
              <p className="text-xs text-slate-600 font-medium">No documents uploaded for Semester {nextSem} yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click &ldquo;+ Upload for Sem {nextSem}&rdquo; to attach the required Final Report and Defense PPT.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Research Manuscript & Publication Block (Optional) */}
      <div className="p-6 sm:p-7 bg-white border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#c59b27] border border-amber-200 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[#0a192f] uppercase tracking-wider">
                  Research Manuscript &amp; Publication Tracking
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Optional
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Record communicated draft papers or published articles affiliated with Avishkar CIE.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowManuscriptModal(true)}
            className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-[#0a192f] hover:bg-[#112240] text-[#c59b27] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#c59b27]/30 shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#c59b27]" />
            <span>
              {proj.hasCommunicatedManuscript || proj.isManuscriptPublished
                ? "Update Manuscript Details"
                : "+ Add Manuscript Details"}
            </span>
          </button>
        </div>

        {/* Status Preview Card if data exists */}
        {proj.hasCommunicatedManuscript || proj.isManuscriptPublished ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* Communicated Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Manuscript Communication
                </span>
                {proj.hasCommunicatedManuscript ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    Communicated / Under Review
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                    Not Communicated
                  </span>
                )}
              </div>

              {proj.hasCommunicatedManuscript && (
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">Journal: </span>
                    <span className="font-semibold text-slate-800">{proj.journalName || "Specified"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Avishkar Affiliation: Confirmed ✓</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {proj.draftManuscriptUrl && (
                      <a
                        href={proj.draftManuscriptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Draft Manuscript</span>
                      </a>
                    )}
                    {proj.manuscriptPlagiarismUrl && (
                      <a
                        href={proj.manuscriptPlagiarismUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold flex items-center gap-1"
                        title="Download first 3-5 pages Turnitin report"
                      >
                        <ShieldCheck className="w-3 h-3 text-amber-700" />
                        <span>Plagiarism Summary (3-5 pp)</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Published Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Publication Status
                </span>
                {proj.isManuscriptPublished ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Published / In-Print
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                    Awaiting Publication
                  </span>
                )}
              </div>

              {proj.isManuscriptPublished && (
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500">DOI: </span>
                    {proj.publicationDoi ? (
                      <a
                        href={proj.publicationDoi.startsWith("http") ? proj.publicationDoi : `https://doi.org/${proj.publicationDoi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-blue-700 hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        <span>{proj.publicationDoi}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-600 font-mono">Recorded</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Avishkar Affiliation: Confirmed ✓</span>
                  </div>
                  <div className="pt-1">
                    {proj.publishedManuscriptUrl && (
                      <a
                        href={proj.publishedManuscriptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Published Paper (PDF)</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50/70 border border-dashed border-slate-200 text-center text-xs text-slate-500">
            No manuscript has been communicated or published for this project yet. (Optional)
          </div>
        )}
      </div>

      {/* Registered Students Table & Export */}
      <div className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Registered Students ({proj.students.length})</span>
            </h4>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
              <span>🔒</span>
              <span>Roster Locked · Admin Managed</span>
            </span>
          </div>

          {/* Project-specific Marks & Export */}
          {proj.students.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenMarksModal}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
                title="Enter and share assessment marks with Department SPOC"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Enter & Share Marks</span>
              </button>

              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
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
                  <th className="pb-3 px-4 text-center">Attendance</th>
                  <th className="pb-3 px-4 text-center">Internal (/40)</th>
                  <th className="pb-3 px-4 text-center">External (/60)</th>
                  <th className="pb-3 px-4 text-center">Marks Status</th>
                  <th className="pb-3 pl-4 text-right">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proj.students.map((std) => {
                  const hasMarks = (std.internalMarks ?? 0) > 0 || (std.externalMarks ?? 0) > 0;
                  return (
                    <tr key={std.id} className="hover:bg-slate-50/60">
                      <td className="py-3 pr-4 font-mono font-bold text-[#0d2137]">
                        {std.enrollment}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {std.name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {std.phone ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${std.phone}`}
                              className="inline-flex items-center gap-1.5 font-mono text-xs text-[#0d2137] hover:text-[#cda34f] font-semibold transition-colors"
                              title="Click to call student"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span>+91 {std.phone}</span>
                            </a>
                            {std.phoneVerified ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                Unverified
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not provided</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{std.department}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        {std.attendancePercent ?? 100}%
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {(std.internalMarks ?? 0) > 0 ? (
                          <span className="text-emerald-700">{std.internalMarks}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {(std.externalMarks ?? 0) > 0 ? (
                          <span className="text-emerald-700">{std.externalMarks}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasMarks ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Shared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-4 text-right text-slate-500 font-mono text-[11px]">
                        {std.registeredAt.split("T")[0]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enter & Share Student Marks Modal */}
      {showMarksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0d2137]">
                    Student Assessment Marks & Attendance
                  </h3>
                  <p className="text-xs text-slate-500">
                    {proj.projectId} · {proj.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMarksModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>
                Sharing marks updates the records in real time and notifies your Department SPOC that marks have been submitted.
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2.5 pr-3">Enrollment No.</th>
                    <th className="pb-2.5 px-3">Student Name</th>
                    <th className="pb-2.5 px-3 w-28 text-center">Attendance %</th>
                    <th className="pb-2.5 px-3 w-28 text-center">Internal (/40)</th>
                    <th className="pb-2.5 px-3 w-28 text-center">External (/60)</th>
                    <th className="pb-2.5 pl-3 w-24 text-center">Total (/100)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proj.students.map((st) => {
                    const rowData = marksData[st.id] || {
                      internalMarks: st.internalMarks ?? 0,
                      externalMarks: st.externalMarks ?? 0,
                      attendancePercent: st.attendancePercent ?? 100,
                    };
                    const total = Number(rowData.internalMarks || 0) + Number(rowData.externalMarks || 0);

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 pr-3 font-mono font-bold text-[#0d2137]">
                          {st.enrollment}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {st.name}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={rowData.attendancePercent}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, Number(e.target.value)));
                              setMarksData((prev) => ({
                                ...prev,
                                [st.id]: {
                                  ...rowData,
                                  attendancePercent: val,
                                },
                              }));
                            }}
                            className="w-20 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d2137]/20"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="40"
                            value={rowData.internalMarks}
                            onChange={(e) => {
                              const val = Math.min(40, Math.max(0, Number(e.target.value)));
                              setMarksData((prev) => ({
                                ...prev,
                                [st.id]: {
                                  ...rowData,
                                  internalMarks: val,
                                },
                              }));
                            }}
                            className="w-20 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d2137]/20"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={rowData.externalMarks}
                            onChange={(e) => {
                              const val = Math.min(60, Math.max(0, Number(e.target.value)));
                              setMarksData((prev) => ({
                                ...prev,
                                [st.id]: {
                                  ...rowData,
                                  externalMarks: val,
                                },
                              }));
                            }}
                            className="w-20 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d2137]/20"
                          />
                        </td>
                        <td className="py-2.5 pl-3 text-center font-bold text-emerald-700">
                          {total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total Students: <strong>{proj.students.length}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMarksModal(false)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingMarks}
                  onClick={handleSaveAndShareMarks}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingMarks ? "Sharing Marks..." : "Save & Share Marks with SPOC"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manuscript Modal */}
      {showManuscriptModal && (
        <ManuscriptModal
          isOpen={showManuscriptModal}
          project={proj}
          onClose={() => setShowManuscriptModal(false)}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
