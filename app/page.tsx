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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col justify-center">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/80 shadow-sm mb-8 text-center sm:text-left relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="w-12 h-1 bg-[#cda34f] rounded-full mb-4 mx-auto sm:mx-0" />
              <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                  Avishkar · Centre for Innovation & Entrepreneurship (CIE)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0d2137] tracking-tight">
                G.D. Goenka University
              </h1>
              <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed max-w-2xl">
                Welcome to the Inter-Disciplinary Project (IDP) Registration Portal. Please select your role below to proceed with authentication and access your dashboard.
              </p>
            </div>

            {/* Dual Featured Logos Badge */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 shadow-inner">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-[#0d2137]">
                <img
                  src="/gdgu-logo.jpeg"
                  alt="GDGU Logo"
                  width="56"
                  height="56"
                  className="w-full h-full object-cover scale-110"
                />
              </div>
              <div className="h-10 w-[1px] bg-slate-300" />
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-white p-1.5">
                <img
                  src="/avishkar-logo.png"
                  alt="Avishkar CIE Logo"
                  width="56"
                  height="56"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Student Card */}
          <Link
            href="/student/login"
            className="group bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#cda34f]/80 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0d2137]/5 text-[#0d2137] flex items-center justify-center mb-5 group-hover:bg-[#0d2137] group-hover:text-white transition-colors">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#0d2137] mb-1.5">
                Student Portal
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Sign in with your official GDGU Google email (@gdgu.org) to register or view your assigned project.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-[#0d2137] group-hover:text-[#cda34f] transition-colors">
              <span>Continue with GDGU Email</span>
              <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Faculty Card */}
          <Link
            href="/faculty/login"
            className="group bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#cda34f]/80 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0d2137]/5 text-[#0d2137] flex items-center justify-center mb-5 group-hover:bg-[#0d2137] group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#0d2137] mb-1.5">
                Faculty Portal
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Sign in with your official faculty email and passcode to view assigned projects and registered student rosters.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-[#0d2137] group-hover:text-[#cda34f] transition-colors">
              <span>Faculty Login</span>
              <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Department SPOC Card */}
          <Link
            href="/spoc/login"
            className="group bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#cda34f]/80 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0d2137]/5 text-[#0d2137] flex items-center justify-center mb-5 group-hover:bg-[#0d2137] group-hover:text-white transition-colors">
                <FolderCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#0d2137] mb-1.5">
                Department SPOC
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Sign in with designated department SPOC credentials to verify artifacts, review submissions, and manage rosters.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-[#0d2137] group-hover:text-[#cda34f] transition-colors">
              <span>SPOC Portal</span>
              <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Admin Card */}
          <Link
            href="/admin/login"
            className="group bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#cda34f]/80 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0d2137]/5 text-[#0d2137] flex items-center justify-center mb-5 group-hover:bg-[#0d2137] group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#0d2137] mb-1.5">
                Administrator
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Access system controls, department limits, bulk registration, and live university registration statistics.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold text-[#0d2137] group-hover:text-[#cda34f] transition-colors">
              <span>Admin Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
