"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlertTriangle, RefreshCw, Home, ShieldCheck } from "lucide-react";
import { cleanErrorMessage } from "@/lib/error-utils";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side error securely
    console.error("Portal Application Error Boundary Caught:", error);
  }, [error]);

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-elevated text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-red-800">
              System Error Intercepted
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a192f] tracking-tight">
              Something went wrong
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              An unexpected operation error occurred while processing your request. Your session data remains safe.
            </p>
          </div>

          {/* Technical Diagnostics (Error Digest for Support) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px]">
              <span>Error Diagnosis</span>
              {error.digest && <span className="font-mono">Ref: {error.digest}</span>}
            </div>
            <p className="text-slate-800 break-all text-xs leading-relaxed">
              {cleanErrorMessage(error, "An unexpected issue was encountered. Please try refreshing or return home.")}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#0a192f] hover:bg-[#163456] text-white text-xs font-bold transition-all shadow-subtle flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-[#c59b27]" />
              <span>Try Again</span>
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>GDGU Secure Portal Recovery Guard</span>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
