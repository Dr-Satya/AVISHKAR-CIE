"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
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

  // Dynamic SMS 2FA Mode & Phone Verification State
  const [smsOtpEnabled, setSmsOtpEnabled] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [confirmPhoneInput, setConfirmPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null);

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
      if (typeof data.smsOtpEnabled === "boolean") {
        setSmsOtpEnabled(data.smsOtpEnabled);
      }
      if (data.user.phone) {
        setPhoneInput(data.user.phone);
        setConfirmPhoneInput(data.user.phone);
      }

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

  const handleSendOtp = async () => {
    const clean = phoneInput.replace(/\D/g, "");
    if (clean.length !== 10) {
      setPhoneError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setPhoneLoading(true);
    setPhoneError(null);
    setPhoneSuccess(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_OTP", phone: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error || "Failed to send OTP.");
        return;
      }
      setOtpSent(true);
      if (data.devOtp) setDevOtpHint(data.devOtp);
      setPhoneSuccess(data.message || "OTP sent successfully.");
    } catch {
      setPhoneError("Network error while sending OTP.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const clean = phoneInput.replace(/\D/g, "");
    if (clean.length !== 10) {
      setPhoneError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (otpInput.trim().length !== 6) {
      setPhoneError("Please enter the 6-digit OTP code.");
      return;
    }
    if (!consentChecked) {
      setPhoneError("Please tick the consent box: 'this will be used for further communication'.");
      return;
    }
    setPhoneLoading(true);
    setPhoneError(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_OTP",
          phone: clean,
          otp: otpInput.trim(),
          consent: consentChecked,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error || "OTP verification failed.");
        return;
      }
      setStudent((prev) =>
        prev
          ? {
              ...prev,
              phone: data.student.phone,
              phoneVerified: true,
            }
          : prev
      );
      setPhoneSuccess("Mobile number verified successfully!");
    } catch {
      setPhoneError("Network error while verifying OTP.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSavePhoneDoubleEntry = async () => {
    const clean = phoneInput.replace(/\D/g, "");
    const cleanConfirm = confirmPhoneInput.replace(/\D/g, "");
    if (clean.length !== 10) {
      setPhoneError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (clean !== cleanConfirm) {
      setPhoneError("Mobile numbers do not match. Please re-enter.");
      return;
    }
    if (!consentChecked) {
      setPhoneError("Please tick the consent box: 'this will be used for further communication'.");
      return;
    }
    setPhoneLoading(true);
    setPhoneError(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SAVE_PHONE",
          phone: clean,
          confirmPhone: cleanConfirm,
          consent: consentChecked,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error || "Failed to save mobile number.");
        return;
      }
      setStudent((prev) =>
        prev
          ? {
              ...prev,
              phone: data.student.phone,
              phoneVerified: true,
            }
          : prev
      );
      setPhoneSuccess("Mobile number saved successfully!");
    } catch {
      setPhoneError("Network error while saving mobile number.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleRegister = async (projectId: string) => {
    if (!student?.phoneVerified) {
      setError("Please complete mobile number verification before registering.");
      return;
    }
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

        {/* MANDATORY FIRST-TIME PHONE VERIFICATION MODAL */}
        {student && !student.phoneVerified && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d2137]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
              {/* Top Decorative Gold Accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#cda34f] via-[#0d2137] to-[#cda34f]" />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#cda34f] flex-shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#0d2137]">
                    {student.registration ? "Confirm Contact Details" : "Mobile Number Verification"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {smsOtpEnabled
                      ? "Two-Factor SMS OTP Verification Required"
                      : "First-Time Mobile Number Confirmation"}
                  </p>
                </div>
              </div>

              {/* Requirement & Consent Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 mb-5 text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#cda34f] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-950">Important Notice:</p>
                  <p className="text-amber-900/90 leading-relaxed font-medium">
                    &quot;this will be used for further communication&quot; — All official notifications regarding IDP project allocation, faculty mentor contact, and schedule updates will be dispatched to this number.
                  </p>
                </div>
              </div>

              {phoneError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{phoneError}</span>
                </div>
              )}

              {phoneSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                  <span>{phoneSuccess}</span>
                </div>
              )}

              {/* DYNAMIC MODE 1: SMS OTP 2FA */}
              {smsOtpEnabled ? (
                <div className="space-y-4">
                  {!otpSent ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Enter 10-Digit Mobile Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={phoneInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setPhoneInput(val);
                            setPhoneError(null);
                          }}
                          className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        A 6-digit OTP verification code will be sent to this number.
                      </p>

                      <div className="mt-5 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={phoneLoading || phoneInput.length !== 10}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {phoneLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>Send Verification OTP</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 font-medium">OTP sent to: </span>
                          <span className="font-mono font-bold text-[#0d2137]">+91 {phoneInput}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpInput("");
                            setDevOtpHint(null);
                            setPhoneError(null);
                          }}
                          className="text-[#cda34f] hover:underline font-semibold text-xs"
                        >
                          Change Number
                        </button>
                      </div>

                      {devOtpHint && (
                        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-center justify-between">
                          <span>
                            🔑 Demo OTP: <strong className="font-mono">{devOtpHint}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setOtpInput(devOtpHint)}
                            className="text-xs text-blue-600 underline font-semibold hover:text-blue-800"
                          >
                            Auto-fill
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Enter 6-Digit OTP Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit OTP"
                          value={otpInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setOtpInput(val);
                            setPhoneError(null);
                          }}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-center tracking-[0.3em] text-base font-bold text-[#0d2137] focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                        />
                      </div>

                      {/* Mandatory Consent Checkbox */}
                      <label className="flex items-start gap-2.5 cursor-pointer pt-1 group">
                        <input
                          type="checkbox"
                          checked={consentChecked}
                          onChange={(e) => setConsentChecked(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0d2137] focus:ring-[#cda34f]"
                        />
                        <span className="text-xs text-slate-700 group-hover:text-slate-900 font-medium leading-relaxed">
                          I confirm this is my mobile number and tick the consent box:{" "}
                          <strong className="text-[#0d2137]">&quot;this will be used for further communication&quot;</strong>.
                        </span>
                      </label>

                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-between">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={phoneLoading}
                          className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${phoneLoading ? "animate-spin" : ""}`} />
                          <span>Resend OTP</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={phoneLoading || otpInput.trim().length !== 6 || !consentChecked}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {phoneLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>Verify & Continue</span>
                              <CheckCircle2 className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* DYNAMIC MODE 2: DOUBLE-ENTRY CONFIRMATION (SMS OTP OFF) */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={phoneInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setPhoneInput(val);
                          setPhoneError(null);
                        }}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Confirm Mobile Number (Enter Twice)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Re-enter same mobile number"
                        value={confirmPhoneInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setConfirmPhoneInput(val);
                          setPhoneError(null);
                        }}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0d2137]"
                      />
                    </div>
                    {phoneInput && confirmPhoneInput && phoneInput !== confirmPhoneInput && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">
                        Mobile numbers do not match.
                      </p>
                    )}
                  </div>

                  {/* Mandatory Consent Checkbox */}
                  <label className="flex items-start gap-2.5 cursor-pointer pt-1 group">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0d2137] focus:ring-[#cda34f]"
                    />
                    <span className="text-xs text-slate-700 group-hover:text-slate-900 font-medium leading-relaxed">
                      I confirm both numbers match and tick the consent box:{" "}
                      <strong className="text-[#0d2137]">&quot;this will be used for further communication&quot;</strong>.
                    </span>
                  </label>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSavePhoneDoubleEntry}
                      disabled={
                        phoneLoading ||
                        phoneInput.length !== 10 ||
                        phoneInput !== confirmPhoneInput ||
                        !consentChecked
                      }
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0d2137] hover:bg-[#1a3a60] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {phoneLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Save Mobile Number & Continue</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
