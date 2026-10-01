"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  AlertCircle,
  FolderCheck,
  Building2,
  Users,
  Download,
} from "lucide-react";
import { exportToCsv, exportToXlsx, exportToPdf } from "@/lib/export";
import {
  ProjectData,
  FacultyMember,
  StudentRecord,
  SpocKpis,
} from "@/types/spoc";
import { SpocHeader } from "@/components/spoc/SpocHeader";
import { SpocKpisCard } from "@/components/spoc/SpocKpisCard";
import { SpocProjectVerificationTab } from "@/components/spoc/SpocProjectVerificationTab";
import { SpocFacultyDirectoryTab } from "@/components/spoc/SpocFacultyDirectoryTab";
import { SpocStudentsTab } from "@/components/spoc/SpocStudentsTab";
import { SpocExportsTab } from "@/components/spoc/SpocExportsTab";
import { SpocReviewModal } from "@/components/spoc/SpocReviewModal";

export default function SpocPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User and Department state
  const [spocUser, setSpocUser] = useState<any>(null);
  const [department, setDepartment] = useState<string>("");
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [kpis, setKpis] = useState<SpocKpis>({
    totalProjects: 0,
    totalFaculty: 0,
    totalStudents: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    notSubmittedCount: 0,
  });

  // Data lists
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [studentList, setStudentList] = useState<StudentRecord[]>([]);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<
    "VERIFICATION" | "FACULTY" | "STUDENTS" | "EXPORTS"
  >("VERIFICATION");

  // Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProject, setReviewProject] = useState<ProjectData | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");

  const fetchSpocData = async (targetDept?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Verify user auth
      const authRes = await fetch("/api/auth/me");
      if (!authRes.ok) {
        router.push("/spoc/login");
        return;
      }
      const authData = await authRes.json();
      if (!authData.authenticated) {
        router.push("/spoc/login");
        return;
      }

      if (authData.user.role === "STUDENT") {
        router.push("/spoc/login");
        return;
      }

      setSpocUser(authData.user);

      // If user is a faculty member not designated as SPOC, restrict
      if (authData.user.role === "FACULTY" && !authData.user.isSpoc) {
        setError("Access restricted. You are not designated as a Department SPOC.");
        setLoading(false);
        return;
      }

      const deptToFetch =
        targetDept || authData.user.spocDepartment || authData.user.department;
      setDepartment(deptToFetch);

      const res = await fetch(
        `/api/spoc/department?department=${encodeURIComponent(deptToFetch)}`
      );
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Failed to load SPOC department data.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setDepartment(data.department);
      setKpis(data.kpis);
      setProjects(data.projects || []);
      setFacultyList(data.faculty || []);
      setStudentList(data.students || []);

      // If admin, load all departments for department switcher
      if (authData.user.role === "ADMIN") {
        const spocAdminRes = await fetch("/api/admin/spoc");
        if (spocAdminRes.ok) {
          const spocAdminData = await spocAdminRes.json();
          setAllDepartments(spocAdminData.departments || []);
        }
      }
    } catch (err: any) {
      setError("Network error fetching SPOC dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpocData();

    // SSE connection for live updates
    const eventSource = new EventSource("/api/events");
    eventSource.addEventListener("artifact.submitted", () => {
      fetchSpocData(department);
    });
    eventSource.addEventListener("submission.reviewed", () => {
      fetchSpocData(department);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/spoc/login");
  };

  const handleOpenReview = (proj: ProjectData, action: "APPROVE" | "REJECT") => {
    setReviewProject(proj);
    setReviewAction(action);
    setShowReviewModal(true);
  };

  // Export actions
  const handleExportData = (
    type: "STUDENTS" | "FACULTY" | "PROJECTS",
    format: "csv" | "xlsx" | "pdf"
  ) => {
    const safeDept = department.replace(/[^a-zA-Z0-9]/g, "_");

    if (type === "STUDENTS") {
      if (studentList.length === 0) {
        alert("No student data available to export.");
        return;
      }
      const rows = studentList.map((s, idx) => ({
        "Sr. No": idx + 1,
        "Enrollment Number": s.enrollmentNumber,
        "Student Name": s.name,
        Department: s.department,
        Programme: s.programme || "N/A",
        Semester: s.semester,
        Batch: s.batch,
        "Project ID": s.projectId,
        "Project Title": s.projectTitle,
        "Faculty Mentor": s.facultyName,
        "Registration Date": s.registeredAt.split("T")[0],
      }));
      const title = `SPOC_${safeDept}_Students`;
      if (format === "csv") exportToCsv(rows, title);
      else if (format === "xlsx") exportToXlsx(rows, title, "Students");
      else if (format === "pdf")
        exportToPdf(rows, `Department Student Enrolments · ${department}`);
    } else if (type === "FACULTY") {
      if (facultyList.length === 0) {
        alert("No faculty data available to export.");
        return;
      }
      const rows = facultyList.map((f, idx) => ({
        "Sr. No": idx + 1,
        "Faculty Name": f.name,
        Email: f.email,
        Department: department,
        Phone: f.phone || "N/A",
        "Assigned Projects Count": f.projectsCount,
        "Total Mentored Students": f.studentsCount,
        "Project Codes": f.projects.map((p) => p.projectId).join(", "),
      }));
      const title = `SPOC_${safeDept}_Faculty`;
      if (format === "csv") exportToCsv(rows, title);
      else if (format === "xlsx") exportToXlsx(rows, title, "Faculty");
      else if (format === "pdf")
        exportToPdf(rows, `Department Faculty Roster · ${department}`);
    } else if (type === "PROJECTS") {
      if (projects.length === 0) {
        alert("No project data available to export.");
        return;
      }
      const rows = projects.map((p, idx) => {
        const report = p.artifacts.find((a) => a.type === "REPORT");
        return {
          "Sr. No": idx + 1,
          "Project ID": p.projectId,
          Title: p.title,
          Category: p.category,
          Theme: p.theme,
          "Faculty Mentor": p.faculty.name,
          "Enrolled Students": p.studentsCount,
          "Submission Status": p.submissionStatus,
          "SPOC Review Note": p.spocReviewNote || "N/A",
          "Uploaded Artifacts": p.artifacts.length,
          "Report Similarity %": report?.similarityPercent ?? "N/A",
          "Report AI %": report?.aiPercent ?? "N/A",
        };
      });
      const title = `SPOC_${safeDept}_Projects`;
      if (format === "csv") exportToCsv(rows, title);
      else if (format === "xlsx") exportToXlsx(rows, title, "Projects");
      else if (format === "pdf")
        exportToPdf(rows, `Department Projects & Artifact Review · ${department}`);
    }
  };

  if (loading) {
    return (
      <>
        <Header role="SPOC" />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-6 animate-pulse">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-6 w-36 bg-slate-200 rounded-full" />
              <div className="h-7 w-64 bg-slate-300 rounded-lg" />
              <div className="h-3.5 w-96 bg-slate-100 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-slate-200 rounded-xl" />
              <div className="h-9 w-24 bg-slate-100 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2"
              >
                <div className="h-3 w-28 bg-slate-200 rounded" />
                <div className="h-7 w-16 bg-slate-300 rounded-lg" />
                <div className="h-2.5 w-24 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex gap-3 border-b border-slate-200 pb-3">
              <div className="h-8 w-32 bg-slate-200 rounded-lg" />
              <div className="h-8 w-32 bg-slate-100 rounded-lg" />
              <div className="h-8 w-32 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-10 w-full bg-slate-100 rounded-xl mb-4" />
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 w-full bg-slate-50 border border-slate-100 rounded-xl"
                />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error && !projects.length) {
    return (
      <>
        <Header role="SPOC" />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
          <div className="bg-white rounded-2xl p-8 border border-red-200 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Access Denied</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/spoc/login"
                className="inline-block px-5 py-2.5 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#1a3a60]"
              >
                SPOC Login
              </Link>
              <Link
                href="/faculty/portal"
                className="inline-block px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Faculty Portal
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header role="SPOC" />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <SpocHeader
          spocUser={spocUser}
          department={department}
          allDepartments={allDepartments}
          onDepartmentChange={(dept) => fetchSpocData(dept)}
          onLogout={handleLogout}
        />

        <SpocKpisCard kpis={kpis} department={department} />

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab("VERIFICATION")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "VERIFICATION"
                ? "border-[#0d2137] text-[#0d2137]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FolderCheck className="w-4 h-4" />
            <span>Project Verification ({projects.length})</span>
            {kpis.pendingCount > 0 && (
              <span className="px-2 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                {kpis.pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("FACULTY")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "FACULTY"
                ? "border-[#0d2137] text-[#0d2137]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Faculty Directory ({facultyList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("STUDENTS")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "STUDENTS"
                ? "border-[#0d2137] text-[#0d2137]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students Enrolled ({studentList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("EXPORTS")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "EXPORTS"
                ? "border-[#0d2137] text-[#0d2137]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Data Extraction & Reports</span>
          </button>
        </div>

        {activeTab === "VERIFICATION" && (
          <SpocProjectVerificationTab
            projects={projects}
            onOpenReview={handleOpenReview}
          />
        )}

        {activeTab === "FACULTY" && (
          <SpocFacultyDirectoryTab
            facultyList={facultyList}
            department={department}
            onExport={(fmt) => handleExportData("FACULTY", fmt)}
          />
        )}

        {activeTab === "STUDENTS" && (
          <SpocStudentsTab
            studentList={studentList}
            department={department}
            onExport={(fmt) => handleExportData("STUDENTS", fmt)}
          />
        )}

        {activeTab === "EXPORTS" && (
          <SpocExportsTab
            studentCount={studentList.length}
            facultyCount={facultyList.length}
            department={department}
            onExportData={handleExportData}
          />
        )}
      </main>

      {/* SPOC REVIEW MODAL */}
      {showReviewModal && reviewProject && (
        <SpocReviewModal
          project={reviewProject}
          action={reviewAction}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => fetchSpocData(department)}
        />
      )}

      <Footer />
    </>
  );
}
