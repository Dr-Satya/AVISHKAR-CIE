"use client";

import React, { useState } from "react";
import { Lightbulb, X, Loader2, AlertCircle, CheckCircle2, BookOpen } from "lucide-react";
import { cleanErrorMessage } from "@/lib/error-utils";

interface ProjectProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  facultyDepartment?: string;
}

const GDGU_THEMES = [
  "AI Assisted Digital Health, Telehealth, Diagnosis & Therapeutics - For Desease Reversal",
  "AI Computational Intelligence Edge AI Tiny ML and Cyber Physical Systems",
  "Governance of Disruptive Technologies and the Digital Economy",
  "Smart AgriTech Precision Farming and Agro Sustainability",
  "Smart and Composite Materials Additive and Flexible Manufacturing Nanotechnology and Next Gen Devices with Responsive Design",
  "Sustainable Energy Environmental Tech Smart Infrastructure and Climate Resilience",
  "Technology assisted Human Performance, Health, Rehabilitation and Active Living",
  "Bio Engineering Synthetic Biology and Molecular Systems",
  "Intelligent Systems for Autonomous Sensing and Control IoT Radar Camera Drones Robotics and Sensor Fusion with AI ML",
  "Next Gen Operations Supply Chain Resilience and Industry 5.0",
  "Others",
];

export function ProjectProposalModal({
  isOpen,
  onClose,
  onSuccess,
  facultyDepartment,
}: ProjectProposalModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("IDP2502");
  const [theme, setTheme] = useState(GDGU_THEMES[0]);
  const [description, setDescription] = useState("");
  const [sdgMapping, setSdgMapping] = useState("");
  const [maxSeats, setMaxSeats] = useState("10");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Project Title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/faculty/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          theme,
          description: description.trim() || undefined,
          sdgMapping: sdgMapping.trim() || undefined,
          maxSeats: parseInt(maxSeats, 10) || 10,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(cleanErrorMessage(data.error, "Failed to submit project idea."));
      }

      setSuccess(data.message || "Project idea submitted successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(cleanErrorMessage(err, "Submission failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1 bg-[#c59b27] rounded-full mb-3" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-[#0a192f] flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[#c59b27]" />
              <span>Submit Project Idea</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Propose a new IDP project to your Department SPOC ({facultyDepartment || "Department"}).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-2xl flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Smart Water Monitoring and Conservation System"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0a192f]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f]"
              >
                <option value="IDP2502">IDP2502 (Application / Project Based)</option>
                <option value="IDP2501">IDP2501 (Research / Theoretical)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Student Capacity
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxSeats}
                onChange={(e) => setMaxSeats(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0a192f]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Interdisciplinary Theme *
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f]"
            >
              {GDGU_THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              SDG Alignment (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. SDG 11: Sustainable Cities and Communities"
              value={sdgMapping}
              onChange={(e) => setSdgMapping(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0a192f]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Description &amp; Objectives
            </label>
            <textarea
              rows={3}
              placeholder="Briefly describe the problem statement, interdisciplinary scope, and expected deliverables for enrolled students..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0a192f] leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#0a192f] hover:bg-[#163456] text-white text-xs font-bold transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Proposal...</span>
                </>
              ) : (
                <>
                  <Lightbulb className="w-3.5 h-3.5 text-[#c59b27]" />
                  <span>Submit to SPOC</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
