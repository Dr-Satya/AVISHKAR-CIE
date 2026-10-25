"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShieldCheck, ArrowLeft, ShieldAlert } from "lucide-react";
import { cleanErrorMessage } from "@/lib/error-utils";

export default function VerifyEnrollmentPage() {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment) return;

    setLoading(true);
    setError(null);

    try {
      // Complete university enrollment verification
      const res = await fetch("/api/auth/student/verify-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentNumber: enrollment.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(cleanErrorMessage(data.error, "Enrollment verification failed."));
        setLoading(false);
        return;
      }

      router.push("/student/portal");
    } catch (err: any) {
      setError(cleanErrorMessage(err, "Network error. Please try again."));
      setLoading(false);
    }
  };

  return (
    <>
      <Header role="Student" />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12 sm:py-16 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-8 sm:p-11 border border-slate-200/90 shadow-elevated relative overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <Link
              href="/student/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0a192f] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Login</span>
            </Link>
            <div className="h-9 px-3 py-1 rounded-xl bg-white border border-[#c59b27]/40 shadow-sm flex items-center justify-center">
              <img
                src="/avishkar-logo.png"
                alt="Avishkar CIE"
                className="h-full w-auto max-w-[100px] object-contain"
              />
            </div>
          </div>

          <div className="w-8 h-1 bg-[#c59b27] rounded-full mb-3" />
          <h1 className="text-2xl font-bold text-[#09131f] tracking-tight">
            Verify Student Account
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Google identity confirmed. Please enter your university enrollment number to link your academic record.
          </p>

          {error && (
            <div className="mt-4 p-4 rounded-2xl bg-red-50/90 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Verification Error</p>
                <p className="mt-0.5 text-xs leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="student-enrollment" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enrollment Number *
              </label>
              <input
                id="student-enrollment"
                name="enrollmentNumber"
                type="text"
                autoComplete="username"
                placeholder="e.g. 24001011001"
                value={enrollment}
                onChange={(e) => setEnrollment(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300/90 bg-slate-50/50 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f] focus:border-transparent transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !enrollment.trim()}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0a192f] hover:bg-[#132c4a] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all tactile-btn shadow-card hover:shadow-elevated disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? "Verifying Record..." : "Verify & Link Account"}</span>
            </button>
          </form>

          <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-center text-xs text-slate-500">
            <Link
              href="/student/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0a192f] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Student Login</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
