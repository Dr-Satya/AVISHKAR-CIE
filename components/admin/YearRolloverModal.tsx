import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";

interface YearRolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAcademicYear: string;
  onSuccess: (message: string) => Promise<void> | void;
}

export function YearRolloverModal({
  isOpen,
  onClose,
  activeAcademicYear,
  onSuccess,
}: YearRolloverModalProps) {
  const [yearStep, setYearStep] = useState<1 | 2>(1);
  const [targetYearInput, setTargetYearInput] = useState("2026-2027");
  const [targetSemesterInput, setTargetSemesterInput] = useState(3);
  const [confirmPhraseInput, setConfirmPhraseInput] = useState("");
  const [adminPasscodeInput, setAdminPasscodeInput] = useState("");
  const [yearWarningChecked, setYearWarningChecked] = useState(false);
  const [yearSwitchLoading, setYearSwitchLoading] = useState(false);
  const [yearSwitchError, setYearSwitchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setYearStep(1);
    setConfirmPhraseInput("");
    setAdminPasscodeInput("");
    setYearWarningChecked(false);
    setYearSwitchError(null);
    onClose();
  };

  const handleYearRollover = async () => {
    setYearSwitchLoading(true);
    setYearSwitchError(null);
    try {
      const res = await fetch("/api/admin/configuration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ACTIVATE_ACADEMIC_YEAR",
          targetYear: targetYearInput,
          startingSemester: targetSemesterInput,
          confirmationPhrase: confirmPhraseInput,
          adminPasscode: adminPasscodeInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setYearSwitchError(data.error || "Rollover failed.");
        setYearSwitchLoading(false);
        return;
      }
      handleClose();
      await onSuccess(data.message);
    } catch (err: any) {
      setYearSwitchError(err.message || "Failed to switch academic year.");
    } finally {
      setYearSwitchLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#0d2137] flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              <span>Academic Year Rollover Guard</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Step {yearStep} of 2 • Double-Verification Cohort Lifecycle Switcher
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {yearSwitchError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{yearSwitchError}</span>
          </div>
        )}

        {yearStep === 1 ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                Strict Cohort Isolation Notice
              </p>
              <p className="leading-relaxed text-amber-800">
                Activating a new academic year seals existing students and project submissions.
                Incoming students will only see projects and mentors created for the new cohort.
                Previous cohort data remains permanently stored and retrievable by administrators.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Academic Year to Activate
              </label>
              <input
                type="text"
                placeholder="e.g. 2026-2027"
                value={targetYearInput}
                onChange={(e) => setTargetYearInput(e.target.value.trim())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Format: YYYY-YYYY (e.g. 2026-2027). Currently active: <strong>{activeAcademicYear}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Semester Milestone
              </label>
              <select
                value={targetSemesterInput}
                onChange={(e) => setTargetSemesterInput(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white"
              >
                <option value={3}>Semester 1 Milestone (Sem 3 - PPT Submission)</option>
                <option value={4}>Semester 2 Milestone (Sem 4 - Final Report)</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={yearWarningChecked}
                  onChange={(e) => setYearWarningChecked(e.target.checked)}
                  className="mt-0.5 rounded text-[#0d2137] focus:ring-[#0d2137] w-4 h-4"
                />
                <span className="text-xs text-slate-600 leading-snug">
                  I confirm that the prerequisite data (students, faculty, and projects) for{" "}
                  <strong className="text-[#0d2137]">{targetYearInput || "the new year"}</strong> has been uploaded or will be initialized now.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetYearInput || !yearWarningChecked}
                onClick={() => {
                  setYearStep(2);
                  setYearSwitchError(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>Proceed to Verification</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
              <p className="font-bold">Dual Security Gate</p>
              <p className="text-red-800">
                To activate <strong>{targetYearInput}</strong>, complete both verification checks below.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Check 1: Type Confirmation Phrase
              </label>
              <div className="text-[11px] font-mono text-slate-500 mb-1.5 bg-slate-100 px-2 py-1 rounded inline-block">
                CONFIRM {targetYearInput}
              </div>
              <input
                type="text"
                placeholder={`CONFIRM ${targetYearInput}`}
                value={confirmPhraseInput}
                onChange={(e) => setConfirmPhraseInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Check 2: Admin Security Passcode
              </label>
              <input
                type="password"
                placeholder="Enter administrator passcode"
                value={adminPasscodeInput}
                onChange={(e) => setAdminPasscodeInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-red-600"
                required
              />
            </div>

            <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={yearSwitchLoading}
                onClick={() => setYearStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={
                  yearSwitchLoading ||
                  confirmPhraseInput !== `CONFIRM ${targetYearInput}` ||
                  !adminPasscodeInput
                }
                onClick={handleYearRollover}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
              >
                {yearSwitchLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Activating Cohort...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify &amp; Activate Year</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
