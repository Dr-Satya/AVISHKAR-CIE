"use client";

import React from "react";
import { FileText, FileSpreadsheet, Download } from "lucide-react";

interface SpocExportsTabProps {
  studentCount: number;
  facultyCount: number;
  department: string;
  onExportData: (
    type: "STUDENTS" | "FACULTY" | "PROJECTS",
    format: "csv" | "xlsx" | "pdf"
  ) => void;
}

export function SpocExportsTab({
  studentCount,
  facultyCount,
  department,
  onExportData,
}: SpocExportsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Student Data Extraction Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="w-10 h-1 bg-blue-600 rounded-full" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#0d2137]">
            Enrolled Students Dataset
          </h3>
          <p className="text-xs text-slate-500">
            Extract complete roster of all {studentCount} enrolled students under this department's projects.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => onExportData("STUDENTS", "csv")}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Download CSV (.csv)
            </span>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onExportData("STUDENTS", "xlsx")}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Download Excel (.xlsx)
            </span>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onExportData("STUDENTS", "pdf")}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4 text-red-600" />
              Print / Save PDF Report
            </span>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Faculty Data Extraction Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="w-10 h-1 bg-purple-600 rounded-full" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#0d2137]">
            Faculty Roster Dataset
          </h3>
          <p className="text-xs text-slate-500">
            Extract complete roster of all {facultyCount} faculty mentors and their workload in {department}.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => onExportData("FACULTY", "csv")}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Download CSV (.csv)
            </span>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onExportData("FACULTY", "xlsx")}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Download Excel (.xlsx)
            </span>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onExportData("FACULTY", "pdf")}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4 text-red-600" />
              Print / Save PDF Report
            </span>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Projects & Verification Audit Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="w-10 h-1 bg-[#cda34f] rounded-full" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#0d2137]">
            Project Audit & Verification Report
          </h3>
          <p className="text-xs text-slate-500">
            Export complete verification status, plagiarism similarity percentages, and SPOC review feedback.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => onExportData("PROJECTS", "csv")}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Download CSV (.csv)
            </span>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onExportData("PROJECTS", "xlsx")}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Download Excel (.xlsx)
            </span>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => onExportData("PROJECTS", "pdf")}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
          >
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4 text-red-600" />
              Print / Save PDF Report
            </span>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
