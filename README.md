# GDGU Project Registration Portal

Production-quality Inter-Disciplinary Project (IDP) Registration Portal for G.D. Goenka University built with Next.js 14, TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM.

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v20.20.1)
- **PostgreSQL**: v14+ running locally on port 5432

### 2. Environment Setup
The `.env` file is pre-configured for local execution:
```bash
cp .env.example .env
```
Ensure your database `gdgu_idp` exists:
```bash
createdb gdgu_idp
```

### 3. Install & Sync Database
```bash
npm install
npm run db:push
```

### 4. Import Datasets from Excel Files
Normalizes and seeds all 188 projects, faculty accounts, student master data, and existing registrations directly from the provided Excel spreadsheets:
```bash
npm run import:data
```

### 5. Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Automated Concurrency & Rule Testing
Run the automated test suite simulating concurrent student registrations, verifying zero overbooking, quota enforcement, and kill-switch safety:
```bash
npx tsx scripts/test-concurrency.ts
```

---

## 🔑 Default Credentials for Local Testing

### System Administrator
- **URL:** `/admin/login`
- **Email:** `admin@gdgu.org`
- **Passcode:** `admin@gdgu2026`

### Faculty
- **URL:** `/faculty/login`
- **Sample Email:** `debajyoti.roy@gdgu.org` or `shipra@uid.edu.in`
- **Default Passcode:** `gdgu@2026`
- *Faculty can change their passcode anytime from their portal dashboard.*

### Student
- **URL:** `/student/login`
- **Sample Registered Student:** `250040205005@gdgu.org` (Aarshiya Lahiry, registered for P080)
- **Sample Unregistered Student:** `250010301003@gdgu.org` (Sandhya Verma, MBA, Unregistered)
- *Enforces @gdgu.org Google official email authentication.*

---

## 📐 System Architecture

### 1. Database & Schema
- **PostgreSQL & Prisma ORM**: Fully normalized relational schema with unique constraints on `Student.enrollmentNumber`, `Faculty.email`, `Project.projectId`, and `Registration.studentId`.
- **Constraint Precedence**:
  1. Department-Specific Override (`DepartmentRegistrationLimit`)
  2. Project-Specific Limit (`Project.sameDeptLimit`, `Project.otherDeptLimit`)
  3. Global Default Configuration (`GlobalConfig`)

### 2. Concurrency & Transaction Safety
- Uses PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) inside atomic database transactions.
- Zero overbooking guarantee even when multiple students submit registrations for the same last seat at the exact same millisecond.

### 3. Bulk Registration Engine
- Evaluates identical transaction-safe constraints as individual registrations.
- Sorts projects by current registration count ascending (filling the emptiest projects first).
- Respects project maximum seats, same-department quotas, and other-department quotas.
- Records and displays detailed reason codes for any skipped students.

### 4. Real-Time Synchronization
- Server-Sent Events (SSE) via `/api/events` automatically syncs Admin KPI counters, project seat ratios, and faculty student rosters without manual browser refresh.

### 5. Responsive Visual Design
- Faithful recreation of the GDGU visual identity: deep navy headers (`#0d2137`), university gold accent bars (`#cda34f`), crisp white cards, and responsive table-to-card transitions for mobile viewports.
