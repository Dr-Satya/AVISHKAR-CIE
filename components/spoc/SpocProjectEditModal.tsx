"use client";

import React, { useState, useEffect } from "react";
import { Edit3, X, Loader2, AlertCircle, CheckCircle2, Check, XCircle } from "lucide-react";
import { ProjectData } from "@/types/spoc";

interface SpocProjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData | null;
  onSuccess: () => void;
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

export function SpocProjectEditModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: SpocProjectEditModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("IDP2502");
  const [theme, setTheme] = useState(GDGU_THEMES[0]);
  const [description, setDescription] = useState("");
  const [sdgMapping, setSdgMapping] = useState("");
  const [maxSeats, setMaxSeats] = useState("10");
  const [sameDeptLimit, setSameDeptLimit] = useState("4");
  const [otherDeptLimit, setOtherDeptLimit] = useState("6");
  const [submissionStatus, setSubmissionStatus] = useState("PENDING");
  const [spocReviewNote, setSpocReviewNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setTitle(project.title || "");
      setCategory(project.category || "IDP2502");
      setTheme(project.theme || GDGU_THEMES[0]);
      setDescription(project.description || "");
      setSdgMapping((project as any).sdgMapping || "");
      setMaxSeats(String((project as any).maxSeats || 10));
      setSameDeptLimit(String((project as any).sameDeptLimit || 4));
      setOtherDeptLimit(String((project as any).otherDeptLimit || 6));
      setSubmissionStatus(project.submissionStatus || "PENDING");
      setSpocReviewNote(project.spocReviewNote || "");
      setError(null);
      setSuccess(null);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSave = async (overrideStatus?: string) => {
    if (!title.trim()) {
      setError("Project Title cannot be empty.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const finalStatus = overrideStatus || submissionStatus;

    try {
      const res = await fetch("/api/spoc/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          title: title.trim(),
          category,
          theme,
          description: description.trim() || null,
          sdgMapping: sdgMapping.trim() || null,
          maxSeats: parseInt(maxSeats, 10) || 10,
          sameDeptLimit: parseInt(sameDeptLimit, 10) || 4,
          otherDeptLimit: parseInt(otherDeptLimit, 10) || 6,
          submissionStatus: finalStatus,
          spocReviewNote: spocReviewNote.trim() || (finalStatus === "APPROVED" ? "Approved by Department SPOC" : null),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update project.");
      }

      setSuccess(`Project ${project.projectId} updated successfully!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save project changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1 bg-purple-600 rounded-full mb-3" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-[#0a192f] flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-600" />
              <span>Edit Project Idea ({project.projectId})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mentor: <strong>{project.faculty.name}</strong> • {project.faculty.department}
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

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="IDP2502">IDP2502 (Application)</option>
                <option value="IDP2501">IDP2501 (Research)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Approval Status
              </label>
              <select
                value={submissionStatus}
                onChange={(e) => setSubmissionStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="PENDING">PENDING (Under Review)</option>
                <option value="APPROVED">APPROVED (Ready for Registration)</option>
                <option value="REJECTED">REJECTED (Changes Required)</option>
                <option value="NOT_SUBMITTED">NOT SUBMITTED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Interdisciplinary Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              {GDGU_THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Seats
              </label>
              <input
                type="number"
                min="1"
                max="25"
                value={maxSeats}
                onChange={(e) => setMaxSeats(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Same Dept Cap
              </label>
              <input
                type="number"
                min="0"
                max="25"
                value={sameDeptLimit}
                onChange={(e) => setSameDeptLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Other Dept Cap
              </label>
              <input
                type="number"
                min="0"
                max="25"
                value={otherDeptLimit}
                onChange={(e) => setOtherDeptLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              SDG Mapping (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. SDG 9: Industry, Innovation, and Infrastructure"
              value={sdgMapping}
              onChange={(e) => setSdgMapping(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              SPOC Review Feedback / Modification Note
            </label>
            <textarea
              rows={2}
              placeholder="Add feedback or instructions for the faculty mentor..."
              value={spocReviewNote}
              onChange={(e) => setSpocReviewNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave("APPROVED")}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save &amp; Approve</span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave()}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Save Edits</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
