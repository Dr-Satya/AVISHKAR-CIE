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
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Trash2,
  Play,
  ShieldCheck,
  Building2,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Upload,
  Plus,
  Edit2,
  RefreshCw,
  X,
  FileUp,
} from "lucide-react";
import { exportToCsv, exportToXlsx, exportToPdf } from "@/lib/export";

interface KpiData {
  totalStudents: number;
  totalProjects: number;
  totalRegistrations: number;
  totalCapacity: number;
  seatsFilledRatio: string;
}

interface GlobalConfigData {
  registrationOpen: boolean;
  maxSeats: number;
  sameDeptLimit: number;
  otherDeptLimit: number;
  activeAcademicYear?: string;
  activeSemester?: number;
}

interface DeptLimit {
  id: string;
  department: string;
  sameDeptLimit: number;
  otherDeptLimit: number;
}

interface BulkProgressState {
  totalToProcess: number;
  processed: number;
  registered: number;
  skipped: number;
  skippedDetails: Array<{ enrollment: string; name: string; reason: string }>;
  isCompleted: boolean;
}

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

  // Bulk Registration State
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkProgressState | null>(null);
  const [showSkippedModal, setShowSkippedModal] = useState(false);

  // Students Table State
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentFilter, setStudentFilter] = useState("all"); // all, yes, no
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Projects Table State
  const [projects, setProjects] = useState<any[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectPage, setProjectPage] = useState(1);
  const [projectTotalPages, setProjectTotalPages] = useState(1);
  const [projectTotal, setProjectTotal] = useState(0);
  const [projectCategoryFilter, setProjectCategoryFilter] = useState("all");
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

  // Academic Year & Semester
  const [activeAcademicYear, setActiveAcademicYear] = useState("2025-2026");
  const [activeSemester, setActiveSemester] = useState(3);
  const [showYearModal, setShowYearModal] = useState(false);
  const [yearStep, setYearStep] = useState<1 | 2>(1);
  const [targetYearInput, setTargetYearInput] = useState("2026-2027");
  const [targetSemesterInput, setTargetSemesterInput] = useState(3);
  const [confirmPhraseInput, setConfirmPhraseInput] = useState("");
  const [adminPasscodeInput, setAdminPasscodeInput] = useState("");
  const [yearWarningChecked, setYearWarningChecked] = useState(false);
  const [yearSwitchLoading, setYearSwitchLoading] = useState(false);
  const [yearSwitchError, setYearSwitchError] = useState<string | null>(null);

  // Template Download & Ingest Modal
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<"STUDENTS" | "FACULTY" | "SPOC" | "PROJECTS">("STUDENTS");
  const [importYear, setImportYear] = useState("2025-2026");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Student CRUD Modals
  const [studentAcademicYear, setStudentAcademicYear] = useState("all");
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    id: "",
    enrollmentNumber: "",
    name: "",
    department: "School of Engineering & Sciences",
    programme: "",
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
  const [facultyForm, setFacultyForm] = useState({
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

  const fetchSpocData = async () => {
    try {
      const res = await fetch("/api/admin/spoc");
      if (res.ok) {
        const data = await res.json();
        setSpocDepartments(data.departments || []);
        setSpocsByDept(data.spocByDepartment || {});
      }
    } catch (err) {}
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
    } catch (err) {
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
    } catch (err) {
    } finally {
      setSpocUpdating(null);
    }
  };

  // Fetch KPI
  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setKpi(data.kpi);
    } catch (err) {}
  };

  // Fetch Global Configuration
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
        setImportYear(yr);
        setStudentForm((sf) => ({ ...sf, academicYear: yr }));
      }
    } catch (err) {}
  };

  // Fetch Department Limits
  const fetchDeptLimits = async () => {
    try {
      const res = await fetch("/api/admin/department-limits");
      const data = await res.json();
      setDeptLimits(data.limits || []);
    } catch (err) {}
  };

  // Fetch Students Table
  const fetchStudents = async (page = 1, search = "", filter = "all", year = studentAcademicYear) => {
    setLoadingStudents(true);
    try {
      const res = await fetch(
        `/api/admin/students?page=${page}&limit=10&search=${encodeURIComponent(
          search
        )}&registered=${filter}&academicYear=${encodeURIComponent(year)}`
      );
      const data = await res.json();
      setStudents(data.students || []);
      setStudentPage(data.pagination.page);
      setStudentTotalPages(data.pagination.totalPages);
      setStudentTotal(data.pagination.total);
    } catch (err) {
    } finally {
      setLoadingStudents(false);
    }
  };

  // Toggle Semester Phase
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
        setConfigMessage(`Switched active semester milestone to Semester ${nextSem === 3 ? "1 (Sem 3 - PPT)" : "2 (Sem 4 - Report)"}.`);
        setTimeout(() => setConfigMessage(null), 3500);
      }
    } catch (err) {}
  };

  // Double-Verified Academic Year Rollover
  const handleYearRollover = async () => {
    setYearSwitchLoading(true);
    setYearSwitchError(null);
    try {
      const res = await fetch("/api/admin/configuration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ACTIVATE_ACADEMIC_YEAR",
          targetYear: targetYearInput,
          startingSemester: targetSemesterInput,
          confirmationPhrase: confirmPhraseInput,
          adminPasscode: adminPasscodeInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setYearSwitchError(data.error || "Rollover failed.");
        setYearSwitchLoading(false);
        return;
      }
      setShowYearModal(false);
      setConfigMessage(data.message);
      await Promise.all([fetchConfig(), fetchDashboardData(), fetchStudents(1), fetchProjects(1)]);
      setTimeout(() => setConfigMessage(null), 5000);
    } catch (err: any) {
      setYearSwitchError(err.message || "Failed to switch academic year.");
    } finally {
      setYearSwitchLoading(false);
    }
  };

  // Direct XLSX Ingestion
  const handleImportXlsx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError("Please select a valid .xlsx file.");
      return;
    }
    setImportLoading(true);
    setImportError(null);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("type", importType);
      fd.append("academicYear", importYear);

      const res = await fetch("/api/admin/bulk-registration", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || "Import failed.");
        setImportLoading(false);
        return;
      }
      setImportResult(data.summary);
      setImportFile(null);
      await Promise.all([fetchStudents(1), fetchProjects(1), fetchFacultyAccess(), fetchDashboardData()]);
    } catch (err: any) {
      setImportError(err.message || "Import encountered an error.");
    } finally {
      setImportLoading(false);
    }
  };

  // Student CRUD
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

  // Faculty CRUD
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

  // Fetch Projects Table
  const fetchProjects = async (page = 1, search = "", cat = "all") => {
    setLoadingProjects(true);
    try {
      const res = await fetch(
        `/api/admin/projects?page=${page}&limit=10&search=${encodeURIComponent(
          search
        )}&category=${cat}`
      );
      const data = await res.json();
      setProjects(data.projects || []);
      setProjectPage(data.pagination.page);
      setProjectTotalPages(data.pagination.totalPages);
      setProjectTotal(data.pagination.total);
    } catch (err) {
    } finally {
      setLoadingProjects(false);
    }
  };

  // Fetch Registrations Table
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
    } catch (err) {
    } finally {
      setLoadingRegistrations(false);
    }
  };

  // Fetch Faculty Access
  const fetchFacultyAccess = async () => {
    setLoadingFacultyAccess(true);
    try {
      const res = await fetch("/api/admin/faculty-access");
      const data = await res.json();
      setFaculties(data.faculties || []);
    } catch (err) {
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

    // SSE connection for live updates
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
      } catch (e) {}
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
      } catch (e) {}
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  // Save Global Configuration
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
      const data = await res.json();
      if (res.ok) {
        setConfigMessage("Configuration saved successfully.");
        setTimeout(() => setConfigMessage(null), 3000);
      }
    } catch (err) {
    } finally {
      setConfigSaving(false);
    }
  };

  // Save Department Limit
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
    } catch (err) {
    } finally {
      setDeptSaving(false);
    }
  };

  // Delete Department Limit
  const handleDeleteDeptLimit = async (id: string) => {
    if (!confirm("Are you sure you want to remove this department limit override?")) return;
    try {
      await fetch(`/api/admin/department-limits?id=${id}`, { method: "DELETE" });
      await fetchDeptLimits();
    } catch (err) {}
  };

  // Trigger Bulk Registration
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
    } catch (err) {
    } finally {
      setBulkRunning(false);
      fetchDashboardData();
      fetchRegistrations(1);
      fetchProjects(1);
      fetchStudents(1);
    }
  };

  // Toggle Faculty Admin Access
  const handleToggleFacultyAdmin = async (facultyId: string, currentStatus: boolean) => {
    try {
      await fetch("/api/admin/faculty-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyId, isAdmin: !currentStatus }),
      });
      await fetchFacultyAccess();
    } catch (err) {}
  };

  // Reset Faculty Passcode by Admin
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

  if (loading) {
    return (
      <>
        <Header role="Admin" />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6 animate-pulse">
          {/* Top Header Card Skeleton */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-slate-200 rounded-lg" />
              <div className="h-3.5 w-32 bg-slate-100 rounded-md" />
            </div>
            <div className="h-9 w-24 bg-slate-200 rounded-xl" />
          </div>

          {/* KPI Grid Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-8 w-20 bg-slate-300 rounded-lg" />
                <div className="h-2.5 w-32 bg-slate-100 rounded" />
              </div>
            ))}
          </div>

          {/* Config & Table Card Skeleton */}
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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d2137]">
              Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{adminName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Log out
          </button>
        </div>

        {/* Academic Year & Cohort Lifecycle Banner Card */}
        <div className="bg-gradient-to-r from-[#0d2137] via-[#163456] to-[#0d2137] rounded-2xl p-6 sm:p-7 text-white shadow-lg border border-[#cda34f]/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#cda34f]/15 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#cda34f] text-[#0d2137]">
                  Active Cohort Session
                </span>
                <span className="text-xs text-slate-300">
                  {activeSemester === 3 ? "Semester 1 Milestone (Sem 3 - PPT Submission)" : "Semester 2 Milestone (Sem 4 - Final Report)"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <Calendar className="w-7 h-7 text-[#cda34f]" />
                <span>Academic Year {activeAcademicYear}</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Student applications, mentor allocations, and project submissions are strictly scoped to this session. Older cohorts are archived and isolated.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleToggleSemester}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-1.5 shadow-sm"
                title="Switch active semester milestone between Semester 1 (Sem 3 PPT) and Semester 2 (Sem 4 Report)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#cda34f]" />
                <span>Switch to Sem {activeSemester === 3 ? "4 (Report)" : "3 (PPT)"}</span>
              </button>
              <button
                onClick={() => setShowTemplatesModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-[#cda34f]" />
                <span>XLSX Templates</span>
              </button>
              <button
                onClick={() => {
                  setImportType("STUDENTS");
                  setImportYear(activeAcademicYear);
                  setImportFile(null);
                  setImportResult(null);
                  setImportError(null);
                  setShowImportModal(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#cda34f] hover:bg-[#dfb55f] text-[#0d2137] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Direct XLSX Import</span>
              </button>
              <button
                onClick={() => {
                  setYearStep(1);
                  setTargetYearInput("");
                  setTargetSemesterInput(3);
                  setConfirmPhraseInput("");
                  setAdminPasscodeInput("");
                  setYearWarningChecked(false);
                  setYearSwitchError(null);
                  setShowYearModal(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-600/90 hover:bg-red-700 text-white transition-all flex items-center gap-1.5 shadow-sm border border-red-500/50"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Rollover Academic Year</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="text-2xl sm:text-4xl font-extrabold text-[#0d2137]">
              {kpi.totalStudents}
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1.5">
              STUDENTS
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="text-2xl sm:text-4xl font-extrabold text-[#0d2137]">
              {kpi.totalProjects}
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1.5">
              PROJECTS
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="text-2xl sm:text-4xl font-extrabold text-[#0d2137]">
              {kpi.totalRegistrations}
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1.5">
              REGISTRATIONS
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="text-2xl sm:text-4xl font-extrabold text-[#0d2137]">
              {kpi.seatsFilledRatio}
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1.5">
              SEATS FILLED
            </div>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
          <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
          <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-5">
            Configuration
          </h2>

          {configMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{configMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              {/* Registration Open Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Registration Open
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({ ...c, registrationOpen: !c.registrationOpen }))
                  }
                  className={`w-14 h-7 rounded-full p-1 transition-colors flex items-center ${
                    config.registrationOpen ? "bg-[#cda34f]" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      config.registrationOpen ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Maximum Seats */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Maximum Seats
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.maxSeats}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, maxSeats: parseInt(e.target.value, 10) || 1 }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                />
              </div>

              {/* Department Limit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Department Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.sameDeptLimit}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, sameDeptLimit: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                />
              </div>

              {/* Other Department Limit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Other Department Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.otherDeptLimit}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, otherDeptLimit: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={configSaving}
                className="px-6 py-2.5 rounded-xl bg-[#0d2137] hover:bg-[#163456] text-white font-medium text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {configSaving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </form>

          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            These defaults apply to any project that doesn&apos;t set its own Max Seats / Same Dept Limit / Other Dept Limit in the Projects sheet.
          </p>
        </div>

        {/* Department-wise Registration Limits Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
          <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
          <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-1">
            Department-wise Registration Limits
          </h2>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed max-w-4xl">
            Set a Same-Department and Other-Department seat limit per department (e.g. CSE: Same 5 / Other 2, Civil: Same 4 / Other 3). This applies to every project whose faculty belongs to that department, overriding both that project&apos;s own limits and the global defaults above. A department left unset here just falls back to the project&apos;s own limits, then the global defaults.
          </p>

          <form onSubmit={handleSaveDeptLimit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                placeholder="Enter department name"
                value={deptInput}
                onChange={(e) => setDeptInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Same Dept Limit</label>
              <input
                type="number"
                min="0"
                value={sameDeptInput}
                onChange={(e) => setSameDeptInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Other Dept Limit</label>
              <input
                type="number"
                min="0"
                value={otherDeptInput}
                onChange={(e) => setOtherDeptInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={deptSaving}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0d2137] hover:bg-[#163456] text-white font-medium text-xs sm:text-sm transition-colors"
              >
                {deptSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          {/* Department Limits Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0d2137] text-white">
                  <th className="py-2.5 px-4 font-semibold">DEPARTMENT</th>
                  <th className="py-2.5 px-4 font-semibold">SAME DEPT LIMIT</th>
                  <th className="py-2.5 px-4 font-semibold">OTHER DEPT LIMIT</th>
                  <th className="py-2.5 px-4 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptLimits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 px-4 text-center text-slate-400">
                      No department-specific limits set yet. Projects fall back to their own limits, then the global defaults above.
                    </td>
                  </tr>
                ) : (
                  deptLimits.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-[#0d2137]">{l.department}</td>
                      <td className="py-3 px-4 text-slate-600">{l.sameDeptLimit}</td>
                      <td className="py-3 px-4 text-slate-600">{l.otherDeptLimit}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteDeptLimit(l.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Registration Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
          <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
          <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-1">
            Bulk Registration
          </h2>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed max-w-4xl">
            Automatically registers every currently unregistered student. The emptiest projects (fewest current registrations) are filled first, then the next-emptiest, and so on. Every existing rule still applies per student - seat capacity, and same/other department quotas - so a student is skipped wherever no eligible seat is found.
          </p>

          <button
            onClick={handleRunBulkRegistration}
            disabled={bulkRunning}
            className="w-full py-3.5 px-4 rounded-xl bg-[#0d2137] hover:bg-[#163456] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {bulkRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Bulk Registrations...</span>
              </>
            ) : (
              <span>Register All Unregistered Students</span>
            )}
          </button>

          {/* Bulk Registration Progress / Results */}
          {bulkResult && (
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-[#0d2137]">
                <span>
                  {bulkResult.isCompleted ? "Bulk registration completed." : "Processing..."}
                </span>
                <span>
                  {bulkResult.processed} / {bulkResult.totalToProcess} Processed
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#16a34a] transition-all duration-300"
                  style={{
                    width: `${
                      bulkResult.totalToProcess > 0
                        ? (bulkResult.processed / bulkResult.totalToProcess) * 100
                        : 100
                    }%`,
                  }}
                />
              </div>

              <div className="flex items-center gap-4 text-slate-600 pt-1">
                <span>
                  Registered: <strong className="text-green-700">{bulkResult.registered}</strong>
                </span>
                <span>
                  Skipped: <strong className="text-amber-700">{bulkResult.skipped}</strong>
                </span>
                {bulkResult.skipped > 0 && (
                  <button
                    onClick={() => setShowSkippedModal(true)}
                    className="text-[#0d2137] underline font-semibold ml-auto"
                  >
                    View Skipped Reasons
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Students Table Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
          <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
              Students ({studentTotal})
            </h2>

            {/* Search & Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search student or enrollment..."
                  aria-label="Search student by name or enrollment"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    fetchStudents(1, e.target.value, studentFilter, studentAcademicYear);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137] w-48 sm:w-64"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={studentFilter}
                aria-label="Filter students by status"
                onChange={(e) => {
                  setStudentFilter(e.target.value);
                  fetchStudents(1, studentSearch, e.target.value, studentAcademicYear);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="yes">Registered</option>
                <option value="no">Unregistered</option>
              </select>

              <select
                value={studentAcademicYear}
                aria-label="Filter students by academic cohort"
                onChange={(e) => {
                  setStudentAcademicYear(e.target.value);
                  fetchStudents(1, studentSearch, studentFilter, e.target.value);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none bg-white font-medium text-slate-700"
              >
                <option value="all">All Cohorts</option>
                <option value={activeAcademicYear}>Active ({activeAcademicYear})</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>

              <button
                onClick={() => {
                  setStudentCrudError(null);
                  setStudentForm({
                    id: "",
                    enrollmentNumber: "",
                    name: "",
                    department: "School of Engineering & Sciences",
                    programme: "B.Tech CSE",
                    semester: activeSemester,
                    batch: "2025",
                    admissionNumber: "",
                    academicYear: activeAcademicYear,
                  });
                  setShowAddStudentModal(true);
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0d2137] text-white hover:bg-[#163456] flex items-center gap-1 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student</span>
              </button>

              <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
                <button
                  onClick={() => {
                    const rows = students.map((s, idx) => ({
                      "Sr. No": idx + 1,
                      "Enrollment": s.enrollment,
                      "Name": s.name,
                      "Department": s.department,
                      "Programme": s.programme || "N/A",
                      "Semester": s.semester,
                      "Batch": s.batch,
                      "Registered": s.isRegistered ? "Yes" : "No",
                      "Project": s.projectCode || "N/A",
                    }));
                    exportToCsv(rows, "GDGU_Admin_Students");
                  }}
                  className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                  title="Export Students CSV"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => {
                    const rows = students.map((s, idx) => ({
                      "Sr. No": idx + 1,
                      "Enrollment": s.enrollment,
                      "Name": s.name,
                      "Department": s.department,
                      "Programme": s.programme || "N/A",
                      "Semester": s.semester,
                      "Batch": s.batch,
                      "Registered": s.isRegistered ? "Yes" : "No",
                      "Project": s.projectCode || "N/A",
                    }));
                    exportToXlsx(rows, "GDGU_Admin_Students", "Students");
                  }}
                  className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                  title="Export Students Excel"
                >
                  <FileSpreadsheet className="w-3 h-3 text-green-600" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => {
                    const rows = students.map((s, idx) => ({
                      "Sr. No": idx + 1,
                      "Enrollment": s.enrollment,
                      "Name": s.name,
                      "Department": s.department,
                      "Programme": s.programme || "N/A",
                      "Semester": s.semester,
                      "Batch": s.batch,
                      "Registered": s.isRegistered ? "Yes" : "No",
                      "Project": s.projectCode || "N/A",
                    }));
                    exportToPdf(rows, "GDGU Student Enrollment Master List");
                  }}
                  className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                  title="Print / Save PDF"
                >
                  <Download className="w-3 h-3 text-red-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0d2137] text-white">
                  <th className="py-2.5 px-3 font-semibold">ENROLLMENT</th>
                  <th className="py-2.5 px-3 font-semibold">NAME</th>
                  <th className="py-2.5 px-3 font-semibold">DEPARTMENT</th>
                  <th className="py-2.5 px-3 font-semibold">PROGRAM</th>
                  <th className="py-2.5 px-3 font-semibold">SEM</th>
                  <th className="py-2.5 px-3 font-semibold">BATCH</th>
                  <th className="py-2.5 px-3 font-semibold">REGISTERED</th>
                  <th className="py-2.5 px-3 font-semibold">PROJECT</th>
                  <th className="py-2.5 px-3 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingStudents ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0d2137]" />
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400">
                      No student records found.
                    </td>
                  </tr>
                ) : (
                  students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono text-slate-800">{st.enrollment}</td>
                      <td className="py-3 px-3 font-medium text-[#0d2137]">{st.name}</td>
                      <td className="py-3 px-3 text-slate-600">{st.department}</td>
                      <td className="py-3 px-3 text-slate-500">{st.program}</td>
                      <td className="py-3 px-3 text-slate-600">{st.sem}</td>
                      <td className="py-3 px-3 text-slate-600">{st.batch}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            st.registered
                              ? "bg-[#dcfce7] text-[#15803d]"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {st.registered ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {st.projectCode}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setStudentCrudError(null);
                              setStudentForm({
                                id: st.id,
                                enrollmentNumber: st.enrollment,
                                name: st.name,
                                department: st.department,
                                programme: st.program || "",
                                semester: st.sem || 3,
                                batch: st.batch || "2025",
                                admissionNumber: st.admissionNumber || "",
                                academicYear: st.academicYear || activeAcademicYear,
                              });
                              setShowEditStudentModal(true);
                            }}
                            className="p-1 rounded text-slate-600 hover:text-[#0d2137] hover:bg-slate-100 transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setStudentCrudError(null);
                              setStudentForm({
                                id: st.id,
                                enrollmentNumber: st.enrollment,
                                name: st.name,
                                department: st.department,
                                programme: st.program || "",
                                semester: st.sem || 3,
                                batch: st.batch || "2025",
                                admissionNumber: st.admissionNumber || "",
                                academicYear: st.academicYear || activeAcademicYear,
                              });
                              setShowDeleteStudentModal(true);
                            }}
                            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Students Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-4">
            <div>
              Page {studentPage} of {studentTotalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={studentPage <= 1}
                onClick={() => fetchStudents(studentPage - 1, studentSearch, studentFilter, studentAcademicYear)}
                className="px-3 py-1 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={studentPage >= studentTotalPages}
                onClick={() => fetchStudents(studentPage + 1, studentSearch, studentFilter, studentAcademicYear)}
                className="px-3 py-1 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Projects Table Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
          <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
              Projects ({projectTotal})
            </h2>

            {/* Search & Category Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search project ID or title..."
                  aria-label="Search projects by ID or title"
                  value={projectSearch}
                  onChange={(e) => {
                    setProjectSearch(e.target.value);
                    fetchProjects(1, e.target.value, projectCategoryFilter);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137] w-48 sm:w-64"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={projectCategoryFilter}
                aria-label="Filter projects by category"
                onChange={(e) => {
                  setProjectCategoryFilter(e.target.value);
                  fetchProjects(1, projectSearch, e.target.value);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none bg-white"
              >
                <option value="all">All Categories</option>
                <option value="IDP2501">IDP2501</option>
                <option value="IDP2502">IDP2502</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0d2137] text-white">
                  <th className="py-2.5 px-3 font-semibold">PROJECT ID</th>
                  <th className="py-2.5 px-3 font-semibold">TITLE</th>
                  <th className="py-2.5 px-3 font-semibold">FACULTY</th>
                  <th className="py-2.5 px-3 font-semibold">DEPARTMENT</th>
                  <th className="py-2.5 px-3 font-semibold">THEME</th>
                  <th className="py-2.5 px-3 font-semibold">CATEGORY</th>
                  <th className="py-2.5 px-3 font-semibold">SEATS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingProjects ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0d2137]" />
                    </td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-[#0d2137]">{p.projectId}</td>
                      <td className="py-3 px-3 font-medium text-slate-800 max-w-xs">{p.title}</td>
                      <td className="py-3 px-3 text-slate-700">{p.faculty}</td>
                      <td className="py-3 px-3 text-slate-600">{p.department}</td>
                      <td className="py-3 px-3 text-slate-600">{p.theme}</td>
                      <td className="py-3 px-3 text-slate-600">{p.category}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{p.seatsRatio}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Projects Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-4">
            <div>
              Page {projectPage} of {projectTotalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={projectPage <= 1}
                onClick={() => fetchProjects(projectPage - 1, projectSearch, projectCategoryFilter)}
                className="px-3 py-1 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={projectPage >= projectTotalPages}
                onClick={() => fetchProjects(projectPage + 1, projectSearch, projectCategoryFilter)}
                className="px-3 py-1 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Registrations Table Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
          <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
              Registrations ({registrationTotal})
            </h2>

            {/* Search & Export */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search enrollment or student..."
                  aria-label="Search registrations by enrollment or student"
                  value={registrationSearch}
                  onChange={(e) => {
                    setRegistrationSearch(e.target.value);
                    fetchRegistrations(1, e.target.value);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137] w-48 sm:w-64"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
                <button
                  onClick={() => {
                    const rows = registrations.map((r, idx) => ({
                      "Sr. No": idx + 1,
                      "Timestamp": r.timestamp,
                      "Enrollment": r.enrollment,
                      "Student Name": r.studentName,
                      "Department": r.department,
                      "Project Code": r.projectCode,
                      "Faculty Mentor": r.facultyName,
                      "Status": r.status,
                      "Theme": r.theme,
                    }));
                    exportToCsv(rows, "GDGU_Admin_Registrations");
                  }}
                  className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                  title="Export Registrations CSV"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => {
                    const rows = registrations.map((r, idx) => ({
                      "Sr. No": idx + 1,
                      "Timestamp": r.timestamp,
                      "Enrollment": r.enrollment,
                      "Student Name": r.studentName,
                      "Department": r.department,
                      "Project Code": r.projectCode,
                      "Faculty Mentor": r.facultyName,
                      "Status": r.status,
                      "Theme": r.theme,
                    }));
                    exportToXlsx(rows, "GDGU_Admin_Registrations", "Registrations");
                  }}
                  className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                  title="Export Registrations Excel"
                >
                  <FileSpreadsheet className="w-3 h-3 text-green-600" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => {
                    const rows = registrations.map((r, idx) => ({
                      "Sr. No": idx + 1,
                      "Timestamp": r.timestamp,
                      "Enrollment": r.enrollment,
                      "Student Name": r.studentName,
                      "Department": r.department,
                      "Project Code": r.projectCode,
                      "Faculty Mentor": r.facultyName,
                      "Status": r.status,
                      "Theme": r.theme,
                    }));
                    exportToPdf(rows, "GDGU Project Registrations Master Report");
                  }}
                  className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                  title="Print / Save PDF"
                >
                  <Download className="w-3 h-3 text-red-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0d2137] text-white">
                  <th className="py-2.5 px-3 font-semibold">TIMESTAMP</th>
                  <th className="py-2.5 px-3 font-semibold">ENROLLMENT</th>
                  <th className="py-2.5 px-3 font-semibold">STUDENT</th>
                  <th className="py-2.5 px-3 font-semibold">DEPARTMENT</th>
                  <th className="py-2.5 px-3 font-semibold">PROJECT</th>
                  <th className="py-2.5 px-3 font-semibold">FACULTY</th>
                  <th className="py-2.5 px-3 font-semibold">STATUS</th>
                  <th className="py-2.5 px-3 font-semibold">THEME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingRegistrations ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0d2137]" />
                    </td>
                  </tr>
                ) : registrations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      No registrations found.
                    </td>
                  </tr>
                ) : (
                  registrations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {r.timestamp}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800">{r.enrollment}</td>
                      <td className="py-3 px-3 font-medium text-[#0d2137]">{r.studentName}</td>
                      <td className="py-3 px-3 text-slate-600">{r.department}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#0d2137]">{r.projectCode}</td>
                      <td className="py-3 px-3 text-slate-700">{r.facultyName}</td>
                      <td className="py-3 px-3">
                        <span className="bg-[#dcfce7] text-[#15803d] px-2 py-0.5 rounded text-[11px] font-bold">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{r.theme}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Registrations Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-4">
            <div>
              Page {registrationPage} of {registrationTotalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={registrationPage <= 1}
                onClick={() => fetchRegistrations(registrationPage - 1, registrationSearch)}
                className="px-3 py-1 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={registrationPage >= registrationTotalPages}
                onClick={() => fetchRegistrations(registrationPage + 1, registrationSearch)}
                className="px-3 py-1 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Department SPOC Management Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
          <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
                Department SPOC (Single Point of Contact) Management
              </h2>
              <p className="text-xs text-slate-500">
                Designate faculty members as department SPOCs to verify project documents, enforce plagiarism guidelines, and review student rosters.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spocDepartments.map((dept) => {
              const currentSpocs = spocsByDept[dept] || [];
              const deptFaculty = faculties.filter((f) => f.department === dept);
              const selectedFaculty = selectedFacultyForDept[dept] || "";

              return (
                <div
                  key={dept}
                  className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 flex flex-col justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-[#0d2137] text-xs line-clamp-1" title={dept}>
                        {dept}
                      </span>
                      <Link
                        href="/spoc/portal"
                        className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5 flex-shrink-0"
                      >
                        <span>View Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Current SPOC info */}
                    <div className="mt-2 p-2.5 bg-white rounded-lg border border-slate-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Active SPOC Profile:
                        </span>
                        {currentSpocs.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                      {currentSpocs.length > 0 ? (
                        <div className="space-y-2">
                          {currentSpocs.map((s) => (
                            <div key={s.id} className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-900 line-clamp-1">
                                  {s.facultyName && s.facultyName !== "N/A" ? s.facultyName : s.name}
                                </span>
                                <button
                                  onClick={() => handleRevokeSpoc(dept, s.facultyId || s.id)}
                                  disabled={spocUpdating === dept}
                                  className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline flex-shrink-0"
                                >
                                  Revoke
                                </button>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                                <span>Faculty Email:</span>
                                <span className="font-mono text-slate-700">{s.facultyEmail || "N/A"}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200">
                                <span className="font-semibold text-[#0d2137]">SPOC Login ID:</span>
                                <span className="font-mono font-bold text-[#0d2137] select-all">{s.email}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs block py-1">No SPOC assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Assign new SPOC dropdown */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                    <select
                      value={selectedFaculty}
                      onChange={(e) =>
                        setSelectedFacultyForDept((prev) => ({
                          ...prev,
                          [dept]: e.target.value,
                        }))
                      }
                      className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none"
                    >
                      <option value="">Select faculty to assign...</option>
                      {deptFaculty.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleAssignSpoc(dept, selectedFaculty)}
                      disabled={!selectedFaculty || spocUpdating === dept}
                      className="px-3 py-1.5 rounded-lg bg-[#0d2137] hover:bg-[#1a3a60] text-white text-[11px] font-bold shadow-sm disabled:opacity-40 transition-all flex-shrink-0"
                    >
                      {spocUpdating === dept ? "Saving..." : "Assign"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Faculty & Admin Access Management Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
          <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0d2137]">
                Faculty Access &amp; Administrative Roles
              </h2>
              <p className="text-xs text-slate-500">
                Grant or revoke administrative dashboard and SPOC access, manage faculty rosters, or update credentials.
              </p>
            </div>
            <button
              onClick={() => {
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
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0d2137] text-white hover:bg-[#163456] flex items-center gap-1 shadow-sm transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Faculty</span>
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0d2137] text-white">
                  <th className="py-2.5 px-3 font-semibold">NAME</th>
                  <th className="py-2.5 px-3 font-semibold">EMAIL</th>
                  <th className="py-2.5 px-3 font-semibold">DEPARTMENT</th>
                  <th className="py-2.5 px-3 font-semibold text-center">SPOC STATUS</th>
                  <th className="py-2.5 px-3 font-semibold text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {faculties.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-[#0d2137]">{f.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{f.email}</td>
                    <td className="py-2.5 px-3 text-slate-500">{f.department}</td>
                    <td className="py-2.5 px-3 text-center">
                      {f.isSpoc ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          SPOC: {f.spocDepartment || f.department}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
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
                          className="p-1 rounded text-slate-600 hover:text-[#0d2137] hover:bg-slate-200 transition-colors"
                          title="Edit Faculty"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
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
                          className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete Faculty"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleFacultyAdmin(f.id, f.isAdmin)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
                            f.isAdmin
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {f.isAdmin ? "Revoke Admin" : "Grant Admin"}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedResetFaculty(f);
                            setNewPasscodeInput("gdgu@2026");
                            setResetPasscodeMessage(null);
                          }}
                          className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          Reset Passcode
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Skipped Students Details Modal */}
        {showSkippedModal && bulkResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-xl relative max-h-[80vh] flex flex-col">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
              <h3 className="text-lg font-bold text-[#0d2137]">
                Skipped Students ({bulkResult.skippedDetails.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                Students who could not be automatically registered due to constraint restrictions.
              </p>

              <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 text-xs">
                {bulkResult.skippedDetails.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex justify-between font-semibold text-[#0d2137]">
                      <span>{item.name}</span>
                      <span className="font-mono text-slate-600">{item.enrollment}</span>
                    </div>
                    <p className="text-red-600 text-[11px] mt-1 font-medium">
                      Reason: {item.reason}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowSkippedModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Faculty Password Reset Modal */}
        {selectedResetFaculty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-xl relative">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
              <h3 className="text-lg font-bold text-[#0d2137]">
                Reset Passcode
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Assign a new passcode for{" "}
                <span className="font-semibold text-[#0d2137]">
                  {selectedResetFaculty.name}
                </span>{" "}
                ({selectedResetFaculty.email})
              </p>

              {resetPasscodeMessage && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs font-medium border ${
                    resetPasscodeMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {resetPasscodeMessage.text}
                </div>
              )}

              <form onSubmit={handleResetFacultyPasscode} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Passcode
                  </label>
                  <input
                    type="text"
                    value={newPasscodeInput}
                    onChange={(e) => setNewPasscodeInput(e.target.value)}
                    placeholder="Enter new passcode (min 6 chars)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPasscodeInput("gdgu@2026")}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    Set to default (gdgu@2026)
                  </button>
                </div>

                <div className="mt-5 flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    disabled={resetPasscodeLoading}
                    onClick={() => {
                      setSelectedResetFaculty(null);
                      setResetPasscodeMessage(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetPasscodeLoading || !newPasscodeInput}
                    className="px-4 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {resetPasscodeLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Save New Passcode</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Double-Verification Academic Year Rollover Modal */}
        {showYearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0d2137] flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    <span>Academic Year Rollover Guard</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Step {yearStep} of 2 • Double-Verification Cohort Lifecycle Switcher
                  </p>
                </div>
                <button
                  onClick={() => setShowYearModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {yearSwitchError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{yearSwitchError}</span>
                </div>
              )}

              {yearStep === 1 ? (
                <div className="mt-5 space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                      Strict Cohort Isolation Notice
                    </p>
                    <p className="leading-relaxed text-amber-800">
                      Activating a new academic year seals existing students and project submissions.
                      Incoming students will only see projects and mentors created for the new cohort.
                      Previous cohort data remains permanently stored and retrievable by administrators.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Academic Year to Activate
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-2027"
                      value={targetYearInput}
                      onChange={(e) => setTargetYearInput(e.target.value.trim())}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Format: YYYY-YYYY (e.g. 2026-2027). Currently active: <strong>{activeAcademicYear}</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Initial Semester Milestone
                    </label>
                    <select
                      value={targetSemesterInput}
                      onChange={(e) => setTargetSemesterInput(parseInt(e.target.value, 10))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white"
                    >
                      <option value={3}>Semester 1 Milestone (Sem 3 - PPT Submission)</option>
                      <option value={4}>Semester 2 Milestone (Sem 4 - Final Report)</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={yearWarningChecked}
                        onChange={(e) => setYearWarningChecked(e.target.checked)}
                        className="mt-0.5 rounded text-[#0d2137] focus:ring-[#0d2137] w-4 h-4"
                      />
                      <span className="text-xs text-slate-600 leading-snug">
                        I confirm that the prerequisite data (students, faculty, and projects) for{" "}
                        <strong className="text-[#0d2137]">{targetYearInput || "the new year"}</strong> has been uploaded or will be initialized now.
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowYearModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!targetYearInput || !yearWarningChecked}
                      onClick={() => {
                        setYearStep(2);
                        setYearSwitchError(null);
                      }}
                      className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span>Proceed to Verification</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                    <p className="font-bold">Dual Security Gate</p>
                    <p className="text-red-800">
                      To activate <strong>{targetYearInput}</strong>, complete both verification checks below.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Check 1: Type Confirmation Phrase
                    </label>
                    <div className="text-[11px] font-mono text-slate-500 mb-1.5 bg-slate-100 px-2 py-1 rounded inline-block">
                      CONFIRM {targetYearInput}
                    </div>
                    <input
                      type="text"
                      placeholder={`CONFIRM ${targetYearInput}`}
                      value={confirmPhraseInput}
                      onChange={(e) => setConfirmPhraseInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Check 2: Admin Security Passcode
                    </label>
                    <input
                      type="password"
                      placeholder="Enter administrator passcode"
                      value={adminPasscodeInput}
                      onChange={(e) => setAdminPasscodeInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-red-600"
                      required
                    />
                  </div>

                  <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={yearSwitchLoading}
                      onClick={() => setYearStep(1)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      disabled={
                        yearSwitchLoading ||
                        confirmPhraseInput !== `CONFIRM ${targetYearInput}` ||
                        !adminPasscodeInput
                      }
                      onClick={handleYearRollover}
                      className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
                    >
                      {yearSwitchLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Activating Cohort...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify &amp; Activate Year</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Download Pre-formatted XLSX Templates Modal */}
        {showTemplatesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl relative">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0d2137]">
                    Official Bulk Upload Templates (.xlsx)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pre-configured Excel templates with valid column headers for direct database ingestion.
                  </p>
                </div>
                <button
                  onClick={() => setShowTemplatesModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Students Template */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-[#0d2137] text-sm">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span>Students Template</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Columns: Enrollment No, Full Name, Department, Programme, Semester (3/4), Batch, Admission No, Academic Year.
                    </p>
                  </div>
                  <a
                    href="/api/export?type=TEMPLATE_STUDENTS"
                    download="TEMPLATE_GDGU_Students.xlsx"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .xlsx</span>
                  </a>
                </div>

                {/* Faculty Template */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-[#0d2137] text-sm">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span>Faculty Template</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Columns: Faculty Name, Email ID, Department, Phone, Initial Passcode, IsAdmin (Yes/No), IsSpoc (Yes/No), SpocDepartment.
                    </p>
                  </div>
                  <a
                    href="/api/export?type=TEMPLATE_FACULTY"
                    download="TEMPLATE_GDGU_Faculty.xlsx"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .xlsx</span>
                  </a>
                </div>

                {/* SPOC Template */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-[#0d2137] text-sm">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span>SPOC Template</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Columns: Department Name, Faculty Email, Faculty Name. Assigns single point of contact roles directly.
                    </p>
                  </div>
                  <a
                    href="/api/export?type=TEMPLATE_SPOC"
                    download="TEMPLATE_GDGU_SPOC.xlsx"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .xlsx</span>
                  </a>
                </div>

                {/* Projects Template */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-[#0d2137] text-sm">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span>Projects Template</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Columns: Project ID, Title, Faculty Email, Faculty Name, Department, Theme, Category, Max Seats, Same Dept Limit, Other Dept Limit, Academic Year.
                    </p>
                  </div>
                  <a
                    href="/api/export?type=TEMPLATE_PROJECTS"
                    download="TEMPLATE_GDGU_Projects.xlsx"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .xlsx</span>
                  </a>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTemplatesModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Direct XLSX Data Ingestion Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0d2137]">
                    Direct XLSX Data Ingestion
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload formatted spreadsheet to directly insert or update database records.
                  </p>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {importError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importResult && (
                <div className="mt-4 p-4 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Spreadsheet Processed Successfully</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                    <div className="bg-white p-2 rounded border border-emerald-200 text-center">
                      <div className="text-[10px] text-slate-500">TOTAL</div>
                      <div className="text-sm font-bold text-slate-800">{importResult.total}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-emerald-200 text-center">
                      <div className="text-[10px] text-emerald-600">INSERTED</div>
                      <div className="text-sm font-bold text-emerald-700">{importResult.inserted}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-emerald-200 text-center">
                      <div className="text-[10px] text-amber-600">SKIPPED</div>
                      <div className="text-sm font-bold text-amber-700">{importResult.skipped}</div>
                    </div>
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 text-[11px] text-amber-800 font-sans">
                      Notice: {importResult.errors.slice(0, 3).join(", ")}
                      {importResult.errors.length > 3 ? "..." : ""}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleImportXlsx} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Data Entity
                  </label>
                  <select
                    value={importType}
                    onChange={(e: any) => setImportType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white"
                  >
                    <option value="STUDENTS">Students Master List</option>
                    <option value="FACULTY">Faculty &amp; Mentor List</option>
                    <option value="SPOC">Department SPOC List</option>
                    <option value="PROJECTS">Projects Master List</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Year Tag
                  </label>
                  <input
                    type="text"
                    value={importYear}
                    onChange={(e) => setImportYear(e.target.value.trim())}
                    placeholder="e.g. 2025-2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Records will be indexed under this academic year.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Choose .xlsx Spreadsheet File
                  </label>
                  <input
                    type="file"
                    accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !importFile}
                    className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {importLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Ingesting Spreadsheet...</span>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-3.5 h-3.5" />
                        <span>Upload &amp; Populate D1</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0d2137]">Add New Student</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enroll a student directly into the active cohort database.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {studentCrudError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {studentCrudError}
                </div>
              )}

              <form onSubmit={handleCreateStudent} className="mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Enrollment Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 24001011001"
                      value={studentForm.enrollmentNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, enrollmentNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Student full name"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Programme
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech CSE"
                      value={studentForm.programme}
                      onChange={(e) => setStudentForm({ ...studentForm, programme: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Semester
                    </label>
                    <select
                      value={studentForm.semester}
                      onChange={(e) => setStudentForm({ ...studentForm, semester: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white"
                    >
                      <option value={3}>Semester 3 (Year 2)</option>
                      <option value={4}>Semester 4 (Year 2)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Batch Year
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2025"
                      value={studentForm.batch}
                      onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      value={studentForm.academicYear}
                      onChange={(e) => setStudentForm({ ...studentForm, academicYear: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={studentCrudLoading}
                    className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {studentCrudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Save Student</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {showEditStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0d2137]">Edit Student Record</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update student information and cohort metadata.
                  </p>
                </div>
                <button
                  onClick={() => setShowEditStudentModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {studentCrudError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {studentCrudError}
                </div>
              )}

              <form onSubmit={handleUpdateStudent} className="mt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Enrollment Number *
                    </label>
                    <input
                      type="text"
                      value={studentForm.enrollmentNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, enrollmentNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Programme
                    </label>
                    <input
                      type="text"
                      value={studentForm.programme}
                      onChange={(e) => setStudentForm({ ...studentForm, programme: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Semester
                    </label>
                    <select
                      value={studentForm.semester}
                      onChange={(e) => setStudentForm({ ...studentForm, semester: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137] bg-white"
                    >
                      <option value={3}>Semester 3</option>
                      <option value={4}>Semester 4</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Batch Year
                    </label>
                    <input
                      type="text"
                      value={studentForm.batch}
                      onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      value={studentForm.academicYear}
                      onChange={(e) => setStudentForm({ ...studentForm, academicYear: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditStudentModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={studentCrudLoading}
                    className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {studentCrudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Update Student</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Student Confirmation Modal */}
        {showDeleteStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl relative">
              <div className="w-10 h-1 bg-red-600 rounded-full mb-3" />
              <h3 className="text-lg font-bold text-[#0d2137]">Confirm Student Removal</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Are you sure you want to delete student{" "}
                <strong className="text-[#0d2137]">{studentForm.name}</strong> (Enrollment:{" "}
                <span className="font-mono">{studentForm.enrollmentNumber}</span>)?
                Any active project registration will also be removed.
              </p>

              {studentCrudError && (
                <div className="mt-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {studentCrudError}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowDeleteStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={studentCrudLoading}
                  onClick={handleDeleteStudent}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {studentCrudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Delete Record</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Faculty Modal */}
        {showAddFacultyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0d2137]">Add Faculty Member</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Register a university faculty member with optional admin or SPOC roles.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddFacultyModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {facultyCrudError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {facultyCrudError}
                </div>
              )}

              <form onSubmit={handleCreateFaculty} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faculty Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Doe"
                    value={facultyForm.name}
                    onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="faculty@gdgu.org"
                      value={facultyForm.email}
                      onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={facultyForm.phone}
                      onChange={(e) => setFacultyForm({ ...facultyForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    value={facultyForm.department}
                    onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Passcode
                  </label>
                  <input
                    type="text"
                    value={facultyForm.passcode}
                    onChange={(e) => setFacultyForm({ ...facultyForm, passcode: e.target.value })}
                    placeholder="Defaults to gdgu@2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                  />
                </div>

                <div className="pt-2 space-y-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={facultyForm.isAdmin}
                      onChange={(e) => setFacultyForm({ ...facultyForm, isAdmin: e.target.checked })}
                      className="rounded text-[#0d2137] focus:ring-[#0d2137] w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">Grant Admin Dashboard Access</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={facultyForm.isSpoc}
                      onChange={(e) => setFacultyForm({ ...facultyForm, isSpoc: e.target.checked })}
                      className="rounded text-[#0d2137] focus:ring-[#0d2137] w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">Designate as Department SPOC</span>
                  </label>

                  {facultyForm.isSpoc && (
                    <div className="pl-6 pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Assigned SPOC Department
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. School of Engineering & Sciences"
                        value={facultyForm.spocDepartment}
                        onChange={(e) => setFacultyForm({ ...facultyForm, spocDepartment: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddFacultyModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={facultyCrudLoading}
                    className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {facultyCrudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Save Faculty</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Faculty Modal */}
        {showEditFacultyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0d2137]">Edit Faculty Member</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update faculty profile, department, and role designations.
                  </p>
                </div>
                <button
                  onClick={() => setShowEditFacultyModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {facultyCrudError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {facultyCrudError}
                </div>
              )}

              <form onSubmit={handleUpdateFaculty} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faculty Full Name *
                  </label>
                  <input
                    type="text"
                    value={facultyForm.name}
                    onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={facultyForm.email}
                      onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={facultyForm.phone}
                      onChange={(e) => setFacultyForm({ ...facultyForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    value={facultyForm.department}
                    onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                    required
                  />
                </div>

                <div className="pt-2 space-y-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={facultyForm.isAdmin}
                      onChange={(e) => setFacultyForm({ ...facultyForm, isAdmin: e.target.checked })}
                      className="rounded text-[#0d2137] focus:ring-[#0d2137] w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">Admin Dashboard Access</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={facultyForm.isSpoc}
                      onChange={(e) => setFacultyForm({ ...facultyForm, isSpoc: e.target.checked })}
                      className="rounded text-[#0d2137] focus:ring-[#0d2137] w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">Department SPOC</span>
                  </label>

                  {facultyForm.isSpoc && (
                    <div className="pl-6 pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Assigned SPOC Department
                      </label>
                      <input
                        type="text"
                        value={facultyForm.spocDepartment}
                        onChange={(e) => setFacultyForm({ ...facultyForm, spocDepartment: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137]"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditFacultyModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={facultyCrudLoading}
                    className="px-5 py-2 rounded-xl bg-[#0d2137] text-white text-xs font-semibold hover:bg-[#163456] transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {facultyCrudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Update Faculty</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Faculty Confirmation Modal */}
        {showDeleteFacultyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl relative">
              <div className="w-10 h-1 bg-red-600 rounded-full mb-3" />
              <h3 className="text-lg font-bold text-[#0d2137]">Confirm Faculty Removal</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Are you sure you want to delete faculty member{" "}
                <strong className="text-[#0d2137]">{facultyForm.name}</strong> ({facultyForm.email})?
              </p>

              {facultyCrudError && (
                <div className="mt-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {facultyCrudError}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowDeleteFacultyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={facultyCrudLoading}
                  onClick={handleDeleteFaculty}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {facultyCrudLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Delete Record</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
