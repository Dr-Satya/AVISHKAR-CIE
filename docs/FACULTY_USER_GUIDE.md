# GDGU IDP Portal — Faculty User Guide

> **Inter-Disciplinary Project (IDP) Portal**  
> **Target Audience:** G D Goenka University Faculty Mentors & Project Supervisors  
> **Portal URL:** `https://idp.gdgu.org/faculty/login` (or `http://localhost:3000/faculty/login` for local instances)

---

## Table of Contents
1. [Overview & Role Objectives](#1-overview--role-objectives)
2. [Authentication & Initial Account Setup](#2-authentication--initial-account-setup)
   - [2.1 Logging In](#21-logging-in)
   - [2.2 Mandatory Phone Number Verification](#22-mandatory-phone-number-verification)
   - [2.3 Updating Your Security Passcode](#23-updating-your-security-passcode)
3. [Faculty Portal Dashboard Layout](#3-faculty-portal-dashboard-layout)
   - [3.1 Top Navigation Bar](#31-top-navigation-bar)
   - [3.2 Academic Context & Live Sync (SSE)](#32-academic-context--live-sync-sse)
4. [Managing Assigned Projects & Student Rosters](#4-managing-assigned-projects--student-rosters)
   - [4.1 Project Overview & Quota Meters](#41-project-overview--quota-meters)
   - [4.2 Student Roster Inspection](#42-student-roster-inspection)
   - [4.3 Contacting Enrolled Students](#43-contacting-enrolled-students)
   - [4.4 Multi-Format Roster Exports (CSV, XLSX, PDF)](#44-multi-format-roster-exports-csv-xlsx-pdf)
5. [Submitting New Project Proposals](#5-submitting-new-project-proposals)
   - [5.1 Proposal Modal Fields & Standards](#51-proposal-modal-fields--standards)
   - [5.2 SDG Mapping & Interdisciplinary Quotas](#52-sdg-mapping--interdisciplinary-quotas)
   - [5.3 Approval Lifecycle by Department SPOC](#53-approval-lifecycle-by-department-spoc)
6. [Deliverables & Project Artifacts Management](#6-deliverables--project-artifacts-management)
   - [6.1 Uploading Project Reports & Presentations](#61-uploading-project-reports--presentations)
   - [6.2 Plagiarism & AI Content Verification Standards](#62-plagiarism--ai-content-verification-standards)
   - [6.3 Mandatory Plagiarism Report Upload](#63-mandatory-plagiarism-report-upload)
   - [6.4 Review Status: Pending, Approved, and Rejected](#64-review-status-pending-approved-and-rejected)
7. [Research Manuscript & Publication Tracking](#7-research-manuscript--publication-tracking)
   - [7.1 Communicated / Draft Manuscript Submission](#71-communicated--draft-manuscript-submission)
   - [7.2 Avishkar CIE Institutional Affiliation Requirements](#72-avishkar-cie-institutional-affiliation-requirements)
   - [7.3 Published Manuscript, DOI, and Final Indexing](#73-published-manuscript-doi-and-final-indexing)
8. [Faculty Best Practices & FAQ](#8-faculty-best-practices--faq)

---

## 1. Overview & Role Objectives

Faculty members serve as primary academic and technical mentors for multidisciplinary student teams. The Faculty Portal equips supervisors with tools to:
- Monitor live student registrations and view multidisciplinary team compositions.
- Export clean class rosters for attendance and grading.
- Submit new project proposals aligned with institutional categories and UN Sustainable Development Goals (SDGs).
- Upload and archive student deliverables (Reports, PPTs) with integrated plagiarism and AI screening.
- Track research manuscripts and peer-reviewed publications linked with the **Avishkar Center for Innovation & Entrepreneurship (CIE)**.

---

## 2. Authentication & Initial Account Setup

```
+-------------------------------------------------------------+
|                      FACULTY LOGIN                          |
|                                                             |
|  Email:    [ debajyoti.roy@gdgu.org                       ] |
|  Passcode: [ ********                                     ] |
|                                                             |
|                    [ Sign In to Portal ]                    |
+-------------------------------------------------------------+
```

### 2.1 Logging In
1. Navigate to `/faculty/login`.
2. Enter your institutional email address (e.g., `debajyoti.roy@gdgu.org`).
3. Enter your assigned passcode. (The default initial passcode for newly provisioned accounts is `gdgu@2026`).
4. Click **Sign In to Portal**.

### 2.2 Mandatory Phone Number Verification
On first login (or whenever your contact profile is incomplete), a security modal appears:
1. Enter your active 10-digit mobile number in the **Mobile Number** field.
2. Re-enter the exact same 10 digits in **Confirm Mobile Number**.
3. Check the consent box allowing the portal to share this contact number with your registered students.
4. Click **Save Contact Number**.
> *Note: This number is displayed directly on your registered students' dashboards so they can coordinate lab sessions and project meetings with you.*

### 2.3 Updating Your Security Passcode
1. In the top navigation bar, click the **Change Passcode** button.
2. Enter your current passcode.
3. Enter a new, secure passcode (minimum 8 characters, alphanumeric recommended).
4. Re-enter to confirm and click **Update Passcode**.
5. A confirmation notification will appear upon successful encryption and update.

---

## 3. Faculty Portal Dashboard Layout

### 3.1 Top Navigation Bar
- **Faculty Identity:** Displays your full name, assigned department, and institutional email.
- **Academic Term Badge:** Identifies the active academic session (e.g., `2025-2026 · Semester 3`).
- **Quick Action Controls:**
  - `+ Propose Project`: Open the proposal creation drawer.
  - `Update Phone`: Edit or re-verify your student-facing mobile number.
  - `Change Passcode`: Security configuration.
  - `Logout`: Securely terminates the encrypted session cookie.

### 3.2 Academic Context & Live Sync (SSE)
The faculty dashboard features live Server-Sent Events (SSE) synchronization. When a student registers for or is allocated to one of your projects, your roster count, seat progress bar, and student table update automatically without requiring a manual browser reload.

---

## 4. Managing Assigned Projects & Student Rosters

```
+-----------------------------------------------------------------------------------------+
| [P080] Autonomous Solar Tracking Agricultural Drone            Status: VERIFIED         |
| Category: Sustainability | Theme: Clean Energy | SDG: #7 Clean Energy, #9 Innovation    |
| Capacity: 10/10 Allocated [ Same-Dept: 4/4 | Other-Dept: 6/6 ]                          |
|                                                                                         |
| Export Roster: [ CSV ] [ Excel (.xlsx) ] [ PDF ]                                        |
| --------------------------------------------------------------------------------------- |
| S.No  Enrollment    Student Name     Dept       Program      Phone         Marks (Int/Ext) |
| 1     250040205005  Aarshiya Lahiry  CSE        B.Tech CSE   9810012345    0 / 0           |
| 2     250010301003  Rohan Sharma     Mechanical B.Tech ME    9811234567    0 / 0           |
| ...                                                                                     |
+-----------------------------------------------------------------------------------------+
```

### 4.1 Project Overview & Quota Meters
Each assigned project appears as an interactive card displaying:
- **Project ID & Title:** Permanent project identifier.
- **Category & Theme:** Academic classification.
- **SDG Mapping:** Sustainable Development Goal numbers addressed by the project.
- **Capacity Breakdown:**
  - *Total Enrolled vs Max Seats* (e.g., `8 / 10`).
  - *Same-Department Count* (e.g., `4 / 4` CSE students).
  - *Other-Department Count* (e.g., `4 / 6` non-CSE students).

### 4.2 Student Roster Inspection
Clicking on a project expands the verified student roster table:
- **Student Enrollment Number:** 12-digit official identifier.
- **Full Name:** Verified student legal name.
- **Department & Programme:** Academic discipline (e.g., *Computer Science & Engineering*, *B.Tech CSE*).
- **Contact Details:** Clickable phone number (`tel:`) and email link (`mailto:`).
- **Academic Metrics:** Current internal assessment marks, external evaluation marks, and attendance percentage.

### 4.3 Contacting Enrolled Students
- Click any student's email link to initiate direct correspondence.
- Click a phone link on a mobile or calling-enabled workstation to initiate direct calls.
- Use the roster details to establish your team communication group (e.g., Teams, WhatsApp, or Google Classroom).

### 4.4 Multi-Format Roster Exports (CSV, XLSX, PDF)
Faculty can export rosters at any time for institutional grading or offline records:
- **CSV (`.csv`):** Lightweight format ideal for spreadsheet manipulation or importing into custom grading software.
- **Excel (`.xlsx`):** Formatted institutional workbook including project header details, category metadata, and column formatting.
- **PDF (`.pdf`):** Formal printable document styled with GDGU typography, university navy accents, student signature columns, and mentor sign-off blocks.

---

## 5. Submitting New Project Proposals

Faculty are encouraged to introduce cutting-edge, multidisciplinary research topics each semester.

```
+-------------------------------------------------------------+
|                 SUBMIT NEW PROJECT PROPOSAL                 |
|                                                             |
|  Project Title: [ AI-Driven Grid Fault Diagnostics       ] |
|  Category:      [ Engineering & Deep Tech               v ] |
|  Theme:         [ Smart Grid Analytics                  v ] |
|  SDG Mapping:   [ SDG 7: Clean Energy, SDG 9: Innovation  ] |
|  Description:   [ Detailed problem statement & scope...   ] |
|                                                             |
|  Max Capacity:  [ 10 ]  Same-Dept: [ 4 ]  Other-Dept: [ 6 ] |
|                                                             |
|                  [ Submit for SPOC Approval ]               |
+-------------------------------------------------------------+
```

### 5.1 Proposal Modal Fields & Standards
1. Click **+ Propose Project** in the top bar.
2. Complete the required fields:
   - **Project Title:** Concise, academically rigorous project title.
   - **Category:** Select the institutional research domain.
   - **Theme:** Choose the specific thematic area.
   - **Description:** Outline the project background, objectives, experimental/analytical methodology, and expected deliverables.
   - **Capacity Settings:** Specify maximum student intake (default: 10), Same-Department quota (default: 4), and Other-Department quota (default: 6).

### 5.2 SDG Mapping & Interdisciplinary Quotas
- Select one or more relevant UN SDGs (e.g., *SDG 3: Good Health and Well-being*, *SDG 11: Sustainable Cities and Communities*).
- Formulate the proposal so tasks can be meaningfully split between your home department and students from external fields (e.g., engineering students handling hardware/software, management students handling commercial viability or user surveys).

### 5.3 Approval Lifecycle by Department SPOC
- Once submitted, the project enters `PENDING` review status.
- Your Department Single Point of Contact (SPOC) reviews the proposal.
- If approved, the project is published live on the Student Portal for registration.
- If revisions are required, the SPOC will attach a feedback note, and the proposal status will indicate `REJECTED` or `CHANGES_REQUESTED`.

---

## 6. Deliverables & Project Artifacts Management

At mid-term and semester conclusion, faculty mentors must submit verified team deliverables.

```
+-------------------------------------------------------------+
|                 UPLOAD PROJECT DELIVERABLE                  |
|                                                             |
|  Deliverable Type:  (*) Final Report  ( ) Presentation (PPT)|
|  Deliverable Title: [ Final Project Synthesis Report      ] |
|  Document File:     [ Browse: Final_Report_P080.pdf       ] |
|                                                             |
|  PLAGIARISM & AI INTEGRITY VERIFICATION                     |
|  Similarity Percentage: [ 8.5  ] % (Max allowable: 10%)    |
|  AI Generated Content:  [ 4.2  ] % (Max allowable: 10%)    |
|  Plagiarism Report:     [ Browse: Turnitin_Report_P080.pdf] |
|                                                             |
|  [x] I declare that the submitted document has undergone    |
|      institutional plagiarism screening and adheres to      |
|      university academic integrity norms.                   |
|                                                             |
|                  [ Submit for SPOC Review ]                 |
+-------------------------------------------------------------+
```

### 6.1 Uploading Project Reports & Presentations
1. On the relevant project card, click **Upload Deliverable**.
2. Select the deliverable type:
   - `REPORT`: Comprehensive final project documentation.
   - `PPT`: Capstone presentation slide deck.
   - `OTHER`: Source code archives, patents, or supplementary datasets.
3. Attach the main document file (`.pdf`, `.docx`, or `.pptx`).

### 6.2 Plagiarism & AI Content Verification Standards
GDGU upholds strict academic integrity guidelines for all IDP projects:
- **Maximum Allowable Similarity Index:** $\le 10\%$ (excluding bibliography and standard methodology phrasing).
- **Maximum Allowable AI Generated Content:** $\le 10\%$.
- Enter the exact numerical percentages reported by your institutional screening software (e.g., Turnitin, DrillBit, or iThenticate).

### 6.3 Mandatory Plagiarism Report Upload
- You must attach the official PDF copy of the generated similarity report.
- Tick the mandatory academic integrity self-declaration checkbox.
- Click **Submit Artifact**.

### 6.4 Review Status: Pending, Approved, and Rejected
- **PENDING (Amber):** Deliverable submitted and awaiting departmental SPOC audit.
- **APPROVED (Green):** Verified by SPOC; archived for institutional accreditation.
- **REJECTED (Red):** SPOC has identified discrepancies (e.g., high similarity index or missing annexures). Read the **SPOC Review Note** on the card, rectify the document, and re-upload.

---

## 7. Research Manuscript & Publication Tracking

To incentivize high-impact research, the IDP portal includes a specialized tracking engine for research papers developed from student projects.

```
+-------------------------------------------------------------+
|              RESEARCH MANUSCRIPT & PUBLICATION              |
|                                                             |
|  [x] Draft Manuscript Communicated                          |
|      Target Journal: [ IEEE Transactions on Smart Grid    ] |
|      [x] Avishkar CIE Institutional Affiliation Mentioned   |
|      Upload Draft:   [ Browse: Manuscript_Draft_P080.pdf  ] |
|                                                             |
|  [x] Paper Published / Accepted                             |
|      Publication DOI: [ https://doi.org/10.1109/TSG.2026.x ]|
|      [x] Avishkar CIE Affiliation in Published Version      |
|      Upload Published: [ Browse: Final_Paper_Published.pdf] |
|                                                             |
|                    [ Save Publication Data ]                |
+-------------------------------------------------------------+
```

### 7.1 Communicated / Draft Manuscript Submission
- When your team submits a manuscript to a peer-reviewed Scopus/WoS/UGC-CARE indexed journal or IEEE conference:
  1. Open the project card and click **Manuscript Tracking**.
  2. Check **Draft Manuscript Communicated**.
  3. Enter the exact **Journal / Conference Name**.
  4. Upload the communicated draft document.

### 7.2 Avishkar CIE Institutional Affiliation Requirements
- All publications arising from IDP work must cite the institutional support of **Avishkar Center for Innovation & Entrepreneurship (CIE), G D Goenka University**.
- Check the confirmation box: *"Avishkar Affiliation Included in Manuscript Authorship/Acknowledgment"*.

### 7.3 Published Manuscript, DOI, and Final Indexing
- Upon acceptance and publication:
  1. Check **Paper Published**.
  2. Enter the permanent **Digital Object Identifier (DOI)** or public repository URL.
  3. Upload the final publisher PDF.
  4. Enter final similarity and AI percentages.
  5. Click **Save Publication Data**.

---

## 8. Faculty Best Practices & FAQ

- **Weekly Engagement:** Maintain continuous records of student participation. Project groups should meet weekly.
- **Attendance & Continuous Evaluation:** Use the CSV/Excel exports to log progress marks before the mid-semester evaluation portal closes.
- **Handling Inactive Students:** If an allocated student fails to report or participate, notify your Department SPOC immediately so the student can be counseled or unmapped before final grading.
- **Plagiarism Buffer:** Ensure students run preliminary similarity checks early. Do not wait until the final submission deadline to screen for similarity.
