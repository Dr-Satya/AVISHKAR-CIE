import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full py-8 mt-16 border-t border-slate-200/80 bg-white/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">G.D. Goenka University</span>
        <span>·</span>
        <span>Avishkar Centre for Innovation & Entrepreneurship</span>
        <span>·</span>
        <Link
          href="/privacy"
          className="font-medium text-slate-600 hover:text-[#0a192f] underline underline-offset-4 transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
