"use client";

import React from "react";
import Link from "next/link";

interface HeaderProps {
  role?: "Student" | "Faculty" | "Admin" | "SPOC" | string | null;
}

export function Header({ role }: HeaderProps) {
  return (
    <header className="w-full bg-[#0d2137] border-b-2 border-[#cda34f] px-4 sm:px-8 py-3.5 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Official Logos: GDGU + Avishkar CIE */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#2a4d77] shadow-inner flex items-center justify-center bg-[#0d2137] transition-transform group-hover:scale-105 shrink-0">
              <img
                src="/gdgu-logo.jpeg"
                alt="GDGU Logo"
                width="40"
                height="40"
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <div className="h-6 w-[1px] bg-[#2a4d77]" />

            {/* Highlighted Avishkar CIE Official Logo */}
            <div className="h-10 sm:h-11 px-3 py-1 rounded-xl bg-white border-2 border-[#cda34f] shadow-md shadow-[#cda34f]/30 flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-[#e5be6b] group-hover:shadow-[#cda34f]/50">
              <img
                src="/avishkar-logo.png"
                alt="Avishkar CIE Logo"
                className="h-full w-auto max-w-[130px] sm:max-w-[160px] object-contain drop-shadow-xs"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-white font-semibold text-base sm:text-lg tracking-tight leading-tight">
              Project Registration Portal
            </span>
            <span className="text-[#cda34f] text-[10px] sm:text-xs font-bold tracking-wider uppercase flex items-center gap-1">
              <span>Avishkar</span>
              <span className="text-slate-400">·</span>
              <span className="text-amber-200">CIE</span>
            </span>
          </div>
        </Link>

        {role && (
          <div className="flex items-center gap-3">
            <span className="bg-[#173252] text-[#8cb6e0] text-xs font-medium px-3.5 py-1 rounded-full border border-[#23456c]">
              {role}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
