"use client";

import React, { useState } from "react";
import { Loader2, Upload, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { AssignedProject } from "@/types/faculty";

interface ArtifactUploadModalProps {
  project: AssignedProject;
  onClose: () => void;
  onSuccess: () => void;
}

export function ArtifactUploadModal({
  project,
  onClose,
  onSuccess,
}: ArtifactUploadModalProps) {
  const [artifactType, setArtifactType] = useState<"REPORT" | "PPT" | "OTHER">("REPORT");
  const [artifactTitle, setArtifactTitle] = useState(`${project.projectId} Project Report`);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPlagiarismFile, setSelectedPlagiarismFile] = useState<File | null>(null);
  const [similarityChecked, setSimilarityChecked] = useState(false);
  const [aiChecked, setAiChecked] = useState(false);
  const [selfDeclarationChecked, setSelfDeclarationChecked] = useState(false);
  const [similarityValue, setSimilarityValue] = useState("5.0");
  const [aiValue, setAiValue] = useState("10.0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selfDeclarationChecked) {
      setError("Please confirm the self-declaration: 'All the above info is correct'.");
      return;
    }

    if (artifactType === "REPORT") {
      if (!similarityChecked) {
        setError("You must verify that Content Similarity is < 10%.");
        return;
      }
      if (!aiChecked) {
        setError("You must verify that AI-written content is < 20%.");
        return;
      }
      const sim = parseFloat(similarityValue);
      const ai = parseFloat(aiValue);
      if (isNaN(sim) || sim >= 10.0) {
        setError(`Content similarity must be less than 10%. (Entered: ${similarityValue}%)`);
        return;
      }
      if (isNaN(ai) || ai >= 20.0) {
        setError(`AI content must be less than 20%. (Entered: ${aiValue}%)`);
        return;
      }
      if (!selectedPlagiarismFile) {
        setError("Please upload the official Plagiarism Report document/PDF.");
        return;
      }
    }

    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      setError(
        `File size (${(selectedFile.size / (1024 * 1024)).toFixed(
          2
        )} MB) exceeds the 10MB maximum limit. Please compress your document.`
      );
      return;
    }

    if (selectedPlagiarismFile && selectedPlagiarismFile.size > 10 * 1024 * 1024) {
      setError(
        `Plagiarism report file size (${(selectedPlagiarismFile.size / (1024 * 1024)).toFixed(
          2
        )} MB) exceeds the 10MB maximum limit.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("projectId", project.id);
      formData.append("type", artifactType);
      formData.append("title", artifactTitle);
      formData.append("similarityChecked", similarityChecked ? "true" : "false");
      formData.append("aiChecked", aiChecked ? "true" : "false");
      formData.append("selfDeclaration", selfDeclarationChecked ? "true" : "false");
      formData.append("similarityPercent", similarityValue);
      formData.append("aiPercent", aiValue);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }
      if (selectedPlagiarismFile) {
        formData.append("plagiarismFile", selectedPlagiarismFile);
      }

      const res = await fetch("/api/faculty/artifacts", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        setLoading(false);
        return;
      }

      setSuccess("Artifact uploaded and submitted to Department SPOC!");
      onSuccess();
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setError("Network error uploading artifact.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0d2137]">Upload Project Artifact</h3>
            <p className="text-xs text-slate-500">
              {project.projectId} · {project.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Artifact Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Artifact Document Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["REPORT", "PPT", "OTHER"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setArtifactType(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    artifactType === t
                      ? "bg-[#0d2137] text-white border-[#0d2137]"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {t === "REPORT" ? "Project Report" : t === "PPT" ? "Presentation PPT" : "Others"}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={artifactTitle}
              onChange={(e) => setArtifactTitle(e.target.value)}
              placeholder="Enter document title"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
              required
            />
          </div>

          {/* File Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Attach Document File (PDF, PPTX, DOCX, ZIP)</span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                Max 10 MB Cap
              </span>
            </label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          {/* Plagiarism & AI Check for REPORT */}
          {artifactType === "REPORT" && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/90 space-y-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Compulsory Plagiarism & AI Integrity Verification</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Per GDGU academic guidelines, project reports must undergo plagiarism and AI detection prior to SPOC submission. All conditions are mandatory:
              </p>

              {/* Similarity / Plagiarism Checkbox & Score */}
              <div className="space-y-1.5 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={similarityChecked}
                    onChange={(e) => setSimilarityChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#0d2137] focus:ring-[#0d2137]"
                  />
                  <div className="text-xs text-slate-800">
                    <span className="font-bold text-slate-900">
                      1. Content similarity / plagiarism is verified &lt; 10%
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Checked via Turnitin / Urkund official similarity software.
                    </p>
                  </div>
                </label>

                <div className="ml-6.5 flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 font-medium">
                    Plagiarism Count / Similarity (%):
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="9.9"
                    value={similarityValue}
                    onChange={(e) => setSimilarityValue(e.target.value)}
                    className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                  />
                  <span className="text-[11px] text-slate-400">(Max allowed: 9.9%)</span>
                </div>
              </div>

              {/* AI Checkbox */}
              <div className="space-y-1.5 pt-2 border-t border-amber-200/60">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiChecked}
                    onChange={(e) => setAiChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#0d2137] focus:ring-[#0d2137]"
                  />
                  <div className="text-xs text-slate-800">
                    <span className="font-bold text-slate-900">
                      2. AI-written content is verified &lt; 20%
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Verified that AI-generated passages do not exceed 20%.
                    </p>
                  </div>
                </label>

                <div className="ml-6.5 flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 font-medium">
                    AI Content Score (%):
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="19.9"
                    value={aiValue}
                    onChange={(e) => setAiValue(e.target.value)}
                    className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                  />
                  <span className="text-[11px] text-slate-400">(Max allowed: 19.9%)</span>
                </div>
              </div>

              {/* Plagiarism Report File Upload */}
              <div className="space-y-1.5 pt-2 border-t border-amber-200/60">
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span>3. Upload Plagiarism Report File (Turnitin / Urkund PDF)</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    Mandatory
                  </span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSelectedPlagiarismFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                  required={artifactType === "REPORT"}
                />
                <p className="text-[11px] text-slate-500">
                  Attach the official plagiarism similarity report generated by Turnitin / DrillBit.
                </p>
              </div>
            </div>
          )}

          {/* Self Declaration Consent */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selfDeclarationChecked}
                onChange={(e) => setSelfDeclarationChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#0d2137] focus:ring-[#0d2137]"
                required
              />
              <div className="text-xs text-slate-800">
                <span className="font-bold text-slate-900">
                  Self Declaration:
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  &ldquo;I hereby declare that all the above info is correct and the documents and plagiarism verification scores submitted are authentic.&rdquo;
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !selfDeclarationChecked ||
                (artifactType === "REPORT" && (!similarityChecked || !aiChecked || !selectedPlagiarismFile))
              }
              className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
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
