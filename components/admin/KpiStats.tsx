import React from "react";
import { KpiData } from "@/types/admin";

interface KpiStatsProps {
  kpi: KpiData;
}

export function KpiStats({ kpi }: KpiStatsProps) {
  const cards = [
    { label: "Total Students", value: kpi.totalStudents.toLocaleString(), tag: "Enrolled", color: "from-[#c59b27]/20 to-transparent" },
    { label: "Project Tracks", value: kpi.totalProjects.toLocaleString(), tag: "Active", color: "from-blue-500/10 to-transparent" },
    { label: "Total Registrations", value: kpi.totalRegistrations.toLocaleString(), tag: "Allocated", color: "from-emerald-500/10 to-transparent" },
    { label: "Seats Filled Ratio", value: kpi.seatsFilledRatio, tag: "Capacity", color: "from-amber-500/10 to-transparent" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-card hover:shadow-elevated transition-all relative overflow-hidden group"
        >
          {/* Subtle ambient corner gradient */}
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${card.color} rounded-bl-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-60`} />

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                {card.tag}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-[#09131f] tabular-nums">
              {card.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
