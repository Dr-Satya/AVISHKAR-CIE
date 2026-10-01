import React from "react";
import { KpiData } from "@/types/admin";

interface KpiStatsProps {
  kpi: KpiData;
}

export function KpiStats({ kpi }: KpiStatsProps) {
  const cards = [
    { label: "STUDENTS", value: kpi.totalStudents.toLocaleString() },
    { label: "PROJECTS", value: kpi.totalProjects.toLocaleString() },
    { label: "REGISTRATIONS", value: kpi.totalRegistrations.toLocaleString() },
    { label: "SEATS FILLED", value: kpi.seatsFilledRatio },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm"
        >
          <div className="text-2xl sm:text-4xl font-extrabold text-[#0d2137]">
            {card.value}
          </div>
          <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1.5">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
