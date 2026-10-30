# G D Goenka University — Inter-Disciplinary Project (IDP) Portal
## Comprehensive Master User Manual & Operational Reference

> **Document Classification:** Master Institutional Standard Operating Procedure (SOP)  
> **System Name:** GDGU Inter-Disciplinary Project (IDP) Registration & Management Portal  
> **Affiliated Center:** Avishkar Center for Innovation & Entrepreneurship (CIE)  
> **Academic Session:** 2025–2026 / 2026–2027  
> **Version:** 2.0 (Production Release)

---

## Executive Table of Contents
1. [Institutional Mission & Portal Objectives](#1-institutional-mission--portal-objectives)
2. [Technical Architecture & Security Foundations](#2-technical-architecture--security-foundations)
   - [2.1 Tech Stack & Relational Data Model](#21-tech-stack--relational-data-model)
   - [2.2 Concurrency Engine & Zero-Overbooking Guarantees](#22-concurrency-engine--zero-overbooking-guarantees)
   - [2.3 Multi-Layered Quota Precedence Engine](#23-multi-layered-quota-precedence-engine)
   - [2.4 Real-Time Synchronization via Server-Sent Events (SSE)](#24-real-time-synchronization-via-server-sent-events-sse)
3. [User Role & Access Control Matrix](#3-user-role--access-control-matrix)
4. [End-to-End Academic Lifecycle (The 7 Phases)](#4-end-to-end-academic-lifecycle-the-7-phases)
5. [Complete Student User Manual](#5-complete-student-user-manual)
   - [5.1 Student Authentication & SSO Matching](#51-student-authentication--sso-matching)
   - [5.2 Mandatory Mobile Contact Declaration](#52-mandatory-mobile-contact-declaration)
   - [5.3 Category & Thematic Discovery Flow](#53-category--thematic-discovery-flow)
   - [5.4 Seat Evaluation & Concurrency-Safe Registration](#54-seat-evaluation--concurrency-safe-registration)
   - [5.5 Registered Student Dashboard & Faculty Coordination](#55-registered-student-dashboard--faculty-coordination)
6. [Complete Faculty Mentor User Manual](#6-complete-faculty-mentor-user-manual)
   - [6.1 Faculty Onboarding & Security Passcode Management](#61-faculty-onboarding--security-passcode-management)
   - [6.2 Project Oversight & Real-Time Student Rosters](#62-project-oversight--real-time-student-rosters)
   - [6.3 Student Contact Verification & Roster Exporting](#63-student-contact-verification--roster-exporting)
   - [6.4 Submitting New Research Project Proposals](#64-submitting-new-research-project-proposals)
   - [6.5 Capstone Deliverables & Plagiarism/AI Screening](#65-capstone-deliverables--plagiarism-ai-screening)
   - [6.6 Research Manuscript & Avishkar CIE Publication Tracking](#66-research-manuscript--avishkar-cie-publication-tracking)
7. [Complete Department SPOC User Manual](#7-complete-department-spoc-user-manual)
   - [7.1 Departmental Governance & KPI Health Card](#71-departmental-governance--kpi-health-card)
   - [7.2 Verification Tab: Deliverable & Plagiarism Auditing](#72-verification-tab-deliverable--plagiarism-auditing)
   - [7.3 Faculty Directory & Workload Monitoring](#73-faculty-directory--workload-monitoring)
   - [7.4 Student Roster & Unallocated Tracking](#74-student-roster--unallocated-tracking)
   - [7.5 Departmental Archival & ZIP Export Bundling](#75-departmental-archival--zip-export-bundling)
8. [Complete System Administrator User Manual](#8-complete-system-administrator-user-manual)
   - [8.1 Master Dashboard & Institutional Capacity Metrics](#81-master-dashboard--institutional-capacity-metrics)
   - [8.2 Master Registration Kill Switch & Global Policies](#82-master-registration-kill-switch--global-policies)
   - [8.3 Granular Departmental Quota Customization](#83-granular-departmental-quota-customization)
   - [8.4 The Concurrency-Safe Bulk Auto-Registration Engine](#84-the-concurrency-safe-bulk-auto-registration-engine)
   - [8.5 Manual Administrative Overrides & Reallocations](#85-manual-administrative-overrides--reallocations)
   - [8.6 Projects Inventory & Capacity Management](#86-projects-inventory--capacity-management)
   - [8.7 Faculty Identity & Access Control](#87-faculty-identity--access-control)
   - [8.8 Institutional Data Management & Excel Bulk Ingestion](#88-institutional-data-management--excel-bulk-ingestion)
   - [8.9 Academic Year Rollover & Complete Cohort Workbook](#89-academic-year-rollover--complete-cohort-workbook)
9. [Data Dictionaries, Schema & Verification Rules](#9-data-dictionaries-schema--verification-rules)
10. [Troubleshooting, FAQs & Institutional Runbooks](#10-troubleshooting-faqs--institutional-runbooks)

---

## 1. Institutional Mission & Portal Objectives

The **Inter-Disciplinary Project (IDP)** initiative at G D Goenka University (GDGU), operating in synergy with the **Avishkar Center for Innovation & Entrepreneurship (CIE)**, breaks down departmental silos and promotes cross-disciplinary problem-solving.

Undergraduate and postgraduate students from Engineering, Management, Design, Law, Applied Sciences, and Humanities unite into balanced teams to address real-world technological, social, and commercial challenges aligned with the United Nations Sustainable Development Goals (SDGs).

The IDP Portal serves as the institutional technology backbone, orchestrating:
- **Fair, Concurrency-Safe Allocation:** Eliminating overbooking and seat racing through database-level row locking.
- **Multidisciplinary Balance:** Enforcing same-department vs. other-department ratios on every project.
- **Academic Integrity Assurance:** Enforcing mandatory similarity and AI content audits on all deliverables before final sign-off.
- **Research Translation:** Tracking scholarly manuscripts, patents, and peer-reviewed publications bearing Avishkar CIE affiliations.

---

## 2. Technical Architecture & Security Foundations

```
+-------------------------------------------------------------------------------+
|                             CLIENT APPLICATION LAYER                          |
|  Student Portal (/student) | Faculty Portal (/faculty) | SPOC (/spoc) | Admin |
+-------------------------------------------------------------------------------+
                                      |
                           HTTPS / Next.js 14 App Router
                                      |
+-------------------------------------------------------------------------------+
|                               SERVER ENGINE                                   |
|  - Auth & Role Guards (/api/auth)    - Concurrency Lock Engine                |
|  - SSE Event Broadcaster (/api/events) - Multi-Tier Quota Evaluator           |
+-------------------------------------------------------------------------------+
                                      |
                                Prisma ORM
                                      |
+-------------------------------------------------------------------------------+
|                             DATA PERSISTENCE                                  |
|  - PostgreSQL / SQLite (Atomic Transactions, SELECT FOR UPDATE)               |
|  - Encrypted Storage (Passcodes hashed with bcrypt, Session Cookies)         |
+-------------------------------------------------------------------------------+
```

### 2.1 Tech Stack & Relational Data Model
- **Framework:** Next.js 14 with TypeScript and Tailwind CSS.
- **ORM & Database:** Prisma ORM connected to PostgreSQL / SQLite.
- **Security:** Encrypted, HTTP-only cookie sessions with role guards, bcrypt password hashing, and sanitized inputs.

### 2.2 Concurrency Engine & Zero-Overbooking Guarantees
During peak registration periods, thousands of students compete for limited project seats.
- When a student registers, the server executes an **Atomic Database Transaction**.
- The project record is locked using database row-level locking (`SELECT ... FOR UPDATE`).
- Current enrollment counts and department limits are re-validated in isolation.
- If all quota constraints pass, the registration record is written and the seat counter is updated.
- If two students submit for the final seat simultaneously, only the transaction that acquires the lock commits; the other transaction aborts cleanly with an explicit error. Overbooking is mathematically impossible.

### 2.3 Multi-Layered Quota Precedence Engine
The portal resolves project seat allocation limits through a strict three-tier precedence hierarchy:

```
[Tier 1: Department-Specific Override] (Highest Precedence)
               | (If no department limit exists)
               v
[Tier 2: Project-Specific Limit] (Configured directly on Project)
               | (If project limits are null)
               v
[Tier 3: Global System Configuration] (Baseline University Fallback)
```

1. **Department Registration Limit (`DepartmentRegistrationLimit`):** Overrides applied to specific departments with unique student populations.
2. **Project-Specific Limit (`Project.sameDeptLimit`, `Project.otherDeptLimit`):** Custom limits configured directly on an individual project.
3. **Global Configuration (`GlobalConfig`):** University-wide default (typically 10 max seats: 4 same-dept, 6 other-dept).

### 2.4 Real-Time Synchronization via Server-Sent Events (SSE)
- Persistent SSE connection stream at `/api/events`.
- Broadcasts real-time events (`registration.created`, `registration.cancelled`, `config.updated`).
- All active client portals update seat meters, KPI statistics, and student rosters automatically without requiring manual browser reloads.

---

## 3. User Role & Access Control Matrix

| Capability / Feature | Student | Faculty | Department SPOC | Central Admin |
| :--- | :---: | :---: | :---: | :---: |
| Authenticate via Official Email / Passcode | Yes (SSO/ID) | Yes (Passcode) | Yes (Passcode) | Yes (Passcode) |
| Mandatory Mobile Contact Declaration | Yes | Yes | Optional | N/A |
| Browse Projects Catalog & Thematic Filters | Yes | Yes | Yes | Yes |
| Self-Register for Project Seat | Yes (Single) | No | No | No |
| View Allocated Project & Faculty Contact | Yes (Post-Reg) | Yes | Yes | Yes |
| View Full Student Rosters & Contact Details | Personal Only | Own Projects | Department Only | University-Wide |
| Export Rosters (CSV, XLSX, PDF) | No | Own Projects | Department Only | University-Wide |
| Propose New IDP Research Project | No | Yes | Review & Endorse| Full Control |
| Upload Deliverables (Reports, PPTs) | No | Yes | Audit & Approve | Full Control |
| Enter Similarity % & Plagiarism Certificates | No | Yes | Audit & Approve | Full Control |
| Manuscript & Publication Tracking | No | Yes | Audit | Full Control |
| Approve / Reject Project Deliverables | No | No | Yes | Yes |
| Run Automated Concurrency-Safe Bulk Allocation| No | No | No | Yes |
| Manual Reallocation / Cancellation Overrides | No | No | No | Yes |
| Toggle Master Registration Kill Switch | No | No | No | Yes |
| Manage Faculty Accounts & Reset Passcodes | No | No | No | Yes |
| Bulk Excel Data Ingestion & Year Rollover | No | No | No | Yes |
| Generate Complete Multi-Sheet Cohort Workbook| No | No | No | Yes |

---

## 4. End-to-End Academic Lifecycle (The 7 Phases)

```
[Phase 1: Ingestion & Setup] -> [Phase 2: SPOC & Proposals] -> [Phase 3: Student Registration]
           |                                                                 |
[Phase 6: Quality Audit]     <- [Phase 5: Mentorship & Upload] <- [Phase 4: Bulk Allocation]
           |
[Phase 7: Cohort Archival & Rollover]
```

1. **Phase 1: Ingestion & Setup (Admin):** Admin imports Master Student, Faculty, and Project records via Excel; sets baseline seat quotas.
2. **Phase 2: SPOC & Proposals (Admin & Faculty):** SPOCs are mapped to departments; faculty propose new project topics for approval.
3. **Phase 3: Student Registration (Students & Admin):** Admin activates the registration window; students declare mobile numbers, browse catalog, and lock seat registrations.
4. **Phase 4: Bulk Allocation (Admin):** Registration window closes; Admin runs the bulk allocation engine to place remaining unallocated students.
5. **Phase 5: Mentorship & Upload (Faculty & Students):** Teams collaborate weekly; faculty mentors upload final reports, PPTs, and plagiarism certificates.
6. **Phase 6: Quality Audit (SPOC):** Department SPOCs audit deliverables, review plagiarism reports ($\le 10\%$), and approve/reject submissions.
7. **Phase 7: Cohort Archival & Rollover (Admin):** Admin downloads the complete institutional cohort workbook, archives records, and executes year rollover.

---

## 5. Complete Student User Manual

### 5.1 Student Authentication & SSO Matching
1. Access `/student/login`.
2. Input your institutional email address (`@gdgu.org`) or 12-digit university enrollment number.
3. Review and check the mandatory **Institutional Terms & Conditions and Mobile Number Declaration Policy** box.
4. Click **Continue to Student Portal**.
5. If direct matching is required, complete `/student/verify-enrollment` to link your active browser session.

### 5.2 Mandatory Mobile Contact Declaration
Before project registration is unlocked, you must confirm your active mobile number:
- Enter your 10-digit mobile number in the **Mobile Number** field.
- Re-enter the exact same 10 digits in **Confirm Mobile Number**.
- Tick the consent box authorizing phone number sharing with your assigned mentor.
- Click **Save Mobile Number**.

### 5.3 Category & Thematic Discovery Flow
- Select an institutional research category (e.g., *Sustainability & Clean Energy*, *Engineering & Deep Tech*, *Healthcare Innovation*).
- Select a specific sub-theme.
- The portal displays all projects offered under that domain in real time.

### 5.4 Seat Evaluation & Concurrency-Safe Registration
- Inspect Project Cards:
  - Project ID, Title, Mentor Name, Department, SDG mappings.
  - **Remaining Seats:** Total seats open.
  - **Same-Dept vs Other-Dept Quotas:** Check whether your branch's quota has open seats.
- Click **Register for Project**.
- Verify the modal summary and click **Confirm Registration**.
- The transaction commits atomically. Once confirmed, your seat is permanently reserved and locked.

### 5.5 Registered Student Dashboard & Faculty Coordination
Once allocated:
- Displays **Registration Confirmed · Locked**.
- Full project details and assigned Faculty Mentor card.
- Direct links:
  - **Send Email:** Opens an email draft to your mentor.
  - **Call Mentor:** Direct telephone connection to your supervisor's declared contact number.
- Self-service project switching or dropping is strictly disabled.

---

## 6. Complete Faculty Mentor User Manual

### 6.1 Faculty Onboarding & Security Passcode Management
1. Access `/faculty/login`.
2. Login with official email and default passcode (`gdgu@2026`).
3. Complete the mandatory phone number declaration modal.
4. Click **Change Passcode** in the top bar to update your account with a private, secure passcode.

### 6.2 Project Oversight & Real-Time Student Rosters
- View all assigned projects on your dashboard.
- Each card shows live capacity (e.g., `10/10 Allocated`), with separate counters for same-department and other-department students.
- Expanding a project card reveals the live student roster.

### 6.3 Student Contact Verification & Roster Exporting
- View student enrollment numbers, legal names, departments, programmes, and verified mobile numbers.
- Record internal continuous evaluation marks, external jury marks, and attendance percentages.
- Export rosters anytime using the top card buttons:
  - **CSV:** Formatted raw table.
  - **Excel (.xlsx):** Formatted institutional spreadsheet.
  - **PDF:** Formal university document with GDGU styling and sign-off blocks.

### 6.4 Submitting New Research Project Proposals
1. Click **+ Propose Project** in the top bar.
2. Complete Title, Category, Theme, Problem Description, and SDG mappings.
3. Define capacity (Max seats: 10, Same-dept: 4, Other-dept: 6).
4. Click **Submit for SPOC Approval**.

### 6.5 Capstone Deliverables & Plagiarism/AI Screening
1. On your project card, click **Upload Deliverable**.
2. Select type (`REPORT`, `PPT`, or `OTHER`).
3. Attach the deliverable file.
4. Input official **Similarity Index (%)** and **AI Content Index (%)** (both must be $\le 10\%$).
5. Upload the certified Plagiarism Report PDF.
6. Check the self-declaration box and submit for SPOC verification.

### 6.6 Research Manuscript & Avishkar CIE Publication Tracking
- Access **Manuscript Tracking** on your project card.
- Track communicated drafts: Target journal name, communicated draft file, and Avishkar CIE affiliation acknowledgment.
- Track published papers: Publication DOI URL, published PDF file, and Avishkar CIE citation verification.

---

## 7. Complete Department SPOC User Manual

### 7.1 Departmental Governance & KPI Health Card
1. Access `/spoc/login` with your authorized SPOC credentials.
2. If overseeing multiple disciplines, use the top bar **Department Dropdown** to switch active views.
3. Review the departmental executive KPI card:
   - Total Projects, Total Faculty, Total Department Students, Allocation Rate.
   - Deliverable Status Pipeline: Pending Review (Amber), Approved (Green), Rejected (Red), Not Submitted (Slate).

### 7.2 Verification Tab: Deliverable & Plagiarism Auditing
1. Filter projects by status (`Pending`, `Approved`, `Rejected`, `Not Submitted`).
2. Click **View Document** to review submitted reports or slide decks.
3. Click **View Plagiarism Report PDF** to inspect Turnitin/DrillBit certifications.
4. Click **Review Submission**:
   - Choose **APPROVE** to archive the compliant submission.
   - Choose **REJECT** and provide detailed, constructive feedback in the **SPOC Review Note** box.

### 7.3 Faculty Directory & Workload Monitoring
- Navigate to the **FACULTY** tab to monitor supervisor workloads.
- Identify faculty members who have not declared their phone numbers or who have deliverables overdue past university deadlines.

### 7.4 Student Roster & Unallocated Tracking
- Navigate to the **STUDENTS** tab.
- Click **Unallocated** to isolate students who have not yet secured a project.
- Work with departmental class coordinators to ensure students complete registration before the window closes.

### 7.5 Departmental Archival & ZIP Export Bundling
- **Single Project ZIP:** Click **Download ZIP** on any project card to export metadata, roster CSV, deliverable documents, and plagiarism certificates in one archive.
- **Department-Wide Archive:** In the **EXPORTS** tab, click **Download All Deliverables (.ZIP)**. The system dynamically packages all departmental project folders into a structured archive.

---

## 8. Complete System Administrator User Manual

### 8.1 Master Dashboard & Institutional Capacity Metrics
- Access `/admin/login` using `admin@gdgu.org` / `admin@gdgu2026`.
- Monitor live institutional KPIs:
  - Total Students across all university schools.
  - Total Approved Projects.
  - Total Registrations Completed.
  - Seats Filled Ratio (e.g., `2,120 / 2,450 Seats`).

### 8.2 Master Registration Kill Switch & Global Policies
In the **DASHBOARD** tab:
- **Registration Window:** Toggle to `CLOSED` to immediately freeze all student self-service registrations across the university. Toggle to `OPEN` when the registration window begins.
- Set Global Default Max Seats, Same-Department Limit, and Other-Department Limit.

### 8.3 Granular Departmental Quota Customization
In the **Department Limits Card**:
- Configure tailored seat limits for departments with atypical student counts.
- These rules automatically supersede global defaults when students from that department register.

### 8.4 The Concurrency-Safe Bulk Auto-Registration Engine
In the **REGISTRATION** tab:
1. When self-service registration ends, review the count of unallocated students.
2. Select **Dry Run Simulation** and click **Execute Bulk Allocation Engine**.
3. Review the simulation breakdown: projects filled, students placed, and any skipped student exceptions.
4. Select **Live Execution & Commit** and run the engine to permanently assign all eligible students.

### 8.5 Manual Administrative Overrides & Reallocations
In the **Registrations Table Card**:
- Search by student enrollment number or project ID.
- **Cancel Registration:** Unmaps the student and immediately restores the seat to the project.
- **Reallocate Student:** Atomically transfers the student to a chosen destination project without risking capacity errors.

### 8.6 Projects Inventory & Capacity Management
In the **PROJECTS** tab:
- Search, filter, add, edit, or delete projects across all 188+ university offerings.
- Override project-specific seat caps directly on individual project cards.

### 8.7 Faculty Identity & Access Control
In the **FACULTY** tab:
- Add new faculty members and view assigned project counts.
- Reset faculty passcodes (default `gdgu@2026` or custom string).
- Elevate faculty members to Department SPOCs or revoke SPOC privileges.

### 8.8 Institutional Data Management & Excel Bulk Ingestion
In the **DATABASE** tab:
- Click **Bulk Import (Excel)** to ingest master data files for Students, Faculty, Projects, or Historical Registrations.
- Click **Download Templates** to obtain standard formatted `.xlsx` templates.

### 8.9 Academic Year Rollover & Complete Cohort Workbook
- **Download Complete IDP Cohort Workbook:** Generates a 5-sheet institutional Excel master file:
  - *Sheet 1: Executive KPI Summary*
  - *Sheet 2: Registered Students Register*
  - *Sheet 3: Unregistered Students Exception List*
  - *Sheet 4: Projects & Capacity Inventory*
  - *Sheet 5: Department Allocation Breakdown*
- **Academic Year Rollover:** Archive the current semester/year, transition the active session (e.g., `2026-2027`), and reset registrations for the new cohort.

---

## 9. Data Dictionaries, Schema & Verification Rules

```
+--------------------+           +----------------------+           +--------------------+
|      Student       |           |     Registration     |           |      Project       |
|--------------------|           |----------------------|           |--------------------|
| id (PK)            |1       0..1| id (PK)              |0..*     1| id (PK)            |
| enrollmentNumber(U)|<--------->| studentId (FK, U)    |---------->| projectId (U)      |
| name, department   |           | projectId (FK)       |           | title, description |
| phone, phoneVerify |           | status               |           | maxSeats, limits   |
+--------------------+           +----------------------+           +--------------------+
                                                                              |1
                                                                              |0..*
                                                                    +--------------------+
                                                                    |  ProjectArtifact   |
                                                                    |--------------------|
                                                                    | id (PK)            |
                                                                    | projectId (FK)     |
                                                                    | type, title        |
                                                                    | similarityPercent  |
                                                                    | aiPercent, status  |
                                                                    +--------------------+
```

### Academic Integrity Verification Thresholds
- **Turnitin / Similarity Index:** Must be $\le 10\%$.
- **AI Content Index:** Must be $\le 10\%$.
- **Plagiarism Certificate:** Official PDF document upload mandatory.
- **Mentor Self-Declaration:** Mandatory affirmative confirmation before SPOC routing.

---

## 10. Troubleshooting, FAQs & Institutional Runbooks

### FAQ 1: A student cannot log into the portal.
- Verify whether the student is using their official `@gdgu.org` Google email or a valid 12-digit enrollment number.
- Ensure the student accepted the terms and condition checkbox.
- Check the Administrator **Students Table** to verify the student's record exists in the master database.

### FAQ 2: A project has remaining seats, but a student cannot register.
- Check the project's departmental quota breakdown. If the student belongs to the mentor's department and the **Same-Department Limit** has been reached, the student cannot take seats reserved for other departments.

### FAQ 3: How can a faculty member update their declared phone number?
- In the Faculty Portal, the faculty supervisor clicks the **Update Phone** button in the top navigation bar, enters the new 10-digit number twice, and clicks Save.

### FAQ 4: What is the procedure if a student transfers or drops out?
- The Central IDP Administrator opens the **REGISTRATION** tab in `/admin/portal`, searches for the student's enrollment number, and clicks **Unmap / Delete**. The allocated seat is instantly returned to the project.

### FAQ 5: What occurs during Academic Year Rollover?
- All existing registrations and deliverables are permanently archived with their academic year tag.
- Project catalogs and faculty profiles are retained.
- Registration tables are cleared for the new incoming academic term.
