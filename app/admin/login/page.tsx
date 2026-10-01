"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlertCircle, Lock, Mail, ShieldCheck, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passcode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid administrator credentials.");
        setLoading(false);
        return;
      }

      router.push("/admin/portal");
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Header role="Admin" />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/80 shadow-sm relative">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0d2137] transition-colors mb-4 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Login Selection</span>
          </Link>

          <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d2137]">
            Admin Login
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Access administrative management for the GDGU Project Registration Portal.
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
              <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter administrator or faculty email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137] focus:border-transparent"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="admin-passcode" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Passcode
              </label>
              <div className="relative">
                <input
                  id="admin-passcode"
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
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? "Verifying Permissions..." : "Verify Access & Enter Admin Dashboard"}</span>
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
      </main>
      <Footer />
    </>
  );
}
