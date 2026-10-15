"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  X,
  Users,
  GraduationCap,
  Percent,
} from "lucide-react";
import { FacultyMember, FacultyStudentMarks } from "@/types/spoc";
import { exportToCsv, exportToXlsx, exportToPdf } from "@/lib/export";

interface SpocFacultyDirectoryTabProps {
  facultyList: FacultyMember[];
  department: string;
  onExport: (format: "csv" | "xlsx" | "pdf") => void;
}

export function SpocFacultyDirectoryTab({
  facultyList,
  department,
  onExport,
}: SpocFacultyDirectoryTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SHARED" | "PARTIAL" | "NOT_SHARED" | "NO_STUDENTS">("ALL");
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState("");

  // Statistics
  const stats = useMemo(() => {
    let shared = 0;
    let partial = 0;
    let pending = 0;
    let noStudents = 0;
    let totalStudents = 0;

    facultyList.forEach((f) => {
      totalStudents += f.studentsCount;
      if (f.marksStatus === "SHARED") shared++;
      else if (f.marksStatus === "PARTIAL") partial++;
      else if (f.marksStatus === "NOT_SHARED") pending++;
      else noStudents++;
    });

    return { shared, partial, pending, noStudents, totalStudents };
  }, [facultyList]);

  // Filtered faculty list
  const filteredFaculty = useMemo(() => {
    return facultyList.filter((f) => {
      // Status filter
      if (statusFilter !== "ALL" && f.marksStatus !== statusFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(query);
        const matchesEmail = f.email.toLowerCase().includes(query);
        const matchesProjects = f.projects.some(
          (p) =>
            p.projectId.toLowerCase().includes(query) ||
            p.title.toLowerCase().includes(query)
        );
        return matchesName || matchesEmail || matchesProjects;
      }

      return true;
    });
  }, [facultyList, statusFilter, searchTerm]);

  // Filtered students for modal
  const modalFilteredStudents = useMemo(() => {
    if (!selectedFaculty || !selectedFaculty.studentsWithMarks) return [];
    if (!modalSearchTerm.trim()) return selectedFaculty.studentsWithMarks;
    const query = modalSearchTerm.toLowerCase();
    return selectedFaculty.studentsWithMarks.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.enrollmentNumber.toLowerCase().includes(query) ||
        (s.programme && s.programme.toLowerCase().includes(query)) ||
        s.projectTitle.toLowerCase().includes(query)
    );
  }, [selectedFaculty, modalSearchTerm]);

  // Export marks for single faculty
  const handleExportFacultyMarks = (faculty: FacultyMember, format: "csv" | "xlsx" | "pdf") => {
    if (!faculty.studentsWithMarks || faculty.studentsWithMarks.length === 0) {
      alert("No students found for this faculty member.");
      return;
    }

    const rows = faculty.studentsWithMarks.map((s, idx) => ({
      "Sr. No": idx + 1,
      "Enrollment Number": s.enrollmentNumber,
      "Student Name": s.name,
      Programme: s.programme || "N/A",
      "Project ID": s.projectId,
      "Project Title": s.projectTitle,
      "Internal Marks": s.internalMarks,
      "External Marks": s.externalMarks,
      "Total Marks": s.internalMarks + s.externalMarks,
      "Attendance %": `${s.attendancePercent}%`,
      "Marks Shared": s.marksShared ? "Yes" : "Pending",
    }));

    const cleanName = faculty.name.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Marks_${cleanName}`;

    if (format === "csv") exportToCsv(rows, filename);
    else if (format === "xlsx") exportToXlsx(rows, filename, "Marks");
    else if (format === "pdf")
      exportToPdf(rows, `Student Assessment Marks · ${faculty.name} (${department})`);
  };

  const renderStatusBadge = (status: FacultyMember["marksStatus"], shared: number, total: number) => {
    switch (status) {
      case "SHARED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>All Shared ({shared}/{total})</span>
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>Partial ({shared}/{total})</span>
          </span>
        );
      case "NOT_SHARED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
            <span>Pending (0/{total})</span>
          </span>
        );
      case "NO_STUDENTS":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            No Students
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#0d2137]">
            Department Faculty & Marks Directory ({facultyList.length})
          </h3>
          <p className="text-xs text-slate-500">
            Track student assessment marks submission status across faculty in {department}.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-semibold mr-1">Export Directory:</span>
          <button
            onClick={() => onExport("csv")}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => onExport("xlsx")}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => onExport("pdf")}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-red-600" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Marks Shared</div>
            <div className="text-base font-bold text-emerald-700">{stats.shared} Faculty</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Partially Shared</div>
            <div className="text-base font-bold text-amber-700">{stats.partial} Faculty</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
            <XCircle className="w-4 h-4 text-rose-700" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Marks Pending</div>
            <div className="text-base font-bold text-rose-700">{stats.pending} Faculty</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
            <Users className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Enrolled Students</div>
            <div className="text-base font-bold text-[#0d2137]">{stats.totalStudents} Students</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search faculty by name, email, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d2137]/20 focus:border-[#0d2137]"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === "ALL"
                ? "bg-[#0d2137] text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            All ({facultyList.length})
          </button>
          <button
            onClick={() => setStatusFilter("SHARED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              statusFilter === "SHARED"
                ? "bg-emerald-700 text-white"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Shared ({stats.shared})</span>
          </button>
          <button
            onClick={() => setStatusFilter("PARTIAL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              statusFilter === "PARTIAL"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Partial ({stats.partial})</span>
          </button>
          <button
            onClick={() => setStatusFilter("NOT_SHARED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              statusFilter === "NOT_SHARED"
                ? "bg-rose-700 text-white"
                : "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
            }`}
          >
            <XCircle className="w-3 h-3" />
            <span>Pending ({stats.pending})</span>
          </button>
          <button
            onClick={() => setStatusFilter("NO_STUDENTS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === "NO_STUDENTS"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            No Students ({stats.noStudents})
          </button>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold">
              <th className="pb-3 pr-4">Faculty Name</th>
              <th className="pb-3 px-4">Email</th>
              <th className="pb-3 px-4 text-center">Projects</th>
              <th className="pb-3 px-4 text-center">Students</th>
              <th className="pb-3 px-4">Marks Status</th>
              <th className="pb-3 px-4">Project Codes</th>
              <th className="pb-3 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredFaculty.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No faculty members match the selected filter or search query.
                </td>
              </tr>
            ) : (
              filteredFaculty.map((fac) => (
                <tr key={fac.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 pr-4">
                    <div className="font-bold text-[#0d2137] flex items-center gap-2">
                      <span>{fac.name}</span>
                      {fac.isSpoc && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          SPOC
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{fac.email}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    {fac.projectsCount}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    {fac.studentsCount}
                  </td>
                  <td className="py-3.5 px-4">
                    {renderStatusBadge(fac.marksStatus, fac.marksSharedCount, fac.studentsCount)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] max-w-[150px] truncate">
                    {fac.projects.map((p) => p.projectId).join(", ") || "—"}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedFaculty(fac);
                        setModalSearchTerm("");
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-[#0d2137] hover:text-white text-[#0d2137] border border-slate-200 transition-colors inline-flex items-center gap-1.5"
                      title="Inspect student assessment marks"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Marks</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Marks Detail Modal */}
      {selectedFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#0d2137]">
                    Student Marks · {selectedFaculty.name}
                  </h3>
                  {renderStatusBadge(
                    selectedFaculty.marksStatus,
                    selectedFaculty.marksSharedCount,
                    selectedFaculty.studentsCount
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedFaculty.email} · {department}
                </p>
              </div>

              <button
                onClick={() => setSelectedFaculty(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Summary Banner */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <span className="text-slate-600">
                  Total Students: <strong className="text-[#0d2137]">{selectedFaculty.studentsCount}</strong>
                </span>
                <span className="text-emerald-700">
                  Shared: <strong>{selectedFaculty.marksSharedCount}</strong>
                </span>
                <span className="text-rose-700">
                  Pending: <strong>{selectedFaculty.marksPendingCount}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold mr-1 text-[11px]">Export:</span>
                <button
                  onClick={() => handleExportFacultyMarks(selectedFaculty, "csv")}
                  className="px-2 py-0.5 text-[11px] font-semibold rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => handleExportFacultyMarks(selectedFaculty, "xlsx")}
                  className="px-2 py-0.5 text-[11px] font-semibold rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3 h-3 text-green-600" />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter students by name, enrollment, or programme..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d2137]/20 focus:border-[#0d2137]"
                />
              </div>
            </div>

            {/* Modal Students Table */}
            <div className="flex-1 overflow-y-auto p-5">
              {modalFilteredStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {selectedFaculty.studentsCount === 0
                    ? "No students are enrolled in projects under this faculty member."
                    : "No students match your search criteria."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="pb-2.5 pr-3">Enrollment No.</th>
                        <th className="pb-2.5 px-3">Student Name</th>
                        <th className="pb-2.5 px-3">Programme</th>
                        <th className="pb-2.5 px-3">Project Title</th>
                        <th className="pb-2.5 px-3 text-center">Attendance</th>
                        <th className="pb-2.5 px-3 text-center">Internal (/40)</th>
                        <th className="pb-2.5 px-3 text-center">External (/60)</th>
                        <th className="pb-2.5 pl-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {modalFilteredStudents.map((st) => (
                        <tr key={st.studentId} className="hover:bg-slate-50/60">
                          <td className="py-2.5 pr-3 font-mono font-bold text-[#0d2137]">
                            {st.enrollmentNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {st.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {st.programme || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-[160px] truncate" title={st.projectTitle}>
                            {st.projectTitle}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700 font-medium">
                            {st.attendancePercent}%
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                            {st.internalMarks > 0 ? (
                              <span className="text-emerald-700">{st.internalMarks}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                            {st.externalMarks > 0 ? (
                              <span className="text-emerald-700">{st.externalMarks}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-2.5 pl-3 text-right">
                            {st.marksShared ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Shared
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
              <button
                onClick={() => setSelectedFaculty(null)}
                className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
