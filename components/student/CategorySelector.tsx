"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface CategorySelectorProps {
  categories: string[];
  onSelectCategory: (category: string) => void;
}

export function CategorySelector({
  categories,
  onSelectCategory,
}: CategorySelectorProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-in fade-in duration-200">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
      <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-1">
        Choose Project Category
      </h2>
      <p className="text-xs text-slate-500 mb-6">
        Select your assigned IDP category to proceed.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className="p-5 rounded-xl border bg-slate-50 text-slate-800 border-slate-200 hover:border-[#cda34f] hover:bg-slate-100/80 text-sm font-semibold transition-all flex items-center justify-between group"
          >
            <span className="text-base text-[#0d2137]">{cat}</span>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#cda34f] group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
