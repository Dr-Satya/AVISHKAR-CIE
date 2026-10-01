"use client";

import React from "react";
import { StudentData } from "@/types/student";

interface RegisteredStatusCardProps {
  registration: NonNullable<StudentData["registration"]>;
}

export function RegisteredStatusCard({ registration }: RegisteredStatusCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-4" />
      <h2 className="text-base sm:text-lg font-bold text-[#16a34a] mb-5">
        You are registered
      </h2>

      <div className="space-y-4 text-xs sm:text-sm">
        <div>
          <span className="font-bold text-[#0d2137]">Project: </span>
          <span className="text-slate-700">{registration.project.title}</span>
        </div>

        <div>
          <span className="font-bold text-[#0d2137]">Faculty: </span>
          <span className="text-slate-700">{registration.project.faculty.name}</span>
        </div>

        <div>
          <span className="font-bold text-[#0d2137]">Department: </span>
          <span className="text-slate-700">{registration.project.department}</span>
        </div>

        <div>
          <span className="font-bold text-[#0d2137]">Theme: </span>
          <span className="text-slate-700">{registration.project.theme}</span>
        </div>

        <div>
          <span className="font-bold text-[#0d2137]">Category: </span>
          <span className="text-slate-700">{registration.project.category}</span>
        </div>
      </div>
    </div>
  );
}
