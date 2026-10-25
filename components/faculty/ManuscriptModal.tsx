"use client";

import React, { useState } from "react";
import {
  X,
  BookOpen,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  FileText,
  FileCheck,
  Send,
} from "lucide-react";
import { AssignedProject } from "@/types/faculty";

interface ManuscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: AssignedProject;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes

export function ManuscriptModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: ManuscriptModalProps) {
  // Option 1: Manuscript in Draft
  const [hasDraft, setHasDraft] = useState<boolean>(
    project.hasDraftManuscript || Boolean(project.draftManuscriptUrl) || false
  );
  const [draftFile, setDraftFile] = useState<File | null>(null);

  // Option 2: Communicated
  const [hasCommunicated, setHasCommunicated] = useState<boolean>(
    project.hasCommunicatedManuscript || false
  );
  const [journalName, setJournalName] = useState<string>(
    project.journalName || ""
  );
  const [affiliationCommunicated, setAffiliationCommunicated] = useState<boolean>(
    project.avishkarAffiliationCommunicated || false
  );

  // Plagiarism & AI for manuscript (First 3-5 pages only)
  const [plagiarismFile, setPlagiarismFile] = useState<File | null>(null);
  const [similarityPercent, setSimilarityPercent] = useState<string>(
    project.manuscriptSimilarityPercent !== null && project.manuscriptSimilarityPercent !== undefined
      ? String(project.manuscriptSimilarityPercent)
      : "5.0"
  );
  const [aiPercent, setAiPercent] = useState<string>(
    project.manuscriptAiPercent !== null && project.manuscriptAiPercent !== undefined
      ? String(project.manuscriptAiPercent)
      : "10.0"
  );

  // Option 3: Published
  const [isPublished, setIsPublished] = useState<boolean>(
    project.isManuscriptPublished || false
  );
  const [doi, setDoi] = useState<string>(project.publicationDoi || "");
  const [affiliationPublished, setAffiliationPublished] = useState<boolean>(
    project.avishkarAffiliationPublished || false
  );
  const [publishedFile, setPublishedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateFileSize = (file: File, label: string): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `${label} (${(file.size / (1024 * 1024)).toFixed(
          2
        )} MB) exceeds the strict 10MB maximum limit. Please compress the file.`
      );
      return false;
    }
    return true;
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !validateFileSize(file, "Draft Manuscript")) {
      e.target.value = "";
      setDraftFile(null);
      return;
    }
    setError(null);
    setDraftFile(file);
  };

  const handlePlagiarismChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !validateFileSize(file, "Plagiarism Report (3-5 Pages)")) {
      e.target.value = "";
      setPlagiarismFile(null);
      return;
    }
    setError(null);
    setPlagiarismFile(file);
  };

  const handlePublishedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !validateFileSize(file, "Published Paper")) {
      e.target.value = "";
      setPublishedFile(null);
      return;
    }
    setError(null);
    setPublishedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation if draft is selected
    if (hasDraft && !draftFile && !project.draftManuscriptUrl) {
      setError("Please select and upload your draft manuscript file.");
      return;
    }

    // Validation if communicated is selected
    if (hasCommunicated) {
      if (!journalName.trim()) {
        setError("Please specify the Journal Name where the manuscript was submitted.");
        return;
      }
      if (!affiliationCommunicated) {
        setError(
          "Affiliation verification required: Please confirm you added 'Avishkar Centre for Innovation and Entrepreneurship' in the paper."
        );
        return;
      }
      const sim = parseFloat(similarityPercent);
      const ai = parseFloat(aiPercent);
      if (isNaN(sim) || sim >= 10.0) {
        setError("Content similarity must be less than 10%. (Turnitin summary)");
        return;
      }
      if (isNaN(ai) || ai >= 20.0) {
        setError("AI score must be less than 20%.");
        return;
      }
    }

    // Validation if published is selected
    if (isPublished) {
      if (!doi.trim()) {
        setError("Please provide the publication DOI link or identifier.");
        return;
      }
      if (!affiliationPublished) {
        setError(
          "Affiliation verification required: Please confirm Avishkar affiliation in the published paper."
        );
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("projectId", project.id);
      formData.append("hasDraftManuscript", hasDraft ? "true" : "false");
      formData.append("hasCommunicatedManuscript", hasCommunicated ? "true" : "false");
      formData.append("isManuscriptPublished", isPublished ? "true" : "false");

      if (hasDraft || hasCommunicated) {
        if (draftFile) formData.append("draftFile", draftFile);
      }

      if (hasCommunicated) {
        formData.append("journalName", journalName.trim());
        formData.append("avishkarAffiliationCommunicated", affiliationCommunicated ? "true" : "false");
        formData.append("manuscriptSimilarityPercent", similarityPercent);
        formData.append("manuscriptAiPercent", aiPercent);
        if (plagiarismFile) formData.append("plagiarismFile", plagiarismFile);
      }

      if (isPublished) {
        formData.append("publicationDoi", doi.trim());
        formData.append("avishkarAffiliationPublished", affiliationPublished ? "true" : "false");
        if (publishedFile) formData.append("publishedFile", publishedFile);
      }

      const res = await fetch("/api/faculty/manuscript", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update manuscript details.");
        setLoading(false);
        return;
      }

      setSuccess("Research manuscript tracking saved successfully!");
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError("Network error while submitting manuscript data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0a192f] text-[#c59b27] flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                  Compulsory Academic Milestone
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {project.projectId}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-[#0a192f]">
                Research Manuscript &amp; Publication
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-[#0a192f]">Notice for Faculty Mentors:</span> This section is <strong>compulsory</strong>. If you or your student team have prepared a draft manuscript, submitted it to a peer-reviewed journal, or had a paper published, please record the details below. If not submitted, you still need to fill this form with the &ldquo;Not Submitted&rdquo; option to enable CIE publication indexing.
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: MANUSCRIPT IN DRAFT */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0a192f] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>1. Manuscript in Draft</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Are you currently preparing or have you completed a draft manuscript?
                </p>
              </div>

              {/* Yes / No Toggle */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setHasDraft(true)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    hasDraft
                      ? "bg-[#0a192f] text-[#c59b27] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setHasDraft(false)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    !hasDraft
                      ? "bg-slate-200 text-slate-800"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Not Submitted
                </button>
              </div>
            </div>

            {hasDraft && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                {/* Draft Manuscript Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Upload Draft Manuscript (.pdf, .doc, .docx)</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      Capped at 10 MB Max
                    </span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleDraftChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300"
                  />
                  {project.draftManuscriptUrl && !draftFile && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-700">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Existing draft attached:</span>
                      <a
                        href={project.draftManuscriptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-mono truncate max-w-xs"
                      >
                        {project.draftManuscriptFileName || "View Draft"}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: COMMUNICATED MANUSCRIPT */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0a192f] flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>2. Manuscript Communicated (Under Review)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Have you communicated your manuscript to a scientific journal?
                </p>
              </div>

              {/* Yes / No Toggle */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setHasCommunicated(true)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    hasCommunicated
                      ? "bg-[#0a192f] text-[#c59b27] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setHasCommunicated(false)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    !hasCommunicated
                      ? "bg-slate-200 text-slate-800"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Not Submitted
                </button>
              </div>
            </div>

            {hasCommunicated && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                {/* 1. Journal Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    1. Journal Name where you have submitted <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={journalName}
                    onChange={(e) => setJournalName(e.target.value)}
                    placeholder="e.g. IEEE Transactions on Industrial Informatics, Elsevier, Springer Nature..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0a192f] bg-white"
                    required={hasCommunicated}
                  />
                </div>

                {/* 2. Avishkar Affiliation Confirmation */}
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={affiliationCommunicated}
                      onChange={(e) => setAffiliationCommunicated(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#0a192f] focus:ring-[#0a192f]"
                      required={hasCommunicated}
                    />
                    <div className="text-xs text-slate-800">
                      <span className="font-bold text-slate-900">
                        2. Confirmation on Avishkar Affiliation in Paper <span className="text-red-500">*</span>
                      </span>
                      <p className="text-[11px] text-amber-900 mt-0.5">
                        &ldquo;I confirm that <strong>Avishkar Centre for Innovation and Entrepreneurship, G D Goenka University</strong> has been explicitly included in the author affiliations in the submitted draft.&rdquo;
                      </p>
                    </div>
                  </label>
                </div>

                {/* 3. Similarity & AI Check (First 3-5 pages only) */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0a192f]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>3. Plagiarism &amp; AI Integrity Verification (Summary Pages Only)</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-900 leading-snug">
                    <span className="font-bold">Important Upload Rule:</span> Upload <strong>only the first 3-5 pages</strong> showing the Turnitin similarity index and AI detection percentages (Summary and score sheets only). Do <strong>not</strong> upload the full manuscript here. (Max 10 MB cap).
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span>Upload 3-5 Page Turnitin Summary PDF</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Max 10 MB
                      </span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handlePlagiarismChange}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200"
                    />
                    {project.manuscriptPlagiarismUrl && !plagiarismFile && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Existing summary report:</span>
                        <a
                          href={project.manuscriptPlagiarismUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-mono truncate max-w-xs"
                        >
                          View Report
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Turnitin Similarity (%): &lt; 10%
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="9.9"
                        value={similarityPercent}
                        onChange={(e) => setSimilarityPercent(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0a192f]"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-700 mb-1">
                        AI Content Score (%): &lt; 20%
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="19.9"
                        value={aiPercent}
                        onChange={(e) => setAiPercent(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0a192f]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: PUBLISHED MANUSCRIPT */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0a192f] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>3. Manuscript Publication (Published / In-Print)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Has your manuscript been accepted and officially published?
                </p>
              </div>

              {/* Yes / No Toggle */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setIsPublished(true)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    isPublished
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublished(false)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    !isPublished
                      ? "bg-slate-200 text-slate-800"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Not Submitted
                </button>
              </div>
            </div>

            {isPublished && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                {/* 1. DOI Link */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    1. DOI Link / Identifier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={doi}
                    onChange={(e) => setDoi(e.target.value)}
                    placeholder="e.g. https://doi.org/10.1016/j.procs.2026.01.001 or 10.1016/..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0a192f] bg-white"
                    required={isPublished}
                  />
                  {doi && (
                    <a
                      href={doi.startsWith("http") ? doi : `https://doi.org/${doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-700 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Test DOI Link</span>
                    </a>
                  )}
                </div>

                {/* 2. Upload Published Manuscript */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>2. Upload Final Published Manuscript PDF</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      Capped at 10 MB Max
                    </span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handlePublishedChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300"
                  />
                  {project.publishedManuscriptUrl && !publishedFile && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Existing published paper:</span>
                      <a
                        href={project.publishedManuscriptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-mono truncate max-w-xs"
                      >
                        {project.publishedManuscriptFileName || "View Published Paper"}
                      </a>
                    </div>
                  )}
                </div>

                {/* 3. Avishkar Affiliation Confirmation on Published Paper */}
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={affiliationPublished}
                      onChange={(e) => setAffiliationPublished(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                      required={isPublished}
                    />
                    <div className="text-xs text-slate-800">
                      <span className="font-bold text-slate-900">
                        3. Confirmation on Avishkar Affiliation in Published Paper <span className="text-red-500">*</span>
                      </span>
                      <p className="text-[11px] text-emerald-900 mt-0.5">
                        &ldquo;I confirm that <strong>Avishkar Centre for Innovation and Entrepreneurship, G D Goenka University</strong> is formally listed as an author affiliation in the final published paper.&rdquo;
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 sm:py-2 text-xs font-bold rounded-xl bg-[#0a192f] hover:bg-[#112240] text-[#c59b27] border border-[#c59b27]/40 shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#c59b27]" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-[#c59b27]" />
                  <span>Save Manuscript Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
