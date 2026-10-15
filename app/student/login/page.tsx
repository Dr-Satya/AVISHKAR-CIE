"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlertCircle, CheckCircle2, ShieldAlert, ArrowLeft, FileText, Smartphone, Lock, X, ShieldCheck } from "lucide-react";

export default function StudentLoginPage() {
  const router = useRouter();
  const [identifierInput, setIdentifierInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Clear any existing stale session on mount so old cookies never persist
  React.useEffect(() => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }, []);

  const handleStudentSignIn = async (inputToSubmit: string) => {
    if (!termsAccepted) {
      setError("Please review and accept the Terms & Conditions and SMS Verification Policy to proceed.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/student/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: inputToSubmit.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please verify your enrollment number.");
        setLoading(false);
        return;
      }

      // Directly authenticated to student's verified account
      router.push("/student/portal");
    } catch (err: any) {
      setError("Network error. Please try again.");
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
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0a192f] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Login Selection</span>
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
            Student Access
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Sign in using your University Enrollment Number or official G D Goenka University email.
          </p>

          {error && (
            <div className="mt-5 p-4 rounded-2xl bg-red-50/90 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Access Restricted</p>
                <p className="mt-0.5 text-xs leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <div className="mt-7 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (identifierInput) handleStudentSignIn(identifierInput);
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="student-identifier" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  University Enrollment Number or GDGU Email
                </label>
                <input
                  id="student-identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. 250160226549 or enrollment@gdgu.org"
                  value={identifierInput}
                  onChange={(e) => setIdentifierInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300/90 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f] focus:border-transparent transition-all font-mono"
                  required
                />
              </div>

              {/* Terms & Conditions and SMS Verification Consent */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    id="student-terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (error) setError(null);
                    }}
                    className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#0a192f] focus:ring-[#0a192f] cursor-pointer"
                  />
                  <label htmlFor="student-terms" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="font-semibold text-[#0a192f] hover:text-[#c59b27] underline decoration-slate-300 hover:decoration-[#c59b27] transition-colors"
                    >
                      Terms & Conditions
                    </button>{" "}
                    and consent to university data usage and SMS verification.
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pl-6.5">
                  Your university records (email, enrollment number, academic data) and registered mobile phone are used for authentication and OTP delivery.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !identifierInput || !termsAccepted}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0a192f] hover:bg-[#132c4a] text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all tactile-btn shadow-card hover:shadow-elevated disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Google "G" Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? "Verifying Credentials..." : "Continue to Student Portal"}</span>
              </button>
            </form>
          </div>

          <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0a192f] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Return to Overview</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-xs text-slate-500 hover:text-[#0a192f] underline decoration-slate-300"
            >
              Privacy & SMS Policy
            </button>
          </div>
        </div>
      </main>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0a192f] text-[#c59b27] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#09131f]">Terms & Conditions</h2>
                  <p className="text-[11px] text-slate-500">GDGU Avishkar CIE IDP Portal Policy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 py-5 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
                <p className="text-amber-900 text-[11px] leading-relaxed">
                  By accessing the Interdisciplinary Project (IDP) Portal, you acknowledge and agree to the institutional data management and SMS identity verification terms outlined below.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#0a192f]" />
                  1. Information Collected & Used
                </h3>
                <p className="mb-2">
                  The portal accesses and verifies official student records maintained by G D Goenka University, including:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>University Identity:</strong> Official institutional Google email (`@gdgu.org`) and unique University Enrollment Number.</li>
                  <li><strong>Academic Records:</strong> Allocated School, Department/Branch, Academic Year, Semester, and Cohort Track.</li>
                  <li><strong>Course Evaluations:</strong> Internal evaluation scores, External jury marks, Faculty attendance logs, and Project Stage Submissions (Phase 1 & Phase 2).</li>
                  <li><strong>Project Allocations:</strong> Interdisciplinary mentor mappings, team rosters, and project category preferences.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#0a192f]" />
                  2. SMS Verification & Communications
                </h3>
                <p className="mb-2">
                  To safeguard student identity and project allocations, the portal uses SMS verification:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Two-Factor OTP:</strong> A 6-digit one-time password (OTP) is dispatched via SMS to your registered mobile number during first-time enrollment binding and security re-verification.</li>
                  <li><strong>Administrative Notices:</strong> University administrators and faculty mentors may broadcast urgent deadline alerts, jury schedules, and project milestone notices via official SMS broadcasts.</li>
                  <li><strong>Carrier Charges:</strong> Standard carrier messaging rates may apply depending on your service plan.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0a192f]" />
                  3. Student Responsibilities & Data Protection
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>You must only authenticate using your designated institutional credentials. Attempting to bind another student's enrollment number is a disciplinary violation.</li>
                  <li>All reports, prototypes, and presentations submitted remain subject to GDGU academic integrity and plagiarism guidelines.</li>
                  <li>Access is protected under Row-Level Security: your evaluation data is accessible solely by yourself, your assigned faculty mentor, and university administrators.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Effective for Academic Year 2026</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTermsAccepted(true);
                    setShowTermsModal(false);
                    if (error) setError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0a192f] text-white text-xs font-semibold hover:bg-[#132c4a] transition-all shadow-sm"
                >
                  Accept & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
