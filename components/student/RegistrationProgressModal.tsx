"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  User,
  Building2,
} from "lucide-react";
import { ProjectCardData } from "@/types/student";

interface RegistrationProgressModalProps {
  isOpen: boolean;
  isRegistering: boolean;
  project: ProjectCardData | null;
  successData: {
    projectId: string;
    projectTitle: string;
    facultyName?: string;
    category?: string;
  } | null;
  errorMessage: string | null;
  onClose: () => void;
}

export function RegistrationProgressModal({
  isOpen,
  isRegistering,
  project,
  successData,
  errorMessage,
  onClose,
}: RegistrationProgressModalProps) {
  const [progress, setProgress] = useState(15);
  const [stageText, setStageText] = useState("Connecting to IDP allocation queue...");

  useEffect(() => {
    if (!isRegistering) {
      if (successData) {
        setProgress(100);
        setStageText("Registration complete! Your seat is secured.");
      }
      return;
    }

    setProgress(20);
    setStageText("Verifying department eligibility and seat balance...");

    const t1 = setTimeout(() => {
      setProgress(55);
      setStageText("Securing project allocation in university registry...");
    }, 900);

    const t2 = setTimeout(() => {
      setProgress(85);
      setStageText("Assigning faculty mentor and locking seat...");
    }, 2200);

    const t3 = setTimeout(() => {
      setProgress(95);
      setStageText("Finalizing confirmation...");
    }, 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isRegistering, successData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a192f]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Top Gold Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#c59b27] via-[#0a192f] to-[#c59b27]" />

        {isRegistering ? (
          <div className="py-4 space-y-6 text-center">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-amber-100/80 animate-ping opacity-30" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/90 border border-amber-200 flex items-center justify-center text-[#c59b27] shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin text-[#0a192f]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-[#0a192f]">
                Reserving Your Project Seat
              </h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                {project ? project.title : "Processing your IDP project allocation"}
              </p>
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#c59b27] animate-pulse" />
                  {stageText}
                </span>
                <span className="text-[#0a192f] font-mono">{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#c59b27] via-amber-500 to-[#0a192f] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Please keep this window open while we secure your slot.</span>
            </div>
          </div>
        ) : successData ? (
          <div className="py-2 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Seat Confirmed & Allocated</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#0a192f]">
                Registration Successful!
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                You have been officially registered for this Inter-Disciplinary Project.
              </p>
            </div>

            {/* Project Details Box */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/90 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#0a192f] text-white">
                  {successData.projectId}
                </span>
                {successData.category && (
                  <span className="text-[11px] font-semibold text-slate-500">
                    Category: {successData.category}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-[#0a192f] leading-snug">
                {successData.projectTitle}
              </h4>

              {successData.facultyName && (
                <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Faculty Mentor: <strong>{successData.facultyName}</strong></span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0a192f] hover:bg-[#163456] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <span>View My IDP Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : errorMessage ? (
          <div className="py-2 space-y-5 text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-[#0a192f]">
                Registration Notice
              </h3>
              <p className="text-xs text-red-700 bg-red-50/80 p-3 rounded-xl border border-red-200 leading-relaxed font-medium">
                {errorMessage}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#0a192f] font-semibold text-xs transition-colors"
            >
              Close & Choose Another Project
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
