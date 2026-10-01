"use client";

import React from "react";
import Link from "next/link";
import { KeyRound, ShieldCheck, ExternalLink } from "lucide-react";
import { FacultyData } from "@/types/faculty";

interface FacultyTopBarProps {
  faculty: FacultyData;
  onOpenPasscode: () => void;
  onLogout: () => void;
}

export function FacultyTopBar({ faculty, onOpenPasscode, onLogout }: FacultyTopBarProps) {
  return (
    <>
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d2137]">
              {faculty.name}
            </h1>
            {faculty.isSpoc && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                SPOC: {faculty.spocDepartment || faculty.department}
              </span>
            )}
            {faculty.isAdmin && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                Administrator
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {faculty.department} · {faculty.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {faculty.isSpoc && (
            <Link
              href="/spoc/portal"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#cda34f] text-[#0d2137] hover:bg-[#b99142] flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Department SPOC Portal</span>
            </Link>
          )}
          {faculty.isAdmin && (
            <Link
              href="/admin/portal"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#0d2137] text-white hover:bg-[#163456] flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-[#cda34f]" />
              <span>Admin Dashboard</span>
            </Link>
          )}
          <button
            onClick={onOpenPasscode}
            className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Passcode</span>
          </button>
          <button
            onClick={onLogout}
            className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Admin Shortcut Banner */}
      {faculty.isAdmin && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0d2137] text-[#cda34f] flex items-center justify-center font-bold text-sm shadow-sm">
              ADMIN
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#0d2137]">
                You have University Administrator Privileges
              </p>
              <p className="text-xs text-slate-600">
                Access administrative management, SPOC appointments, registration limits, and system controls.
              </p>
            </div>
          </div>
          <Link
            href="/admin/portal"
            className="text-xs font-bold px-4 py-2 rounded-xl bg-[#0d2137] text-white hover:bg-[#1a3a60] transition-colors flex items-center gap-1.5 self-start sm:self-center"
          >
            <span>Launch Admin Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* SPOC Shortcut Banner */}
      {faculty.isSpoc && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              SPOC
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#0d2137]">
                You are the designated Single Point of Contact (SPOC) for {faculty.spocDepartment || faculty.department}
              </p>
              <p className="text-xs text-slate-600">
                Review faculty project uploads, approve/reject artifacts, and manage department student rosters.
              </p>
            </div>
          </div>
          <Link
            href="/spoc/portal"
            className="text-xs font-bold px-4 py-2 rounded-xl bg-[#0d2137] text-white hover:bg-[#1a3a60] transition-colors flex items-center gap-1.5 self-start sm:self-center"
          >
            <span>Launch SPOC Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </>
  );
}
