import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { BulkProgressState } from "@/types/admin";

interface BulkRegistrationCardProps {
  bulkRunning: boolean;
  bulkResult: BulkProgressState | null;
  onRunBulkRegistration: () => void;
}

export function BulkRegistrationCard({
  bulkRunning,
  bulkResult,
  onRunBulkRegistration,
}: BulkRegistrationCardProps) {
  const [showSkippedModal, setShowSkippedModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
        <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
        <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-1">
          Bulk Registration
        </h2>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed max-w-4xl">
          Automatically registers every currently unregistered student. The emptiest projects (fewest current registrations) are filled first, then the next-emptiest, and so on. Every existing rule still applies per student - seat capacity, and same/other department quotas - so a student is skipped wherever no eligible seat is found.
        </p>

        <button
          type="button"
          onClick={onRunBulkRegistration}
          disabled={bulkRunning}
          className="w-full py-3.5 px-4 rounded-xl bg-[#0d2137] hover:bg-[#163456] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
        >
          {bulkRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing Bulk Registrations...</span>
            </>
          ) : (
            <span>Register All Unregistered Students</span>
          )}
        </button>

        {/* Bulk Registration Progress / Results */}
        {bulkResult && (
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-[#0d2137]">
              <span>
                {bulkResult.isCompleted ? "Bulk registration completed." : "Processing..."}
              </span>
              <span>
                {bulkResult.processed} / {bulkResult.totalToProcess} Processed
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#16a34a] transition-all duration-300"
                style={{
                  width: `${
                    bulkResult.totalToProcess > 0
                      ? (bulkResult.processed / bulkResult.totalToProcess) * 100
                      : 100
                  }%`,
                }}
              />
            </div>

            <div className="flex items-center gap-4 text-slate-600 pt-1">
              <span>
                Registered: <strong className="text-green-700">{bulkResult.registered}</strong>
              </span>
              <span>
                Skipped: <strong className="text-amber-700">{bulkResult.skipped}</strong>
              </span>
              {bulkResult.skipped > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSkippedModal(true)}
                  className="text-[#0d2137] underline font-semibold ml-auto"
                >
                  View Skipped Reasons
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Skipped Students Details Modal */}
      {showSkippedModal && bulkResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-xl relative max-h-[80vh] flex flex-col">
            <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
            <h3 className="text-lg font-bold text-[#0d2137]">
              Skipped Students ({bulkResult.skippedDetails.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Students who could not be automatically registered due to constraint restrictions.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 text-xs">
              {bulkResult.skippedDetails.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex justify-between font-semibold text-[#0d2137]">
                    <span>{item.name}</span>
                    <span className="font-mono text-slate-500">{item.enrollment}</span>
                  </div>
                  <div className="text-amber-800 mt-1">{item.reason}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSkippedModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
