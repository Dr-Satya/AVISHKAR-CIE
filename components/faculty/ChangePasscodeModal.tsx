"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface ChangePasscodeModalProps {
  onClose: () => void;
}

export function ChangePasscodeModal({ onClose }: ChangePasscodeModalProps) {
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/auth/faculty/change-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPasscode, newPasscode, confirmPasscode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update passcode.");
        setLoading(false);
        return;
      }

      setSuccess("Passcode updated successfully!");
      setCurrentPasscode("");
      setNewPasscode("");
      setConfirmPasscode("");
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 sm:p-7 shadow-xl border border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-[#0d2137]">Update Passcode</h3>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Current Passcode
            </label>
            <input
              type="password"
              value={currentPasscode}
              onChange={(e) => setCurrentPasscode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              New Passcode (Min 6 chars)
            </label>
            <input
              type="password"
              value={newPasscode}
              onChange={(e) => setNewPasscode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Confirm New Passcode
            </label>
            <input
              type="password"
              value={confirmPasscode}
              onChange={(e) => setConfirmPasscode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-[#0d2137] text-white hover:bg-[#163456] disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? "Saving..." : "Save Passcode"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
