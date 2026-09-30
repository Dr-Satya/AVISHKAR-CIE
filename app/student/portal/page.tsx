"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

interface StudentData {
  id: string;
  name: string;
  enrollmentNumber: string;
  department: string;
  programme?: string;
  semester: number;
  batch: string;
  email: string;
  registration?: {
    id: string;
    status: string;
    project: {
      projectId: string;
      title: string;
      department: string;
      theme: string;
      category: string;
      faculty: {
        name: string;
        department: string;
      };
    };
  };
}

interface ProjectCardData {
  id: string;
  projectId: string;
  title: string;
  description: string;
  department: string;
  facultyName: string;
  theme: string;
  category: string;
  maxSeats: number;
  seatsFilled: number;
  availableSeats: number;
  sameDeptQuota: string;
  otherDeptQuota: string;
  isSameDept: boolean;
  isEligible: boolean;
  ineligibilityReason: string;
}

export default function StudentPortalPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unregistered Flow States
  const [categories, setCategories] = useState<string[]>([]);
  const [themesByCategory, setThemesByCategory] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [registrationSuccessMessage, setRegistrationSuccessMessage] = useState<string | null>(null);

  // Fetch initial student data
  const fetchStudentData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/student/login");
        return;
      }
      const data = await res.json();
      if (!data.authenticated || data.user.role !== "STUDENT") {
        router.push("/student/login");
        return;
      }
      setStudent(data.user);

      // If unregistered, load categories
      if (!data.user.registration) {
        fetchCategories();
      }
    } catch (err) {
      setError("Failed to load student data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/student/categories");
      const data = await res.json();
      setCategories(data.categories || []);
      setThemesByCategory(data.themesByCategory || {});
    } catch (err) {}
  };

  const fetchProjects = async (category: string, theme: string) => {
    setLoadingProjects(true);
    try {
      const res = await fetch(
        `/api/student/projects?category=${encodeURIComponent(category)}&theme=${encodeURIComponent(theme)}`
      );
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchStudentData();

    // Setup Real-time SSE listener
    const eventSource = new EventSource("/api/events");
    eventSource.addEventListener("registration.created", () => {
      // Re-fetch project counts if viewing projects list
      if (selectedCategory && selectedTheme) {
        fetchProjects(selectedCategory, selectedTheme);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedTheme(null);
    setProjects([]);
  };

  const handleSelectTheme = (thm: string) => {
    setSelectedTheme(thm);
    if (selectedCategory) {
      fetchProjects(selectedCategory, thm);
    }
  };

  const handleRegister = async (projectId: string) => {
    setRegisteringId(projectId);
    setError(null);
    try {
      const res = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setRegisteringId(null);
        return;
      }

      setRegistrationSuccessMessage("Registration Successful!");
      // Reload student data to switch to registered view
      await fetchStudentData();
    } catch (err: any) {
      setError("Registration request failed.");
    } finally {
      setRegisteringId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <>
        <Header role="Student" />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-6 animate-pulse">
          {/* Student Profile Card Skeleton */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-slate-200 rounded-lg" />
              <div className="h-4 w-64 bg-slate-100 rounded-md" />
              <div className="h-3.5 w-72 bg-slate-100 rounded-md" />
            </div>
            <div className="h-9 w-24 bg-slate-200 rounded-xl" />
          </div>

          {/* Registration / Exploration Card Skeleton */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-10 h-1 bg-[#cda34f]/50 rounded-full mb-3" />
            <div className="h-6 w-52 bg-slate-200 rounded-lg" />
            <div className="h-4 w-80 bg-slate-100 rounded mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-40 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!student) return null;

  return (
    <>
      <Header role="Student" />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d2137] uppercase">
              {student.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {student.department}
              {student.programme ? ` · ${student.programme}` : ""}
              {` · Semester ${student.semester || 3} · Batch ${student.batch || "2025"}`}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Log out
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {registrationSuccessMessage && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3 text-green-800 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
            <p className="font-medium">{registrationSuccessMessage}</p>
          </div>
        )}

        {/* VIEW 1: REGISTERED STUDENT STATE */}
        {student.registration ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative">
            <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-4" />
            <h2 className="text-base sm:text-lg font-bold text-[#16a34a] mb-5">
              You are registered
            </h2>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <span className="font-bold text-[#0d2137]">Project: </span>
                <span className="text-slate-700">
                  {student.registration.project.title}
                </span>
              </div>

              <div>
                <span className="font-bold text-[#0d2137]">Faculty: </span>
                <span className="text-slate-700">
                  {student.registration.project.faculty.name}
                </span>
              </div>

              <div>
                <span className="font-bold text-[#0d2137]">Department: </span>
                <span className="text-slate-700">
                  {student.registration.project.department}
                </span>
              </div>

              <div>
                <span className="font-bold text-[#0d2137]">Theme: </span>
                <span className="text-slate-700">
                  {student.registration.project.theme}
                </span>
              </div>

              <div>
                <span className="font-bold text-[#0d2137]">Category: </span>
                <span className="text-slate-700">
                  {student.registration.project.category}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: UNREGISTERED STUDENT REGISTRATION FLOW (Single-Screen Wizard) */
          <div>
            {/* SCREEN 1: Choose Project Category */}
            {!selectedCategory && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-in fade-in duration-200">
                <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
                <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-1">
                  Choose Project Category
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                  Select your assigned IDP category to proceed.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleSelectCategory(cat)}
                      className="p-5 rounded-xl border bg-slate-50 text-slate-800 border-slate-200 hover:border-[#cda34f] hover:bg-slate-100/80 text-sm font-semibold transition-all flex items-center justify-between group"
                    >
                      <span className="text-base text-[#0d2137]">{cat}</span>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#cda34f] group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SCREEN 2: Choose Theme for Selected Category */}
            {selectedCategory && !selectedTheme && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-1 bg-[#cda34f] rounded-full" />
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedTheme(null);
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-[#0d2137] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Categories</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold bg-[#0d2137] text-white px-2.5 py-0.5 rounded-full">
                    {selectedCategory}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-1">
                  Choose Theme
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                  Select a theme within <strong className="text-slate-700">{selectedCategory}</strong> to view available projects.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(themesByCategory[selectedCategory] || []).map((thm) => (
                    <button
                      key={thm}
                      onClick={() => handleSelectTheme(thm)}
                      className="p-4 rounded-xl border bg-slate-50 text-slate-700 border-slate-200 hover:border-[#cda34f] hover:bg-slate-100/80 text-xs sm:text-sm font-medium transition-all flex items-center justify-between group text-left"
                    >
                      <span className="text-[#0d2137] font-semibold">{thm}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#cda34f] group-hover:translate-x-1 flex-shrink-0 ml-2 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SCREEN 3: Available Projects for Category + Theme */}
            {selectedCategory && selectedTheme && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-1 bg-[#cda34f] rounded-full" />
                  <button
                    onClick={() => {
                      setSelectedTheme(null);
                      setProjects([]);
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-[#0d2137] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Themes</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold bg-[#0d2137] text-white px-2.5 py-0.5 rounded-full">
                    {selectedCategory}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    › {selectedTheme}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#0d2137] mb-1">
                  Available Projects ({projects.length})
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                  Select a project below to complete instant registration.
                </p>

                {loadingProjects ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0d2137]" />
                  </div>
                ) : projects.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No projects found for the selected category and theme.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((proj) => (
                      <div
                        key={proj.id}
                        className={`p-5 rounded-xl border transition-all ${
                          proj.isEligible
                            ? "bg-white border-slate-200 hover:border-[#0d2137] hover:shadow-sm"
                            : "bg-slate-50 border-slate-200/70 opacity-75"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-bold text-[#0d2137] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {proj.projectId}
                              </span>
                              <span className="text-xs font-medium text-slate-500">
                                {proj.department}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-semibold text-[#0d2137]">
                              {proj.title}
                            </h3>
                            {proj.description && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {proj.description}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span>
                                <strong className="text-slate-700">Faculty:</strong> {proj.facultyName}
                              </span>
                              <span>
                                <strong className="text-slate-700">Available Seats:</strong>{" "}
                                <span className={proj.availableSeats > 0 ? "text-green-700 font-bold" : "text-red-600 font-bold"}>
                                  {proj.availableSeats} / {proj.maxSeats}
                                </span>
                              </span>
                              <span>
                                <strong className="text-slate-700">Quotas:</strong> Same: {proj.sameDeptQuota} · Other: {proj.otherDeptQuota}
                              </span>
                            </div>

                            {!proj.isEligible && (
                              <p className="mt-2 text-xs font-medium text-red-600">
                                ⚠ {proj.ineligibilityReason}
                              </p>
                            )}
                          </div>

                          <div className="flex-shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => handleRegister(proj.id)}
                              disabled={!proj.isEligible || registeringId === proj.id}
                              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                proj.isEligible
                                  ? "bg-[#0d2137] hover:bg-[#163456] text-white shadow-sm"
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              {registeringId === proj.id ? "Registering..." : "Register"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
