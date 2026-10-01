"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ThemeSelectorProps {
  selectedCategory: string;
  themes: string[];
  onSelectTheme: (theme: string) => void;
  onBack: () => void;
}

export function ThemeSelector({
  selectedCategory,
  themes,
  onSelectTheme,
  onBack,
}: ThemeSelectorProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-1 bg-[#cda34f] rounded-full" />
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-[#0d2137] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Categories</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-bold bg-[#0d2137] text-white px-2.5 py-0.5 rounded-full">
          {selectedCategory}
        </span>
      </div>
      <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-1">
        Choose Theme
      </h2>
      <p className="text-xs text-slate-500 mb-6">
        Select a theme within <strong className="text-slate-700">{selectedCategory}</strong> to view available projects.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {themes.map((thm) => (
          <button
            key={thm}
            onClick={() => onSelectTheme(thm)}
            className="p-4 rounded-xl border bg-slate-50 text-slate-700 border-slate-200 hover:border-[#cda34f] hover:bg-slate-100/80 text-xs sm:text-sm font-medium transition-all flex items-center justify-between group text-left"
          >
            <span className="text-[#0d2137] font-semibold">{thm}</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#cda34f] group-hover:translate-x-1 flex-shrink-0 ml-2 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
