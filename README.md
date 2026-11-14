# GDGU IDP Portal — Avishkar CIE

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Database-Cloudflare_D1-orange?logo=cloudflare)](https://developers.cloudflare.com/d1/)
[![Cloudflare R2](https://img.shields.io/badge/Storage-Cloudflare_R2-F38020?logo=cloudflare)](https://developers.cloudflare.com/r2/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-199%20Passing-brightgreen)](./scripts/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

Official Inter-Disciplinary Project (IDP) Registration and Lifecycle Management Portal for **G D Goenka University**, engineered by the **Avishkar Centre for Innovation and Entrepreneurship (CIE)**.

> **Latest Release — November 2026:** Comprehensive Marks Export for SPOC & Admin, SPOC Premature Rejection Guard, Direct Project Files Modal, Multi-SPOC per school, full-dataset CSV/Excel/PDF exports, 200+ automated regression tests.

Deployed at scale on the Cloudflare Edge network to deliver millisecond-latency student registration, project lifecycle tracking, milestone evaluations, and automated multi-tier quota enforcement.

🌐 **Production:** [https://gdgu-idp-portal.cie-1e4.workers.dev](https://gdgu-idp-portal.cie-1e4.workers.dev)  
🔒 **Admin Panel:** [`/admin/login`](https://gdgu-idp-portal.cie-1e4.workers.dev/admin/login)  
📋 **Faculty Portal:** [`/faculty/login`](https://gdgu-idp-portal.cie-1e4.workers.dev/faculty/login)  
🏫 **SPOC Portal:** [`/spoc/login`](https://gdgu-idp-portal.cie-1e4.workers.dev/spoc/login)

---

## 🆕 What's New (November 2026)

| Feature | Detail |
|---------|--------|
| **Student Marks & Assessment Export (SPOC & Admin)** | Department SPOCs and University Administrators can now export comprehensive student marks rosters containing Internal Marks (/50), External Marks (/50), Total Marks (/100), Attendance %, and evaluation statuses in formatted Excel (`.xlsx`), CSV, and printable PDF. |
| **SPOC Premature Rejection Guard** | Projects with zero submitted documents (`NOT_SUBMITTED` / 0 artifacts) can no longer be prematurely rejected or approved. SPOC verification cards display an informative "Awaiting Uploads" badge, and the review API strictly rejects premature decisions until deliverables are uploaded. |
| **Direct Project Files Viewer Modal** | SPOCs and Administrators can inspect and download all uploaded deliverables (Reports, Presentations, Consent Forms, Turnitin Similarity reports, Research Manuscripts) via a single-click **Files ({count})** button on every project card. |
| **Faculty In-Portal Passcode Change** | Faculty mentors can update their temporary initial passcodes (`gdgu@2026`) immediately upon portal entry via the "Change Passcode" top bar navigation action. |
| **Student Publication Consent Form Protocol** | Standard Operating Procedure and visual dual-column submission workflow for official 10-student publication consent forms (`Consent_Form_IDP_publication.docx`) with Turnitin (<10%) and AI (<20%) verification. |
| **Multi-SPOC per School** | Assign multiple Department SPOCs to any school. Full create / edit / delete management from the admin panel with no overwrite risk. |
| **Faculty & SPOC Password Reset Protocol** | Standardized admin-managed credential reset workflow. Clear in-portal guidance directs users to contact `admin@gdgu.org` upon login failure. |
| **Active Faculty Mentors KPI Alignment** | Transparent SPOC dashboard analytics distinguishing actively mentoring faculty from unassigned department faculty with project-level 1:1 matching. |
| **Active Semester Upload Window** | Admin can dynamically view and configure which semester milestone is open (`Semester 3` Interim vs `Semester 4` Final Defense). Only the active semester accepts document uploads across Faculty and SPOC portals; inactive semester buttons and submission actions are locked and unclickable with real-time SSE updates. |
| **Full-Dataset Exports** | CSV / Excel / PDF downloads now fetch the **complete filtered dataset** from the API — not just the 25 rows on the current page. |
| **Gender Analytics Fix** | Student gender stored in mixed case (`male`, `MALE`, `Male`) is now normalised before aggregation. Gender split in Admin & SPOC dashboards shows correct counts. |
| **School Acronym Normalisation** | `SOES`, `COHSFE`, `SoLaw`, etc. are canonicalised before all KPI breakdowns so school stats merge correctly. |
| **200+ Regression Tests** | End-to-end automated suites covering exports, marks integrity, rejection guards, KPI breakdowns, SPOC metrics, and multi-SPOC CRUD — all green on every deploy. |

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Cloudflare Edge Network                         │
│                                                                        │
│   ┌───────────────────────────┐         ┌──────────────────────────┐   │
│   │   OpenNext Worker         │ ◄─────► │   Cloudflare D1 (SQL)    │   │
│   │   (Next.js 14 App Router) │         │   (gdgu_idp_db)          │   │
│   └─────────────┬─────────────┘         └──────────────────────────┘   │
│                 │                                                      │
│                 ▼                                                      │
│   ┌───────────────────────────┐         ┌──────────────────────────┐   │
│   │   Cloudflare R2 Storage   │         │   Server-Sent Events     │   │
│   │   (gdgu-idp-artifacts)    │         │   (Real-Time Sync Engine)│   │
│   └───────────────────────────┘         └──────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

- **Edge Runtime:** Next.js 14 deployed via `@opennextjs/cloudflare` running on Cloudflare Workers.
- **Relational Data Layer:** Cloudflare D1 distributed database with native `@prisma/adapter-d1` integration and direct D1 batch SQL execution for high-throughput endpoints.
- **Artifact Object Storage:** Cloudflare R2 bucket (`gdgu-idp-artifacts`) storing student presentations, project manuscripts, similarity reports, and database export archives.
- **Concurrency & Quotas:** Transaction-safe seat allocation preventing race conditions and zero-overbooking across 188 concurrent projects.
- **Real-Time Updates:** Server-Sent Events (`/api/events`) keeping Admin KPIs, seat quotas, and faculty rosters synchronized live.

---

## 👥 Portals & Role-Based Access Control

The application implements strict role-based access control with HTTP-only encrypted JWT session cookies:

| Role | Portal Route | Primary Capabilities |
|---|---|---|
| **Student** | `/student/login` | Official `@gdgu.org` Google OAuth / enrollment verification, theme browsing, real-time seat reservation, project allocation card. |
| **Faculty Mentor** | `/faculty/login` | Project roster tracking, manuscript submissions (draft & published), similarity percent recording, secure passcode management. |
| **Department SPOC** | `/spoc/login` | Departmental milestone verification, manuscript reviews, rubric scoring, faculty project directory filtering. |
| **Administrator** | `/admin/login` | Cohort management, department quota limits, bulk registration engine, live audit logs, one-click full database export, safe wipe. |

Comprehensive user manuals are available in the [`docs/`](./docs) directory:
- [Student User Guide](./docs/STUDENT_USER_GUIDE.md)
- [Faculty User Guide](./docs/FACULTY_USER_GUIDE.md)
- [SPOC User Guide](./docs/SPOC_USER_GUIDE.md)
- [Admin User Guide](./docs/ADMIN_USER_GUIDE.md)
- [Comprehensive Portal Guide](./docs/COMPREHENSIVE_IDP_PORTAL_USER_GUIDE.md)

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v20+)
- **npm**: v9+
- **Wrangler CLI**: v4+ (included in `devDependencies`)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Dr-Satya/AVISHKAR-CIE.git
cd AVISHKAR-CIE

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### 3. Database Initialization
```bash
# Push schema to local dev.db SQLite database
npm run db:push

# Generate Prisma Client
npm run db:generate

# (Optional) Seed initial data from university Excel sheets
npm run import:data
```

### 4. Start Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Suites

Run automated verification suites covering concurrency, exports, KPI analytics, and SPOC metrics:

```bash
# Full-dataset export tests (68 assertions)
npm run test:export

# KPI breakdowns & gender analytics (96 assertions)
npm run test:kpi

# SPOC department metrics (28 assertions)
npx tsx scripts/test-spoc-kpis.ts

# Multi-SPOC CRUD correctness (7 assertions)
npx tsx scripts/test-multiple-spocs.ts

# Concurrency & zero-overbooking stress test
npm run test:concurrency

# End-to-end API endpoints & business logic
npm run test:e2e
```

---

## 🚀 Cloudflare Deployment

### Build and Deploy to Cloudflare Workers
```bash
# Build Next.js bundle for Cloudflare OpenNext runtime
npm run build:cf

# Deploy to Cloudflare Workers edge network
npm run deploy
```

### Database Backups & Time Travel Recovery
```bash
# Export remote D1 database to timestamped SQL file
npm run db:backup

# Inspect D1 Time Travel bookmarks (last 30 days)
npm run db:timetravel

# Restore D1 to a specific Time Travel bookmark
npx wrangler d1 time-travel restore gdgu_idp_db --bookmark=<bookmark-id>
```

---

## 📁 Repository Directory Structure

```
├── app/                       # Next.js 14 App Router
│   ├── admin/                # Administrator console & authentication
│   ├── api/                  # Edge serverless API endpoints
│   ├── faculty/              # Faculty mentor interface
│   ├── spoc/                 # Department SPOC evaluation portal
│   └── student/              # Student registration flow
├── components/                # React UI components
│   ├── admin/                # Admin dashboards, cards & modals
│   ├── common/               # Shared toasts, progress bars, pagination
│   ├── faculty/              # Faculty project cards & upload modals
│   ├── spoc/                 # SPOC review tabs & verification cards
│   └── student/              # Theme selectors, project cards, modals
├── docs/                      # Official role-based documentation & manuals
├── lib/                       # Core utilities & database adapters
│   ├── auth.ts               # JWT authentication & session handling
│   ├── data-management.ts    # D1-optimized export, purge & audit logic
│   ├── prisma.ts             # Prisma client adapter for Cloudflare D1
│   ├── quota.ts              # Department-wise registration quotas
│   └── zip-export.ts         # Bulk artifact export helper
├── prisma/                    # Relational schema definition (schema.prisma)
├── public/                    # Static brand assets & background illustrations
├── scripts/                   # Migration, sync, and verification tools
│   ├── import-data.ts        # University spreadsheet master import engine
│   ├── patch-worker.mjs      # OpenNext worker patch for scheduled warmups
│   ├── sync-to-remote-d1.ts  # D1 remote migration synchronizer
│   ├── test-concurrency.ts   # Concurrent registration race-condition test
│   ├── test-all-buttons-and-endpoints.ts # E2E API suite
│   ├── test-exports.ts       # Full-dataset export regression suite (68 tests)
│   ├── test-kpi-and-breakdowns.ts # KPI & gender analytics suite (96 tests)
│   ├── test-spoc-kpis.ts     # SPOC department metrics suite (28 tests)
│   └── test-multiple-spocs.ts # Multi-SPOC CRUD correctness (7 tests)
├── services/                  # Business logic services
│   └── registration.service.ts # Core seat reservation transaction engine
├── types/                     # TypeScript domain type definitions
├── open-next.config.ts        # Cloudflare OpenNext build configuration
└── wrangler.jsonc             # Cloudflare Workers, D1 & R2 binding definition
```

---

## 📜 Key Architectural Guarantees

1. **Deterministic Quota Hierarchy:**
   - Level 1: Department-Specific Limits (`DepartmentRegistrationLimit`)
   - Level 2: Project-Specific Limits (`Project.sameDeptLimit`, `Project.otherDeptLimit`)
   - Level 3: Global Institutional Configuration (`GlobalConfig`)
2. **Edge Export Optimization:**
   - Full-dataset CSV / Excel / PDF exports bypass pagination and stream directly from D1 SQL batch queries — zero `Error 1102` CPU limit violations.
3. **Multi-SPOC Architecture:**
   - Any school can have multiple active SPOCs simultaneously. SPOC identity is scoped by email (unique), not department. Creating a new SPOC never overwrites an existing one.
4. **Pre-Wipe Safety Guarantee:**
   - Any bulk wipe action is gated by an automated verification export to Cloudflare R2 before any records can be modified.
5. **Gender & School Analytics Normalisation:**
   - All gender values (`male`, `MALE`, `Male`, `M`) and school acronyms (`SOES`, `SoEngineering`, etc.) are canonicalised server-side before aggregation so KPI dashboards always show accurate breakdowns.
6. **Data Privacy & FERPA Compliance:**
   - Passcodes hashed using bcrypt. Student mobile numbers and credentials stored securely with consent logs and no public exposure.
7. **Active Semester Upload Gating:**
   - Document submissions (reports, presentation slides, consent forms) are strictly locked to the administrator-configured active semester (`Semester 3` or `Semester 4`). Inactive semester upload buttons are disabled and non-clickable on client portals and enforced with HTTP 403 at the API layer.

---

## 👨‍💻 Project Governance & Authors

Developed for **G D Goenka University** under the leadership of:

| Name | Role | Profile | Affiliation |
|------|------|---------|-------------|
| **Dr. Satya Prakash** | Project Lead & Principal Investigator | [@Dr-Satya](https://github.com/Dr-Satya) | Avishkar CIE, School of Engineering & Sciences, GD Goenka University |
| **Potla Sri Sharan** | Lead Developer & Systems Architect | [@potlasrisharan](https://github.com/potlasrisharan) | Avishkar CIE, GD Goenka University |
| **Sarthak Singh** | Developer & Operations | [@SarthakSingh](https://github.com/SarthakSingh) | Avishkar CIE, GD Goenka University |

> **Key Contributor & Lead Developer:** **Potla Sri Sharan** ([@potlasrisharan](https://github.com/potlasrisharan)) engineered the core full-stack portal architecture, Cloudflare Edge Workers & D1 database integration, real-time quota controls, and end-to-end multi-role portal security.

---

## 📊 Platform Statistics (November 2026)

| Metric | Value |
|--------|-------|
| Total Students | 2,238+ |
| Active Projects | 188+ |
| Schools Covered | 11 |
| Test Coverage | 200+ assertions across 7 suites |
| Uptime Target | 99.9% (Cloudflare SLA) |
| Export Speed | Full dataset < 2.5 s |

---

## 📄 License

This software is proprietary and confidential.  
© 2024–2026 **Avishkar Centre for Innovation and Entrepreneurship (CIE)**, G D Goenka University, Gurugram, Haryana, India.  
All rights reserved. See [LICENSE](./LICENSE) for full terms.
