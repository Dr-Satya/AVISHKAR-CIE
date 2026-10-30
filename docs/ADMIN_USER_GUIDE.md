# GDGU IDP Portal — System Administrator User Guide

> **Inter-Disciplinary Project (IDP) Portal**  
> **Target Audience:** University System Administrators, Dean of Academics, & Central IDP Operations  
> **Portal URL:** `https://idp.gdgu.org/admin/login` (or `http://localhost:3000/admin/login` for local instances)

---

## Table of Contents
1. [Administrative Scope & Architecture](#1-administrative-scope--architecture)
2. [Authentication & Security Protocols](#2-authentication--security-protocols)
   - [2.1 Admin Credentials & Session Management](#21-admin-credentials--session-management)
   - [2.2 Privilege Hierarchy](#22-privilege-hierarchy)
3. [Global Executive Dashboard & Live KPIs](#3-global-executive-dashboard--live-kpis)
   - [3.1 Real-Time Metrics & Capacity Counters](#31-real-time-metrics--capacity-counters)
   - [3.2 Server-Sent Events (SSE) Synchronization](#32-server-sent-events-sse-synchronization)
4. [Master Configuration & Department Quotas (DASHBOARD Tab)](#4-master-configuration--department-quotas-dashboard-tab)
   - [4.1 The Master Registration Kill Switch](#41-the-master-registration-kill-switch)
   - [4.2 Global Default Seat Parameters](#42-global-default-seat-parameters)
   - [4.3 Department-Specific Quota Overrides & Precedence](#43-department-specific-quota-overrides--precedence)
   - [4.4 SMS OTP & Contact Verification Controls](#44-sms-otp--contact-verification-controls)
   - [4.5 SPOC Designation & Role Mapping](#45-spoc-designation--role-mapping)
5. [Registrations & Bulk Allocation Engine (REGISTRATION Tab)](#5-registrations--bulk-allocation-engine-registration-tab)
   - [5.1 Monitoring Active Student Registrations](#51-monitoring-active-student-registrations)
   - [5.2 Manual Administrative Overrides (Reallocation & Cancellation)](#52-manual-administrative-overrides-reallocation--cancellation)
   - [5.3 The Concurrency-Safe Bulk Auto-Registration Algorithm](#53-the-concurrency-safe-bulk-auto-registration-algorithm)
   - [5.4 Dry Run vs Live Execution Mode](#54-dry-run-vs-live-execution-mode)
   - [5.5 Interpreting Skip Reason Codes](#55-interpreting-skip-reason-codes)
6. [University Projects Inventory (PROJECTS Tab)](#6-university-projects-inventory-projects-tab)
   - [6.1 Full Project Inventory & Multi-Dimensional Filtering](#61-full-project-inventory--multi-dimensional-filtering)
   - [6.2 Adding, Editing, and Deleting Projects](#62-adding-editing-and-deleting-projects)
   - [6.3 Custom Project-Specific Seat Limits](#63-custom-project-specific-seat-limits)
7. [Faculty Access & Credential Governance (FACULTY Tab)](#7-faculty-access--credential-governance-faculty-tab)
   - [7.1 Faculty Roster & Workload Oversight](#71-faculty-roster--workload-oversight)
   - [7.2 Provisioning New Faculty & Resetting Passcodes](#72-provisioning-new-faculty--resetting-passcodes)
   - [7.3 Granting and Revoking SPOC Privileges](#73-granting-and-revoking-spoc-privileges)
8. [Data Governance, Imports & Year Rollover (DATABASE Tab)](#8-data-governance-imports--year-rollover-database-tab)
   - [8.1 Bulk Excel Data Imports (Students, Faculty, Projects)](#81-bulk-excel-data-imports-students-faculty-projects)
   - [8.2 Downloading Standardized Import Templates](#82-downloading-standardized-import-templates)
   - [8.3 The Institutional Master Cohort Workbook (.xlsx)](#83-the-institutional-master-cohort-workbook-xlsx)
   - [8.4 Database Backups and Restore Operations](#84-database-backups-and-restore-operations)
   - [8.5 Academic Year Rollover & Archival Procedures](#85-academic-year-rollover--archival-procedures)
   - [8.6 System Audit Logs & Forensic Trail](#86-system-audit-logs--forensic-trail)
9. [Disaster Recovery & Operational Runbooks](#9-disaster-recovery--operational-runbooks)

---

## 1. Administrative Scope & Architecture

The Central IDP Administrator controls all configuration, allocation rules, user credentials, data imports, and academic lifecycles for the G D Goenka University Inter-Disciplinary Project Portal.

The portal enforces clean architectural boundaries:
- **Relational Integrity:** PostgreSQL / SQLite backed by Prisma ORM with strict foreign keys and cascading rules.
- **Concurrency Protection:** Row-level locking (`SELECT ... FOR UPDATE`) during all registration and bulk allocation transactions.
- **Three-Tier Quota Precedence:**
  1. *Department-Specific Override* (`DepartmentRegistrationLimit`)
  2. *Project-Specific Limit* (`Project.sameDeptLimit`, `Project.otherDeptLimit`)
  3. *Global Default Configuration* (`GlobalConfig`)

---

## 2. Authentication & Security Protocols

```
+-------------------------------------------------------------+
|                      ADMINISTRATOR LOGIN                    |
|                                                             |
|  Email:    [ admin@gdgu.org                               ] |
|  Passcode: [ ******************                           ] |
|                                                             |
|                   [ Authenticate as Admin ]                 |
+-------------------------------------------------------------+
```

### 2.1 Admin Credentials & Session Management
- **URL:** `/admin/login`
- **Default Superadmin Email:** `admin@gdgu.org`
- **Default Passcode:** `admin@gdgu2026`
- **Session Lifespan:** Secure, HTTP-only cookie with same-site protection. Logging out invalidates the server session immediately.

### 2.2 Privilege Hierarchy
- **ADMIN:** Unrestricted read/write access to all departments, global configurations, database operations, user accounts, and audit trails.
- **SPOC:** Read/write access strictly bounded to their assigned department's projects, faculty, deliverables, and student rosters.
- **FACULTY:** Bounded to their assigned projects, student roster grading, deliverable uploads, and proposals.
- **STUDENT:** Read access to catalog, write access to their single personal registration and mobile declaration.

---

## 3. Global Executive Dashboard & Live KPIs

The Administrator Portal features five segregated operational tabs: **DASHBOARD**, **REGISTRATION**, **PROJECTS**, **FACULTY**, and **DATABASE**.

```
+---------------------------------------------------------------------------------------------------+
| GDGU IDP EXECUTIVE MONITOR                                                                        |
|                                                                                                   |
| [ 2,450 Total Students ] [ 188 Active Projects ] [ 2,120 Registrations ] [ 2,120 / 2,450 Seats ]  |
| Overall Seat Utilization: 86.5% | SSE Stream: ACTIVE                                              |
+---------------------------------------------------------------------------------------------------+
```

### 3.1 Real-Time Metrics & Capacity Counters
- **Total Students:** Count of all active students in the master roster.
- **Total Projects:** Active approved IDP projects.
- **Total Registrations:** Confirmed allocations across the university.
- **Seats Filled Ratio:** Visual meter showing cumulative seat consumption versus global available capacity.

### 3.2 Server-Sent Events (SSE) Synchronization
- Connected to `/api/events`.
- Automatically increments counters, updates quota gauges, and syncs tables whenever a student registers or an administrator modifies allocations. Manual browser reloads are unnecessary.

---

## 4. Master Configuration & Department Quotas (DASHBOARD Tab)

```
+-----------------------------------------------------------------------------------------+
| GLOBAL CONFIGURATION CARD                                                               |
|                                                                                         |
| Master Registration Window: [ (•) OPEN / ACTIVE     ( ) CLOSED / HALTED ]               |
| Global Default Max Seats:   [ 10 ]                                                      |
| Global Same-Department:     [ 4  ]                                                      |
| Global Other-Department:    [ 6  ]                                                      |
| SMS OTP Verification:       [ ( ) Enabled  (•) Disabled (Double-Entry Enforced) ]       |
|                                                                                         |
|                             [ Save Global Configuration ]                               |
+-----------------------------------------------------------------------------------------+
```

### 4.1 The Master Registration Kill Switch
- Toggling **Registration Window** to `CLOSED` immediately freezes the student portal.
- All "Register" buttons across all student devices are instantly disabled.
- Use this during maintenance windows, data reconciliations, or when moving from self-service registration to bulk automated allocation.

### 4.2 Global Default Seat Parameters
- Defines the baseline capacity for projects that do not have custom limits:
  - **Max Seats:** Maximum students per project (default: 10).
  - **Same-Department Limit:** Max students permitted from the mentor's department (default: 4).
  - **Other-Department Limit:** Minimum students required from other disciplines (default: 6).

### 4.3 Department-Specific Quota Overrides & Precedence
Different academic schools possess varying cohort sizes. The **Department Limits Card** allows granular overrides:
1. Under **Add Department Quota**, enter the Department name (e.g., *School of Law* or *Mechanical Engineering*).
2. Set specific **Same-Dept Limit** (e.g., `8`) and **Other-Dept Limit** (e.g., `2`).
3. Click **Add / Update Limit**.
4. The system updates the `DepartmentRegistrationLimit` table. Any student from that department registering for a project will now be governed by this higher-precedence rule.

### 4.4 SMS OTP & Contact Verification Controls
- Toggle whether two-factor SMS OTP or mandatory double-entry verification is required before student project registration.

### 4.5 SPOC Designation & Role Mapping
In the **SPOC Management Card**:
1. View all designated Department SPOCs.
2. Click **Assign New SPOC**.
3. Select an existing faculty member or enter an authorized email address.
4. Select the target department.
5. Set their initial access passcode and click **Confirm SPOC Assignment**.

---

## 5. Registrations & Bulk Allocation Engine (REGISTRATION Tab)

```
+-----------------------------------------------------------------------------------------+
| BULK AUTO-REGISTRATION ENGINE                                                           |
|                                                                                         |
| Unallocated Students: 330   |   Available Capacity: 480 Seats                           |
| Mode: [ (•) Dry Run Simulation     ( ) Live Execution & Commit ]                        |
|                                                                                         |
| [ Execute Concurrency-Safe Bulk Allocation Engine ]                                     |
|                                                                                         |
| Simulation Summary:                                                                     |
| -> Successfully Allocated: 326 Students                                                 |
| -> Skipped / Unallocated:  4 Students                                                   |
|    Reason: No remaining eligible seats matching department quota limits                 |
+-----------------------------------------------------------------------------------------+
```

### 5.1 Monitoring Active Student Registrations
The **Registrations Table Card** displays every confirmed project seat in the university:
- Student Enrollment, Student Name, Department, Allocated Project ID, Mentor Name, Timestamp.
- Searchable by student enrollment number or filterable by department.

### 5.2 Manual Administrative Overrides (Reallocation & Cancellation)
Administrators retain full authority to adjust allocations:
- **Cancel Registration:** Click **Unmap / Delete** on any student row. The student's seat is immediately unlocked and returned to the project's available quota.
- **Reallocate Student:** Click **Reallocate**, select the destination Project ID from the dropdown, and confirm. The system moves the student inside an atomic transaction, decrementing the old project's count and incrementing the new project's count.

### 5.3 The Concurrency-Safe Bulk Auto-Registration Algorithm
When the self-service student registration window closes, many students may remain unallocated. The portal contains an automated allocation engine:
1. Queries all students where `Registration IS NULL`.
2. Sorts eligible projects in **ascending order of current enrollment** (filling the emptiest projects first to balance faculty workloads).
3. Evaluates all three quota layers (Department Override $\rightarrow$ Project Custom Limit $\rightarrow$ Global Default).
4. Executes allocations in transaction-safe batches with zero risk of overbooking.

### 5.4 Dry Run vs Live Execution Mode
- **Dry Run Simulation:** Evaluates all allocation logic and produces an exact impact report without writing changes to the database. Always perform a Dry Run first.
- **Live Execution & Commit:** Permanently writes registrations to the database, sends SSE events, and updates student dashboard statuses.

### 5.5 Interpreting Skip Reason Codes
If students cannot be allocated during bulk execution:
- `QUOTA_EXHAUSTED`: Projects have open seats, but the specific department limit for the student's branch is full.
- `CAPACITY_REACHED`: Total university project capacity is lower than the remaining student body. (Requires adding new projects or increasing max seats).

---

## 6. University Projects Inventory (PROJECTS Tab)

The **Projects Table Card** manages the central project master register (188+ projects).

```
+-----------------------------------------------------------------------------------------+
| Search: [               ] Filter Dept: [ All v ] Category: [ All v ] Status: [ All v ]  |
|                                                                                         |
| ID    Title                                  Dept   Mentor       Seats   Status Actions |
| P001  Autonomous Electric Vehicle Powertrain EEE    Dr. S. Kumar 10/10   Active [Edit]  |
| P080  Solar Tracking Agricultural Drone      CSE    Dr. D. Roy   10/10   Active [Edit]  |
|                                                                                         |
| [+ Add New Project ]                                                                    |
+-----------------------------------------------------------------------------------------+
```

### 6.1 Full Project Inventory & Multi-Dimensional Filtering
- Filter projects by Department, Research Category, Theme, or Submission Status (`APPROVED`, `PENDING`, `REJECTED`, `NOT_SUBMITTED`).
- View total seats allocated vs maximum seat caps.

### 6.2 Adding, Editing, and Deleting Projects
- **Add Project:** Click `+ Add New Project`. Fill in Project ID (e.g., `P189`), Title, Category, Theme, SDG Mapping, Department, and Faculty Mentor.
- **Edit Project:** Modify title, change mentor assignment, or alter custom seat parameters.
- **Delete Project:** Deleting a project is restricted if active student registrations exist. The administrator must first reallocate or unmap students before removing the project record.

### 6.3 Custom Project-Specific Seat Limits
- If a high-demand project requires a specialized team (e.g., 6 CSE students and 4 Management students), edit the project and set explicit `sameDeptLimit` and `otherDeptLimit` values directly on the project card.

---

## 7. Faculty Access & Credential Governance (FACULTY Tab)

The **Faculty Access Card** provides master identity governance over all teaching staff.

```
+-----------------------------------------------------------------------------------------+
| Faculty Directory                                               [ + Add Faculty Member ]|
|                                                                                         |
| Name                 Department     Email                  SPOC Status    Actions       |
| Dr. Debajyoti Roy    CSE            debajyoti.roy@gdgu.org --             [Reset] [Edit]|
| Prof. Shipra         Design         shipra@uid.edu.in      SPOC (Design)  [Revoke SPOC] |
+-----------------------------------------------------------------------------------------+
```

### 7.1 Faculty Roster & Workload Oversight
- Inspect all registered faculty across all schools.
- View total projects supervised per faculty member.

### 7.2 Provisioning New Faculty & Resetting Passcodes
- **Add Faculty Member:** Enter Name, Department, Official Email, and Phone. The system generates an account with the default passcode (`gdgu@2026`).
- **Reset Passcode:** If a faculty member forgets their passcode:
  1. Click **Reset Passcode** on their row.
  2. Choose to generate a default passcode (`gdgu@2026`) or specify a custom secure string.
  3. The system immediately hashes the new passcode with bcrypt and invalidates stale sessions.

### 7.3 Granting and Revoking SPOC Privileges
- Click **Grant SPOC** to elevate a faculty member to departmental coordinator.
- Click **Revoke SPOC** to downgrade them back to standard supervisor permissions.

---

## 8. Data Governance, Imports & Year Rollover (DATABASE Tab)

The **Database Operations Hub** houses institutional data management tools.

```
+-------------------------------------------------------------+
|                 DATABASE OPERATIONS & DATA HUB              |
|                                                             |
|  [ Bulk Import (Excel) ]       [ Download Templates ]       |
|  [ Master Cohort Workbook ]    [ Academic Year Rollover ]   |
|  [ Database Backup & Restore ] [ View Audit Logs ]          |
+-------------------------------------------------------------+
```

### 8.1 Bulk Excel Data Imports (Students, Faculty, Projects)
1. Click **Bulk Import (Excel)**.
2. Select the import entity:
   - `Students`: Ingests enrollment numbers, student names, departments, programmes, batches.
   - `Faculty`: Ingests faculty names, departments, and official emails.
   - `Projects`: Ingests project codes, titles, themes, categories, and mentor mappings.
   - `Previous Registrations`: Migrates historical allocations.
3. Upload the `.xlsx` spreadsheet.
4. The import parser performs pre-flight validation, checking for duplicate keys, missing fields, or invalid emails, and reports a detailed ingest summary.

### 8.2 Downloading Standardized Import Templates
- Click **Download Templates** to obtain officially formatted `.xlsx` files with preset header columns and sample rows. Always use these templates to prevent schema parse failures.

### 8.3 The Institutional Master Cohort Workbook (.xlsx)
Click **Download Complete IDP Cohort Workbook** to generate a five-sheet institutional spreadsheet:
- **Sheet 1: Executive KPI Summary:** Overall metrics, seat fill percentages, registration completion rate.
- **Sheet 2: Registered Students:** Complete master list of every allocated student, enrollment number, department, project title, and assigned mentor.
- **Sheet 3: Unregistered Students:** Exception report listing students requiring academic intervention.
- **Sheet 4: Projects & Capacity:** Complete inventory of all projects, seat quotas, same/other department allocations, and mentor details.
- **Sheet 5: Department Breakdown:** Statistical breakdown of capacity and allocations grouped by academic department.

### 8.4 Database Backups and Restore Operations
- **Create Backup:** Click **Create Snapshot Backup**. The system creates a timestamped SQL/DB dump in the server's `backups/` directory.
- **Restore Point:** In the event of system corruption or erroneous data import, select a verified timestamped backup from the list and confirm restoration.

### 8.5 Academic Year Rollover & Archival Procedures
At the completion of an academic cycle (e.g., transition from `2025-2026` to `2026-2027`):
1. Click **Academic Year Rollover**.
2. Enter the new Academic Year string (e.g., `2026-2027`) and active semester (e.g., `3`).
3. Select archival options:
   - *Archive existing student registrations to historical audit records.*
   - *Preserve faculty accounts and project catalog.*
   - *Reset registration counts to zero for the upcoming semester.*
4. Type `CONFIRM-ROLLOVER` in the verification box and click **Execute Year Rollover**.

### 8.6 System Audit Logs & Forensic Trail
- Tracks every administrative transaction, actor email, IP timestamp, action type (`REGISTRATION_CANCELLED`, `CONFIG_UPDATED`, `BULK_ALLOCATION_RUN`), target entity, and payload metadata for compliance and security auditing.

---

## 9. Disaster Recovery & Operational Runbooks

### Runbook 1: High-Concurrency Registration Rush
- **Scenario:** 2,000+ students attempt to register simultaneously at window opening.
- **Action:**
  1. The portal automatically utilizes connection pooling and row-level locks.
  2. SSE throttling prevents thundering herd API spam.
  3. If database latency spikes, temporarily toggle the **Registration Window** to `CLOSED`, inspect connection saturation, and reopen once stable.

### Runbook 2: Resolving Project Overbooking Inconsistencies
- **Scenario:** A legacy import or manual data intervention caused a project to exceed max seats.
- **Action:**
  1. Navigate to **REGISTRATION** tab.
  2. Filter by the overbooked Project ID.
  3. Contact the faculty mentor to identify the most recent student addition.
  4. Use the **Reallocate** button to transfer the student to an adjacent project with open capacity.
