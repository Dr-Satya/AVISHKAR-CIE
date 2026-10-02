"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlertCircle, Lock, Mail, Users, ArrowLeft } from "lucide-react";

export default function FacultyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/faculty/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passcode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid faculty credentials.");
        setLoading(false);
        return;
      }

      router.push("/faculty/portal");
    } catch (err: any) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Header role="Faculty" />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/80 shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0d2137] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Login Selection</span>
            </Link>
            <div className="h-9 px-3 py-1 rounded-xl bg-white border border-[#cda34f] shadow-sm shadow-[#cda34f]/20 flex items-center justify-center">
              <img
                src="/avishkar-logo.png"
                alt="Avishkar CIE"
                className="h-full w-auto max-w-[100px] object-contain"
              />
            </div>
          </div>

          <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d2137]">
            Faculty Login
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Sign in with your official faculty email address and passcode.
          </p>

          {error && (
            <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="faculty-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Faculty Official Email
              </label>
              <div className="relative">
                <input
                  id="faculty-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your official faculty email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137] focus:border-transparent"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="faculty-passcode" className="text-xs font-semibold text-slate-700">
                  Passcode
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-medium text-[#cda34f] hover:text-[#b88c3a] transition-colors"
                >
                  Forgot passcode?
                </button>
              </div>
              <div className="relative">
                <input
                  id="faculty-passcode"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137] focus:border-transparent"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !passcode}
              className="w-full py-3 px-4 rounded-xl bg-[#0d2137] hover:bg-[#163456] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              <Users className="w-4 h-4" />
              <span>{loading ? "Authenticating..." : "Login to Faculty Portal"}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center text-xs text-slate-500">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0d2137] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Login Selection</span>
            </Link>
          </div>
        </div>

        {/* Forgot Passcode Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-xl relative">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
              <h3 className="text-lg font-bold text-[#0d2137]">Forgot Your Passcode?</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                If you have forgotten your passcode or need a reset, please contact the System Administrator directly at:
              </p>
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#0d2137]">
                📧 <span className="font-semibold">admin@gdgu.org</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                The administrator can reset your passcode instantly from the Faculty Access Management panel.
              </p>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
