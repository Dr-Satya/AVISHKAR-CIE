"use client";

import React from "react";
import { Briefcase, Clock, Building2, Users, CheckCircle2 } from "lucide-react";
import { SpocKpis } from "@/types/spoc";

interface SpocKpisCardProps {
  kpis: SpocKpis;
  department: string;
  facultyList?: Array<{ studentsCount: number }>;
}

export function SpocKpisCard({ kpis, department, facultyList }: SpocKpisCardProps) {
  const activeFacultyCount =
    kpis.facultyWithStudentsCount ??
    (facultyList ? facultyList.filter((f) => f.studentsCount > 0).length : (kpis.totalFaculty || 0));
  const sharedCount = kpis.facultyMarksSharedCount ?? 0;
  const sharedPercent = activeFacultyCount > 0 ? Math.round((sharedCount / activeFacultyCount) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Projects
          </span>
          <Briefcase className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-[#0d2137] mt-2">
          {kpis.totalProjects ?? 0}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Across department faculty
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Pending Review
          </span>
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-bold text-amber-600 mt-2">
          {kpis.pendingCount ?? 0}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Requires SPOC action
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Faculty Mentors
          </span>
          <Building2 className="w-4 h-4 text-purple-600" />
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold text-[#0d2137]">
            {activeFacultyCount}
          </span>
          {kpis.totalFaculty && kpis.totalFaculty > activeFacultyCount && (
            <span className="text-xs font-medium text-slate-400">
              / {kpis.totalFaculty} registered
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          {kpis.totalFaculty && kpis.totalFaculty > activeFacultyCount
            ? `${activeFacultyCount} active · ${kpis.totalFaculty - activeFacultyCount} unassigned`
            : `All ${activeFacultyCount} active in ${(department || "").slice(0, 18)}`}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Marks Submitted
          </span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold text-emerald-700">
            {activeFacultyCount > 0 ? `${sharedCount}/${activeFacultyCount}` : "—"}
          </span>
          {activeFacultyCount > 0 ? (
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {sharedPercent}%
            </span>
          ) : null}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          {activeFacultyCount > 0
            ? `${sharedCount}/${activeFacultyCount} Active Mentors (${sharedPercent}%)`
            : "No active faculty mentors"}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Enrolled Students
          </span>
          <Users className="w-4 h-4 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-[#0d2137] mt-2">
          {kpis.totalStudents ?? 0}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          {kpis.departmentUnregisteredStudents != null
            ? `${kpis.departmentUnregisteredStudents} unallocated in cohort`
            : "Active in department"}
        </div>
      </div>
    </div>
  );
}
