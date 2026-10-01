"use client";

import React from "react";
import { Briefcase, Clock, Building2, Users } from "lucide-react";
import { SpocKpis } from "@/types/spoc";

interface SpocKpisCardProps {
  kpis: SpocKpis;
  department: string;
}

export function SpocKpisCard({ kpis, department }: SpocKpisCardProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Projects
          </span>
          <Briefcase className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-[#0d2137] mt-2">
          {kpis.totalProjects}
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
          {kpis.pendingCount}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Requires SPOC action
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Faculty Members
          </span>
          <Building2 className="w-4 h-4 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-[#0d2137] mt-2">
          {kpis.totalFaculty}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          In {department.slice(0, 20)}...
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Enrolled Students
          </span>
          <Users className="w-4 h-4 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-[#0d2137] mt-2">
          {kpis.totalStudents}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Active in department
        </div>
      </div>
    </div>
  );
}
