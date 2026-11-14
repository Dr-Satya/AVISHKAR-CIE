import React from "react";
import { CheckCircle2, Lock, Calendar } from "lucide-react";
import { GlobalConfigData } from "@/types/admin";

interface GlobalConfigCardProps {
  config: GlobalConfigData;
  setConfig: React.Dispatch<React.SetStateAction<GlobalConfigData>>;
  configSaving: boolean;
  configMessage: string | null;
  onSave: (e: React.FormEvent) => void;
}

export function GlobalConfigCard({
  config,
  setConfig,
  configSaving,
  configMessage,
  onSave,
}: GlobalConfigCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
      <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
      <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-5">
        Configuration
      </h2>

      {configMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{configMessage}</span>
        </div>
      )}

      <form onSubmit={onSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {/* Registration Open Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Registration Open
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setConfig((c) => ({ ...c, registrationOpen: !c.registrationOpen }))
                }
                className={`w-14 h-7 rounded-full p-1 transition-colors flex items-center ${
                  config.registrationOpen ? "bg-[#cda34f]" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                    config.registrationOpen ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-xs font-medium text-slate-600">
                {config.registrationOpen ? "Open" : "Closed"}
              </span>
            </div>
          </div>

          {/* Maximum Seats */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Maximum Seats
            </label>
            <input
              type="number"
              min="1"
              value={config.maxSeats}
              onChange={(e) =>
                setConfig((c) => ({ ...c, maxSeats: parseInt(e.target.value, 10) || 1 }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
            />
          </div>

          {/* Department Limit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Department Limit
            </label>
            <input
              type="number"
              min="0"
              value={config.sameDeptLimit}
              onChange={(e) =>
                setConfig((c) => ({ ...c, sameDeptLimit: parseInt(e.target.value, 10) || 0 }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
            />
          </div>

          {/* Other Department Limit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Other Department Limit
            </label>
            <input
              type="number"
              min="0"
              value={config.otherDeptLimit}
              onChange={(e) =>
                setConfig((c) => ({ ...c, otherDeptLimit: parseInt(e.target.value, 10) || 0 }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
            />
          </div>
        </div>

        {/* Active Semester Upload Window */}
        <div className="border-t border-slate-100 pt-5 mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#cda34f]" />
                <span>Active Semester Upload Window</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Controls which semester milestone is open for student and faculty submissions. The inactive semester will be locked and non-clickable.
              </p>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
              Active: Semester {config.activeSemester || 3}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfig((c) => ({ ...c, activeSemester: 3 }))}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                (config.activeSemester || 3) === 3
                  ? "border-[#cda34f] bg-amber-50/70 shadow-xs ring-1 ring-[#cda34f]/30"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 ${
                  (config.activeSemester || 3) === 3
                    ? "border-[#cda34f] bg-[#cda34f]"
                    : "border-slate-300"
                }`}
              >
                {(config.activeSemester || 3) === 3 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-[#0d2137]">Semester 3 (Interim Phase)</p>
                  {(config.activeSemester || 3) === 3 ? (
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Uploads Open
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Only Semester 3 PPT presentations, Interim Reports, and Consent Forms are open for upload. Semester 4 remains locked and unclickable.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setConfig((c) => ({ ...c, activeSemester: 4 }))}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                config.activeSemester === 4
                  ? "border-[#cda34f] bg-amber-50/70 shadow-xs ring-1 ring-[#cda34f]/30"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 ${
                  config.activeSemester === 4
                    ? "border-[#cda34f] bg-[#cda34f]"
                    : "border-slate-300"
                }`}
              >
                {config.activeSemester === 4 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-[#0d2137]">Semester 4 (Final Defense)</p>
                  {config.activeSemester === 4 ? (
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Uploads Open
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Only Semester 4 Capstone Reports and Defense PPT presentations are open for upload. Semester 3 remains locked and unclickable.
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={configSaving}
            className="px-6 py-2.5 rounded-xl bg-[#0d2137] hover:bg-[#163456] text-white font-medium text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {configSaving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>

      <p className="text-xs text-slate-400 mt-4 leading-relaxed">
        These defaults apply to any project that doesn&apos;t set its own Max Seats / Same Dept Limit / Other Dept Limit in the Projects sheet.
      </p>
    </div>
  );
}
