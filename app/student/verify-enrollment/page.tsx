"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlertCircle, ShieldCheck, ArrowLeft, Smartphone, ShieldAlert, KeyRound } from "lucide-react";

export default function VerifyEnrollmentPage() {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneRequired, setPhoneRequired] = useState(false);
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
        body: JSON.stringify({
          action: "SEND",
          enrollmentNumber: enrollment,
          phone: phone ? phone.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.phoneRequired) {
          setPhoneRequired(true);
        }
        setError(data.error || "Failed to send OTP.");
      } else {
        setOtpSent(true);
        setOtpSuccessMessage(
          data.debugOtp
            ? `OTP sent! (Development Test Code: ${data.debugOtp})`
            : data.message || "6-digit OTP sent to your mobile number via 2Factor."
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
          body: JSON.stringify({
            action: "VERIFY",
            enrollmentNumber: enrollment,
            otp: otpCode,
            phone: phone ? phone.trim() : undefined,
          }),
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
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-12 sm:py-16 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-8 sm:p-11 border border-slate-200/90 shadow-elevated relative overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <Link
              href="/student/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0a192f] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Login</span>
            </Link>
            <div className="h-9 px-3 py-1 rounded-xl bg-white border border-[#c59b27]/40 shadow-sm flex items-center justify-center">
              <img
                src="/avishkar-logo.png"
                alt="Avishkar CIE"
                className="h-full w-auto max-w-[100px] object-contain"
              />
            </div>
          </div>

          <div className="w-8 h-1 bg-[#c59b27] rounded-full mb-3" />
          <h1 className="text-2xl font-bold text-[#09131f] tracking-tight">
            Verify Student Account
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Google identity confirmed. Please enter your university enrollment number to link your academic record.
          </p>

          {/* SMS Verification Notice */}
          <div className="mt-5 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/70 flex items-start gap-2.5 text-blue-900 text-xs">
            <Smartphone className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-blue-950">SMS Identity Verification:</span> A 6-digit OTP will be dispatched via 2Factor SMS to verify and secure your account.
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-2xl bg-red-50/90 border border-red-200 flex items-start gap-3 text-red-800 text-xs sm:text-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Verification Error</p>
                <p className="mt-0.5 text-xs leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {otpSuccessMessage && (
            <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{otpSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="student-enrollment" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enrollment Number *
              </label>
              <input
                id="student-enrollment"
                name="enrollmentNumber"
                type="text"
                autoComplete="username"
                placeholder="e.g. 24001011001"
                value={enrollment}
                onChange={(e) => setEnrollment(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300/90 bg-slate-50/50 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f] focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="student-phone" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Mobile Number (10 Digits) {phoneRequired ? <span className="text-red-500 font-bold">*</span> : <span className="text-slate-400 font-normal">(for 2Factor SMS OTP)</span>}</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="student-phone"
                  name="phone"
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300/90 bg-slate-50/50 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a192f] focus:border-transparent transition-all"
                  required={phoneRequired}
                />
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || !enrollment}
                    className="px-4 py-3 rounded-2xl bg-[#0a192f] hover:bg-[#132c4a] text-white text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-50 tactile-btn shadow-sm"
                  >
                    {otpLoading ? "Sending..." : "Send OTP"}
                  </button>
                )}
              </div>
            </div>

            {otpSent && (
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="student-otp" className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#0a192f]" />
                    6-Digit SMS OTP Code *
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="text-xs text-[#0a192f] hover:text-[#c59b27] font-semibold underline transition-colors"
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
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300/90 bg-white text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#0a192f] focus:border-transparent transition-all"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !enrollment || (otpSent && !otpCode)}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0a192f] hover:bg-[#132c4a] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all tactile-btn shadow-card hover:shadow-elevated disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? "Verifying Record..." : "Verify & Link Account"}</span>
            </button>
          </form>

          <div className="mt-7 pt-4 border-t border-slate-100 flex items-center justify-center text-xs text-slate-500">
            <Link
              href="/student/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0a192f] transition-colors group"
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
