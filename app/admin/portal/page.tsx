"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Settings,
  Users,
  FileSpreadsheet,
  LayoutDashboard,
  FolderKanban,
  ShieldCheck,
  Database,
  AlertTriangle,
  KeyRound,
  Loader2,
  X,
} from "lucide-react";

// Modular Components
import { AdminBanner } from "@/components/admin/AdminBanner";
import { KpiStats } from "@/components/admin/KpiStats";
import { GlobalConfigCard } from "@/components/admin/GlobalConfigCard";
import { DepartmentLimitsCard } from "@/components/admin/DepartmentLimitsCard";
import { BulkRegistrationCard } from "@/components/admin/BulkRegistrationCard";
import { StudentsTableCard } from "@/components/admin/StudentsTableCard";
import { StudentModals } from "@/components/admin/StudentModals";
import { ProjectsTableCard } from "@/components/admin/ProjectsTableCard";
import { RegistrationsTableCard } from "@/components/admin/RegistrationsTableCard";
import { SpocManagementCard } from "@/components/admin/SpocManagementCard";
import { FacultyAccessCard } from "@/components/admin/FacultyAccessCard";
import { FacultyModals } from "@/components/admin/FacultyModals";
import { YearRolloverModal } from "@/components/admin/YearRolloverModal";
import { DataManagementModal, DatabaseDashboardCard } from "@/components/admin/DataManagementModal";
import { TemplatesModal } from "@/components/admin/TemplatesModal";
import { BulkImportModal } from "@/components/admin/BulkImportModal";
import { SmsBroadcastCard } from "@/components/admin/SmsBroadcastCard";
import { downloadIdpCohortsXlsx } from "@/lib/export";

// Types
import {
  KpiData,
  GlobalConfigData,
  DeptLimit,
  BulkProgressState,
  StudentFormData,
  FacultyFormData,
} from "@/types/admin";

export default function AdminPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("System Admin");

  // KPI Data
  const [kpi, setKpi] = useState<KpiData>({
    totalStudents: 0,
    totalProjects: 0,
    totalRegistrations: 0,
    totalCapacity: 0,
    seatsFilledRatio: "0/0",
  });

  // Global Config Form
  const [config, setConfig] = useState<GlobalConfigData>({
    registrationOpen: true,
    maxSeats: 10,
    sameDeptLimit: 4,
    otherDeptLimit: 6,
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState<string | null>(null);

  // Department Limits Form & List
  const [deptLimits, setDeptLimits] = useState<DeptLimit[]>([]);
  const [deptInput, setDeptInput] = useState("");
  const [sameDeptInput, setSameDeptInput] = useState("5");
  const [otherDeptInput, setOtherDeptInput] = useState("2");
  const [deptSaving, setDeptSaving] = useState(false);

  // Active Dashboard Tab (Segregated into 5 Core Operations)
  const [activeDashboardTab, setActiveDashboardTab] = useState<
    "DASHBOARD" | "REGISTRATION" | "PROJECTS" | "FACULTY" | "DATABASE"
  >("DASHBOARD");

  // Bulk Registration State
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkProgressState | null>(null);

  // Students Table State
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentFilter, setStudentFilter] = useState("all");
  const [studentSchool, setStudentSchool] = useState("all");
  const [studentBranch, setStudentBranch] = useState("all");
  const [studentGender, setStudentGender] = useState("all");
  const [studentSortBy, setStudentSortBy] = useState("enrollmentNumber");
  const [studentSortOrder, setStudentSortOrder] = useState<"asc" | "desc">("asc");
  const [unregisteredStats, setUnregisteredStats] = useState<any | null>(null);
  const [studentFilterOptions, setStudentFilterOptions] = useState<any | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Projects / Submissions Table State
  const [projects, setProjects] = useState<any[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectPage, setProjectPage] = useState(1);
  const [projectTotalPages, setProjectTotalPages] = useState(1);
  const [projectTotal, setProjectTotal] = useState(0);
  const [projectCategoryFilter, setProjectCategoryFilter] = useState("all");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [projectSchoolFilter, setProjectSchoolFilter] = useState("all");
  const [completionStats, setCompletionStats] = useState<any | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Registrations Table State
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [registrationSearch, setRegistrationSearch] = useState("");
  const [registrationPage, setRegistrationPage] = useState(1);
  const [registrationTotalPages, setRegistrationTotalPages] = useState(1);
  const [registrationTotal, setRegistrationTotal] = useState(0);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  // Faculty Access Management State
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loadingFacultyAccess, setLoadingFacultyAccess] = useState(false);
  const [selectedResetFaculty, setSelectedResetFaculty] = useState<any | null>(null);
  const [newPasscodeInput, setNewPasscodeInput] = useState("gdgu@2026");
  const [resetPasscodeLoading, setResetPasscodeLoading] = useState(false);
  const [resetPasscodeMessage, setResetPasscodeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // SPOC Management State
  const [spocDepartments, setSpocDepartments] = useState<string[]>([]);
  const [spocsByDept, setSpocsByDept] = useState<Record<string, any[]>>({});
  const [selectedFacultyForDept, setSelectedFacultyForDept] = useState<Record<string, string>>({});
  const [spocUpdating, setSpocUpdating] = useState<string | null>(null);
  const [selectedResetSpoc, setSelectedResetSpoc] = useState<{ dept: string; spoc: any } | null>(null);
  const [spocNewPasscodeInput, setSpocNewPasscodeInput] = useState("spoc@gdgu2026");
  const [spocResetPasscodeLoading, setSpocResetPasscodeLoading] = useState(false);
  const [spocResetPasscodeMessage, setSpocResetPasscodeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Academic Year & Semester
  const [activeAcademicYear, setActiveAcademicYear] = useState("2025-2026");
  const [activeSemester, setActiveSemester] = useState(3);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);

  // Template Download & Ingest Modal
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Student CRUD Modals
  const [studentAcademicYear, setStudentAcademicYear] = useState("all");
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState<StudentFormData>({
    id: "",
    enrollmentNumber: "",
    name: "",
    department: "School of Engineering & Sciences",
    programme: "",
    phone: "",
    phoneVerified: false,
    gender: "Male",
    internalMarks: 32,
    externalMarks: 48,
    attendancePercent: 85,
    semester: 3,
    batch: "2025",
    admissionNumber: "",
    academicYear: "2025-2026",
  });
  const [studentCrudLoading, setStudentCrudLoading] = useState(false);
  const [studentCrudError, setStudentCrudError] = useState<string | null>(null);

  // Faculty CRUD Modals
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showEditFacultyModal, setShowEditFacultyModal] = useState(false);
  const [showDeleteFacultyModal, setShowDeleteFacultyModal] = useState(false);
  const [facultyForm, setFacultyForm] = useState<FacultyFormData>({
    id: "",
    name: "",
    email: "",
    department: "School of Engineering & Sciences",
    phone: "",
    passcode: "gdgu@2026",
    isAdmin: false,
    isSpoc: false,
    spocDepartment: "",
  });
  const [facultyCrudLoading, setFacultyCrudLoading] = useState(false);
  const [facultyCrudError, setFacultyCrudError] = useState<string | null>(null);

  // --- API Handlers ---

  const fetchSpocData = async () => {
    try {
      const res = await fetch("/api/admin/spoc");
      if (res.ok) {
        const data = await res.json();
        setSpocDepartments(data.departments || []);
        setSpocsByDept(data.spocByDepartment || {});
      }
    } catch {}
  };

  const handleAssignSpoc = async (dept: string, facultyId: string) => {
    if (!facultyId) return;
    setSpocUpdating(dept);
    try {
      await fetch("/api/admin/spoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyId, department: dept, isSpoc: true }),
      });
      await Promise.all([fetchSpocData(), fetchFacultyAccess()]);
    } catch {
    } finally {
      setSpocUpdating(null);
    }
  };

  const handleRevokeSpoc = async (dept: string, facultyId: string) => {
    setSpocUpdating(dept);
    try {
      await fetch("/api/admin/spoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyId, department: dept, isSpoc: false }),
      });
      await Promise.all([fetchSpocData(), fetchFacultyAccess()]);
    } catch {
    } finally {
      setSpocUpdating(null);
    }
  };

  const handleDownloadCohorts = async () => {
    try {
      await downloadIdpCohortsXlsx("registered", studentSchool !== "all" ? studentSchool : undefined);
    } catch (err: any) {
      alert("Error downloading cohort details: " + err.message);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setKpi(data.kpi);
    } catch {}
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/configuration");
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        const yr = data.config.activeAcademicYear || "2025-2026";
        const sem = data.config.activeSemester || 3;
        setActiveAcademicYear(yr);
        setActiveSemester(sem);
        setStudentForm((sf) => ({ ...sf, academicYear: yr }));
      }
    } catch {}
  };

  const fetchDeptLimits = async () => {
    try {
      const res = await fetch("/api/admin/department-limits");
      const data = await res.json();
      setDeptLimits(data.limits || []);
    } catch {}
  };

  const fetchStudents = async (
    page = 1,
    search = studentSearch,
    filter = studentFilter,
    year = studentAcademicYear,
    school = studentSchool,
    branch = studentBranch,
    gender = studentGender,
    sortBy = studentSortBy,
    sortOrder = studentSortOrder
  ) => {
    setLoadingStudents(true);
    try {
      const res = await fetch(
        `/api/admin/students?page=${page}&limit=25&search=${encodeURIComponent(
          search
        )}&registered=${filter}&academicYear=${encodeURIComponent(
          year
        )}&school=${encodeURIComponent(school)}&branch=${encodeURIComponent(
          branch
        )}&gender=${encodeURIComponent(gender)}&sortBy=${encodeURIComponent(
          sortBy
        )}&sortOrder=${encodeURIComponent(sortOrder)}`
      );
      const data = await res.json();
      setStudents(data.students || []);
      setStudentPage(data.pagination?.page || 1);
      setStudentTotalPages(data.pagination?.totalPages || 1);
      setStudentTotal(data.pagination?.total || 0);
      if (data.unregisteredStats) {
        setUnregisteredStats(data.unregisteredStats);
      }
      if (data.filterOptions) {
        setStudentFilterOptions(data.filterOptions);
      }
    } catch {
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleToggleSemester = async () => {
    const nextSem = activeSemester === 3 ? 4 : 3;
    try {
      const res = await fetch("/api/admin/configuration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationOpen: config.registrationOpen,
          maxSeats: config.maxSeats,
          sameDeptLimit: config.sameDeptLimit,
          otherDeptLimit: config.otherDeptLimit,
          activeSemester: nextSem,
        }),
      });
      if (res.ok) {
        setActiveSemester(nextSem);
        setConfigMessage(
          `Switched active semester milestone to Semester ${
            nextSem === 3 ? "1 (Sem 3 - PPT)" : "2 (Sem 4 - Report)"
          }.`
        );
        setTimeout(() => setConfigMessage(null), 3500);
      }
    } catch {}
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentCrudLoading(true);
    setStudentCrudError(null);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setStudentCrudError(data.error || "Failed to create student.");
        setStudentCrudLoading(false);
        return;
      }
      setShowAddStudentModal(false);
      setStudentForm({
        id: "",
        enrollmentNumber: "",
        name: "",
        department: "School of Engineering & Sciences",
        programme: "",
        semester: 3,
        batch: "2025",
        admissionNumber: "",
        academicYear: activeAcademicYear,
      });
      await fetchStudents(studentPage, studentSearch, studentFilter);
    } catch (err: any) {
      setStudentCrudError(err.message || "Network error.");
    } finally {
      setStudentCrudLoading(false);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentCrudLoading(true);
    setStudentCrudError(null);
    try {
      const res = await fetch("/api/admin/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setStudentCrudError(data.error || "Failed to update student.");
        setStudentCrudLoading(false);
        return;
      }
      setShowEditStudentModal(false);
      await fetchStudents(studentPage, studentSearch, studentFilter);
    } catch (err: any) {
      setStudentCrudError(err.message || "Network error.");
    } finally {
      setStudentCrudLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentForm.id) return;
    setStudentCrudLoading(true);
    setStudentCrudError(null);
    try {
      const res = await fetch(`/api/admin/students?id=${encodeURIComponent(studentForm.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setStudentCrudError(data.error || "Failed to delete student.");
        setStudentCrudLoading(false);
        return;
      }
      setShowDeleteStudentModal(false);
      await fetchStudents(studentPage, studentSearch, studentFilter);
    } catch (err: any) {
      setStudentCrudError(err.message || "Network error.");
    } finally {
      setStudentCrudLoading(false);
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacultyCrudLoading(true);
    setFacultyCrudError(null);
    try {
      const res = await fetch("/api/admin/faculty-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE", ...facultyForm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFacultyCrudError(data.error || "Failed to create faculty.");
        setFacultyCrudLoading(false);
        return;
      }
      setShowAddFacultyModal(false);
      setFacultyForm({
        id: "",
        name: "",
        email: "",
        department: "School of Engineering & Sciences",
        phone: "",
        passcode: "gdgu@2026",
        isAdmin: false,
        isSpoc: false,
        spocDepartment: "",
      });
      await fetchFacultyAccess();
    } catch (err: any) {
      setFacultyCrudError(err.message || "Network error.");
    } finally {
      setFacultyCrudLoading(false);
    }
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacultyCrudLoading(true);
    setFacultyCrudError(null);
    try {
      const res = await fetch("/api/admin/faculty-access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facultyForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setFacultyCrudError(data.error || "Failed to update faculty.");
        setFacultyCrudLoading(false);
        return;
      }
      setShowEditFacultyModal(false);
      await fetchFacultyAccess();
    } catch (err: any) {
      setFacultyCrudError(err.message || "Network error.");
    } finally {
      setFacultyCrudLoading(false);
    }
  };

  const handleDeleteFaculty = async () => {
    if (!facultyForm.id) return;
    setFacultyCrudLoading(true);
    setFacultyCrudError(null);
    try {
      const res = await fetch(`/api/admin/faculty-access?id=${encodeURIComponent(facultyForm.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setFacultyCrudError(data.error || "Failed to delete faculty.");
        setFacultyCrudLoading(false);
        return;
      }
      setShowDeleteFacultyModal(false);
      await fetchFacultyAccess();
    } catch (err: any) {
      setFacultyCrudError(err.message || "Network error.");
    } finally {
      setFacultyCrudLoading(false);
    }
  };

  const fetchProjects = async (
    page = 1,
    search = projectSearch,
    cat = projectCategoryFilter,
    status = projectStatusFilter,
    school = projectSchoolFilter
  ) => {
    setLoadingProjects(true);
    try {
      const res = await fetch(
        `/api/admin/projects?page=${page}&limit=10&search=${encodeURIComponent(
          search
        )}&category=${cat}&status=${status}&school=${encodeURIComponent(school)}`
      );
      const data = await res.json();
      setProjects(data.projects || []);
      setProjectPage(data.pagination?.page || 1);
      setProjectTotalPages(data.pagination?.totalPages || 1);
      setProjectTotal(data.pagination?.total || 0);
      if (data.completionStats) {
        setCompletionStats(data.completionStats);
      }
    } catch {
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchRegistrations = async (page = 1, search = "") => {
    setLoadingRegistrations(true);
    try {
      const res = await fetch(
        `/api/admin/registrations?page=${page}&limit=10&search=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setRegistrations(data.registrations || []);
      setRegistrationPage(data.pagination.page);
      setRegistrationTotalPages(data.pagination.totalPages);
      setRegistrationTotal(data.pagination.total);
    } catch {
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const fetchFacultyAccess = async () => {
    setLoadingFacultyAccess(true);
    try {
      const res = await fetch("/api/admin/faculty-access");
      const data = await res.json();
      setFaculties(data.faculties || []);
    } catch {
    } finally {
      setLoadingFacultyAccess(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (!data.authenticated || data.user.role !== "ADMIN") {
        router.push("/admin/login");
        return;
      }
      setAdminName(data.user.name || "System Admin");

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get("tab")?.toUpperCase();
        if (tabParam === "DATABASE" || tabParam === "DB") {
          setActiveDashboardTab("DATABASE");
        } else if (tabParam === "REGISTRATION" || tabParam === "STUDENTS") {
          setActiveDashboardTab("REGISTRATION");
        } else if (tabParam === "PROJECTS") {
          setActiveDashboardTab("PROJECTS");
        } else if (tabParam === "FACULTY") {
          setActiveDashboardTab("FACULTY");
        }
      } catch {}

      await Promise.all([
        fetchDashboardData(),
        fetchConfig(),
        fetchDeptLimits(),
        fetchStudents(1),
        fetchProjects(1),
        fetchRegistrations(1),
        fetchFacultyAccess(),
        fetchSpocData(),
      ]);

      setLoading(false);
    };

    init();

    const eventSource = new EventSource("/api/events");
    eventSource.addEventListener("registration.created", () => {
      fetchDashboardData();
      fetchRegistrations(1, registrationSearch);
      fetchProjects(projectPage, projectSearch, projectCategoryFilter);
      fetchStudents(studentPage, studentSearch, studentFilter);
    });

    eventSource.addEventListener("spoc.updated", () => {
      fetchSpocData();
      fetchFacultyAccess();
    });

    eventSource.addEventListener("bulk_registration.progress", (event) => {
      try {
        const p = JSON.parse(event.data);
        setBulkResult(p);
      } catch {}
    });

    eventSource.addEventListener("bulk_registration.completed", (event) => {
      try {
        const p = JSON.parse(event.data);
        setBulkResult(p);
        setBulkRunning(false);
        fetchDashboardData();
        fetchRegistrations(1);
        fetchProjects(1);
        fetchStudents(1);
      } catch {}
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigMessage(null);
    try {
      const res = await fetch("/api/admin/configuration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setConfigMessage("Configuration saved successfully.");
        setTimeout(() => setConfigMessage(null), 3000);
      }
    } catch {
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSaveDeptLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptInput) return;
    setDeptSaving(true);
    try {
      const res = await fetch("/api/admin/department-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: deptInput,
          sameDeptLimit: sameDeptInput,
          otherDeptLimit: otherDeptInput,
        }),
      });
      if (res.ok) {
        setDeptInput("");
        await fetchDeptLimits();
      }
    } catch {
    } finally {
      setDeptSaving(false);
    }
  };

  const handleDeleteDeptLimit = async (id: string) => {
    if (!confirm("Are you sure you want to remove this department limit override?")) return;
    try {
      await fetch(`/api/admin/department-limits?id=${id}`, { method: "DELETE" });
      await fetchDeptLimits();
    } catch {}
  };

  const handleRunBulkRegistration = async () => {
    if (
      !confirm(
        "Are you sure you want to run bulk registration for all unregistered students? This will respect seat caps and department quotas."
      )
    ) {
      return;
    }

    setBulkRunning(true);
    try {
      const res = await fetch("/api/admin/bulk-registration", { method: "POST" });
      const data = await res.json();
      if (data.result) {
        setBulkResult(data.result);
      }
    } catch {
    } finally {
      setBulkRunning(false);
      fetchDashboardData();
      fetchRegistrations(1);
      fetchProjects(1);
      fetchStudents(1);
    }
  };

  const handleToggleFacultyAdmin = async (facultyId: string, currentStatus: boolean) => {
    try {
      await fetch("/api/admin/faculty-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyId, isAdmin: !currentStatus }),
      });
      await fetchFacultyAccess();
    } catch {}
  };

  const handleResetFacultyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResetFaculty || !newPasscodeInput) return;
    setResetPasscodeLoading(true);
    setResetPasscodeMessage(null);
    try {
      const res = await fetch("/api/admin/faculty-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: selectedResetFaculty.id,
          newPasscode: newPasscodeInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetPasscodeMessage({ type: "error", text: data.error || "Failed to reset passcode." });
      } else {
        setResetPasscodeMessage({ type: "success", text: "Passcode updated successfully!" });
        setTimeout(() => {
          setSelectedResetFaculty(null);
          setNewPasscodeInput("gdgu@2026");
          setResetPasscodeMessage(null);
        }, 1200);
      }
    } catch {
      setResetPasscodeMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setResetPasscodeLoading(false);
    }
  };

  const handleResetSpocPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResetSpoc || !spocNewPasscodeInput) return;
    setSpocResetPasscodeLoading(true);
    setSpocResetPasscodeMessage(null);
    try {
      const res = await fetch("/api/admin/spoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_PASSCODE",
          department: selectedResetSpoc.dept,
          facultyId: selectedResetSpoc.spoc.facultyId,
          spocPasscode: spocNewPasscodeInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSpocResetPasscodeMessage({ type: "error", text: data.error || "Failed to reset SPOC passcode." });
      } else {
        setSpocResetPasscodeMessage({
          type: "success",
          text: `SPOC passcode for ${selectedResetSpoc.dept} updated successfully!`,
        });
        setTimeout(() => {
          setSelectedResetSpoc(null);
          setSpocNewPasscodeInput("spoc@gdgu2026");
          setSpocResetPasscodeMessage(null);
        }, 1300);
      }
    } catch {
      setSpocResetPasscodeMessage({ type: "error", text: "Network error while updating SPOC passcode." });
    } finally {
      setSpocResetPasscodeLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header role="Admin" />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6 animate-pulse">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-slate-200 rounded-lg" />
              <div className="h-3.5 w-32 bg-slate-100 rounded-md" />
            </div>
            <div className="h-9 w-24 bg-slate-200 rounded-xl" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-8 w-20 bg-slate-300 rounded-lg" />
                <div className="h-2.5 w-32 bg-slate-100 rounded" />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-10 h-1 bg-[#cda34f]/50 rounded-full mb-3" />
            <div className="h-6 w-56 bg-slate-200 rounded-lg" />
            <div className="h-4 w-72 bg-slate-100 rounded mb-4" />
            <div className="h-10 w-full bg-slate-100 rounded-xl mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 w-full bg-slate-50 border border-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header role="Admin" />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0a192f]/5 text-[#0a192f]">
                Central Console
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#09131f]">
              Administrator Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{adminName}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="tactile-btn text-xs font-semibold px-4 py-2.5 rounded-2xl border border-slate-300/90 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all shadow-subtle"
          >
            Log out
          </button>
        </div>

        {/* Four-Part Segregated Navigation Switcher — Apple HIG Segmented Control */}
        <div className="bg-slate-200/60 p-1.5 rounded-3xl border border-slate-300/60 shadow-inner flex items-center gap-1.5 overflow-x-auto">
          {/* Part 1: Dashboard */}
          <button
            type="button"
            onClick={() => setActiveDashboardTab("DASHBOARD")}
            className={`flex-1 min-w-[170px] py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all tactile-btn ${
              activeDashboardTab === "DASHBOARD"
                ? "bg-[#0a192f] text-white shadow-elevated"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#c59b27]" />
            <span>Dashboard</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums bg-white/15 text-slate-100 font-bold ml-1">
              {kpi.totalRegistrations}
            </span>
          </button>

          {/* Part 2: Registrations & Students */}
          <button
            type="button"
            onClick={() => setActiveDashboardTab("REGISTRATION")}
            className={`flex-1 min-w-[210px] py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all tactile-btn ${
              activeDashboardTab === "REGISTRATION"
                ? "bg-[#0a192f] text-white shadow-elevated"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <Users className="w-4 h-4 text-[#c59b27]" />
            <span>Rosters & Students</span>
            {unregisteredStats && unregisteredStats.totalUnregistered > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums bg-amber-500 text-white font-bold ml-1">
                {unregisteredStats.totalUnregistered}
              </span>
            )}
          </button>

          {/* Part 3: Projects & Submissions */}
          <button
            type="button"
            onClick={() => setActiveDashboardTab("PROJECTS")}
            className={`flex-1 min-w-[190px] py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all tactile-btn ${
              activeDashboardTab === "PROJECTS"
                ? "bg-[#0a192f] text-white shadow-elevated"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <FolderKanban className="w-4 h-4 text-[#c59b27]" />
            <span>Projects & Submissions</span>
            {completionStats && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums bg-emerald-600 text-white font-bold ml-1">
                {completionStats.completionPercentage}% Done
              </span>
            )}
          </button>

          {/* Part 4: Faculty & SPOC Management */}
          <button
            type="button"
            onClick={() => setActiveDashboardTab("FACULTY")}
            className={`flex-1 min-w-[170px] py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all tactile-btn ${
              activeDashboardTab === "FACULTY"
                ? "bg-[#0a192f] text-white shadow-elevated"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#c59b27]" />
            <span>Faculty & SPOCs</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums bg-white/20 text-slate-700 font-bold ml-1">
              {faculties.length}
            </span>
          </button>

          {/* Part 5: Central Database Console */}
          <button
            type="button"
            onClick={() => setActiveDashboardTab("DATABASE")}
            className={`flex-1 min-w-[170px] py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all tactile-btn ${
              activeDashboardTab === "DATABASE"
                ? "bg-[#0a192f] text-white shadow-elevated"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <Database className="w-4 h-4 text-[#c59b27]" />
            <span>Database</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums bg-[#c59b27]/20 text-[#c59b27] font-bold ml-1 border border-[#c59b27]/30">
              Master
            </span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* PART 1: DASHBOARD (Overview, KPIs, Rollover, Config)    */}
        {/* ======================================================== */}
        {activeDashboardTab === "DASHBOARD" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Stats Overview */}
            <KpiStats kpi={kpi} />

            {/* Academic Year Banner & Cohort Controls */}
            <AdminBanner
              activeAcademicYear={activeAcademicYear}
              activeSemester={activeSemester}
              onToggleSemester={handleToggleSemester}
              onOpenTemplates={() => setShowTemplatesModal(true)}
              onOpenImport={() => setShowImportModal(true)}
              onOpenRollover={() => setShowYearModal(true)}
              onDownloadCohorts={handleDownloadCohorts}
              onOpenDataManagement={() => setShowDataModal(true)}
            />

            {/* Global Configuration */}
            <GlobalConfigCard
              config={config}
              setConfig={setConfig}
              configSaving={configSaving}
              configMessage={configMessage}
              onSave={handleSaveConfig}
            />

            {/* Department-wise Registration Limits */}
            <DepartmentLimitsCard
              deptLimits={deptLimits}
              deptInput={deptInput}
              setDeptInput={setDeptInput}
              sameDeptInput={sameDeptInput}
              setSameDeptInput={setSameDeptInput}
              otherDeptInput={otherDeptInput}
              setOtherDeptInput={setOtherDeptInput}
              deptSaving={deptSaving}
              onSave={handleSaveDeptLimit}
              onDelete={handleDeleteDeptLimit}
            />

            {/* Bulk Registration Engine */}
            <BulkRegistrationCard
              bulkRunning={bulkRunning}
              bulkResult={bulkResult}
              onRunBulkRegistration={handleRunBulkRegistration}
            />

            {/* Targeted SMS Broadcast Center (Admin Only) */}
            <SmsBroadcastCard schools={spocDepartments} />
          </div>
        )}

        {/* ======================================================== */}
        {/* PART 2: REGISTRATION & STUDENTS (Roster, Sort, Assessments) */}
        {/* ======================================================== */}
        {activeDashboardTab === "REGISTRATION" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Students Table with School, Branch, Gender, Attendance, Assessment Sorting */}
            <StudentsTableCard
              students={students}
              studentTotal={studentTotal}
              studentSearch={studentSearch}
              setStudentSearch={setStudentSearch}
              studentFilter={studentFilter}
              setStudentFilter={setStudentFilter}
              studentAcademicYear={studentAcademicYear}
              setStudentAcademicYear={setStudentAcademicYear}
              activeAcademicYear={activeAcademicYear}
              studentSchool={studentSchool}
              setStudentSchool={setStudentSchool}
              studentBranch={studentBranch}
              setStudentBranch={setStudentBranch}
              studentGender={studentGender}
              setStudentGender={setStudentGender}
              studentSortBy={studentSortBy}
              setStudentSortBy={setStudentSortBy}
              studentSortOrder={studentSortOrder}
              setStudentSortOrder={setStudentSortOrder}
              unregisteredStats={unregisteredStats}
              filterOptions={studentFilterOptions}
              studentPage={studentPage}
              studentTotalPages={studentTotalPages}
              loadingStudents={loadingStudents}
              onFetchStudents={fetchStudents}
              onAddClick={() => {
                setStudentCrudError(null);
                setStudentForm({
                  id: "",
                  enrollmentNumber: "",
                  name: "",
                  department: "School of Engineering & Sciences",
                  programme: "B.Tech CSE",
                  gender: "Male",
                  internalMarks: 32,
                  externalMarks: 48,
                  attendancePercent: 85,
                  semester: activeSemester,
                  batch: "2025",
                  admissionNumber: "",
                  academicYear: activeAcademicYear,
                });
                setShowAddStudentModal(true);
              }}
              onEditClick={(st) => {
                setStudentCrudError(null);
                setStudentForm({
                  id: st.id,
                  enrollmentNumber: st.enrollment,
                  name: st.name,
                  department: st.department,
                  programme: st.program || "",
                  phone: st.phone || "",
                  phoneVerified: Boolean(st.phoneVerified),
                  gender: st.gender || "Male",
                  internalMarks: st.internals ?? 32,
                  externalMarks: st.externals ?? 48,
                  attendancePercent: st.attendance ?? 85,
                  semester: st.sem || 3,
                  batch: st.batch || "2025",
                  admissionNumber: st.admissionNumber || "",
                  academicYear: st.academicYear || activeAcademicYear,
                });
                setShowEditStudentModal(true);
              }}
              onDeleteClick={(st) => {
                setStudentCrudError(null);
                setStudentForm({
                  id: st.id,
                  enrollmentNumber: st.enrollment,
                  name: st.name,
                  department: st.department,
                  programme: st.program || "",
                  phone: st.phone || "",
                  phoneVerified: Boolean(st.phoneVerified),
                  gender: st.gender || "Male",
                  internalMarks: st.internals ?? 32,
                  externalMarks: st.externals ?? 48,
                  attendancePercent: st.attendance ?? 85,
                  semester: st.sem || 3,
                  batch: st.batch || "2025",
                  admissionNumber: st.admissionNumber || "",
                  academicYear: st.academicYear || activeAcademicYear,
                });
                setShowDeleteStudentModal(true);
              }}
            />

            {/* Registrations Table */}
            <RegistrationsTableCard
              registrations={registrations}
              registrationTotal={registrationTotal}
              registrationSearch={registrationSearch}
              setRegistrationSearch={setRegistrationSearch}
              registrationPage={registrationPage}
              registrationTotalPages={registrationTotalPages}
              loadingRegistrations={loadingRegistrations}
              onFetchRegistrations={fetchRegistrations}
              onDownloadCohorts={handleDownloadCohorts}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* PART 3: PROJECTS & SUBMISSIONS                            */}
        {/* ======================================================== */}
        {activeDashboardTab === "PROJECTS" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ProjectsTableCard
              projects={projects}
              projectTotal={projectTotal}
              projectSearch={projectSearch}
              setProjectSearch={setProjectSearch}
              projectCategoryFilter={projectCategoryFilter}
              setProjectCategoryFilter={setProjectCategoryFilter}
              projectStatusFilter={projectStatusFilter}
              setProjectStatusFilter={setProjectStatusFilter}
              projectSchoolFilter={projectSchoolFilter}
              setProjectSchoolFilter={setProjectSchoolFilter}
              completionStats={completionStats}
              projectPage={projectPage}
              projectTotalPages={projectTotalPages}
              loadingProjects={loadingProjects}
              onFetchProjects={fetchProjects}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* PART 4: FACULTY & SPOC MANAGEMENT                         */}
        {/* ======================================================== */}
        {activeDashboardTab === "FACULTY" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* SPOC Management */}
            <SpocManagementCard
              spocDepartments={spocDepartments}
              spocsByDept={spocsByDept}
              faculties={faculties}
              selectedFacultyForDept={selectedFacultyForDept}
              setSelectedFacultyForDept={setSelectedFacultyForDept}
              spocUpdating={spocUpdating}
              onAssignSpoc={handleAssignSpoc}
              onRevokeSpoc={handleRevokeSpoc}
              onResetSpocPasscode={(dept, spoc) => {
                const slug = dept.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
                setSelectedResetSpoc({ dept, spoc });
                setSpocNewPasscodeInput(`spoc@${slug}2026`);
                setSpocResetPasscodeMessage(null);
              }}
            />

            {/* Faculty Access Management */}
            <FacultyAccessCard
              faculties={faculties}
              onAddClick={() => {
                setFacultyCrudError(null);
                setFacultyForm({
                  id: "",
                  name: "",
                  email: "",
                  department: "School of Engineering & Sciences",
                  phone: "",
                  passcode: "gdgu@2026",
                  isAdmin: false,
                  isSpoc: false,
                  spocDepartment: "",
                });
                setShowAddFacultyModal(true);
              }}
              onEditClick={(f) => {
                setFacultyCrudError(null);
                setFacultyForm({
                  id: f.id,
                  name: f.name,
                  email: f.email,
                  department: f.department,
                  phone: f.phone || "",
                  passcode: "",
                  isAdmin: f.isAdmin,
                  isSpoc: f.isSpoc,
                  spocDepartment: f.spocDepartment || "",
                });
                setShowEditFacultyModal(true);
              }}
              onDeleteClick={(f) => {
                setFacultyCrudError(null);
                setFacultyForm({
                  id: f.id,
                  name: f.name,
                  email: f.email,
                  department: f.department,
                  phone: f.phone || "",
                  passcode: "",
                  isAdmin: f.isAdmin,
                  isSpoc: f.isSpoc,
                  spocDepartment: f.spocDepartment || "",
                });
                setShowDeleteFacultyModal(true);
              }}
              onToggleAdmin={handleToggleFacultyAdmin}
              onResetPasscodeClick={(f) => {
                setSelectedResetFaculty(f);
                setNewPasscodeInput("gdgu@2026");
                setResetPasscodeMessage(null);
              }}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* PART 5: DATABASE (Central Database Console, Mappings, CRUD) */}
        {/* ======================================================== */}
        {activeDashboardTab === "DATABASE" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <DatabaseDashboardCard
              activeAcademicYear={activeAcademicYear}
              activeSemester={activeSemester}
              onOpenDataModal={() => setShowDataModal(true)}
              onAddFaculty={() => {
                setFacultyCrudError(null);
                setFacultyForm({
                  id: "",
                  name: "",
                  email: "",
                  department: "School of Engineering & Sciences",
                  phone: "",
                  passcode: "gdgu@2026",
                  isAdmin: false,
                  isSpoc: false,
                  spocDepartment: "",
                });
                setShowAddFacultyModal(true);
              }}
              onEditFaculty={(f) => {
                setFacultyCrudError(null);
                setFacultyForm({
                  id: f.id,
                  name: f.name,
                  email: f.email,
                  department: f.department,
                  phone: f.phone || "",
                  passcode: "",
                  isAdmin: f.isAdmin,
                  isSpoc: f.isSpoc,
                  spocDepartment: f.spocDepartment || "",
                });
                setShowEditFacultyModal(true);
              }}
              onDeleteFaculty={(f) => {
                setFacultyCrudError(null);
                setFacultyForm({
                  id: f.id,
                  name: f.name,
                  email: f.email,
                  department: f.department,
                  phone: f.phone || "",
                  passcode: "",
                  isAdmin: f.isAdmin,
                  isSpoc: f.isSpoc,
                  spocDepartment: f.spocDepartment || "",
                });
                setShowDeleteFacultyModal(true);
              }}
              onResetFacultyPasscode={(f) => {
                setSelectedResetFaculty(f);
                setNewPasscodeInput("gdgu@2026");
                setResetPasscodeMessage(null);
              }}
              onToggleFacultyAdmin={handleToggleFacultyAdmin}
              onAddStudent={() => {
                setStudentCrudError(null);
                setStudentForm({
                  id: "",
                  enrollmentNumber: "",
                  name: "",
                  department: "School of Engineering & Sciences",
                  programme: "B.Tech CSE",
                  gender: "Male",
                  internalMarks: 32,
                  externalMarks: 48,
                  attendancePercent: 85,
                  semester: activeSemester,
                  batch: "2025",
                  admissionNumber: "",
                  academicYear: activeAcademicYear,
                });
                setShowAddStudentModal(true);
              }}
              onEditStudent={(st) => {
                setStudentCrudError(null);
                setStudentForm({
                  id: st.id,
                  enrollmentNumber: st.enrollment,
                  name: st.name,
                  department: st.department,
                  programme: st.program || "",
                  phone: st.phone || "",
                  phoneVerified: Boolean(st.phoneVerified),
                  gender: st.gender || "Male",
                  internalMarks: st.internals ?? 32,
                  externalMarks: st.externals ?? 48,
                  attendancePercent: st.attendance ?? 85,
                  semester: st.sem || 3,
                  batch: st.batch || "2025",
                  admissionNumber: st.admissionNumber || "",
                  academicYear: st.academicYear || activeAcademicYear,
                });
                setShowEditStudentModal(true);
              }}
              onDeleteStudent={(st) => {
                setStudentCrudError(null);
                setStudentForm({
                  id: st.id,
                  enrollmentNumber: st.enrollment,
                  name: st.name,
                  department: st.department,
                  programme: st.program || "",
                  phone: st.phone || "",
                  phoneVerified: Boolean(st.phoneVerified),
                  gender: st.gender || "Male",
                  internalMarks: st.internals ?? 32,
                  externalMarks: st.externals ?? 48,
                  attendancePercent: st.attendance ?? 85,
                  semester: st.sem || 3,
                  batch: st.batch || "2025",
                  admissionNumber: st.admissionNumber || "",
                  academicYear: st.academicYear || activeAcademicYear,
                });
                setShowDeleteStudentModal(true);
              }}
              onDownloadCohorts={handleDownloadCohorts}
              onDataChanged={async () => {
                await Promise.all([
                  fetchStudents(1),
                  fetchProjects(1),
                  fetchRegistrations(1),
                  fetchFacultyAccess(),
                  fetchDashboardData(),
                  fetchConfig(),
                ]);
              }}
            />
          </div>
        )}

        {/* Modals */}
        <StudentModals
          showAddModal={showAddStudentModal}
          setShowAddModal={setShowAddStudentModal}
          showEditModal={showEditStudentModal}
          setShowEditModal={setShowEditStudentModal}
          showDeleteModal={showDeleteStudentModal}
          setShowDeleteModal={setShowDeleteStudentModal}
          studentForm={studentForm}
          setStudentForm={setStudentForm}
          studentCrudLoading={studentCrudLoading}
          studentCrudError={studentCrudError}
          onAddStudent={handleCreateStudent}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
        />

        <FacultyModals
          showAddModal={showAddFacultyModal}
          setShowAddModal={setShowAddFacultyModal}
          showEditModal={showEditFacultyModal}
          setShowEditModal={setShowEditFacultyModal}
          showDeleteModal={showDeleteFacultyModal}
          setShowDeleteModal={setShowDeleteFacultyModal}
          selectedResetFaculty={selectedResetFaculty}
          setSelectedResetFaculty={setSelectedResetFaculty}
          facultyForm={facultyForm}
          setFacultyForm={setFacultyForm}
          facultyCrudLoading={facultyCrudLoading}
          facultyCrudError={facultyCrudError}
          newPasscodeInput={newPasscodeInput}
          setNewPasscodeInput={setNewPasscodeInput}
          resetPasscodeLoading={resetPasscodeLoading}
          resetPasscodeMessage={resetPasscodeMessage}
          setResetPasscodeMessage={setResetPasscodeMessage}
          onAddFaculty={handleCreateFaculty}
          onUpdateFaculty={handleUpdateFaculty}
          onDeleteFaculty={handleDeleteFaculty}
          onResetPasscode={handleResetFacultyPasscode}
        />

        {/* SPOC Password Reset Modal */}
        {selectedResetSpoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl relative">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#0d2137]">Change SPOC Passcode</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedResetSpoc.dept} · {selectedResetSpoc.spoc.facultyName && selectedResetSpoc.spoc.facultyName !== "N/A" ? selectedResetSpoc.spoc.facultyName : selectedResetSpoc.spoc.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResetSpoc(null);
                    setSpocResetPasscodeMessage(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Warning Alert */}
              <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5 shadow-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-950">Security Notice &amp; Warning:</p>
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    Changing this password will immediately overwrite active SPOC credentials for <strong>{selectedResetSpoc.dept}</strong> ({selectedResetSpoc.spoc.email}). Any active reviewer sessions will be disconnected.
                  </p>
                </div>
              </div>

              {spocResetPasscodeMessage && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs font-medium border ${
                    spocResetPasscodeMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {spocResetPasscodeMessage.text}
                </div>
              )}

              <form onSubmit={handleResetSpocPasscode} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New SPOC Passcode *
                  </label>
                  <input
                    type="text"
                    value={spocNewPasscodeInput}
                    onChange={(e) => setSpocNewPasscodeInput(e.target.value)}
                    placeholder="Enter new passcode (min 6 chars)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSpocNewPasscodeInput("spoc@gdgu2026")}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    spoc@gdgu2026
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const slug = selectedResetSpoc.dept.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
                      setSpocNewPasscodeInput(`spoc@${slug}2026`);
                    }}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Dept Default
                  </button>
                </div>

                <div className="mt-5 flex gap-2 justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={spocResetPasscodeLoading}
                    onClick={() => {
                      setSelectedResetSpoc(null);
                      setSpocResetPasscodeMessage(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={spocResetPasscodeLoading || !spocNewPasscodeInput || spocNewPasscodeInput.length < 6}
                    className="px-4 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {spocResetPasscodeLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Save SPOC Passcode</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <YearRolloverModal
          isOpen={showYearModal}
          onClose={() => setShowYearModal(false)}
          activeAcademicYear={activeAcademicYear}
          onSuccess={async (msg) => {
            setConfigMessage(msg);
            await Promise.all([fetchConfig(), fetchDashboardData(), fetchStudents(1), fetchProjects(1)]);
            setTimeout(() => setConfigMessage(null), 5000);
          }}
        />

        <DataManagementModal
          isOpen={showDataModal}
          onClose={() => setShowDataModal(false)}
          activeAcademicYear={activeAcademicYear}
          onDataChanged={async () => {
            await Promise.all([
              fetchStudents(1),
              fetchProjects(1),
              fetchRegistrations(1),
              fetchFacultyAccess(),
              fetchDashboardData(),
              fetchConfig(),
            ]);
          }}
        />

        <TemplatesModal
          isOpen={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}
        />

        <BulkImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          defaultYear={activeAcademicYear}
          onSuccess={async () => {
            await Promise.all([fetchStudents(1), fetchProjects(1), fetchFacultyAccess(), fetchDashboardData()]);
          }}
        />
      </main>
      <Footer />
    </>
  );
}
