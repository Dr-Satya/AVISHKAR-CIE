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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserX,
  AlertTriangle,
  GraduationCap,
  School,
  CheckCircle2,
  XCircle,
  X,
  Eye,
  Phone,
  Mail,
  Award,
  BookOpen,
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
  studentSchool: string;
  setStudentSchool: (v: string) => void;
  studentBranch: string;
  setStudentBranch: (v: string) => void;
  studentGender: string;
  setStudentGender: (v: string) => void;
  studentSortBy: string;
  setStudentSortBy: (v: string) => void;
  studentSortOrder: "asc" | "desc";
  setStudentSortOrder: (v: "asc" | "desc") => void;
  unregisteredStats?: {
    totalUnregistered: number;
    bySchool: Record<string, number>;
    byBranch: Record<string, number>;
    byGender: Record<string, number>;
  };
  filterOptions?: {
    schools: string[];
    branches: string[];
    genders: string[];
  };
  studentPage: number;
  studentTotalPages: number;
  loadingStudents: boolean;
  onFetchStudents: (
    page: number,
    search?: string,
    filter?: string,
    year?: string,
    school?: string,
    branch?: string,
    gender?: string,
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  ) => void;
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
  studentSchool,
  setStudentSchool,
  studentBranch,
  setStudentBranch,
  studentGender,
  setStudentGender,
  studentSortBy,
  setStudentSortBy,
  studentSortOrder,
  setStudentSortOrder,
  unregisteredStats,
  filterOptions,
  studentPage,
  studentTotalPages,
  loadingStudents,
  onFetchStudents,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: StudentsTableCardProps) {
  const [selectedStudentDetails, setSelectedStudentDetails] = React.useState<any | null>(null);

  const handleSortToggle = (columnKey: string) => {
    let nextOrder: "asc" | "desc" = "asc";
    if (studentSortBy === columnKey) {
      nextOrder = studentSortOrder === "asc" ? "desc" : "asc";
    }
    setStudentSortBy(columnKey);
    setStudentSortOrder(nextOrder);
    onFetchStudents(
      1,
      studentSearch,
      studentFilter,
      studentAcademicYear,
      studentSchool,
      studentBranch,
      studentGender,
      columnKey,
      nextOrder
    );
  };

  const renderSortIcon = (columnKey: string) => {
    if (studentSortBy !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 opacity-40 ml-1 inline-block" />;
    }
    return studentSortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#cda34f] ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#cda34f] ml-1 inline-block" />
    );
  };

  const handleExportCsv = () => {
    const rows = students.map((s, idx) => ({
      "Sr. No": idx + 1,
      "Enrollment Number": s.enrollment,
      "Student Name": s.name,
      "Gender": s.gender || "Unspecified",
      "School": s.department,
      "Branch": s.program || "N/A",
      "Semester": s.sem,
      "Batch": s.batch,
      "Academic Year": s.academicYear || "2025-2026",
      "Phone": s.phone || "N/A",
      "Phone Verified": s.phoneVerified ? "Yes" : "No",
      "Attendance (%)": `${s.attendance}%`,
      "Internal Marks (/40)": s.internals,
      "External Marks (/60)": s.externals,
      "Total Marks (/100)": Number(s.internals ?? 0) + Number(s.externals ?? 0),
      "Registered": s.registered ? "Yes" : "No",
      "Project Code": s.projectCode || "N/A",
      "Project Title": s.projectTitle || "N/A",
      "Project Category": s.projectCategory || "N/A",
      "Faculty Guide": s.facultyName || "N/A",
      "Faculty Email": s.facultyEmail || "N/A",
    }));
    exportToCsv(rows, `GDGU_Students_${studentFilter.toUpperCase()}`);
  };

  const handleExportXlsx = () => {
    const rows = students.map((s, idx) => ({
      "Sr. No": idx + 1,
      "Enrollment Number": s.enrollment,
      "Student Name": s.name,
      "Gender": s.gender || "Unspecified",
      "School": s.department,
      "Branch": s.program || "N/A",
      "Semester": s.sem,
      "Batch": s.batch,
      "Academic Year": s.academicYear || "2025-2026",
      "Phone": s.phone || "N/A",
      "Phone Verified": s.phoneVerified ? "Yes" : "No",
      "Attendance (%)": `${s.attendance}%`,
      "Internal Marks (/40)": s.internals,
      "External Marks (/60)": s.externals,
      "Total Marks (/100)": Number(s.internals ?? 0) + Number(s.externals ?? 0),
      "Registered": s.registered ? "Yes" : "No",
      "Project Code": s.projectCode || "N/A",
      "Project Title": s.projectTitle || "N/A",
      "Project Category": s.projectCategory || "N/A",
      "Faculty Guide": s.facultyName || "N/A",
      "Faculty Email": s.facultyEmail || "N/A",
    }));
    exportToXlsx(rows, `GDGU_Students_${studentFilter.toUpperCase()}`, "Students");
  };

  const handleExportPdf = () => {
    const rows = students.map((s, idx) => ({
      "Sr. No": idx + 1,
      "Enrollment": s.enrollment,
      "Name": s.name,
      "School": s.department,
      "Branch": s.program || "N/A",
      "Attendance %": `${s.attendance}%`,
      "Internals (/40)": s.internals,
      "Externals (/60)": s.externals,
      "Total (/100)": Number(s.internals ?? 0) + Number(s.externals ?? 0),
      "Status": s.registered ? "Registered" : "Unregistered",
      "Project": s.projectCode || "N/A",
    }));
    exportToPdf(rows, `GDGU Student Academic & Registration Roster (${studentFilter.toUpperCase()})`);
  };

  const isUnregisteredMode = studentFilter === "no";

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative space-y-5">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full" />

      {/* Header and Direct Unregistered Quick-Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
              Student Roster & Academic Records
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {studentTotal} record(s)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive student data with real-time registration status, attendance logs, and internal/external assessments.
          </p>
        </div>

        {/* Quick View Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setStudentFilter("all");
                onFetchStudents(1, studentSearch, "all", studentAcademicYear, studentSchool, studentBranch, studentGender, studentSortBy, studentSortOrder);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                studentFilter === "all"
                  ? "bg-white text-[#0d2137] shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Students
            </button>
            <button
              type="button"
              onClick={() => {
                setStudentFilter("yes");
                onFetchStudents(1, studentSearch, "yes", studentAcademicYear, studentSchool, studentBranch, studentGender, studentSortBy, studentSortOrder);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                studentFilter === "yes"
                  ? "bg-white text-emerald-800 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Registered
            </button>
            <button
              type="button"
              onClick={() => {
                setStudentFilter("no");
                onFetchStudents(1, studentSearch, "no", studentAcademicYear, studentSchool, studentBranch, studentGender, studentSortBy, studentSortOrder);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                studentFilter === "no"
                  ? "bg-amber-500 text-white shadow-sm font-bold"
                  : "text-amber-700 hover:text-amber-900"
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Unregistered</span>
              {unregisteredStats && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  studentFilter === "no" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-800"
                }`}>
                  {unregisteredStats.totalUnregistered}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onAddClick}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#0d2137] text-white hover:bg-[#163456] flex items-center gap-1 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>

          <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
              title="Export CSV"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportXlsx}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
              title="Export Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
              title="Save PDF"
            >
              <Download className="w-3.5 h-3.5 text-red-600" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unregistered Insights Box (Active whenever viewing unregistered or stats are present) */}
      {unregisteredStats && unregisteredStats.totalUnregistered > 0 && (
        <div className={`p-4 rounded-xl border text-xs transition-all ${
          isUnregisteredMode
            ? "bg-amber-50/70 border-amber-200 text-amber-900"
            : "bg-slate-50 border-slate-200 text-slate-800"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 mb-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <AlertTriangle className={`w-4 h-4 ${isUnregisteredMode ? "text-amber-600" : "text-slate-500"}`} />
              <span>Unregistered Students Breakdown ({unregisteredStats.totalUnregistered} total without project seats)</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span>Gender Split:</span>
              <span className="text-blue-700 font-bold">Male: {unregisteredStats.byGender.Male || 0}</span>
              <span>•</span>
              <span className="text-purple-700 font-bold">Female: {unregisteredStats.byGender.Female || 0}</span>
              {unregisteredStats.byGender.Other ? (
                <>
                  <span>•</span>
                  <span className="text-slate-700 font-bold">Other: {unregisteredStats.byGender.Other}</span>
                </>
              ) : null}
            </div>
          </div>

          {/* School pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-semibold mr-1">School Breakdown:</span>
            {Object.entries(unregisteredStats.bySchool).map(([schoolName, count]) => (
              <button
                key={schoolName}
                type="button"
                onClick={() => {
                  setStudentSchool(schoolName);
                  onFetchStudents(
                    1,
                    studentSearch,
                    studentFilter,
                    studentAcademicYear,
                    schoolName,
                    studentBranch,
                    studentGender,
                    studentSortBy,
                    studentSortOrder
                  );
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  studentSchool === schoolName
                    ? "bg-[#0d2137] text-white font-bold"
                    : "bg-white border border-slate-200 hover:border-slate-400 text-slate-700"
                }`}
              >
                {schoolName.replace("School of ", "So")}: <strong className="ml-1">{count}</strong>
              </button>
            ))}
            {studentSchool !== "all" && (
              <button
                type="button"
                onClick={() => {
                  setStudentSchool("all");
                  onFetchStudents(
                    1,
                    studentSearch,
                    studentFilter,
                    studentAcademicYear,
                    "all",
                    studentBranch,
                    studentGender,
                    studentSortBy,
                    studentSortOrder
                  );
                }}
                className="text-[11px] text-amber-700 underline font-semibold ml-2 hover:text-amber-900"
              >
                Reset School Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Advanced Filter & Sorting Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search name / enroll no..."
            aria-label="Search student by name or enrollment"
            value={studentSearch}
            onChange={(e) => {
              setStudentSearch(e.target.value);
              onFetchStudents(
                1,
                e.target.value,
                studentFilter,
                studentAcademicYear,
                studentSchool,
                studentBranch,
                studentGender,
                studentSortBy,
                studentSortOrder
              );
            }}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        {/* School / Department */}
        <div>
          <select
            value={studentSchool}
            aria-label="Filter students by school"
            onChange={(e) => {
              setStudentSchool(e.target.value);
              onFetchStudents(
                1,
                studentSearch,
                studentFilter,
                studentAcademicYear,
                e.target.value,
                studentBranch,
                studentGender,
                studentSortBy,
                studentSortOrder
              );
            }}
            className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none bg-white text-slate-700 font-medium truncate"
          >
            <option value="all">All Schools</option>
            {filterOptions?.schools?.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Branch / Programme */}
        <div>
          <select
            value={studentBranch}
            aria-label="Filter students by branch"
            onChange={(e) => {
              setStudentBranch(e.target.value);
              onFetchStudents(
                1,
                studentSearch,
                studentFilter,
                studentAcademicYear,
                studentSchool,
                e.target.value,
                studentGender,
                studentSortBy,
                studentSortOrder
              );
            }}
            className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none bg-white text-slate-700 font-medium truncate"
          >
            <option value="all">All Branches</option>
            {filterOptions?.branches?.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Gender */}
        <div>
          <select
            value={studentGender}
            aria-label="Filter students by gender"
            onChange={(e) => {
              setStudentGender(e.target.value);
              onFetchStudents(
                1,
                studentSearch,
                studentFilter,
                studentAcademicYear,
                studentSchool,
                studentBranch,
                e.target.value,
                studentSortBy,
                studentSortOrder
              );
            }}
            className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none bg-white text-slate-700 font-medium"
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Academic Cohort */}
        <div>
          <select
            value={studentAcademicYear}
            aria-label="Filter students by academic cohort"
            onChange={(e) => {
              setStudentAcademicYear(e.target.value);
              onFetchStudents(
                1,
                studentSearch,
                studentFilter,
                e.target.value,
                studentSchool,
                studentBranch,
                studentGender,
                studentSortBy,
                studentSortOrder
              );
            }}
            className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none bg-white text-slate-700 font-medium"
          >
            <option value="all">All Cohorts</option>
            <option value={activeAcademicYear}>Active ({activeAcademicYear})</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>

        {/* Sort Field & Order Selector */}
        <div className="flex items-center gap-1">
          <select
            value={studentSortBy}
            aria-label="Sort student records by field"
            onChange={(e) => {
              setStudentSortBy(e.target.value);
              onFetchStudents(
                1,
                studentSearch,
                studentFilter,
                studentAcademicYear,
                studentSchool,
                studentBranch,
                studentGender,
                e.target.value,
                studentSortOrder
              );
            }}
            className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none bg-white text-slate-700 font-medium"
          >
            <option value="enrollmentNumber">Sort: Enroll No</option>
            <option value="name">Sort: Name</option>
            <option value="department">Sort: School Wise</option>
            <option value="programme">Sort: Branch Wise</option>
            <option value="attendance">Sort: Attendance</option>
            <option value="internals">Sort: Internals</option>
            <option value="externals">Sort: Externals</option>
            <option value="gender">Sort: Gender</option>
          </select>

          <button
            type="button"
            onClick={() => handleSortToggle(studentSortBy)}
            className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            title={`Toggle order (${studentSortOrder === "asc" ? "Ascending" : "Descending"})`}
          >
            {studentSortOrder === "asc" ? (
              <ArrowUp className="w-3.5 h-3.5 text-[#0d2137]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-[#0d2137]" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Sort Bar - One-click sorting by Name, Enroll No, School Wise, Attendance, Internals, Externals */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs bg-slate-50/90 p-2.5 rounded-xl border border-slate-200">
        <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px] uppercase tracking-wider mr-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#cda34f]" />
          <span>Quick Sort:</span>
        </span>

        {/* Name */}
        <button
          type="button"
          onClick={() => handleSortToggle("name")}
          className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
            studentSortBy === "name"
              ? "bg-[#0d2137] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span>Name</span>
          {renderSortIcon("name")}
        </button>

        {/* Enroll No */}
        <button
          type="button"
          onClick={() => handleSortToggle("enrollmentNumber")}
          className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
            studentSortBy === "enrollmentNumber"
              ? "bg-[#0d2137] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span>Enroll No</span>
          {renderSortIcon("enrollmentNumber")}
        </button>

        {/* School Wise */}
        <button
          type="button"
          onClick={() => handleSortToggle("department")}
          className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
            studentSortBy === "department"
              ? "bg-[#0d2137] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span>School Wise</span>
          {renderSortIcon("department")}
        </button>

        {/* Branch Wise */}
        <button
          type="button"
          onClick={() => handleSortToggle("programme")}
          className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
            studentSortBy === "programme"
              ? "bg-[#0d2137] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span>Branch</span>
          {renderSortIcon("programme")}
        </button>

        {/* Attendance */}
        <button
          type="button"
          onClick={() => handleSortToggle("attendance")}
          className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
            studentSortBy === "attendance"
              ? "bg-[#0d2137] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span>Attendance</span>
          {renderSortIcon("attendance")}
        </button>

        {/* Internals */}
        <button
          type="button"
          onClick={() => handleSortToggle("internals")}
          className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
            studentSortBy === "internals"
              ? "bg-[#0d2137] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span>Internals (/40)</span>
          {renderSortIcon("internals")}
        </button>

        {/* Externals */}
        <button
          type="button"
          onClick={() => handleSortToggle("externals")}
          className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
            studentSortBy === "externals"
              ? "bg-[#0d2137] text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span>Externals (/60)</span>
          {renderSortIcon("externals")}
        </button>
      </div>

      {/* Main Student Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#0d2137] text-white select-none">
              <th
                onClick={() => handleSortToggle("enrollmentNumber")}
                className="py-3 px-3 font-semibold cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <span>ENROLL NO</span>
                {renderSortIcon("enrollmentNumber")}
              </th>
              <th
                onClick={() => handleSortToggle("name")}
                className="py-3 px-3 font-semibold cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <span>STUDENT NAME</span>
                {renderSortIcon("name")}
              </th>
              <th
                onClick={() => handleSortToggle("gender")}
                className="py-3 px-2 font-semibold cursor-pointer hover:bg-slate-800 transition-colors text-center whitespace-nowrap"
              >
                <span>GENDER</span>
                {renderSortIcon("gender")}
              </th>
              <th
                onClick={() => handleSortToggle("department")}
                className="py-3 px-3 font-semibold cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <span>SCHOOL</span>
                {renderSortIcon("department")}
              </th>
              <th
                onClick={() => handleSortToggle("programme")}
                className="py-3 px-3 font-semibold cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <span>BRANCH</span>
                {renderSortIcon("programme")}
              </th>
              <th
                onClick={() => handleSortToggle("attendance")}
                className="py-3 px-2.5 font-semibold cursor-pointer hover:bg-slate-800 transition-colors text-center whitespace-nowrap"
              >
                <span>ATTENDANCE</span>
                {renderSortIcon("attendance")}
              </th>
              <th
                onClick={() => handleSortToggle("internals")}
                className="py-3 px-2.5 font-semibold cursor-pointer hover:bg-slate-800 transition-colors text-center whitespace-nowrap"
              >
                <span>INTERNALS (/40)</span>
                {renderSortIcon("internals")}
              </th>
              <th
                onClick={() => handleSortToggle("externals")}
                className="py-3 px-2.5 font-semibold cursor-pointer hover:bg-slate-800 transition-colors text-center whitespace-nowrap"
              >
                <span>EXTERNALS (/60)</span>
                {renderSortIcon("externals")}
              </th>
              <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                STATUS
              </th>
              <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loadingStudents ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0d2137]" />
                  <p className="text-xs text-slate-500 mt-2">Loading student records...</p>
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-slate-400">
                  <UserX className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No student records found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try relaxing your search terms or filters.</p>
                </td>
              </tr>
            ) : (
              students.map((st) => {
                const att = Number(st.attendance ?? 100);
                const attIsGood = att >= 75;
                const internals = Number(st.internals ?? 0);
                const externals = Number(st.externals ?? 0);

                return (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Enrollment */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {st.enrollment}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#0d2137]">{st.name}</div>
                      {st.admissionNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Adm: {st.admissionNumber}
                        </div>
                      )}
                    </td>

                    {/* Gender */}
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.gender === "Female"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : st.gender === "Male"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {st.gender || "—"}
                      </span>
                    </td>

                    {/* School */}
                    <td className="py-3 px-3 text-slate-700 max-w-[160px] truncate" title={st.department}>
                      {st.department}
                    </td>

                    {/* Branch */}
                    <td className="py-3 px-3 text-slate-600 max-w-[140px] truncate" title={st.program}>
                      {st.program}
                    </td>

                    {/* Attendance */}
                    <td className="py-3 px-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          attIsGood
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {att}%
                        {!attIsGood && <span title="Low attendance">&lt;75%</span>}
                      </span>
                    </td>

                    {/* Internals */}
                    <td className="py-3 px-2.5 text-center font-mono">
                      <span className="font-semibold text-slate-800">{internals}</span>
                      <span className="text-slate-400 text-[10px]">/40</span>
                    </td>

                    {/* Externals */}
                    <td className="py-3 px-2.5 text-center font-mono">
                      <span className="font-semibold text-slate-800">{externals}</span>
                      <span className="text-slate-400 text-[10px]">/60</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      {st.registered ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Registered</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {st.projectCode}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Not Registered</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditClick(st)}
                          className="p-1 rounded text-slate-600 hover:text-[#0d2137] hover:bg-slate-100 transition-colors"
                          title="Edit Student Assessment & Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteClick(st)}
                          className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete Student Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
        page={studentPage}
        totalPages={studentTotalPages}
        totalItems={studentTotal}
        disabled={loadingStudents}
        onPageChange={(newPage) =>
          onFetchStudents(
            newPage,
            studentSearch,
            studentFilter,
            studentAcademicYear,
            studentSchool,
            studentBranch,
            studentGender,
            studentSortBy,
            studentSortOrder
          )
        }
      />
    </div>
  );
}
