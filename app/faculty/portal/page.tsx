"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { exportToCsv, exportToXlsx, exportToPdf } from "@/lib/export";
import { FacultyData, AssignedProject } from "@/types/faculty";
import { FacultyTopBar } from "@/components/faculty/FacultyTopBar";
import { FacultyProjectCard } from "@/components/faculty/FacultyProjectCard";
import { ArtifactUploadModal } from "@/components/faculty/ArtifactUploadModal";
import { ChangePasscodeModal } from "@/components/faculty/ChangePasscodeModal";

export default function FacultyPortalPage() {
  const router = useRouter();
  const [faculty, setFaculty] = useState<FacultyData | null>(null);
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
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
              <FacultyProjectCard
                key={proj.id}
                project={proj}
                onOpenUpload={handleOpenUpload}
                onDeleteArtifact={handleDeleteArtifact}
                onExportStudents={handleExportStudents}
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

      <Footer />
    </>
  );
}
