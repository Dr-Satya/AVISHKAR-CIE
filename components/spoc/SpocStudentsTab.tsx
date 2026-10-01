"use client";

import React from "react";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { StudentRecord } from "@/types/spoc";

interface SpocStudentsTabProps {
  studentList: StudentRecord[];
  department: string;
  onExport: (format: "csv" | "xlsx" | "pdf") => void;
}

export function SpocStudentsTab({
  studentList,
  department,
  onExport,
}: SpocStudentsTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#0d2137]">
            Students Enrolled in {department} Projects ({studentList.length})
          </h3>
          <p className="text-xs text-slate-500">
            Complete list of all students under department faculty mentors.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-semibold mr-1">Export:</span>
          <button
            onClick={() => onExport("csv")}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => onExport("xlsx")}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => onExport("pdf")}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-red-600" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold">
              <th className="pb-3 pr-3">Enrollment No.</th>
              <th className="pb-3 px-3">Student Name</th>
              <th className="pb-3 px-3">Department</th>
              <th className="pb-3 px-3">Programme</th>
              <th className="pb-3 px-3">Project ID</th>
              <th className="pb-3 px-3">Project Title</th>
              <th className="pb-3 pl-3">Faculty Mentor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {studentList.map((std) => (
              <tr key={std.id} className="hover:bg-slate-50/60">
                <td className="py-2.5 pr-3 font-mono font-bold text-[#0d2137]">
                  {std.enrollmentNumber}
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  {std.name}
                </td>
                <td className="py-2.5 px-3 text-slate-600">{std.department}</td>
                <td className="py-2.5 px-3 text-slate-600">{std.programme || "—"}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                  {std.projectId}
                </td>
                <td className="py-2.5 px-3 text-slate-800 line-clamp-1 max-w-xs">
                  {std.projectTitle}
                </td>
                <td className="py-2.5 pl-3 text-slate-700 font-medium">
                  {std.facultyName}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
