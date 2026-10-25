"use client";

import React from "react";
import Link from "next/link";

interface HeaderProps {
  role?: "Student" | "Faculty" | "Admin" | "SPOC" | string | null;
}

export function Header({ role }: HeaderProps) {
  return (
    <header className="w-full bg-[#0a192f] border-b border-[#c59b27]/30 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 sm:gap-3.5 group min-w-0 shrink">
          {/* Official Logos: GDGU + Avishkar CIE in unified premium container */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 p-1 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 shrink-0">
            {/* GDGU Official Logo */}
            <div className="h-7 sm:h-9 md:h-10 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-white border border-[#c59b27]/40 shadow-sm flex items-center justify-center transition-all group-hover:scale-105 shrink-0">
              <img
                src="/gdgu-logo.jpeg"
                alt="GDGU Logo"
                className="h-full w-auto max-w-[75px] xs:max-w-[95px] sm:max-w-[130px] md:max-w-[145px] object-contain"
              />
            </div>
            <div className="h-4 sm:h-5 w-[1px] bg-white/15 shrink-0" />

            {/* Avishkar CIE Official Logo */}
            <div className="h-7 sm:h-9 md:h-10 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-white border border-[#c59b27]/40 shadow-sm flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-[#c59b27] group-hover:shadow-[#c59b27]/30 shrink-0">
              <img
                src="/avishkar-logo.png"
                alt="Avishkar CIE Logo"
                className="h-full w-auto max-w-[75px] xs:max-w-[95px] sm:max-w-[130px] md:max-w-[150px] object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-white font-bold text-xs xs:text-sm sm:text-base tracking-tight leading-snug truncate">
              IDP<span className="hidden sm:inline"> (Inter-Disciplinary Project)</span> Portal
            </span>
            <span className="text-[#c59b27] text-[9px] sm:text-xs font-semibold tracking-wider uppercase flex items-center gap-1 truncate">
              <span>Avishkar</span>
              <span className="text-slate-400">·</span>
              <span className="text-amber-200">CIE</span>
            </span>
          </div>
        </Link>

        {role && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-white/10 text-slate-100 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full border border-white/15 backdrop-blur-sm flex items-center gap-1.5 shadow-subtle shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c59b27] animate-pulse shrink-0" />
              <span>{role}</span>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
