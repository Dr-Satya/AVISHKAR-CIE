"use client";

import React, { useEffect } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Global Root Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto text-red-700">
            <AlertOctagon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-red-800">
              Critical Portal Fault
            </span>
            <h1 className="text-2xl font-black text-[#0a192f]">
              Application Recovery Mode
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              A foundational layout error occurred. You can attempt to reload the portal runtime below.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 text-left font-mono text-[11px] text-slate-700 break-all">
            {error.message || "Root runtime failure"}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full py-3 rounded-2xl bg-[#0a192f] text-white text-xs font-bold hover:bg-[#163456] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Reload Application</span>
            </button>
            <a
              href="/"
              className="w-full py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all text-center"
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
