"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlertCircle, Lock, Mail, Users, ArrowLeft } from "lucide-react";
import { cleanErrorMessage } from "@/lib/error-utils";

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
        setError(cleanErrorMessage(data.error, "Invalid passcode. To change or reset your password, please contact the system administrator at admin@gdgu.org."));
        setLoading(false);
        return;
      }

      router.push("/faculty/portal");
    } catch (err: any) {
      setError(cleanErrorMessage(err, "Network error. Please try again."));
      setLoading(false);
    }
  };

  return (
    <>
      <Header role="Faculty" />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 sm:py-16 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-5 sm:p-8 md:p-11 border border-slate-200/90 shadow-elevated relative overflow-hidden">
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
            Faculty Mentor Portal
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Sign in with your assigned faculty email address and project coordinator passcode.
          </p>

          {error && (
            <div className="mt-5 p-4 rounded-2xl bg-red-50/90 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="mt-0.5 text-xs leading-relaxed">{error}</p>
                <p className="mt-1.5 text-xs text-red-700">
                  Cannot log in? Contact the system administrator at{" "}
                  <a href="mailto:admin@gdgu.org" className="underline font-semibold hover:text-red-900">
                    admin@gdgu.org
                  </a>{" "}
                  to change or reset your password.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="faculty-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Faculty Official Email or Mobile Number
              </label>
              <div className="relative">
                <input
                  id="faculty-email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  placeholder="Official email or 10-digit mobile number"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300/90 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f] focus:border-transparent transition-all"
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
                  className="text-xs font-medium text-[#c59b27] hover:text-[#9e7815] transition-colors"
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
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300/90 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f] focus:border-transparent transition-all font-mono"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 leading-normal">
                To change or reset your password, please contact the system administrator at{" "}
                <a href="mailto:admin@gdgu.org" className="font-semibold text-slate-700 hover:text-[#0a192f] underline">
                  admin@gdgu.org
                </a>
                .
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !passcode}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0a192f] hover:bg-[#132c4a] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all tactile-btn shadow-card hover:shadow-elevated disabled:opacity-50 mt-3"
            >
              <Users className="w-4 h-4 text-[#c59b27]" />
              <span>{loading ? "Authenticating..." : "Login to Faculty Portal"}</span>
            </button>
          </form>

          <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-center text-xs text-slate-500">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0a192f] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Return to Portal Overview</span>
            </Link>
          </div>
        </div>

        {/* Forgot Passcode Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-xl relative">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
              <h3 className="text-lg font-bold text-[#0d2137]">Forgot or Change Passcode</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Password changes cannot be done self-service. If you have forgotten your passcode or need to change or reset your password, you must request it directly from the System Administrator at:
              </p>
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#0d2137]">
                📧 <a href="mailto:admin@gdgu.org" className="font-semibold underline hover:text-[#c59b27]">admin@gdgu.org</a>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                The administrator can update or reset your passcode directly from the Faculty Access Management panel upon request.
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
