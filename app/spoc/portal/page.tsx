"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Users,
  FileText,
  FileSpreadsheet,
  Download,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FolderCheck,
  Building2,
  Briefcase,
  ArrowLeft,
  Filter,
  LogOut,
} from "lucide-react";
import { exportToCsv, exportToXlsx, exportToPdf } from "@/lib/export";

interface Artifact {
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
  reviewedBy?: string;
}

interface ProjectData {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  theme: string;
  category: string;
  submissionStatus: string;
  spocReviewNote?: string;
  reviewedAt?: string;
  faculty: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  studentsCount: number;
  artifacts: Artifact[];
  students: Array<{
    id: string;
    enrollment: string;
    name: string;
    department: string;
    programme?: string;
    semester: number;
    batch: string;
  }>;
}

interface FacultyMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isSpoc: boolean;
  projectsCount: number;
  studentsCount: number;
  projects: Array<{
    id: string;
    projectId: string;
    title: string;
    submissionStatus: string;
  }>;
}

interface StudentRecord {
  id: string;
  enrollmentNumber: string;
  name: string;
  department: string;
  programme?: string;
  semester: number;
  batch: string;
  email?: string;
  projectId: string;
  projectTitle: string;
  facultyName: string;
  facultyEmail: string;
  registeredAt: string;
}

interface SpocKpis {
  totalProjects: number;
  totalFaculty: number;
  totalStudents: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  notSubmittedCount: number;
}

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
  const [activeTab, setActiveTab] = useState<"VERIFICATION" | "FACULTY" | "STUDENTS" | "EXPORTS">("VERIFICATION");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProject, setReviewProject] = useState<ProjectData | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

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

      const deptToFetch = targetDept || authData.user.spocDepartment || authData.user.department;
      setDepartment(deptToFetch);

      const res = await fetch(`/api/spoc/department?department=${encodeURIComponent(deptToFetch)}`);
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

  const toggleExpand = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const handleOpenReview = (proj: ProjectData, action: "APPROVE" | "REJECT") => {
    setReviewProject(proj);
    setReviewAction(action);
    setReviewNote(action === "APPROVE" ? "Approved by Department SPOC. Project documents meet all guidelines." : "");
    setReviewError(null);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProject) return;

    if (reviewAction === "REJECT" && (!reviewNote || reviewNote.trim().length === 0)) {
      setReviewError("A review note explaining the rejection reason is required.");
      return;
    }

    setReviewLoading(true);
    setReviewError(null);

    try {
      const res = await fetch("/api/spoc/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: reviewProject.id,
          action: reviewAction,
          note: reviewNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Review submission failed.");
        setReviewLoading(false);
        return;
      }

      setShowReviewModal(false);
      await fetchSpocData(department);
    } catch (err) {
      setReviewError("Network error submitting review.");
    } finally {
      setReviewLoading(false);
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchesStatus =
      statusFilter === "ALL" ? true : p.submissionStatus === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.projectId.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.faculty.name.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

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
        "Department": s.department,
        "Programme": s.programme || "N/A",
        "Semester": s.semester,
        "Batch": s.batch,
        "Project ID": s.projectId,
        "Project Title": s.projectTitle,
        "Faculty Mentor": s.facultyName,
        "Registration Date": s.registeredAt.split("T")[0],
      }));
      const title = `SPOC_${safeDept}_Students`;
      if (format === "csv") exportToCsv(rows, title);
      else if (format === "xlsx") exportToXlsx(rows, title, "Students");
      else if (format === "pdf") exportToPdf(rows, `Department Student Enrolments · ${department}`);
    } else if (type === "FACULTY") {
      if (facultyList.length === 0) {
        alert("No faculty data available to export.");
        return;
      }
      const rows = facultyList.map((f, idx) => ({
        "Sr. No": idx + 1,
        "Faculty Name": f.name,
        "Email": f.email,
        "Department": department,
        "Phone": f.phone || "N/A",
        "Assigned Projects Count": f.projectsCount,
        "Total Mentored Students": f.studentsCount,
        "Project Codes": f.projects.map((p) => p.projectId).join(", "),
      }));
      const title = `SPOC_${safeDept}_Faculty`;
      if (format === "csv") exportToCsv(rows, title);
      else if (format === "xlsx") exportToXlsx(rows, title, "Faculty");
      else if (format === "pdf") exportToPdf(rows, `Department Faculty Roster · ${department}`);
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
          "Title": p.title,
          "Category": p.category,
          "Theme": p.theme,
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
      else if (format === "pdf") exportToPdf(rows, `Department Projects & Artifact Review · ${department}`);
    }
  };

  if (loading) {
    return (
      <>
        <Header role="SPOC" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0d2137]" />
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
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#0d2137] text-white">
                Department SPOC Portal
              </span>
              <span className="text-xs font-medium text-slate-500">
                {spocUser?.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d2137]">
              {department}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Verify faculty document uploads, enforce plagiarism/AI integrity checks, and manage department rosters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Admin Department Switcher */}
            {spocUser?.role === "ADMIN" && allDepartments.length > 0 && (
              <select
                value={department}
                onChange={(e) => fetchSpocData(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white"
              >
                {allDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            {(spocUser?.role === "FACULTY" || spocUser?.role === "ADMIN") && (
              <Link
                href="/faculty/portal"
                className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Faculty Portal</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 hover:border-red-300 text-slate-700 hover:text-red-700 hover:bg-red-50/50 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Projects
              </span>
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-[#0d2137] mt-2">
              {kpis.totalProjects}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across department faculty
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Review
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-2">
              {kpis.pendingCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Requires SPOC action
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Faculty Members
              </span>
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-[#0d2137] mt-2">
              {kpis.totalFaculty}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              In {department.slice(0, 20)}...
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Enrolled Students
              </span>
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-[#0d2137] mt-2">
              {kpis.totalStudents}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Active in department
            </div>
          </div>
        </div>

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

        {/* TAB 1: PROJECT & DOCUMENT VERIFICATION */}
        {activeTab === "VERIFICATION" && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search project ID, title, mentor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Status:
                </span>
                {(["ALL", "PENDING", "APPROVED", "REJECTED", "NOT_SUBMITTED"] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap ${
                        statusFilter === st
                          ? "bg-[#0d2137] text-white border-[#0d2137]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {st === "ALL"
                        ? "All"
                        : st === "PENDING"
                        ? "Pending Review"
                        : st === "APPROVED"
                        ? "Approved"
                        : st === "REJECTED"
                        ? "Rejected"
                        : "Not Submitted"}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Projects List */}
            {filteredProjects.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-slate-500 text-xs border border-slate-200">
                No projects found matching the selected filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((proj) => {
                  const isExpanded = Boolean(expandedProjects[proj.id]);
                  return (
                    <div
                      key={proj.id}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-[#0d2137] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                                {proj.projectId}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                Mentor: <strong className="text-slate-800">{proj.faculty.name}</strong> ({proj.faculty.email})
                              </span>

                              {/* Status badge */}
                              {proj.submissionStatus === "APPROVED" && (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                  Approved
                                </span>
                              )}
                              {proj.submissionStatus === "PENDING" && (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Pending Review
                                </span>
                              )}
                              {proj.submissionStatus === "REJECTED" && (
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                                  <XCircle className="w-3 h-3 text-red-600" />
                                  Changes Requested / Rejected
                                </span>
                              )}
                              {proj.submissionStatus === "NOT_SUBMITTED" && (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                  Not Submitted
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-bold text-[#0d2137]">
                              {proj.title}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {proj.category} · {proj.theme} · Enrolled Students:{" "}
                              <strong className="text-slate-700">{proj.studentsCount}</strong>
                            </p>
                          </div>

                          {/* SPOC Action Controls */}
                          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                            {proj.artifacts.length > 0 && (
                              <>
                                <button
                                  onClick={() => handleOpenReview(proj, "APPROVE")}
                                  className="px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleOpenReview(proj, "REJECT")}
                                  className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 transition-all"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                                  <span>Reject with Note</span>
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => toggleExpand(proj.id)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1"
                            >
                              <span>{isExpanded ? "Hide Details" : "View Artifacts & Students"}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* SPOC Note banner if exists */}
                        {proj.spocReviewNote && (
                          <div
                            className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 ${
                              proj.submissionStatus === "APPROVED"
                                ? "bg-green-50 border border-green-200 text-green-900"
                                : "bg-red-50 border border-red-200 text-red-900"
                            }`}
                          >
                            {proj.submissionStatus === "APPROVED" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <span className="font-bold">SPOC Note:</span>{" "}
                              <span>{proj.spocReviewNote}</span>
                              {proj.reviewedAt && (
                                <span className="block text-[11px] text-slate-400 mt-0.5">
                                  Reviewed: {proj.reviewedAt.split("T")[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expandable Drawer: Artifacts + Students */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/60 p-5 sm:p-6 space-y-5">
                          {/* Uploaded Documents */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>Uploaded Artifacts ({proj.artifacts.length})</span>
                            </h4>

                            {proj.artifacts.length === 0 ? (
                              <p className="text-xs text-slate-400">
                                No artifacts uploaded by mentor yet.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {proj.artifacts.map((art) => (
                                  <div
                                    key={art.id}
                                    className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
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
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                                          <span>File: {art.fileName}</span>
                                          <span>·</span>
                                          <span>Submitted: {art.submittedAt.split("T")[0]}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Plagiarism & AI Integrity Badges */}
                                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                                      {art.type === "REPORT" && (
                                        <>
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Similarity: {art.similarityPercent ?? 0}% (&lt;10% ✓)
                                          </span>
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            AI: {art.aiPercent ?? 0}% (&lt;20% ✓)
                                          </span>
                                        </>
                                      )}

                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                                        <span>Download</span>
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Enrolled Students Table */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>Enrolled Students ({proj.students.length})</span>
                            </h4>

                            {proj.students.length === 0 ? (
                              <p className="text-xs text-slate-400">No students enrolled.</p>
                            ) : (
                              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/50">
                                      <th className="py-2.5 px-3">Enrollment No.</th>
                                      <th className="py-2.5 px-3">Name</th>
                                      <th className="py-2.5 px-3">Department</th>
                                      <th className="py-2.5 px-3">Programme</th>
                                      <th className="py-2.5 px-3">Semester</th>
                                      <th className="py-2.5 px-3">Batch</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {proj.students.map((s) => (
                                      <tr key={s.id} className="hover:bg-slate-50/50">
                                        <td className="py-2 px-3 font-mono font-bold text-[#0d2137]">
                                          {s.enrollment}
                                        </td>
                                        <td className="py-2 px-3 font-semibold text-slate-800">
                                          {s.name}
                                        </td>
                                        <td className="py-2 px-3 text-slate-600">{s.department}</td>
                                        <td className="py-2 px-3 text-slate-600">{s.programme || "—"}</td>
                                        <td className="py-2 px-3 text-slate-600">Sem {s.semester}</td>
                                        <td className="py-2 px-3 text-slate-600">{s.batch}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FACULTY DIRECTORY */}
        {activeTab === "FACULTY" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0d2137]">
                  Department Faculty Directory ({facultyList.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Faculty members belonging to {department}.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-semibold mr-1">Export:</span>
                <button
                  onClick={() => handleExportData("FACULTY", "csv")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => handleExportData("FACULTY", "xlsx")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleExportData("FACULTY", "pdf")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5 text-red-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-3 pr-4">Faculty Name</th>
                    <th className="pb-3 px-4">Email</th>
                    <th className="pb-3 px-4">Role / SPOC</th>
                    <th className="pb-3 px-4 text-center">Assigned Projects</th>
                    <th className="pb-3 px-4 text-center">Mentored Students</th>
                    <th className="pb-3 pl-4">Project Codes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facultyList.map((fac) => (
                    <tr key={fac.id} className="hover:bg-slate-50/60">
                      <td className="py-3 pr-4 font-bold text-[#0d2137]">{fac.name}</td>
                      <td className="py-3 px-4 text-slate-600">{fac.email}</td>
                      <td className="py-3 px-4">
                        {fac.isSpoc ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            SPOC
                          </span>
                        ) : (
                          <span className="text-slate-400">Faculty</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {fac.projectsCount}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {fac.studentsCount}
                      </td>
                      <td className="py-3 pl-4 text-slate-500 font-mono text-[11px]">
                        {fac.projects.map((p) => p.projectId).join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ENROLLED STUDENTS */}
        {activeTab === "STUDENTS" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0d2137]">
                  Students Enrolled in {department} Projects ({studentList.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Complete list of all students under department faculty mentors.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-semibold mr-1">Export:</span>
                <button
                  onClick={() => handleExportData("STUDENTS", "csv")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => handleExportData("STUDENTS", "xlsx")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleExportData("STUDENTS", "pdf")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5 text-red-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-3 pr-3">Enrollment No.</th>
                    <th className="pb-3 px-3">Student Name</th>
                    <th className="pb-3 px-3">Department</th>
                    <th className="pb-3 px-3">Programme</th>
                    <th className="pb-3 px-3">Project ID</th>
                    <th className="pb-3 px-3">Project Title</th>
                    <th className="pb-3 pl-3">Faculty Mentor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentList.map((std) => (
                    <tr key={std.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 pr-3 font-mono font-bold text-[#0d2137]">
                        {std.enrollmentNumber}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {std.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{std.department}</td>
                      <td className="py-2.5 px-3 text-slate-600">{std.programme || "—"}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        {std.projectId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 line-clamp-1 max-w-xs">
                        {std.projectTitle}
                      </td>
                      <td className="py-2.5 pl-3 text-slate-700 font-medium">
                        {std.facultyName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DATA EXTRACTION & REPORTS */}
        {activeTab === "EXPORTS" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Data Extraction Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-10 h-1 bg-blue-600 rounded-full" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0d2137]">
                  Enrolled Students Dataset
                </h3>
                <p className="text-xs text-slate-500">
                  Extract complete roster of all {studentList.length} enrolled students under this department's projects.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleExportData("STUDENTS", "csv")}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Download CSV (.csv)
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportData("STUDENTS", "xlsx")}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Download Excel (.xlsx)
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportData("STUDENTS", "pdf")}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-red-600" />
                    Print / Save PDF Report
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Faculty Data Extraction Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-10 h-1 bg-purple-600 rounded-full" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0d2137]">
                  Faculty Roster Dataset
                </h3>
                <p className="text-xs text-slate-500">
                  Extract complete roster of all {facultyList.length} faculty mentors and their workload in {department}.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleExportData("FACULTY", "csv")}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Download CSV (.csv)
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportData("FACULTY", "xlsx")}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Download Excel (.xlsx)
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportData("FACULTY", "pdf")}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-red-600" />
                    Print / Save PDF Report
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Projects & Verification Audit Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0d2137]">
                  Project Audit & Verification Report
                </h3>
                <p className="text-xs text-slate-500">
                  Export complete verification status, plagiarism similarity percentages, and SPOC review feedback.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleExportData("PROJECTS", "csv")}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Download CSV (.csv)
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportData("PROJECTS", "xlsx")}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Download Excel (.xlsx)
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportData("PROJECTS", "pdf")}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50/40 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-red-600" />
                    Print / Save PDF Report
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SPOC REVIEW MODAL */}
      {showReviewModal && reviewProject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0d2137]">
                  {reviewAction === "APPROVE" ? "Approve Project Submission" : "Reject Project Submission"}
                </h3>
                <p className="text-xs text-slate-500">
                  {reviewProject.projectId} · Mentor: {reviewProject.faculty.name}
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {reviewError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {reviewAction === "APPROVE" ? "Review Note / Feedback (Optional)" : "Rejection Reason & Feedback Note (Mandatory)"}
                </label>
                <textarea
                  rows={4}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={
                    reviewAction === "APPROVE"
                      ? "Enter approval remarks..."
                      : "Enter specific reasons for rejection and requested corrections..."
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  required={reviewAction === "REJECT"}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-sm flex items-center gap-1.5 ${
                    reviewAction === "APPROVE"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {reviewLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Review...</span>
                    </>
                  ) : reviewAction === "APPROVE" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Approval</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Submit Rejection Note</span>
                    </>
                  )}
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
