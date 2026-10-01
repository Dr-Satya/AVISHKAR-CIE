"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlertCircle, ShieldCheck, ArrowLeft } from "lucide-react";

export default function VerifyEnrollmentPage() {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!enrollment) return;
    setOtpLoading(true);
    setError(null);
    setOtpSuccessMessage(null);

    try {
      const res = await fetch("/api/student/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND", enrollmentNumber: enrollment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP.");
      } else {
        setOtpSent(true);
        setOtpSuccessMessage(
          data.debugOtp
            ? `OTP sent! (Development Test Code: ${data.debugOtp})`
            : "6-digit OTP sent to your registered mobile number."
        );
      }
    } catch {
      setError("Network error while dispatching OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment) return;

    setLoading(true);
    setError(null);

    try {
      // If OTP was sent, verify OTP first
      if (otpSent && otpCode) {
        const otpRes = await fetch("/api/student/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "VERIFY", enrollmentNumber: enrollment, otp: otpCode }),
        });
        const otpData = await otpRes.json();
        if (!otpRes.ok) {
          setError(otpData.error || "Invalid OTP code.");
          setLoading(false);
          return;
        }
      }

      // Complete university enrollment verification
      const res = await fetch("/api/auth/student/verify-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentNumber: enrollment }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Enrollment verification failed.");
        setLoading(false);
        return;
      }

      router.push("/student/portal");
    } catch (err: any) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Header role="Student" />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200/80 shadow-sm relative">
          <Link
            href="/student/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0d2137] transition-colors mb-4 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Student Login</span>
          </Link>

          <div className="w-10 h-1 bg-[#cda34f] rounded-full mb-3" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d2137]">
            Verify Student Account
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Google identity confirmed. Please enter your university enrollment number and verify via OTP.
          </p>

          {error && (
            <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Verification Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {otpSuccessMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              {otpSuccessMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="student-enrollment" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enrollment Number *
              </label>
              <div className="flex gap-2">
                <input
                  id="student-enrollment"
                  name="enrollmentNumber"
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. 24001011001"
                  value={enrollment}
                  onChange={(e) => setEnrollment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0d2137] focus:border-transparent"
                  required
                />
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || !enrollment}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0d2137] text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-50"
                  >
                    {otpLoading ? "Sending..." : "Send OTP"}
                  </button>
                )}
              </div>
            </div>

            {otpSent && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="student-otp" className="block text-xs font-semibold text-slate-700">
                    6-Digit SMS OTP Code *
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    Resend Code
                  </button>
                </div>
                <input
                  id="student-otp"
                  name="otp"
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#0d2137] focus:border-transparent"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !enrollment || (otpSent && !otpCode)}
              className="w-full py-3 px-4 rounded-xl bg-[#0d2137] hover:bg-[#163456] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? "Verifying..." : "Verify & Access Portal"}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center text-xs text-slate-500">
            <Link
              href="/student/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0d2137] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Student Login</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
