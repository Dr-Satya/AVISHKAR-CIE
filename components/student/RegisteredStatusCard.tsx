"use client";

import React from "react";
import { Mail, Phone, User, CheckCircle2 } from "lucide-react";
import { StudentData } from "@/types/student";

interface RegisteredStatusCardProps {
  registration: NonNullable<StudentData["registration"]>;
}

export function RegisteredStatusCard({ registration }: RegisteredStatusCardProps) {
  const { faculty } = registration.project;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative space-y-6">
      <div className="flex items-center justify-between">
        <div className="w-10 h-1 bg-[#cda34f] rounded-full" />
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          Registration Confirmed
        </span>
      </div>

      <div>
        <span className="text-xs font-bold text-[#0d2137] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
          {registration.project.projectId}
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-[#0d2137] mt-2">
          {registration.project.title}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {registration.project.category} · {registration.project.theme} · {registration.project.department}
        </p>
      </div>

      {/* Faculty Mentor Contact Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Faculty Mentor Contact Information
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0d2137] text-white flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm text-[#0d2137]">{faculty.name}</p>
              <p className="text-[11px] text-slate-500">{faculty.department}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {faculty.email && (
              <a
                href={`mailto:${faculty.email}`}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Send Email to Mentor"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>{faculty.email}</span>
              </a>
            )}

            {faculty.phone && (
              <a
                href={`tel:${faculty.phone}`}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Call Faculty Mentor"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{faculty.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
