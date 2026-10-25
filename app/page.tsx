/**
 * G D Goenka University - Inter-Disciplinary Project (IDP) Portal
 * 
 * Code Attribution:
 * - Dr. Satya Prakash (Avishkar Centre for Innovation and Entrepreneurship,
 *   School of Engineering and Sciences, G D Goenka University, Haryana)
 * - Potla Sri Sharan
 * - Sarthak Singh
 * 
 * Licensed under the Apache License, Version 2.0.
 */

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  GraduationCap,
  Users,
  FolderCheck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] relative overflow-hidden">
      {/* Dynamic Ambient Background Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top-Left Deep Navy Ambient Blur */}
        <div className="absolute -top-36 -left-36 w-96 h-96 bg-[#0a192f]/10 rounded-full blur-3xl" />
        {/* Top-Right Signature Gold Ambient Blur */}
        <div className="absolute -top-24 -right-24 w-[32rem] h-[32rem] bg-[#c59b27]/14 rounded-full blur-3xl" />
        {/* Center-Bottom Soft Royal Indigo Ambient Blur */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[40rem] h-[40rem] bg-blue-500/8 rounded-full blur-3xl" />
        {/* Bottom Emerald SPOC Ambient Blur */}
        <div className="absolute -bottom-24 right-1/4 w-[28rem] h-[28rem] bg-emerald-500/8 rounded-full blur-3xl" />
        
        {/* Subtle Architectural Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(#0a192f 1.2px, transparent 1.2px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <Header />

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center">
        {/* Hero Banner with University Identity */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200/90 shadow-elevated mb-7 sm:mb-9 relative overflow-hidden">
          {/* Top Decorative Color Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0a192f] via-[#c59b27] to-blue-600" />
          
          {/* Warm Ambient Radial Accent */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-bl from-[#c59b27]/15 to-transparent rounded-full pointer-events-none blur-xl" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 relative z-10">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 mb-3.5 flex-wrap">
                <span className="text-[10px] xs:text-[11px] font-bold px-2.5 xs:px-3 py-1 rounded-full bg-[#0a192f]/5 text-[#0a192f] border border-[#0a192f]/10 uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#c59b27] animate-pulse shrink-0" />
                  <span>Avishkar · Centre for Innovation &amp; Entrepreneurship</span>
                </span>
                <span className="text-[10px] xs:text-[11px] font-semibold text-slate-600 bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#c59b27] shrink-0" />
                  <span>Academic Session 2025–2026</span>
                </span>
              </div>
              <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#09131f] tracking-tight leading-tight">
                IDP <span className="text-[#c59b27]">(Inter-Disciplinary Project)</span> Portal
              </h1>
              <p className="text-slate-600 mt-2 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl font-normal">
                Official centralized academic project platform for G D Goenka University. Select your designated role below to access your tailored dashboard, verification workflows, and marks rosters.
              </p>
            </div>

            {/* Official Dual Crest Showcase */}
            <div className="flex items-center gap-2 sm:gap-3 bg-white/95 p-2 sm:p-3 rounded-2xl border border-slate-200 shadow-card self-start lg:self-center shrink-0">
              <div className="h-10 sm:h-12 md:h-14 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-center bg-white transition-transform hover:scale-105 shrink-0">
                <img
                  src="/gdgu-logo.jpeg"
                  alt="GDGU Logo"
                  className="h-full w-auto max-w-[95px] xs:max-w-[120px] sm:max-w-[160px] object-contain"
                />
              </div>
              <div className="h-7 sm:h-9 w-[1px] bg-slate-200 shrink-0" />
              <div className="h-10 sm:h-12 md:h-14 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border border-[#c59b27]/40 shadow-2xs flex items-center justify-center bg-white transition-transform hover:scale-105 shrink-0">
                <img
                  src="/avishkar-logo.png"
                  alt="Avishkar CIE Logo"
                  className="h-full w-auto max-w-[95px] xs:max-w-[120px] sm:max-w-[155px] object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Role Cards Grid — Color-Themed Visual Dashboard Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {/* ======================================================== */}
          {/* 1. STUDENT PORTAL (ROYAL BLUE / INDIGO THEME)           */}
          {/* ======================================================== */}
          <Link
            href="/student/login"
            className="group relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white rounded-3xl p-6 sm:p-7 border border-blue-200/80 shadow-card hover:shadow-elevated hover:border-blue-500 hover:-translate-y-1 active:scale-[0.99] transition-all flex flex-col justify-between"
          >
            {/* Top Color Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

            {/* Dashboard Visual Watermark */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <img
                src="/dashboards/student-bg.webp"
                alt=""
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover object-center opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-blue-50/40" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div>
                {/* Header Icon & Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs font-mono">
                    STUDENTS
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#09131f] tracking-tight group-hover:text-blue-700 transition-colors">
                  Student Portal
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-1.5 font-medium">
                  Authenticate with your university Google account (<span className="font-mono text-slate-800 font-bold">@gdgu.org</span>) to select project tracks and view allocated mentors.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:text-blue-900 transition-colors">
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* ======================================================== */}
          {/* 2. FACULTY PORTAL (SIGNATURE GOLD / AMBER THEME)        */}
          {/* ======================================================== */}
          <Link
            href="/faculty/login"
            className="group relative overflow-hidden bg-gradient-to-b from-amber-50/80 via-white to-white rounded-3xl p-6 sm:p-7 border border-amber-300 shadow-card hover:shadow-gold hover:border-[#c59b27] hover:-translate-y-1 active:scale-[0.99] transition-all flex flex-col justify-between"
          >
            {/* Top Color Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#c59b27] to-amber-500" />

            {/* Dashboard Visual Watermark */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <img
                src="/dashboards/faculty-bg.webp"
                alt=""
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover object-center opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-amber-50/40" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div>
                {/* Header Icon & Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#c59b27] text-white flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs font-mono">
                    MENTORS
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#09131f] tracking-tight group-hover:text-amber-800 transition-colors">
                  Faculty Portal
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-1.5 font-medium">
                  Sign in with official credentials to upload project guides, manage student rosters, record marks, and submit semester milestones.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#c59b27] group-hover:text-amber-800 transition-colors">
                <span>Faculty Login</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* ======================================================== */}
          {/* 3. DEPARTMENT SPOC (EMERALD / TEAL THEME)               */}
          {/* ======================================================== */}
          <Link
            href="/spoc/login"
            className="group relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white rounded-3xl p-6 sm:p-7 border border-emerald-200/90 shadow-card hover:shadow-elevated hover:border-emerald-500 hover:-translate-y-1 active:scale-[0.99] transition-all flex flex-col justify-between"
          >
            {/* Top Color Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 to-teal-600" />

            {/* Dashboard Visual Watermark */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <img
                src="/dashboards/spoc-bg.webp"
                alt=""
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover object-center opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-emerald-50/40" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div>
                {/* Header Icon & Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                    <FolderCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-2xs font-mono">
                    DEPT SPOCS
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#09131f] tracking-tight group-hover:text-emerald-700 transition-colors">
                  Department SPOC
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-1.5 font-medium">
                  Review and verify uploaded semester artifacts, inspect Turnitin plagiarism reports, approve projects, and download submitted packages.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-900 transition-colors">
                <span>SPOC Dashboard</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* ======================================================== */}
          {/* 4. ADMINISTRATOR (DEEP ROYAL NAVY / PURPLE THEME)       */}
          {/* ======================================================== */}
          <Link
            href="/admin/login"
            className="group relative overflow-hidden bg-gradient-to-b from-slate-100/90 via-white to-white rounded-3xl p-6 sm:p-7 border border-slate-300/90 shadow-card hover:shadow-elevated hover:border-[#0a192f] hover:-translate-y-1 active:scale-[0.99] transition-all flex flex-col justify-between"
          >
            {/* Top Color Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0a192f] to-indigo-900" />

            {/* Dashboard Visual Watermark */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <img
                src="/dashboards/admin-bg.webp"
                alt=""
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover object-center opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-slate-100/40" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div>
                {/* Header Icon & Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0a192f] text-white flex items-center justify-center shadow-md shadow-slate-900/25 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-200 text-slate-900 border border-slate-300 shadow-2xs font-mono">
                    GOVERNANCE
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#09131f] tracking-tight group-hover:text-[#0a192f] transition-colors">
                  Administrator
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed mt-1.5 font-medium">
                  Central control panel for department limits, batch roster imports, live university analytics, and full submission archives.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#0a192f] group-hover:text-blue-900 transition-colors">
                <span>Admin Console</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
