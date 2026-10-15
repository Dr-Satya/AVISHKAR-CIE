import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  FileQuestion,
  Home,
  GraduationCap,
  Briefcase,
  Building2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-elevated text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center mx-auto text-[#c59b27]">
            <FileQuestion className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700">
              Error 404 • Page Not Found
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0a192f] tracking-tight">
              Lost in the Academic Void?
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              The page, project, or student resource you are trying to access does not exist, has been archived, or moved to another URL.
            </p>
          </div>

          {/* Quick Portal Switcher Grid */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <Link
              href="/student/login"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-[#0a192f]">Student Portal</div>
                  <div className="text-[10px] text-slate-500">Project selection &amp; status</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/faculty/login"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-[#0a192f]">Faculty Portal</div>
                  <div className="text-[10px] text-slate-500">Mentorship &amp; submissions</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/spoc/login"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-xs font-bold text-[#0a192f]">Department SPOC</div>
                  <div className="text-[10px] text-slate-500">Department review &amp; marks</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/admin/login"
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-xs font-bold text-[#0a192f]">Admin Console</div>
                  <div className="text-[10px] text-slate-500">Cohort management</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#0a192f] hover:bg-[#163456] text-white text-xs font-bold transition-all shadow-subtle"
            >
              <Home className="w-4 h-4" />
              <span>Return to IDP Home</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
