"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Lightbulb,
  Phone,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { exportToCsv, exportToXlsx, exportToPdf } from "@/lib/export";
import { FacultyData, AssignedProject } from "@/types/faculty";
import { FacultyTopBar } from "@/components/faculty/FacultyTopBar";
import { FacultyProjectCard } from "@/components/faculty/FacultyProjectCard";
import { ArtifactUploadModal } from "@/components/faculty/ArtifactUploadModal";
import { ChangePasscodeModal } from "@/components/faculty/ChangePasscodeModal";
import { ProjectProposalModal } from "@/components/faculty/ProjectProposalModal";

export default function FacultyPortalPage() {
  const router = useRouter();
  const [faculty, setFaculty] = useState<FacultyData | null>(null);
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneConsent, setPhoneConsent] = useState(false);
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [phoneModalError, setPhoneModalError] = useState<string | null>(null);
  const [phoneModalSuccess, setPhoneModalSuccess] = useState<string | null>(null);
  const [targetProject, setTargetProject] = useState<AssignedProject | null>(null);
  const [uploadSemester, setUploadSemester] = useState<number | undefined>(undefined);

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
      if (!data.faculty.phone || !data.faculty.phone.trim()) {
        setShowPhoneModal(true);
        setPhoneConsent(false);
      } else {
        setPhoneInput(data.faculty.phone);
        setPhoneConsent(true);
      }
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

  const handleOpenUpload = (proj: AssignedProject, sem?: number) => {
    setTargetProject(proj);
    setUploadSemester(sem);
    setShowUploadModal(true);
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
      "Mobile Number": s.phone || "N/A",
      "Phone Verified": s.phoneVerified ? "Yes" : "No",
      "Email": s.email || "N/A",
      "Department": s.department,
      "Programme": s.programme || "N/A",
      "Semester": s.semester,
      "Batch": s.batch,
      "Project ID": proj.projectId,
      "Project Title": proj.title,
      "Faculty Mentor": faculty?.name || "",
      "Registration Date": s.registeredAt.split("T")[0],
      Status: s.status,
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
          "Mobile Number": s.phone || "N/A",
          "Phone Verified": s.phoneVerified ? "Yes" : "No",
          "Email": s.email || "N/A",
          "Department": s.department,
          "Programme": s.programme || "N/A",
          "Semester": s.semester,
          "Batch": s.batch,
          "Project ID": proj.projectId,
          "Project Title": proj.title,
          "Faculty Mentor": faculty?.name || "",
          "Registration Date": s.registeredAt.split("T")[0],
          Status: s.status,
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

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneInput.replace(/\D/g, "");
    if (clean.length < 10) {
      setPhoneModalError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!phoneConsent) {
      setPhoneModalError("Please check the consent box to confirm sharing with your mentored students.");
      return;
    }

    setPhoneSubmitting(true);
    setPhoneModalError(null);
    setPhoneModalSuccess(null);

    try {
      const res = await fetch("/api/faculty/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean.slice(-10) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneModalError(data.error || "Failed to update phone number.");
        return;
      }

      setFaculty((prev) => (prev ? { ...prev, phone: data.phone } : prev));
      setPhoneModalSuccess("Mobile number verified and saved successfully!");
      setTimeout(() => {
        setShowPhoneModal(false);
        setPhoneModalSuccess(null);
      }, 1200);
    } catch {
      setPhoneModalError("Network error while updating phone number.");
    } finally {
      setPhoneSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header role="Faculty" />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-6 animate-pulse">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-52 bg-slate-200 rounded-lg" />
              <div className="h-4 w-72 bg-slate-100 rounded-md" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-28 bg-slate-100 rounded-xl" />
              <div className="h-9 w-24 bg-slate-200 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
                <div className="h-3 w-28 bg-slate-200 rounded" />
                <div className="h-7 w-16 bg-slate-300 rounded-lg" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-10 h-1 bg-[#cda34f]/50 rounded-full mb-2" />
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="h-4 w-96 bg-slate-100 rounded-md mb-6" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-full bg-slate-50 border border-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
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
        <FacultyTopBar
          faculty={faculty}
          onOpenPasscode={() => setShowPasscodeModal(true)}
          onOpenPhoneModal={() => {
            setPhoneModalError(null);
            setPhoneModalSuccess(null);
            setShowPhoneModal(true);
          }}
          onLogout={handleLogout}
        />

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

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowProposalModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#0a192f] text-[#c59b27] hover:bg-[#112240] border border-[#c59b27]/30 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Lightbulb className="w-3.5 h-3.5 text-[#c59b27]" />
                <span>Submit Project Idea</span>
              </button>

              {/* Global Export All Students */}
              {projects.length > 0 && (
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Export:</span>
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
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-sm border border-slate-200/80 space-y-3">
              <p>No projects currently assigned to your profile.</p>
              <div>
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-[#0a192f] text-[#c59b27] hover:bg-[#112240] transition-colors"
                >
                  <Lightbulb className="w-4 h-4 text-[#c59b27]" />
                  Submit Project Idea to SPOC
                </button>
              </div>
            </div>
          ) : (
            projects.map((proj) => (
              <FacultyProjectCard
                key={proj.id}
                project={proj}
                onOpenUpload={handleOpenUpload}
                onDeleteArtifact={handleDeleteArtifact}
                onExportStudents={handleExportStudents}
                onRefresh={fetchFacultyData}
              />
            ))
          )}
        </div>
      </main>

      {/* Artifact Upload Modal */}
      {showUploadModal && targetProject && (
        <ArtifactUploadModal
          project={targetProject}
          initialSemester={uploadSemester}
          onClose={() => {
            setShowUploadModal(false);
            setUploadSemester(undefined);
          }}
          onSuccess={fetchFacultyData}
        />
      )}

      {/* Passcode Modal */}
      {showPasscodeModal && (
        <ChangePasscodeModal onClose={() => setShowPasscodeModal(false)} />
      )}

      {/* Project Proposal Modal */}
      {showProposalModal && (
        <ProjectProposalModal
          isOpen={showProposalModal}
          onClose={() => setShowProposalModal(false)}
          onSuccess={fetchFacultyData}
          facultyDepartment={faculty.department}
        />
      )}

      {/* Faculty Phone Verification & Update Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d2137]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
            {/* Top Gold Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#cda34f] via-[#0d2137] to-[#cda34f]" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#cda34f] flex-shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#0d2137]">
                    {faculty.phone ? "Update Mobile Number" : "Verify Mobile Number"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Official Faculty Mentor Contact Details
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPhoneModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 mb-5 text-xs text-amber-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#cda34f] flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-950">Why is this required?</p>
                <p className="text-amber-900/90 leading-relaxed font-medium">
                  Your mobile number will be visible to students allocated under your mentored IDP projects on their student portal, enabling instant communication for viva, submission feedback, and guidance.
                </p>
              </div>
            </div>

            {phoneModalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{phoneModalError}</span>
              </div>
            )}

            {phoneModalSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                <span>{phoneModalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSavePhone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  10-Digit Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phoneInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setPhoneInput(val);
                    }}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter 10 digits without leading zero or country code.
                </p>
              </div>

              {/* Consent Box */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={phoneConsent}
                  onChange={(e) => setPhoneConsent(e.target.checked)}
                  className="rounded text-[#0d2137] focus:ring-[#0d2137] w-4 h-4 mt-0.5 flex-shrink-0"
                />
                <span className="text-xs text-slate-700 leading-snug">
                  I verify this is my active official mobile number and consent to sharing it with my mentored students for project coordination.
                </span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={phoneSubmitting || phoneInput.length < 10 || !phoneConsent}
                  className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-bold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {phoneSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#cda34f]" />
                  )}
                  <span>Save &amp; Verify Number</span>
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
