"use client";

import React from "react";
import Link from "next/link";
import { Users, LogOut } from "lucide-react";

interface SpocHeaderProps {
  spocUser: any;
  department: string;
  allDepartments: string[];
  onDepartmentChange: (dept: string) => void;
  onLogout: () => void;
}

export function SpocHeader({
  spocUser,
  department,
  allDepartments,
  onDepartmentChange,
  onLogout,
}: SpocHeaderProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#0d2137] text-white">
            Department SPOC Portal
          </span>
          <span className="text-xs font-medium text-slate-500">
            {spocUser?.name}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d2137]">
          {department}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Verify faculty document uploads, enforce plagiarism/AI integrity checks, and manage department rosters.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Admin Department Switcher */}
        {spocUser?.role === "ADMIN" && allDepartments.length > 0 && (
          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white"
          >
            {allDepartments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {(spocUser?.role === "FACULTY" || spocUser?.role === "ADMIN") && (
          <Link
            href="/faculty/portal"
            className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title="Switch to your assigned Faculty Mentor dashboard"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Switch to Faculty View</span>
          </Link>
        )}

        <button
          onClick={onLogout}
          className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 flex items-center gap-1.5 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <LogOut className="w-3.5 h-3.5 text-red-600" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
