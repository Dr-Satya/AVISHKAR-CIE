# GDGU IDP Portal — Avishkar CIE

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Database-Cloudflare_D1-orange?logo=cloudflare)](https://developers.cloudflare.com/d1/)
[![Cloudflare R2](https://img.shields.io/badge/Storage-Cloudflare_R2-F38020?logo=cloudflare)](https://developers.cloudflare.com/r2/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

Official Inter-Disciplinary Project (IDP) Registration and Lifecycle Management Portal for **G D Goenka University**, engineered by the **Avishkar Centre for Innovation and Entrepreneurship (CIE)**.

Deployed at scale on the Cloudflare Edge network to deliver millisecond-latency student registration, project lifecycle tracking, milestone evaluations, and automated multi-tier quota enforcement.

🌐 **Production Application:** [https://gdgu-idp-portal.cie-1e4.workers.dev](https://gdgu-idp-portal.cie-1e4.workers.dev)

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

Run automated verification suites covering concurrency, API endpoints, and database constraints:

```bash
# Concurrency & Zero-Overbooking Stress Test
npm run test:concurrency

# End-to-End API Endpoints & Business Logic Test
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
│   └── test-all-buttons-and-endpoints.ts # E2E API suite
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
   - Cohort details and full database exports execute in under 2.5 seconds via direct D1 SQL batch queries with zero Worker CPU time limit violations (`Error 1102`).
3. **Pre-Wipe Safety Guarantee:**
   - Any bulk wipe action is gated by an automated verification export to Cloudflare R2 before any records can be modified.
4. **Data Privacy & FERPA Compliance:**
   - Passcodes hashed using bcrypt. Student mobile numbers and credentials stored securely with consent logs and no public exposure.

---

## 👨‍💻 Project Governance & Authors

Developed for **G D Goenka University** under the leadership of:

- **Dr. Satya Prakash** — Avishkar Centre for Innovation and Entrepreneurship (CIE), School of Engineering and Sciences, G.D. Goenka University
- **Potla Sri Sharan** — Avishkar Centre for Innovation and Entrepreneurship (CIE), G.D. Goenka University
- **Sarthak Singh** — Avishkar Centre for Innovation and Entrepreneurship (CIE), G.D. Goenka University

---

## 📄 License

Proprietary — All rights reserved by **Avishkar Centre for Innovation and Entrepreneurship (CIE)**, G D Goenka University, Gurugram, Haryana, India.
