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
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {student.department}
          {student.programme ? ` · ${student.programme}` : ""}
          {` · Semester ${student.semester || 3} · Batch ${student.batch || "2025"}`}
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
