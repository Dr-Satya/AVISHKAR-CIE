"use client";

import React from "react";
import { FileText, FileSpreadsheet, Download, Archive, FolderArchive } from "lucide-react";

interface SpocExportsTabProps {
  studentCount: number;
  facultyCount: number;
  department: string;
  onExportData: (
    type: "STUDENTS" | "FACULTY" | "PROJECTS",
    format: "csv" | "xlsx" | "pdf"
  ) => void;
  onDownloadSubmissionsZip?: (sem?: "ALL" | 1 | 2) => void;
}

export function SpocExportsTab({
  studentCount,
  facultyCount,
  department,
  onExportData,
  onDownloadSubmissionsZip,
}: SpocExportsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Student Data Extraction Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="w-10 h-1 bg-blue-600 rounded-full" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#0d2137]">
            Enrolled Students Dataset
          </h3>
          <p className="text-xs text-slate-500">
            Extract complete roster of all {studentCount} enrolled students under this department&apos;s projects.
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

      {/* Submissions & Uploaded Artifacts Archive Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="w-10 h-1 bg-emerald-600 rounded-full" />
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Archive className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-[#0d2137]">
              Submitted Files Package (.zip)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Download all submitted project reports, presentations, Turnitin certificates, and student marks roster bundled into clean folders.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {onDownloadSubmissionsZip ? (
            <>
              <button
                type="button"
                onClick={() => onDownloadSubmissionsZip("ALL")}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0d2137] hover:bg-[#162a45] text-white text-xs font-bold flex items-center justify-between transition-all shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-[#cda34f]" />
                  Download All Files (.zip)
                </span>
                <Download className="w-3.5 h-3.5 text-[#cda34f]" />
              </button>

              <button
                type="button"
                onClick={() => onDownloadSubmissionsZip(1)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <Archive className="w-3.5 h-3.5 text-blue-600" />
                  Semester 1 Files Only (.zip)
                </span>
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onDownloadSubmissionsZip(2)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <Archive className="w-3.5 h-3.5 text-purple-600" />
                  Semester 2 Files Only (.zip)
                </span>
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">
              Archive packaging not available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
