/**
 * G.D. Goenka University - Inter-Disciplinary Project (IDP) Portal
 * 
 * Code Attribution:
 * - Dr. Satya Prakash (Avishkar Centre for Innovation and Entrepreneurship,
 *   School of Engineering and Sciences, G.D. Goenka University, Haryana)
 * - Potla Sri Sharan
 * - Sarthak Singh
 * 
 * Licensed under the Apache License, Version 2.0.
 */

"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GraduationCap, Users, FolderCheck, ShieldCheck, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col justify-center">
        {/* Apple HIG Hero Banner with Asymmetric Balance */}
        <div className="bg-white rounded-3xl p-8 sm:p-11 border border-slate-200/90 shadow-card mb-10 relative overflow-hidden">
          {/* Subtle warm ambient highlight */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#c59b27]/8 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 mb-3.5">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#0a192f]/5 text-[#0a192f] border border-[#0a192f]/10 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c59b27]" />
                  <span>Avishkar · Centre for Innovation & Entrepreneurship</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-0.5 rounded-full">
                  Academic Session 2025–2026
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#09131f] tracking-tight leading-tight">
                IDP <span className="text-[#c59b27]">(Inter-Disciplinary Project)</span> Portal
              </h1>
              <p className="text-slate-600 mt-2.5 text-sm sm:text-base leading-relaxed max-w-2xl">
                Unified academic coordination platform for G.D. Goenka University. Select your assigned designation to manage project allocations, semester artifacts, and validation rosters.
              </p>
            </div>

            {/* Official Dual Crest Showcase */}
            <div className="flex items-center gap-3 bg-slate-50/90 p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-subtle self-start lg:self-center">
              <div className="h-12 sm:h-14 px-3.5 py-1.5 rounded-xl border border-[#c59b27]/40 shadow-sm flex items-center justify-center bg-white transition-transform hover:scale-105">
                <img
                  src="/gdgu-logo.jpeg"
                  alt="GDGU Logo"
                  className="h-full w-auto max-w-[140px] sm:max-w-[175px] object-contain"
                />
              </div>
              <div className="h-10 w-[1px] bg-slate-200" />
              <div className="h-12 sm:h-14 px-3.5 py-1.5 rounded-xl border border-[#c59b27]/40 shadow-sm flex items-center justify-center bg-white transition-transform hover:scale-105">
                <img
                  src="/avishkar-logo.png"
                  alt="Avishkar CIE Logo"
                  className="h-full w-auto max-w-[130px] sm:max-w-[170px] object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Role Cards Grid — Apple HIG Touch-First Pattern */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {/* Student Card */}
          <Link
            href="/student/login"
            className="group bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-card hover:shadow-elevated hover:border-[#c59b27]/80 hover:-translate-y-1 active:scale-[0.99] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#0a192f]/5 text-[#0a192f] flex items-center justify-center group-hover:bg-[#0a192f] group-hover:text-[#c59b27] transition-all shadow-subtle">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Students
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#09131f] tracking-tight group-hover:text-[#0a192f] transition-colors">
                Student Portal
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2">
                Authenticate with your university email (<span className="font-mono text-slate-700">@gdgu.org</span>) to select project tracks and view allocated mentors.
              </p>
            </div>
            <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0a192f] group-hover:text-[#c59b27] transition-colors">
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Faculty Card */}
          <Link
            href="/faculty/login"
            className="group bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-card hover:shadow-elevated hover:border-[#c59b27]/80 hover:-translate-y-1 active:scale-[0.99] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#0a192f]/5 text-[#0a192f] flex items-center justify-center group-hover:bg-[#0a192f] group-hover:text-[#c59b27] transition-all shadow-subtle">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Mentors
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#09131f] tracking-tight group-hover:text-[#0a192f] transition-colors">
                Faculty Portal
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2">
                Sign in with official credentials to upload project guides, manage student rosters, and submit semester milestones.
              </p>
            </div>
            <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0a192f] group-hover:text-[#c59b27] transition-colors">
              <span>Faculty Login</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Department SPOC Card */}
          <Link
            href="/spoc/login"
            className="group bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-card hover:shadow-elevated hover:border-[#c59b27]/80 hover:-translate-y-1 active:scale-[0.99] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#0a192f]/5 text-[#0a192f] flex items-center justify-center group-hover:bg-[#0a192f] group-hover:text-[#c59b27] transition-all shadow-subtle">
                  <FolderCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  SPOCs
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#09131f] tracking-tight group-hover:text-[#0a192f] transition-colors">
                Department SPOC
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2">
                Review and verify uploaded semester artifacts, inspect plagiarism reports, and approve department applications.
              </p>
            </div>
            <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0a192f] group-hover:text-[#c59b27] transition-colors">
              <span>SPOC Dashboard</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Admin Card */}
          <Link
            href="/admin/login"
            className="group bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-card hover:shadow-elevated hover:border-[#c59b27]/80 hover:-translate-y-1 active:scale-[0.99] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#0a192f]/5 text-[#0a192f] flex items-center justify-center group-hover:bg-[#0a192f] group-hover:text-[#c59b27] transition-all shadow-subtle">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Governance
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#09131f] tracking-tight group-hover:text-[#0a192f] transition-colors">
                Administrator
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2">
                Central control panel for department limits, batch imports, live university analytics, and cohort data exports.
              </p>
            </div>
            <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0a192f] group-hover:text-[#c59b27] transition-colors">
              <span>Admin Console</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
