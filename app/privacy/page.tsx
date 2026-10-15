"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield, Lock, FileText, CheckCircle2, ArrowLeft, Mail, Building, Users } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0a192f] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal Home</span>
          </Link>
        </div>

        {/* Hero Banner */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-card mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#0a192f]/5 text-[#0a192f] border border-[#0a192f]/10 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c59b27]" />
              <span>G D Goenka University · Avishkar CIE</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Session 2025–2026
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#09131f] tracking-tight">
            Privacy Policy & Data Governance
          </h1>
          <p className="text-slate-600 mt-2.5 text-sm sm:text-base leading-relaxed">
            This policy outlines how the IDP (Inter-Disciplinary Project) Portal collects, processes, and protects student, faculty, and institutional data under G D Goenka University and the Avishkar Centre for Innovation & Entrepreneurship (CIE).
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-11 border border-slate-200/90 shadow-card space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-[#09131f] mb-3">
              <Building className="w-5 h-5 text-[#c59b27]" />
              <h2>1. Institutional Scope & Ownership</h2>
            </div>
            <p>
              The IDP (Inter-Disciplinary Project) Portal is an academic platform operated for <strong>G D Goenka University</strong> in official affiliation with the <strong>Avishkar Centre for Innovation & Entrepreneurship (CIE)</strong>. The system facilitates cross-departmental student team registrations, mentor allocations, project artifact reviews, and semester evaluations.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-[#09131f] mb-3">
              <FileText className="w-5 h-5 text-[#c59b27]" />
              <h2>2. Information We Collect</h2>
            </div>
            <p className="mb-3">
              To operate the academic registry accurately, the portal collects the following categories of data:
            </p>
            <ul className="space-y-2.5 pl-2">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#c59b27] shrink-0 mt-1" />
                <span>
                  <strong>Student Identity & Credentials:</strong> Full name, official university email (<code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">@gdgu.org</code>), university enrollment number, department/school, academic program, and semester cohort.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#c59b27] shrink-0 mt-1" />
                <span>
                  <strong>Faculty & Department SPOC Information:</strong> Name, designated employee ID, institutional email, designated project allocations, review notes, and evaluation rubrics.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#c59b27] shrink-0 mt-1" />
                <span>
                  <strong>Project Artifacts & Submissions:</strong> Project titles, multidisciplinary domain classifications, project synopses, code repository links, presentation decks, and evaluation verification logs.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#c59b27] shrink-0 mt-1" />
                <span>
                  <strong>Technical & Security Metadata:</strong> Login timestamps, IP addresses, session identifiers, and audit logs required for system integrity and security monitoring.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-[#09131f] mb-3">
              <Users className="w-5 h-5 text-[#c59b27]" />
              <h2>3. Purpose of Data Processing</h2>
            </div>
            <p className="mb-3">We collect and process your information strictly for legitimate academic purposes:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-600">
              <li>Facilitating multidisciplinary team formulation and cross-school collaboration.</li>
              <li>Allocating qualified faculty mentors and department SPOC supervisors.</li>
              <li>Tracking artifact submissions, verification workflows, and semester grading.</li>
              <li>Fulfilling institutional accreditation reporting requirements (such as NAAC, NIRF, and statutory audits).</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-[#09131f] mb-3">
              <Shield className="w-5 h-5 text-[#c59b27]" />
              <h2>4. Google OAuth & Identity Policy</h2>
            </div>
            <p>
              Student authentication is managed via Google OAuth restricted to the official <strong>@gdgu.org</strong> workspace domain. The portal accesses only basic profile information (name, email address, and profile picture) to authenticate your identity. We do not access, scan, or store your private Google Drive files, emails, or personal contacts.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-[#09131f] mb-3">
              <Lock className="w-5 h-5 text-[#c59b27]" />
              <h2>5. Security & Access Control</h2>
            </div>
            <p className="mb-3">
              We employ strict security safeguards to prevent unauthorized access or disclosure:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-semibold text-[#09131f] mb-1">Role-Based Access Control (RBAC)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Students access only their team submission; SPOCs manage their specific department; Faculty inspect assigned cohorts; Admins oversee system governance.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-semibold text-[#09131f] mb-1">Encrypted Transmission</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All communications between your browser and the portal are secured using modern TLS/HTTPS encryption with HTTP-only session tokens.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-[#09131f] mb-3">
              <FileText className="w-5 h-5 text-[#c59b27]" />
              <h2>6. No Commercial Sharing or Sale of Data</h2>
            </div>
            <p>
              We firmly commit that <strong>no student, faculty, or institutional data is ever sold, rented, monetized, or shared with third-party advertisers or commercial marketing agencies</strong>. Your information remains strictly within university and incubator systems.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-[#09131f] mb-3">
              <Mail className="w-5 h-5 text-[#c59b27]" />
              <h2>7. Data Retention & Grievance Redressal</h2>
            </div>
            <p className="mb-3">
              Project records and evaluation logs are retained for the duration required by G D Goenka University academic regulations. For questions, data correction requests, or concerns, contact:
            </p>
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0a192f]/5 border border-[#0a192f]/10 text-xs sm:text-sm text-slate-700">
              <p className="font-bold text-[#09131f]">Avishkar Centre for Innovation & Entrepreneurship (CIE)</p>
              <p className="text-slate-600 mt-0.5">G D Goenka University, Sohna Road, Gurugram, Haryana – 122103</p>
              <p className="mt-2 text-slate-600">
                Email: <a href="mailto:cie@gdgu.org" className="text-[#0a192f] font-semibold underline">cie@gdgu.org</a>
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
