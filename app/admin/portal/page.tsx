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
  const fetchStudents = async (page = 1, search = "", filter = "all") => {
    setLoadingStudents(true);
    try {
      const res = await fetch(
        `/api/admin/students?page=${page}&limit=10&search=${encodeURIComponent(
          search
        )}&registered=${filter}`
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
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0d2137]" />
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
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    fetchStudents(1, e.target.value, studentFilter);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#0d2137] w-48 sm:w-64"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={studentFilter}
                onChange={(e) => {
                  setStudentFilter(e.target.value);
                  fetchStudents(1, studentSearch, e.target.value);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none bg-white"
              >
                <option value="all">All</option>
                <option value="yes">Registered</option>
                <option value="no">Unregistered</option>
              </select>

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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingStudents ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0d2137]" />
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
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
                onClick={() => fetchStudents(studentPage - 1, studentSearch, studentFilter)}
                className="px-3 py-1 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={studentPage >= studentTotalPages}
                onClick={() => fetchStudents(studentPage + 1, studentSearch, studentFilter)}
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
          <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-1">
            Faculty Access &amp; Administrative Roles
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Grant or revoke administrative dashboard and SPOC access for university faculty members.
          </p>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
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
                          onClick={() => handleToggleFacultyAdmin(f.id, f.isAdmin)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
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
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
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
      </main>
      <Footer />
    </>
  );
}
