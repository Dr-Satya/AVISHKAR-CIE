"use client";

import React from "react";
import { StudentData } from "@/types/student";

interface StudentHeaderProps {
  student: StudentData;
  onLogout: () => void;
}

export function StudentHeader({ student, onLogout }: StudentHeaderProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d2137] uppercase">
          {student.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{student.department}</span>
          {student.programme && <span>· {student.programme}</span>}
          <span>· Semester {student.semester || 3}</span>
          <span>· Batch {student.batch || "2025"}</span>
          {student.phone && (
            <span className="inline-flex items-center gap-1 font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-emerald-200">
              📱 +91 {student.phone}
            </span>
          )}
        </p>
      </div>
      <button
        onClick={onLogout}
        className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
      >
        Log out
      </button>
    </div>
  );
}
