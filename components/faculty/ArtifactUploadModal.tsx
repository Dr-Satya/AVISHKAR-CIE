"use client";

import React, { useState } from "react";
import {
  Loader2,
  Upload,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Download,
  FileCheck,
  FileText,
} from "lucide-react";
import { AssignedProject } from "@/types/faculty";

interface ArtifactUploadModalProps {
  project: AssignedProject;
  initialSemester?: number;
  initialType?: "REPORT" | "PPT" | "CONSENT_FORM" | "OTHER";
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

export function ArtifactUploadModal({
  project,
  initialSemester,
  initialType = "REPORT",
  onClose,
  onSuccess,
}: ArtifactUploadModalProps) {
  const baseSem = project.semester || 3;
  const nextSem = baseSem + 1;
  const [selectedSemester, setSelectedSemester] = useState<number>(initialSemester || baseSem);
  const [artifactType, setArtifactType] = useState<"REPORT" | "PPT" | "CONSENT_FORM" | "OTHER">(
    initialType
  );
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);

  const getInitialTitle = (type: "REPORT" | "PPT" | "CONSENT_FORM" | "OTHER", sem: number) => {
    switch (type) {
      case "REPORT":
        return `${project.projectId} Sem ${sem} Project Report`;
      case "PPT":
        return `${project.projectId} Sem ${sem} Presentation PPT`;
      case "CONSENT_FORM":
        return `${project.projectId} Sem ${sem} Student Publication Consent Form`;
      case "OTHER":
        return `${project.projectId} Sem ${sem} Supporting Document`;
    }
  };

  const [artifactTitle, setArtifactTitle] = useState(
    getInitialTitle(initialType, initialSemester || baseSem)
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPlagiarismFile, setSelectedPlagiarismFile] = useState<File | null>(null);
  const [similarityChecked, setSimilarityChecked] = useState(false);
  const [aiChecked, setAiChecked] = useState(false);
  const [selfDeclarationChecked, setSelfDeclarationChecked] = useState(false);
  const [similarityValue, setSimilarityValue] = useState("5.0");
  const [aiValue, setAiValue] = useState("10.0");

  // Consent Form specific verifications (tick marks)
  const [consentStudentSigned, setConsentStudentSigned] = useState(false);
  const [consentThresholdsVerified, setConsentThresholdsVerified] = useState(false);
  const [consentAttributionAgreed, setConsentAttributionAgreed] = useState(false);
  const [consentFacultySigned, setConsentFacultySigned] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSemesterChange = (sem: number) => {
    setSelectedSemester(sem);
    if (!titleManuallyEdited) {
      setArtifactTitle(getInitialTitle(artifactType, sem));
    }
  };

  const handleTypeChange = (t: "REPORT" | "PPT" | "CONSENT_FORM" | "OTHER") => {
    setArtifactType(t);
    if (!titleManuallyEdited) {
      setArtifactTitle(getInitialTitle(t, selectedSemester));
    }
  };

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
    } else if (artifactType === "CONSENT_FORM") {
      if (!selectedFile) {
        setError("Please attach the completed and signed Student Consent Form document (.docx or .pdf).");
        return;
      }
      if (!consentStudentSigned) {
        setError("Please tick mark: Confirm that student consent has been recorded and granted.");
        return;
      }
      if (!consentThresholdsVerified) {
        setError("Please tick mark: Confirm that plagiarism is < 10% and AI content < 20%.");
        return;
      }
      if (!consentAttributionAgreed) {
        setError("Please tick mark: Acknowledge authorship attribution and institutional rights.");
        return;
      }
      if (!consentFacultySigned) {
        setError("Please tick mark: Confirm supervising faculty sign-off.");
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
      formData.append("semester", String(selectedSemester));
      formData.append("type", artifactType);
      formData.append("title", artifactTitle);
      formData.append("similarityChecked", (artifactType === "CONSENT_FORM" || similarityChecked) ? "true" : "false");
      formData.append("aiChecked", (artifactType === "CONSENT_FORM" || aiChecked) ? "true" : "false");
      formData.append("selfDeclaration", selfDeclarationChecked ? "true" : "false");
      formData.append("similarityPercent", artifactType === "CONSENT_FORM" ? "0" : similarityValue);
      formData.append("aiPercent", artifactType === "CONSENT_FORM" ? "0" : aiValue);
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

      const fileTypeLabel =
        artifactType === "REPORT"
          ? "Project Report (PDF)"
          : artifactType === "PPT"
          ? "Project Presentation (PPT)"
          : artifactType === "CONSENT_FORM"
          ? "Student Consent Form"
          : "Project Document";
      const confirmMsg = `${fileTypeLabel} for Semester ${selectedSemester} uploaded and submitted to Department SPOC successfully!`;
      setSuccess(confirmMsg);
      onSuccess(confirmMsg);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setError("Network error uploading artifact.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-7 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
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
          {/* Dual-Semester Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Select Submission Semester</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Both Semesters Required
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSemesterChange(baseSem)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 ${
                  selectedSemester === baseSem
                    ? "bg-[#0d2137] text-white border-[#0d2137] shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider ${selectedSemester === baseSem ? "text-amber-300" : "text-slate-400"}`}>
                  Phase I · Odd Sem
                </span>
                <span>Semester {baseSem} (Interim)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSemesterChange(nextSem)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 ${
                  selectedSemester === nextSem
                    ? "bg-[#0d2137] text-white border-[#0d2137] shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider ${selectedSemester === nextSem ? "text-amber-300" : "text-slate-400"}`}>
                  Phase II · Even Sem
                </span>
                <span>Semester {nextSem} (Final Defense)</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Faculty mentors are required to submit reports and presentation slides for <strong>both</strong> semesters.
            </p>
          </div>

          {/* Artifact Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Artifact Document Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["REPORT", "PPT", "CONSENT_FORM", "OTHER"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    artifactType === t
                      ? "bg-[#0d2137] text-white border-[#0d2137] shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {t === "REPORT"
                    ? "Project Report"
                    : t === "PPT"
                    ? "Presentation PPT"
                    : t === "CONSENT_FORM"
                    ? "Consent Form"
                    : "Others"}
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
              onChange={(e) => {
                setArtifactTitle(e.target.value);
                setTitleManuallyEdited(true);
              }}
              placeholder="Enter document title"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
              required
            />
          </div>

          {/* CONSENT FORM WORKFLOW & INSTRUCTIONS */}
          {artifactType === "CONSENT_FORM" ? (
            <div className="space-y-3.5">
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/90 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-950">
                  <FileCheck className="w-4 h-4 text-teal-700" />
                  <span>Student Publication Consent (2-Step Process)</span>
                </div>
                <p className="text-[11px] text-teal-900 leading-relaxed">
                  Publication of IDP project deliverables (reports, papers, multimedia) requires formal student consent, faculty authorization, and adherence to originality limits.
                </p>

                {/* 2 Clear Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Option 1: Download Template */}
                  <div className="p-3 bg-white rounded-xl border border-teal-200 shadow-xs flex flex-col justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">1</span>
                        <span>Download Template</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Official 10-student table format with publication terms and declaration.
                      </p>
                    </div>
                    <a
                      href="/templates/Consent_Form_IDP_publication.docx"
                      download="Consent_Form_IDP_publication.docx"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Template (.docx)</span>
                    </a>
                  </div>

                  {/* Option 2: Upload Completed Form */}
                  <div className="p-3 bg-white rounded-xl border border-teal-200 shadow-xs flex flex-col justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">2</span>
                        <span>Upload Signed Form</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Fill student details, obtain signed consent (&ldquo;Granted&rdquo;), and attach file.
                      </p>
                    </div>
                    <label
                      htmlFor="consent-file-upload"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0d2137] hover:bg-[#1a3a60] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{selectedFile ? "Replace Form File" : "Choose Completed Form"}</span>
                    </label>
                    <input
                      id="consent-file-upload"
                      type="file"
                      accept=".docx,.doc,.pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (f && f.size > 10 * 1024 * 1024) {
                          setError(`Consent form file exceeds 10MB limit (${(f.size / (1024 * 1024)).toFixed(2)} MB).`);
                          e.target.value = "";
                          setSelectedFile(null);
                          return;
                        }
                        setError(null);
                        setSelectedFile(f);
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                {selectedFile && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-medium">
                    <span className="truncate max-w-[280px]">Attached: {selectedFile.name}</span>
                    <span className="text-[11px] text-emerald-700">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              {/* Mandatory Tick Marks for Consent Form */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Mandatory Verifications (Tick all to submit)</span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-800">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentStudentSigned}
                      onChange={(e) => setConsentStudentSigned(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-teal-700 focus:ring-teal-700"
                    />
                    <div>
                      <span className="font-bold text-slate-900">
                        1. Student Consent Recorded &amp; Granted
                      </span>
                      <p className="text-[11px] text-slate-500">
                        All participating team students have reviewed the terms and signed their consent status (&ldquo;Granted&rdquo; / &ldquo;Denied&rdquo;).
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentThresholdsVerified}
                      onChange={(e) => setConsentThresholdsVerified(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-teal-700 focus:ring-teal-700"
                    />
                    <div>
                      <span className="font-bold text-slate-900">
                        2. Academic Integrity Thresholds Satisfied
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Work strictly conforms to institutional thresholds: <strong>Plagiarism &lt; 10%</strong> and <strong>AI Content &lt; 20%</strong>.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentAttributionAgreed}
                      onChange={(e) => setConsentAttributionAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-teal-700 focus:ring-teal-700"
                    />
                    <div>
                      <span className="font-bold text-slate-900">
                        3. Authorship Attribution &amp; Non-Exclusive Rights
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Appropriate credit is attributed to all contributing students and faculty under institutional non-exclusive license.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentFacultySigned}
                      onChange={(e) => setConsentFacultySigned(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-teal-700 focus:ring-teal-700"
                    />
                    <div>
                      <span className="font-bold text-slate-900">
                        4. Supervising Faculty Sign-Off
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Supervising faculty mentor has verified student details, confirmed ethical compliance, and signed off on the document.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* General File Attachment (REPORT, PPT, OTHER) */
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
          )}

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
                  <span>3. Upload Plagiarism &amp; AI Report (First 3-5 Pages Only)</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    Max 10 MB Cap
                  </span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f && f.size > 10 * 1024 * 1024) {
                      setError(`Plagiarism report exceeds the 10MB maximum cap (${(f.size / (1024 * 1024)).toFixed(2)} MB).`);
                      e.target.value = "";
                      setSelectedPlagiarismFile(null);
                      return;
                    }
                    setError(null);
                    setSelectedPlagiarismFile(f);
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                  required={artifactType === "REPORT"}
                />
                <p className="text-[11px] text-amber-900 font-medium">
                  <strong>Important:</strong> Upload <strong>only the first 3-5 pages</strong> having the similarity and AI check summaries (not full files). File size is capped to 10 MB max.
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

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !selfDeclarationChecked ||
                (artifactType === "REPORT" && (!similarityChecked || !aiChecked || !selectedPlagiarismFile)) ||
                (artifactType === "CONSENT_FORM" &&
                  (!selectedFile ||
                    !consentStudentSigned ||
                    !consentThresholdsVerified ||
                    !consentAttributionAgreed ||
                    !consentFacultySigned))
              }
              className="px-5 py-2.5 sm:py-2 text-xs font-bold rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {artifactType === "CONSENT_FORM"
                      ? "Upload & Submit Consent Form"
                      : "Submit to SPOC"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
