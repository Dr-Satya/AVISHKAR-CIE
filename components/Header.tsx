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
          {/* GDGU Official Logo */}
          <div className="w-9 h-9 rounded-full overflow-hidden border border-[#2a4d77] shadow-inner flex items-center justify-center bg-[#0d2137]">
            <img
              src="/gdgu-logo.jpeg"
              alt="GDGU Logo"
              width="36"
              height="36"
              className="w-full h-full object-cover scale-110"
            />
          </div>
          <span className="text-white font-semibold text-lg sm:text-xl tracking-tight">
            Project Registration Portal
          </span>
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
