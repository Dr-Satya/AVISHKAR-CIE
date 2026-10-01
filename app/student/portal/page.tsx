"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { StudentData, ProjectCardData } from "@/types/student";
import { StudentHeader } from "@/components/student/StudentHeader";
import { RegisteredStatusCard } from "@/components/student/RegisteredStatusCard";
import { CategorySelector } from "@/components/student/CategorySelector";
import { ThemeSelector } from "@/components/student/ThemeSelector";
import { AvailableProjectsList } from "@/components/student/AvailableProjectsList";

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
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-slate-200 rounded-lg" />
              <div className="h-4 w-64 bg-slate-100 rounded-md" />
              <div className="h-3.5 w-72 bg-slate-100 rounded-md" />
            </div>
            <div className="h-9 w-24 bg-slate-200 rounded-xl" />
          </div>
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
        <StudentHeader student={student} onLogout={handleLogout} />

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {registrationSuccessMessage && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3 text-green-800 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" />
            <p className="font-medium">{registrationSuccessMessage}</p>
          </div>
        )}

        {student.registration ? (
          <RegisteredStatusCard registration={student.registration} />
        ) : (
          <div>
            {!selectedCategory && (
              <CategorySelector
                categories={categories}
                onSelectCategory={handleSelectCategory}
              />
            )}

            {selectedCategory && !selectedTheme && (
              <ThemeSelector
                selectedCategory={selectedCategory}
                themes={themesByCategory[selectedCategory] || []}
                onSelectTheme={handleSelectTheme}
                onBack={() => {
                  setSelectedCategory(null);
                  setSelectedTheme(null);
                }}
              />
            )}

            {selectedCategory && selectedTheme && (
              <AvailableProjectsList
                selectedCategory={selectedCategory}
                selectedTheme={selectedTheme}
                projects={projects}
                loadingProjects={loadingProjects}
                registeringId={registeringId}
                onRegister={handleRegister}
                onBack={() => {
                  setSelectedTheme(null);
                  setProjects([]);
                }}
              />
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
