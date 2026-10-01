import React from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  FileText,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { PaginationBar } from "@/components/common/PaginationBar";
import { exportToCsv, exportToXlsx, exportToPdf } from "@/lib/export";

interface StudentsTableCardProps {
  students: any[];
  studentTotal: number;
  studentSearch: string;
  setStudentSearch: (v: string) => void;
  studentFilter: string;
  setStudentFilter: (v: string) => void;
  studentAcademicYear: string;
  setStudentAcademicYear: (v: string) => void;
  activeAcademicYear: string;
  studentPage: number;
  studentTotalPages: number;
  loadingStudents: boolean;
  onFetchStudents: (page: number, search?: string, filter?: string, year?: string) => void;
  onAddClick: () => void;
  onEditClick: (student: any) => void;
  onDeleteClick: (student: any) => void;
}

export function StudentsTableCard({
  students,
  studentTotal,
  studentSearch,
  setStudentSearch,
  studentFilter,
  setStudentFilter,
  studentAcademicYear,
  setStudentAcademicYear,
  activeAcademicYear,
  studentPage,
  studentTotalPages,
  loadingStudents,
  onFetchStudents,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: StudentsTableCardProps) {
  const handleExportCsv = () => {
    const rows = students.map((s, idx) => ({
      "Sr. No": idx + 1,
      Enrollment: s.enrollment,
      Name: s.name,
      Department: s.department,
      Programme: s.programme || "N/A",
      Semester: s.semester,
      Batch: s.batch,
      Registered: s.isRegistered ? "Yes" : "No",
      Project: s.projectCode || "N/A",
    }));
    exportToCsv(rows, "GDGU_Admin_Students");
  };

  const handleExportXlsx = () => {
    const rows = students.map((s, idx) => ({
      "Sr. No": idx + 1,
      Enrollment: s.enrollment,
      Name: s.name,
      Department: s.department,
      Programme: s.programme || "N/A",
      Semester: s.semester,
      Batch: s.batch,
      Registered: s.isRegistered ? "Yes" : "No",
      Project: s.projectCode || "N/A",
    }));
    exportToXlsx(rows, "GDGU_Admin_Students", "Students");
  };

  const handleExportPdf = () => {
    const rows = students.map((s, idx) => ({
      "Sr. No": idx + 1,
      Enrollment: s.enrollment,
      Name: s.name,
      Department: s.department,
      Programme: s.programme || "N/A",
      Semester: s.semester,
      Batch: s.batch,
      Registered: s.isRegistered ? "Yes" : "No",
      Project: s.projectCode || "N/A",
    }));
    exportToPdf(rows, "GDGU Student Enrollment Master List");
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
          Students ({studentTotal})
        </h2>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <input
              type="text"
              placeholder="Search student or enrollment..."
              aria-label="Search student by name or enrollment"
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value);
                onFetchStudents(1, e.target.value, studentFilter, studentAcademicYear);
              }}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137] w-48 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={studentFilter}
            aria-label="Filter students by status"
            onChange={(e) => {
              setStudentFilter(e.target.value);
              onFetchStudents(1, studentSearch, e.target.value, studentAcademicYear);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="yes">Registered</option>
            <option value="no">Unregistered</option>
          </select>

          <select
            value={studentAcademicYear}
            aria-label="Filter students by academic cohort"
            onChange={(e) => {
              setStudentAcademicYear(e.target.value);
              onFetchStudents(1, studentSearch, studentFilter, e.target.value);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none bg-white font-medium text-slate-700"
          >
            <option value="all">All Cohorts</option>
            <option value={activeAcademicYear}>Active ({activeAcademicYear})</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>

          <button
            type="button"
            onClick={onAddClick}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0d2137] text-white hover:bg-[#163456] flex items-center gap-1 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>

          <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
              title="Export Students CSV"
            >
              <FileText className="w-3 h-3 text-blue-600" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportXlsx}
              className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
              title="Export Students Excel"
            >
              <FileSpreadsheet className="w-3 h-3 text-green-600" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
              title="Print / Save PDF"
            >
              <Download className="w-3 h-3 text-red-600" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#0d2137] text-white">
              <th className="py-2.5 px-3 font-semibold">ENROLLMENT</th>
              <th className="py-2.5 px-3 font-semibold">NAME</th>
              <th className="py-2.5 px-3 font-semibold">DEPARTMENT</th>
              <th className="py-2.5 px-3 font-semibold">PROGRAM</th>
              <th className="py-2.5 px-3 font-semibold">SEM</th>
              <th className="py-2.5 px-3 font-semibold">BATCH</th>
              <th className="py-2.5 px-3 font-semibold">REGISTERED</th>
              <th className="py-2.5 px-3 font-semibold">PROJECT</th>
              <th className="py-2.5 px-3 font-semibold text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loadingStudents ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0d2137]" />
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-slate-400">
                  No student records found.
                </td>
              </tr>
            ) : (
              students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono text-slate-800">{st.enrollment}</td>
                  <td className="py-3 px-3 font-medium text-[#0d2137]">{st.name}</td>
                  <td className="py-3 px-3 text-slate-600">{st.department}</td>
                  <td className="py-3 px-3 text-slate-500">{st.program}</td>
                  <td className="py-3 px-3 text-slate-600">{st.sem}</td>
                  <td className="py-3 px-3 text-slate-600">{st.batch}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        st.registered
                          ? "bg-[#dcfce7] text-[#15803d]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {st.registered ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-700">
                    {st.projectCode}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEditClick(st)}
                        className="p-1 rounded text-slate-600 hover:text-[#0d2137] hover:bg-slate-100 transition-colors"
                        title="Edit Student"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteClick(st)}
                        className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={studentPage}
        totalPages={studentTotalPages}
        totalItems={studentTotal}
        disabled={loadingStudents}
        onPageChange={(newPage) =>
          onFetchStudents(newPage, studentSearch, studentFilter, studentAcademicYear)
        }
      />
    </div>
  );
}
