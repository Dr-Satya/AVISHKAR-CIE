import React from "react";
import { CheckCircle2 } from "lucide-react";
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Registration Open Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Registration Open
            </label>
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
