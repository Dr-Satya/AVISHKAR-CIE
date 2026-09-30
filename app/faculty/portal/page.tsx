"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Loader2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Users,
  Upload,
  FileText,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Clock,
  XCircle,
  ExternalLink,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { exportToCsv, exportToXlsx, exportToPdf } from "@/lib/export";

interface FacultyData {
  id: string;
  name: string;
  email: string;
  department: string;
  phone?: string;
  isAdmin: boolean;
  isSpoc?: boolean;
  spocDepartment?: string | null;
}

interface StudentInProject {
  id: string;
  enrollment: string;
  name: string;
  department: string;
  programme?: string;
  semester: number;
  batch: string;
  registeredAt: string;
  status: string;
}

interface ArtifactData {
  id: string;
  type: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  similarityPercent?: number;
  aiPercent?: number;
  similarityChecked: boolean;
  aiChecked: boolean;
  status: string;
  spocNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}

interface AssignedProject {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  theme: string;
  category: string;
  maxSeats: number;
  currentRegistrations: number;
  availableSeats: number;
  submissionStatus: string;
  spocReviewNote?: string;
  reviewedAt?: string;
  artifacts?: ArtifactData[];
  students: StudentInProject[];
}

export default function FacultyPortalPage() {
  const router = useRouter();
  const [faculty, setFaculty] = useState<FacultyData | null>(null);
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Passcode modal state
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [passcodeLoading, setPasscodeLoading] = useState(false);
  const [passcodeSuccess, setPasscodeSuccess] = useState<string | null>(null);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Artifact Upload Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [targetProject, setTargetProject] = useState<AssignedProject | null>(null);
  const [artifactType, setArtifactType] = useState<"REPORT" | "PPT" | "OTHER">("REPORT");
  const [artifactTitle, setArtifactTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [similarityChecked, setSimilarityChecked] = useState(false);
  const [aiChecked, setAiChecked] = useState(false);
  const [similarityValue, setSimilarityValue] = useState("5.0");
  const [aiValue, setAiValue] = useState("10.0");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fetchFacultyData = async () => {
    try {
      const res = await fetch("/api/faculty/me");
      if (!res.ok) {
        router.push("/faculty/login");
        return;
      }
      const data = await res.json();
      setFaculty(data.faculty);
      setProjects(data.projects || []);
    } catch (err) {
      setError("Failed to load faculty portal data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();

    // SSE connection for live updates
    const eventSource = new EventSource("/api/events");
    eventSource.addEventListener("registration.created", () => {
      fetchFacultyData();
    });
    eventSource.addEventListener("submission.reviewed", () => {
      fetchFacultyData();
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const handleChangePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeLoading(true);
    setPasscodeError(null);
    setPasscodeSuccess(null);

    try {
      const res = await fetch("/api/auth/faculty/change-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPasscode, newPasscode, confirmPasscode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasscodeError(data.error || "Failed to update passcode.");
        setPasscodeLoading(false);
        return;
      }

      setPasscodeSuccess("Passcode updated successfully!");
      setCurrentPasscode("");
      setNewPasscode("");
      setConfirmPasscode("");
      setTimeout(() => setShowPasscodeModal(false), 1500);
    } catch (err) {
      setPasscodeError("Network error.");
    } finally {
      setPasscodeLoading(false);
    }
  };

  const handleOpenUpload = (proj: AssignedProject) => {
    setTargetProject(proj);
    setArtifactType("REPORT");
    setArtifactTitle(`${proj.projectId} Project Report`);
    setSelectedFile(null);
    setSimilarityChecked(false);
    setAiChecked(false);
    setSimilarityValue("5.0");
    setAiValue("10.0");
    setUploadError(null);
    setUploadSuccess(null);
    setShowUploadModal(true);
  };

  const handleUploadArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProject) return;

    if (artifactType === "REPORT") {
      if (!similarityChecked) {
        setUploadError("You must verify that Content Similarity is < 10%.");
        return;
      }
      if (!aiChecked) {
        setUploadError("You must verify that AI-written content is < 20%.");
        return;
      }
      const sim = parseFloat(similarityValue);
      const ai = parseFloat(aiValue);
      if (isNaN(sim) || sim >= 10.0) {
        setUploadError(`Content similarity must be less than 10%. (Entered: ${similarityValue}%)`);
        return;
      }
      if (isNaN(ai) || ai >= 20.0) {
        setUploadError(`AI content must be less than 20%. (Entered: ${aiValue}%)`);
        return;
      }
    }

    setUploadLoading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("projectId", targetProject.id);
      formData.append("type", artifactType);
      formData.append("title", artifactTitle);
      formData.append("similarityChecked", similarityChecked ? "true" : "false");
      formData.append("aiChecked", aiChecked ? "true" : "false");
      formData.append("similarityPercent", similarityValue);
      formData.append("aiPercent", aiValue);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/faculty/artifacts", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed.");
        setUploadLoading(false);
        return;
      }

      setUploadSuccess("Artifact uploaded and submitted to Department SPOC!");
      await fetchFacultyData();
      setTimeout(() => setShowUploadModal(false), 1200);
    } catch (err: any) {
      setUploadError("Network error uploading artifact.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteArtifact = async (artifactId: string) => {
    if (!confirm("Are you sure you want to delete this artifact?")) return;
    try {
      const res = await fetch(`/api/faculty/artifacts?artifactId=${artifactId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchFacultyData();
      }
    } catch (err) {}
  };

  // Export handlers
  const handleExportStudents = (proj: AssignedProject, format: "csv" | "xlsx" | "pdf") => {
    if (proj.students.length === 0) {
      alert("No students registered in this project to export.");
      return;
    }

    const rows = proj.students.map((s, idx) => ({
      "Sr. No": idx + 1,
      "Enrollment Number": s.enrollment,
      "Student Name": s.name,
      "Department": s.department,
      "Programme": s.programme || "N/A",
      "Semester": s.semester,
      "Batch": s.batch,
      "Project ID": proj.projectId,
      "Project Title": proj.title,
      "Faculty Mentor": faculty?.name || "",
      "Registration Date": s.registeredAt.split("T")[0],
      "Status": s.status,
    }));

    const filename = `${proj.projectId}_Students`;

    if (format === "csv") {
      exportToCsv(rows, filename);
    } else if (format === "xlsx") {
      exportToXlsx(rows, filename, proj.projectId);
    } else if (format === "pdf") {
      exportToPdf(rows, `Student Enrollment List · ${proj.projectId} - ${proj.title}`);
    }
  };

  const handleExportAllStudents = (format: "csv" | "xlsx" | "pdf") => {
    const allStudents: any[] = [];
    let idx = 1;
    projects.forEach((proj) => {
      proj.students.forEach((s) => {
        allStudents.push({
          "Sr. No": idx++,
          "Enrollment Number": s.enrollment,
          "Student Name": s.name,
          "Department": s.department,
          "Programme": s.programme || "N/A",
          "Semester": s.semester,
          "Batch": s.batch,
          "Project ID": proj.projectId,
          "Project Title": proj.title,
          "Faculty Mentor": faculty?.name || "",
          "Registration Date": s.registeredAt.split("T")[0],
          "Status": s.status,
        });
      });
    });

    if (allStudents.length === 0) {
      alert("No students registered across your projects.");
      return;
    }

    const filename = `All_Mentored_Students_${faculty?.name?.replace(/[^a-zA-Z0-9]/g, "_")}`;

    if (format === "csv") {
      exportToCsv(allStudents, filename);
    } else if (format === "xlsx") {
      exportToXlsx(allStudents, filename, "Students");
    } else if (format === "pdf") {
      exportToPdf(allStudents, `All Mentored Students · Prof. ${faculty?.name}`);
    }
  };

  if (loading) {
    return (
      <>
        <Header role="Faculty" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0d2137]" />
        </main>
        <Footer />
      </>
    );
  }

  if (!faculty) return null;

  return (
    <>
      <Header role="Faculty" />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d2137]">
                {faculty.name}
              </h1>
              {faculty.isSpoc && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  SPOC: {faculty.spocDepartment || faculty.department}
                </span>
              )}
              {faculty.isAdmin && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                  Administrator
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {faculty.department} · {faculty.email}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {faculty.isSpoc && (
              <Link
                href="/spoc/portal"
                className="text-xs font-bold px-4 py-2 rounded-xl bg-[#cda34f] text-[#0d2137] hover:bg-[#b99142] flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Department SPOC Portal</span>
              </Link>
            )}
            {faculty.isAdmin && (
              <Link
                href="/admin/portal"
                className="text-xs font-bold px-4 py-2 rounded-xl bg-[#0d2137] text-white hover:bg-[#163456] flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-[#cda34f]" />
                <span>Admin Dashboard</span>
              </Link>
            )}
            <button
              onClick={() => setShowPasscodeModal(true)}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Passcode</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Admin Shortcut Banner if user has admin privileges */}
        {faculty.isAdmin && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0d2137] text-[#cda34f] flex items-center justify-center font-bold text-sm shadow-sm">
                ADMIN
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#0d2137]">
                  You have University Administrator Privileges
                </p>
                <p className="text-xs text-slate-600">
                  Access administrative management, SPOC appointments, registration limits, and system controls.
                </p>
              </div>
            </div>
            <Link
              href="/admin/portal"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#0d2137] text-white hover:bg-[#1a3a60] transition-colors flex items-center gap-1.5 self-start sm:self-center"
            >
              <span>Launch Admin Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* SPOC Shortcut Banner if user is SPOC */}
        {faculty.isSpoc && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                SPOC
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#0d2137]">
                  You are the designated Single Point of Contact (SPOC) for {faculty.spocDepartment || faculty.department}
                </p>
                <p className="text-xs text-slate-600">
                  Review faculty project uploads, approve/reject artifacts, and manage department student rosters.
                </p>
              </div>
            </div>
            <Link
              href="/spoc/portal"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#0d2137] text-white hover:bg-[#1a3a60] transition-colors flex items-center gap-1.5 self-start sm:self-center"
            >
              <span>Launch SPOC Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* Assigned Projects Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#0d2137]">
                Assigned Projects ({projects.length})
              </h2>
              <p className="text-xs text-slate-500">
                Upload reports & PPTs with plagiarism verification, and export student rosters.
              </p>
            </div>

            {/* Global Export All Students */}
            {projects.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 mr-1">Export All:</span>
                <button
                  onClick={() => handleExportAllStudents("csv")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                  title="Export all students as CSV"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => handleExportAllStudents("xlsx")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                  title="Export all students as Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleExportAllStudents("pdf")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center gap-1"
                  title="Print or Save as PDF"
                >
                  <Download className="w-3.5 h-3.5 text-red-600" />
                  <span>PDF</span>
                </button>
              </div>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-sm border border-slate-200/80">
              No projects currently assigned to your profile.
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                {/* Project Header Bar */}
                <div className="p-6 sm:p-7 border-b border-slate-100">
                  <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#0d2137] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                          {proj.projectId}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {proj.category} · {proj.theme}
                        </span>

                        {/* Submission Status Pill */}
                        {proj.submissionStatus === "APPROVED" && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Approved by SPOC
                          </span>
                        )}
                        {proj.submissionStatus === "PENDING" && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending SPOC Review
                          </span>
                        )}
                        {proj.submissionStatus === "REJECTED" && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-600" />
                            Changes Requested / Rejected
                          </span>
                        )}
                        {proj.submissionStatus === "NOT_SUBMITTED" && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Not Submitted
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#0d2137]">
                        {proj.title}
                      </h3>
                      {proj.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {proj.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
                      <div className="text-left sm:text-right">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Seats Filled
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-[#0d2137]">
                          {proj.currentRegistrations} / {proj.maxSeats}
                        </div>
                        <span className="inline-block mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {proj.availableSeats} Available
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenUpload(proj)}
                        className="px-4 py-2 rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Artifacts</span>
                      </button>
                    </div>
                  </div>

                  {/* SPOC Rejection Note Alert */}
                  {proj.submissionStatus === "REJECTED" && proj.spocReviewNote && (
                    <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-900">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">SPOC Review Feedback:</p>
                        <p className="mt-0.5 text-red-800">{proj.spocReviewNote}</p>
                        <p className="mt-1 text-[11px] text-red-700 font-medium">
                          Please update your documents accordingly and re-upload to resubmit for verification.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SPOC Approved Note Alert */}
                  {proj.submissionStatus === "APPROVED" && (
                    <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 text-xs text-green-900 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>{proj.spocReviewNote || "All project artifacts have been reviewed and approved by the department SPOC."}</span>
                    </div>
                  )}
                </div>

                {/* Artifacts Uploaded Section */}
                {proj.artifacts && proj.artifacts.length > 0 && (
                  <div className="px-6 sm:px-7 py-4 bg-slate-50/70 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Uploaded Documents & Verification ({proj.artifacts.length})</span>
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {proj.artifacts.map((art) => (
                        <div
                          key={art.id}
                          className="bg-white p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                art.type === "REPORT"
                                  ? "bg-blue-100 text-blue-800"
                                  : art.type === "PPT"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {art.type}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800">{art.title}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                                <span>{art.fileName}</span>
                                <span>·</span>
                                <span>Submitted: {art.submittedAt.split("T")[0]}</span>
                                {art.similarityPercent !== null && art.similarityPercent !== undefined && (
                                  <>
                                    <span>·</span>
                                    <span className="text-slate-700 font-semibold">
                                      Similarity: {art.similarityPercent}% (&lt;10% ✓)
                                    </span>
                                  </>
                                )}
                                {art.aiPercent !== null && art.aiPercent !== undefined && (
                                  <>
                                    <span>·</span>
                                    <span className="text-slate-700 font-semibold">
                                      AI Written: {art.aiPercent}% (&lt;20% ✓)
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                art.status === "APPROVED"
                                  ? "bg-green-100 text-green-800"
                                  : art.status === "REJECTED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {art.status}
                            </span>

                            <a
                              href={art.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>View File</span>
                            </a>

                            {art.status !== "APPROVED" && (
                              <button
                                onClick={() => handleDeleteArtifact(art.id)}
                                className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                title="Remove artifact"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Registered Students Table & Export */}
                <div className="p-6 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Registered Students ({proj.students.length})</span>
                    </h4>

                    {/* Project-specific Export */}
                    {proj.students.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">Download:</span>
                        <button
                          onClick={() => handleExportStudents(proj, "csv")}
                          className="px-2 py-0.5 text-xs font-medium rounded border border-slate-200 hover:bg-slate-50 text-slate-600"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => handleExportStudents(proj, "xlsx")}
                          className="px-2 py-0.5 text-xs font-medium rounded border border-slate-200 hover:bg-slate-50 text-slate-600"
                        >
                          XLSX
                        </button>
                        <button
                          onClick={() => handleExportStudents(proj, "pdf")}
                          className="px-2 py-0.5 text-xs font-medium rounded border border-slate-200 hover:bg-slate-50 text-slate-600"
                        >
                          PDF
                        </button>
                      </div>
                    )}
                  </div>

                  {proj.students.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">
                      No students have registered for this project yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200/80 text-slate-500 font-semibold">
                            <th className="pb-3 pr-4">Enrollment No.</th>
                            <th className="pb-3 px-4">Student Name</th>
                            <th className="pb-3 px-4">Department</th>
                            <th className="pb-3 px-4">Programme</th>
                            <th className="pb-3 px-4">Semester</th>
                            <th className="pb-3 px-4">Batch</th>
                            <th className="pb-3 pl-4 text-right">Registration Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {proj.students.map((std) => (
                            <tr key={std.id} className="hover:bg-slate-50/60">
                              <td className="py-3 pr-4 font-mono font-bold text-[#0d2137]">
                                {std.enrollment}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-800">
                                {std.name}
                              </td>
                              <td className="py-3 px-4 text-slate-600">{std.department}</td>
                              <td className="py-3 px-4 text-slate-600">{std.programme || "—"}</td>
                              <td className="py-3 px-4 text-slate-600">Sem {std.semester}</td>
                              <td className="py-3 px-4 text-slate-600">{std.batch}</td>
                              <td className="py-3 pl-4 text-right text-slate-500 font-mono text-[11px]">
                                {std.registeredAt.split("T")[0]}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ARTIFACT UPLOAD MODAL WITH PLAGIARISM & AI CHECK */}
      {showUploadModal && targetProject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0d2137]">
                  Upload Project Artifact
                </h3>
                <p className="text-xs text-slate-500">
                  {targetProject.projectId} · {targetProject.title}
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUploadArtifact} className="space-y-4">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attach Document File (PDF, PPTX, DOCX, ZIP)
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              {/* MANDATORY PLAGIARISM & AI CHECK BOXES FOR REPORT */}
              {artifactType === "REPORT" && (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/90 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Compulsory Plagiarism & AI Integrity Verification</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Per GDGU academic guidelines, project reports must undergo plagiarism and AI detection prior to SPOC submission. Both conditions are mandatory:
                  </p>

                  {/* Similarity Checkbox */}
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
                          1. Content similarity is verified &lt; 10%
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Checked via Turnitin / Urkund official similarity software.
                        </p>
                      </div>
                    </label>

                    <div className="ml-6.5 flex items-center gap-2">
                      <span className="text-[11px] text-slate-600 font-medium">
                        Similarity Score (%):
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
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    uploadLoading ||
                    (artifactType === "REPORT" && (!similarityChecked || !aiChecked))
                  }
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {uploadLoading ? (
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
      )}

      {/* CHANGE PASSCODE MODAL */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 sm:p-7 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-[#0d2137]">Update Passcode</h3>

            {passcodeError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                {passcodeError}
              </div>
            )}
            {passcodeSuccess && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800">
                {passcodeSuccess}
              </div>
            )}

            <form onSubmit={handleChangePasscode} className="space-y-3 text-xs">
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
                  onClick={() => setShowPasscodeModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passcodeLoading}
                  className="px-4 py-1.5 rounded-xl bg-[#0d2137] text-white hover:bg-[#163456] disabled:opacity-50"
                >
                  {passcodeLoading ? "Saving..." : "Save Passcode"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
