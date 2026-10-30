# GDGU IDP Portal — Department SPOC User Guide

> **Inter-Disciplinary Project (IDP) Portal**  
> **Target Audience:** Departmental Single Points of Contact (SPOCs) & Academic Coordinators  
> **Portal URL:** `https://idp.gdgu.org/spoc/login` (or `http://localhost:3000/spoc/login` for local instances)

---

## Table of Contents
1. [Role Definition & Departmental Governance](#1-role-definition--departmental-governance)
2. [Authentication & Department Selection](#2-authentication--department-selection)
   - [2.1 Logging In](#21-logging-in)
   - [2.2 Switching Active Departments](#22-switching-active-departments)
3. [SPOC Executive KPI Dashboard](#3-spoc-executive-kpi-dashboard)
   - [3.1 Department Overview Metrics](#31-department-overview-metrics)
   - [3.2 Verification Pipeline Status](#32-verification-pipeline-status)
4. [Project & Artifact Verification Workflow](#4-project--artifact-verification-workflow)
   - [4.1 Reviewing Submitted Deliverables](#41-reviewing-submitted-deliverables)
   - [4.2 Auditing Plagiarism & AI Integrity Reports](#42-auditing-plagiarism--ai-integrity-reports)
   - [4.3 Approval and Rejection Protocols](#43-approval-and-rejection-protocols)
   - [4.4 Formulating Constructive Rejection Notes](#44-formulating-constructive-rejection-notes)
5. [Faculty Directory Management](#5-faculty-directory-management)
   - [5.1 Monitoring Faculty Project Offerings](#51-monitoring-faculty-project-offerings)
   - [5.2 Contact Status & Verification Audit](#52-contact-status--verification-audit)
6. [Departmental Student Roster & Tracking](#6-departmental-student-roster--tracking)
   - [6.1 Identifying Unallocated Students](#61-identifying-unallocated-students)
   - [6.2 Cross-Checking Marks & Attendance](#62-cross-checking-marks--attendance)
7. [Institutional Reporting & Bulk Export Tools](#7-institutional-reporting--bulk-export-tools)
   - [7.1 Tabular Exports (CSV, XLSX, PDF)](#71-tabular-exports-csv-xlsx-pdf)
   - [7.2 Single Project ZIP Bundles](#72-single-project-zip-bundles)
   - [7.3 Department-Wide Bulk ZIP Archiving](#73-department-wide-bulk-zip-archiving)
8. [SPOC Best Practices & Escalation Pathways](#8-spoc-best-practices--escalation-pathways)

---

## 1. Role Definition & Departmental Governance

The Departmental **Single Point of Contact (SPOC)** serves as the critical academic bridge between department faculty, students, and central university administration. SPOCs are responsible for:
- Quality assurance of multidisciplinary project proposals and deliverables.
- Verifying compliance with university plagiarism and AI generation thresholds.
- Ensuring $100\%$ student allocation within their department.
- Generating formal audit reports and accreditation archives for statutory inspection (e.g., NAAC, NBA, UGC).

---

## 2. Authentication & Department Selection

```
+-------------------------------------------------------------+
|                        SPOC LOGIN                           |
|                                                             |
|  Email:    [ spoc.cse@gdgu.org                            ] |
|  Passcode: [ ********                                     ] |
|                                                             |
|                   [ Sign In as SPOC ]                       |
+-------------------------------------------------------------+
```

### 2.1 Logging In
1. Navigate to `/spoc/login`.
2. Enter your authorized SPOC email address.
3. Enter your assigned security passcode.
4. Click **Sign In as SPOC**.
5. The portal validates your credentials and routes directly to `/spoc/portal`.

### 2.2 Switching Active Departments
If you are responsible for multiple academic departments (e.g., *Computer Science* and *Information Technology*, or an overarching School), the top navigation bar displays a **Department Selector dropdown**:
- Click the department dropdown in the top bar.
- Select your target department.
- The dashboard immediately refreshes all KPIs, projects, faculty lists, and student rosters for the selected entity.

---

## 3. SPOC Executive KPI Dashboard

The top section of the SPOC portal presents real-time health metrics for your department:

```
+---------------------------------------------------------------------------------------+
| DEPARTMENT: Computer Science & Engineering (2025-2026)                                |
|                                                                                       |
| [ 42 Projects ]     [ 28 Faculty ]     [ 380 Students ]     [ 98% Allocated ]         |
|                                                                                       |
| DELIVERABLE AUDIT PIPELINE:                                                           |
| [*] Pending: 6 (Amber) | [v] Approved: 32 (Green) | [x] Rejected: 2 | [ ] Due: 2     |
+---------------------------------------------------------------------------------------+
```

### 3.1 Department Overview Metrics
- **Total Projects:** Number of active IDP projects owned by department faculty.
- **Total Faculty Members:** Registered faculty supervisors in the department.
- **Total Students:** Total enrolled student count in the department master list.
- **Allocation Ratio:** Percentage of department students successfully registered for a project.

### 3.2 Verification Pipeline Status
- **Pending Review (Amber):** Faculty have uploaded deliverables awaiting your review.
- **Approved (Green):** Deliverables verified, compliant with integrity standards, and archived.
- **Rejected (Red):** Submissions returned to faculty mentors for corrections.
- **Not Submitted (Slate):** Active projects where deliverables have not yet been uploaded.

---

## 4. Project & Artifact Verification Workflow

Navigate to the **VERIFICATION** tab to inspect and audit project submissions.

```
+---------------------------------------------------------------------------------------+
| Project: P080 - Autonomous Solar Tracking Agricultural Drone                          |
| Lead Mentor: Dr. Debajyoti Roy | Students: 10/10 | Status: PENDING REVIEW             |
|                                                                                       |
| Deliverables Submitted:                                                               |
| 1. Final Report (PDF) - Similarity: 7.2% | AI: 3.5%                                   |
|    [ View Report ]  [ View Plagiarism Report PDF ]                                    |
| 2. Final Presentation Deck (PPTX)                                                     |
|                                                                                       |
| Actions:  [ Approve Submission ]   [ Reject / Request Revisions ]   [ Download ZIP ]   |
+---------------------------------------------------------------------------------------+
```

### 4.1 Reviewing Submitted Deliverables
1. On the project card, review the list of uploaded artifacts (`REPORT`, `PPT`, `OTHER`).
2. Click **View Document** or **Download** to inspect the submitted work.
3. Verify that student names, enrollment numbers, and project codes on the title page match the portal records.

### 4.2 Auditing Plagiarism & AI Integrity Reports
1. Inspect the reported **Similarity Index (%)** and **AI Content Index (%)**.
2. Click **View Plagiarism Report PDF** to open the official Turnitin/DrillBit certificate.
3. Confirm that:
   - The document title matches the submitted project.
   - The similarity score matches the self-reported percentage.
   - Exclusions (bibliography, small sources) comply with GDGU academic guidelines.
   - **Threshold:** Both Similarity and AI percentages must be $\le 10\%$.

### 4.3 Approval and Rejection Protocols
1. Click **Review Submission** on the project card to launch the **SpocReviewModal**.
2. Select your action:
   - **APPROVE:** Confirms the project meets all academic and institutional integrity standards.
   - **REJECT:** Returns the deliverable back to the faculty supervisor with required corrective action items.

### 4.4 Formulating Constructive Rejection Notes
When rejecting a submission, you must provide clear, actionable feedback in the **SPOC Review Note** box. Examples of professional review notes:
- *"Rejected: Similarity index is 16.4%, which exceeds the 10% university ceiling. Please revise Sections 2 and 3 and upload a new similarity certificate."*
- *"Rejected: The attached Turnitin report is for a different project title. Please upload the certified similarity report for P080."*
- *"Rejected: Capstone slide deck is missing the Avishkar CIE acknowledgment slide."*

---

## 5. Faculty Directory Management

Navigate to the **FACULTY** tab to monitor supervisor workloads and compliance.

```
+---------------------------------------------------------------------------------------+
| S.No  Faculty Name      Email                  Phone          Projects  Submissions   |
| 1     Dr. Debajyoti Roy debajyoti.roy@gdgu.org 9811223344     2 Proj    1 Approved    |
| 2     Prof. Shipra      shipra@uid.edu.in      Not shared     1 Proj    Pending (1)   |
+---------------------------------------------------------------------------------------+
```

### 5.1 Monitoring Faculty Project Offerings
- Ensure every full-time faculty member in your department has proposed and been assigned the required quota of IDP projects.
- Monitor faculty who have pending deliverables past official institutional deadlines.

### 5.2 Contact Status & Verification Audit
- Check whether faculty have declared their student-facing mobile numbers.
- If a faculty member displays `Phone: Not shared`, remind them to complete their profile in `/faculty/portal` so allocated students can reach them.

---

## 6. Departmental Student Roster & Tracking

Navigate to the **STUDENTS** tab for complete oversight of department student registrations.

```
+---------------------------------------------------------------------------------------+
| Filter: [ All ] [ Allocated (368) ] [ Unallocated (12) ]    Search: [             ]   |
|                                                                                       |
| Enrollment    Student Name      Programme    Status      Allocated Project   Mentor   |
| 250040205005  Aarshiya Lahiry   B.Tech CSE   Allocated   P080                D. Roy   |
| 250010301003  Sandhya Verma     MBA          Unallocated --                  --       |
+---------------------------------------------------------------------------------------+
```

### 6.1 Identifying Unallocated Students
- Click the **Unallocated** filter button to immediately isolate students who have not yet registered for any project.
- Export this unallocated list and coordinate with class mentors to ensure students log into `/student/portal` before the registration deadline.
- If the registration window has closed, submit the unallocated roster to the University Administrator for bulk automated allocation.

### 6.2 Cross-Checking Marks & Attendance
- Review recorded internal assessment marks, external jury marks, and attendance percentages across all department students.
- Flag discrepancies to mentors prior to the final examination board meeting.

---

## 7. Institutional Reporting & Bulk Export Tools

The **EXPORTS** tab provides one-click institutional data extraction.

```
+-------------------------------------------------------------+
|                 DEPARTMENTAL EXPORT HUB                     |
|                                                             |
|  Projects Master Register:   [ CSV ]  [ Excel ]  [ PDF ]    |
|  Faculty Workload Summary:   [ CSV ]  [ Excel ]  [ PDF ]    |
|  Student Allocations:        [ CSV ]  [ Excel ]  [ PDF ]    |
|                                                             |
|  ARCHIVAL ZIP BUNDLES                                       |
|  [ Download Department Capstone Deliverables Archive (.ZIP) ]|
+-------------------------------------------------------------+
```

### 7.1 Tabular Exports (CSV, XLSX, PDF)
- **CSV:** High-density raw tables for institutional databases.
- **Excel (.xlsx):** Pre-formatted workbooks featuring department statistics, project allocations, and student rosters with column headers.
- **PDF:** Formal university-stamped summaries suitable for departmental review meetings and NAAC/NBA documentation files.

### 7.2 Single Project ZIP Bundles
- On any project card in the **VERIFICATION** tab, click **Download ZIP**.
- The system packages:
  - Complete project metadata (`project_info.json`).
  - Student team roster (`roster.csv`).
  - All uploaded deliverables (Reports, PPTs).
  - Plagiarism certificate PDF.

### 7.3 Department-Wide Bulk ZIP Archiving
- In the **EXPORTS** tab, click **Download All Deliverables (.ZIP)**.
- The **ZipDownloadProgressModal** provides real-time progress as all department submissions are retrieved, packaged into hierarchical folders (`P001/`, `P002/`, etc.), and compressed for download.

---

## 8. SPOC Best Practices & Escalation Pathways

- **Turnaround Time:** Review pending deliverables within 48 business hours of faculty submission to allow sufficient time for revisions.
- **Zero Overbooking Vigilance:** Monitor project capacities to ensure interdisciplinary ratios are preserved across your departmental projects.
- **Contacting the Central Administrator:** For project quota overrides, faculty profile additions, or student reallocations, email `admin@gdgu.org` or raise a ticket through the central administration office.
