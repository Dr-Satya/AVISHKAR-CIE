"use client";

import React from "react";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { FacultyMember } from "@/types/spoc";

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
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#0d2137]">
            Department Faculty Directory ({facultyList.length})
          </h3>
          <p className="text-xs text-slate-500">
            Faculty members belonging to {department}.
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
              <th className="pb-3 pr-4">Faculty Name</th>
              <th className="pb-3 px-4">Email</th>
              <th className="pb-3 px-4">Role / SPOC</th>
              <th className="pb-3 px-4 text-center">Assigned Projects</th>
              <th className="pb-3 px-4 text-center">Mentored Students</th>
              <th className="pb-3 pl-4">Project Codes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {facultyList.map((fac) => (
              <tr key={fac.id} className="hover:bg-slate-50/60">
                <td className="py-3 pr-4 font-bold text-[#0d2137]">{fac.name}</td>
                <td className="py-3 px-4 text-slate-600">{fac.email}</td>
                <td className="py-3 px-4">
                  {fac.isSpoc ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      SPOC
                    </span>
                  ) : (
                    <span className="text-slate-400">Faculty</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center font-bold text-slate-700">
                  {fac.projectsCount}
                </td>
                <td className="py-3 px-4 text-center font-bold text-slate-700">
                  {fac.studentsCount}
                </td>
                <td className="py-3 pl-4 text-slate-500 font-mono text-[11px]">
                  {fac.projects.map((p) => p.projectId).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
