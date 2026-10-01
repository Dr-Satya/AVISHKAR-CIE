"use client";

import React from "react";
import { ArrowLeft, Loader2, Mail, Phone, User } from "lucide-react";
import { ProjectCardData } from "@/types/student";

interface AvailableProjectsListProps {
  selectedCategory: string;
  selectedTheme: string;
  projects: ProjectCardData[];
  loadingProjects: boolean;
  registeringId: string | null;
  onRegister: (projectId: string) => void;
  onBack: () => void;
}

export function AvailableProjectsList({
  selectedCategory,
  selectedTheme,
  projects,
  loadingProjects,
  registeringId,
  onRegister,
  onBack,
}: AvailableProjectsListProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-1 bg-[#cda34f] rounded-full" />
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-[#0d2137] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Themes</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="text-xs font-bold bg-[#0d2137] text-white px-2.5 py-0.5 rounded-full">
          {selectedCategory}
        </span>
        <span className="text-xs font-semibold text-slate-600">
          › {selectedTheme}
        </span>
      </div>
      <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-1">
        Available Projects ({projects.length})
      </h2>
      <p className="text-xs text-slate-500 mb-6">
        Select a project below to complete instant registration.
      </p>

      {loadingProjects ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#0d2137]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No projects found for the selected category and theme.
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className={`p-5 rounded-xl border transition-all ${
                proj.isEligible
                  ? "bg-white border-slate-200 hover:border-[#0d2137] hover:shadow-sm"
                  : "bg-slate-50 border-slate-200/70 opacity-75"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-[#0d2137] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {proj.projectId}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {proj.department}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-[#0d2137]">
                    {proj.title}
                  </h3>
                  {proj.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {proj.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{proj.facultyName}</span>
                    </span>

                    {proj.facultyEmail && (
                      <a
                        href={`mailto:${proj.facultyEmail}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                        title="Email Faculty Mentor"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-500" />
                        <span>{proj.facultyEmail}</span>
                      </a>
                    )}

                    {proj.facultyPhone && (
                      <a
                        href={`tel:${proj.facultyPhone}`}
                        className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                        title="Call Faculty Mentor"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{proj.facultyPhone}</span>
                      </a>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>
                      <strong className="text-slate-700">Available Seats:</strong>{" "}
                      <span
                        className={
                          proj.availableSeats > 0
                            ? "text-green-700 font-bold"
                            : "text-red-600 font-bold"
                        }
                      >
                        {proj.availableSeats} / {proj.maxSeats}
                      </span>
                    </span>
                    <span>
                      <strong className="text-slate-700">Quotas:</strong> Same:{" "}
                      {proj.sameDeptQuota} · Other: {proj.otherDeptQuota}
                    </span>
                  </div>

                  {!proj.isEligible && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      ⚠ {proj.ineligibilityReason}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onRegister(proj.id)}
                    disabled={!proj.isEligible || registeringId === proj.id}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      proj.isEligible
                        ? "bg-[#0d2137] hover:bg-[#163456] text-white shadow-sm"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {registeringId === proj.id ? "Registering..." : "Register"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
