"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlertCircle, ShieldCheck, ArrowLeft } from "lucide-react";

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
      const res = await fetch("/api/auth/student/verify-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentNumber: enrollment }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Enrollment verification failed.");
        setLoading(false);
        return;
      }

      router.push("/student/portal");
    } catch (err: any) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Header role="Student" />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/80 shadow-sm relative">
          <Link
            href="/student/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0d2137] transition-colors mb-4 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Student Login</span>
          </Link>

          <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d2137]">
            Verify Enrollment Number
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Google identity confirmed. Please enter your university enrollment number to link your account.
          </p>

          {error && (
            <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Verification Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enrollment Number
              </label>
              <input
                type="text"
                placeholder="Enter your enrollment number"
                value={enrollment}
                onChange={(e) => setEnrollment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137] focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !enrollment}
              className="w-full py-3 px-4 rounded-xl bg-[#0d2137] hover:bg-[#163456] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? "Verifying..." : "Verify & Access Portal"}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center text-xs text-slate-500">
            <Link
              href="/student/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0d2137] transition-colors group"
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
