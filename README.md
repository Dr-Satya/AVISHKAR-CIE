# GDGU IDP (Inter-Disciplinary Project) Portal

Production Inter-Disciplinary Project (IDP) Registration and Management Portal for G D Goenka University (Avishkar - Centre for Innovation and Entrepreneurship).

Engineered with Next.js 14, TypeScript, Tailwind CSS, Prisma ORM, and deployed on Cloudflare Workers using OpenNext, Cloudflare D1 (distributed SQL database), and Cloudflare R2 (object storage).

---

## 🚀 Technology Stack

- **Framework:** Next.js 14 (App Router, Server Actions, Edge / Node API routes)
- **Runtime & Deployment:** Cloudflare Workers via `@opennextjs/cloudflare`
- **Database:** Cloudflare D1 (SQLite-compatible distributed relational database) / Local SQLite for development
- **ORM & Data Layer:** Prisma ORM with `@prisma/adapter-d1` and direct D1 SQL batching for low-latency operations
- **File Storage:** Cloudflare R2 (S3-compatible object storage for project presentations, reports, and database archives)
- **Styling:** Tailwind CSS with official GDGU navy (`#0a192f`) and university gold (`#c59b27`) palette
- **Exports:** Streaming Excel workbook generation via SheetJS (`xlsx`)

---

## 💻 Local Development

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v20+)
- **Cloudflare Wrangler CLI**: v4+ (installed via `devDependencies`)

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Database Sync & Seeding
```bash
# Push Prisma schema to local dev.db
npm run db:push

# Generate Prisma Client
npm run db:generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Cloudflare Deployment

### 1. Build for Cloudflare OpenNext
```bash
npm run build:cf
```

### 2. Deploy to Cloudflare Workers
```bash
npx wrangler deploy
```

Production Worker: `https://gdgu-idp-portal.cie-1e4.workers.dev`

---

## 🔑 Login Portals & Access

| Role | Login URL | Default / Sample Credentials | Notes |
|---|---|---|---|
| **System Admin** | `/admin/login` | `admin@gdgu.org` / `admin@gdgu2026` | Full administrative controls, cohort management, quota overrides, safe wipe |
| **Faculty Mentor** | `/faculty/login` | Email (e.g. `debajyoti.roy@gdgu.org`) / `gdgu@2026` | Roster review, project manuscript uploads, passcode change |
| **Department SPOC** | `/spoc/login` | Email (e.g. `dr.akhileshlatoria@gdgu.org`) / `gdgu@2026` | Milestone evaluation, manuscript similarity reviews, department filtering |
| **Student (Unregistered)** | `/student/login` | `250010301003@gdgu.org` (Sandhya Verma) | Authenticates via Google OAuth (@gdgu.org) or enrollment ID verification |
| **Student (Registered)** | `/student/login` | `250040205005@gdgu.org` (Aarshiya Lahiry, P080) | Displays project details, faculty contact, and submission status |

---

## 🛡️ Key Features & Architectural Guarantees

1. **Transaction-Safe Seat Allocation:**
   - Real-time seat validation enforcing Department-Specific limits, Project-Specific limits, and Global defaults.
   - Atomic conditional reservations preventing race conditions and zero overbooking.

2. **Ultra-Low-Latency Edge Exports:**
   - Cohort details and full database backups run on direct D1 SQL batch queries with streaming `ArrayBuffer` responses, avoiding Worker CPU timeouts.

3. **Safe Wipe & Data Management:**
   - Atomic pre-wipe export verification to Cloudflare R2 before any records are modified or purged.
   - Comprehensive audit logging (`AuditLog`) for all sensitive operations.

4. **Multi-Role RBAC:**
   - Encrypted HTTP-only JWT session management with distinct privilege boundaries for Students, Faculty, Department SPOCs, and Administrators.

---

## 📂 Repository Structure

```
├── app/                    # Next.js 14 App Router (pages and API routes)
│   ├── admin/             # Admin console and dashboards
│   ├── api/               # Serverless API endpoints
│   ├── faculty/           # Faculty mentor interface
│   ├── spoc/              # School SPOC review interface
│   └── student/           # Student registration and status portal
├── components/             # Modular React UI components
│   ├── admin/             # Admin management modals and tables
│   ├── faculty/           # Faculty project views
│   └── student/           # Registration flows and project cards
├── lib/                    # Core business logic and database adapters
│   ├── auth.ts            # JWT authentication and session handling
│   ├── data-management.ts # D1-optimized export, wipe, and audit engine
│   ├── prisma.ts          # Edge-compatible Prisma client instance
│   └── quota.ts           # Department and project seat allocation rules
├── prisma/                 # Database schema definition
├── public/                 # Static assets, university logos, and favicons
└── scripts/                # Database migrations, seeders, and build patches
```

---

## 📄 License
Avishkar - Centre for Innovation and Entrepreneurship (CIE), G D Goenka University.
