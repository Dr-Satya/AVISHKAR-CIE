# GDGU IDP Portal — Student User Guide

> **Inter-Disciplinary Project (IDP) Portal**  
> **Target Audience:** G D Goenka University Undergraduate & Postgraduate Students  
> **Portal URL:** `https://idp.gdgu.org/student/login` (or `http://localhost:3000/student/login` for local instances)

---

## Table of Contents
1. [Overview & Prerequisites](#1-overview--prerequisites)
2. [Authentication & Account Verification](#2-authentication--account-verification)
   - [2.1 Google Official Email Sign-In](#21-google-official-email-sign-in)
   - [2.2 Enrollment Number Direct Verification](#22-enrollment-number-direct-verification)
   - [2.3 Accepting Institutional Terms & Policies](#23-accepting-institutional-terms--policies)
3. [Mandatory Mobile Number Declaration](#3-mandatory-mobile-number-declaration)
   - [3.1 Why Mobile Declaration is Required](#31-why-mobile-declaration-is-required)
   - [3.2 Double-Entry Verification Process](#32-double-entry-verification-process)
4. [Project Discovery & Registration Flow](#4-project-discovery--registration-flow)
   - [4.1 Browsing Project Categories](#41-browsing-project-categories)
   - [4.2 Filtering by Themes](#42-filtering-by-themes)
   - [4.3 Evaluating Available Projects & Seat Quotas](#43-evaluating-available-projects--seat-quotas)
   - [4.4 Locking Your Project Registration](#44-locking-your-project-registration)
5. [Registered Student Dashboard](#5-registered-student-dashboard)
   - [5.1 Registration Confirmation & Lock Status](#51-registration-confirmation--lock-status)
   - [5.2 Faculty Mentor Contact Information](#52-faculty-mentor-contact-information)
   - [5.3 Next Steps: Connecting with Your Mentor](#53-next-steps-connecting-with-your-mentor)
6. [Rules, Quotas & Allocation Mechanics](#6-rules-quotas--allocation-mechanics)
   - [6.1 Same-Department vs Other-Department Limits](#61-same-department-vs-other-department-limits)
   - [6.2 Concurrency & Real-Time Seat Updates](#62-concurrency--real-time-seat-updates)
   - [6.3 Registration Window State (Kill Switch)](#63-registration-window-state-kill-switch)
7. [Troubleshooting & Frequently Asked Questions (FAQ)](#7-troubleshooting--frequently-asked-questions-faq)

---

## 1. Overview & Prerequisites

The Inter-Disciplinary Project (IDP) Portal enables university students to discover, select, and register for collaborative, multi-departmental research and applied innovation projects.

### Prerequisites Before Accessing the Portal
- An active official university Google account ending in `@gdgu.org`.
- A valid 12-digit University Enrollment Number (e.g., `250040205005`).
- An active 10-digit Indian mobile number capable of receiving SMS updates regarding your project allocation, mentor communications, and schedule alerts.
- A modern web browser (Google Chrome, Mozilla Firefox, Safari, or Microsoft Edge).

---

## 2. Authentication & Account Verification

The student portal employs institutional single sign-on (SSO) and enrollment number matching to ensure each student accesses their verified record.

```
+-------------------------------------------------------------+
|                      STUDENT LOGIN                          |
|                                                             |
|  [ Enter Official @gdgu.org Email or 12-Digit Enrollment ]  |
|                                                             |
|  [x] I agree to the Institutional Terms & Mobile Policy     |
|                                                             |
|               [ Continue to Student Portal ]                |
+-------------------------------------------------------------+
```

### 2.1 Google Official Email Sign-In
1. Navigate to the login page: `/student/login`.
2. Enter your university email address (`<your-id>@gdgu.org`).
3. Ensure the checkbox for **"Terms & Conditions and Mobile Number Declaration Policy"** is ticked.
4. Click **Continue to Student Portal**.
5. If prompted, complete Google authentication using your official university credentials.

### 2.2 Enrollment Number Direct Verification
If your university Google account is not yet synced with your enrollment record:
1. Enter your 12-digit Enrollment Number (e.g., `250010301003`) in the login identifier field.
2. Accept the institutional terms and click **Continue to Student Portal**.
3. If the system prompts for secondary confirmation, navigate to `/student/verify-enrollment`, re-enter your enrollment number, and click **Verify & Link Account**.
4. Once verified, your browser session will securely store an encrypted authentication cookie.

### 2.3 Accepting Institutional Terms & Policies
Before login completes, you must check the agreement acknowledging that:
- You are registering for an official academic course credit.
- Project allocations are final once submitted and locked.
- Only one project allocation per student is permitted.
- Contact details provided will be used exclusively for mentor-student communication and university notices.

---

## 3. Mandatory Mobile Number Declaration

To facilitate direct communication between assigned faculty mentors, departmental SPOCs, and students, all students must declare and verify their active contact number before selecting a project.

```
+-------------------------------------------------------------+
|              MANDATORY CONTACT DECLARATION                  |
|                                                             |
|  Mobile Number:         [ 9876543210                      ] |
|  Confirm Mobile Number: [ 9876543210                      ] |
|                                                             |
|  [x] I consent to sharing this number with my assigned      |
|      faculty mentor and university coordinators.            |
|                                                             |
|                    [ Save Mobile Number ]                   |
+-------------------------------------------------------------+
```

### 3.1 Why Mobile Declaration is Required
- Allows assigned faculty mentors to reach out for orientation sessions, laboratory allocations, and research manuscript deadlines.
- Enables critical SMS broadcasts regarding project milestones or scheduling updates.
- Prevents invalid or unreachable student profiles in the master roster.

### 3.2 Double-Entry Verification Process
1. Upon logging into `/student/portal`, if your phone status shows unverified, an orange banner will be displayed:
   `Action Required: Please complete mobile number verification before registering.`
2. Enter your 10-digit mobile number in the **Mobile Number** field.
3. Re-type the exact same 10 digits into the **Confirm Mobile Number** field (prevents accidental typos).
4. Tick the consent box: *"I understand this number will be used for official IDP mentor communication."*
5. Click **Save Mobile Number**.
6. Upon validation, the portal confirms with a green badge: `Verified Contact Number: +91 XXXXXXXXXX`.

---

## 4. Project Discovery & Registration Flow

If you are not yet registered for a project, the portal presents the interactive project catalog.

```
Step 1: Select Category  ===>  Step 2: Select Theme  ===>  Step 3: Review Projects  ===>  Step 4: Lock Seat
(e.g., Sustainability)         (e.g., Clean Energy)        (Inspect Quotas & Mentor)      (Instant Lock)
```

### 4.1 Browsing Project Categories
- At the top of the portal, select from available multidisciplinary project categories:
  - *Engineering & Deep Tech*
  - *Sustainability & Clean Energy*
  - *Healthcare & Biomedical Innovation*
  - *Business, FinTech & Social Innovation*
  - *Creative Arts, Media & Design*
- Clicking a category filters available themes in real time.

### 4.2 Filtering by Themes
- Under your chosen category, click on a specific sub-theme (e.g., *Artificial Intelligence in Healthcare*, *Smart Electric Mobility*, or *Circular Economy*).
- The portal queries live project offerings under that combination.

### 4.3 Evaluating Available Projects & Seat Quotas
Each project card displays:
- **Project ID**: Official code (e.g., `P080`).
- **Project Title & Brief Description**: Scope, objectives, and problem statement.
- **Faculty Mentor**: Faculty name and originating department.
- **SDG Alignment**: United Nations Sustainable Development Goals mapped to the research.
- **Seat Availability Meter**:
  - **Total Remaining Seats**: Maximum students permitted minus current registrations.
  - **Same-Department Quota**: Seats reserved for students in the mentor's department.
  - **Other-Department Quota**: Seats reserved for students from external disciplines (encouraging interdisciplinary collaboration).

> **Quota Indicator Status:**
> - **Green ("Seats Available")**: You are eligible to register immediately.
> - **Red ("Department Quota Exhausted")**: The total project may have seats, but the specific quota for your department has been filled. Choose another project.
> - **Grey ("Full")**: All total seats are booked.

### 4.4 Locking Your Project Registration
1. Locate your preferred project with an active **Register** button.
2. Click **Register for Project**.
3. A confirmation modal will appear detailing:
   - Project ID and Full Title
   - Mentor Name and Department
   - Warning notice: *"Once registered, your seat is permanently reserved and locked."*
4. Click **Confirm Registration**.
5. The portal performs an atomic database transaction. If successful, you will see a green confirmation modal, and the view will immediately transform into your **Registered Status Dashboard**.

---

## 5. Registered Student Dashboard

Once registered, your portal transitions into read-only locked status.

```
+-------------------------------------------------------------+
| [Lock Icon] Registration Confirmed · Locked                 |
|                                                             |
| PROJECT P080: Autonomous Solar Tracking Agricultural Drone  |
| Category: Sustainability | Theme: Clean Energy | Dept: CSE  |
|                                                             |
| ----------------------------------------------------------- |
| FACULTY MENTOR CONTACT INFORMATION                          |
|                                                             |
| Mentor: Dr. Debajyoti Roy (Computer Science & Engineering)  |
| Email:  debajyoti.roy@gdgu.org    [ Send Email ]            |
| Phone:  +91 9811223344            [ Call Mentor ]           |
+-------------------------------------------------------------+
```

### 5.1 Registration Confirmation & Lock Status
- Displays your allocated Project Code and complete title.
- Shows your academic year (e.g., `2025-2026`) and active semester.
- **Lock Policy:** Students cannot cancel, drop, or swap projects on their own. This prevents seat-swapping and ensures stable group rosters.

### 5.2 Faculty Mentor Contact Information
- **Mentor Name & Department**: Identifies your lead faculty supervisor.
- **Email Link**: Click to open your default mail client addressed to your mentor.
- **Phone Link**: On mobile devices, tap to directly call your mentor. If the faculty has not verified their mobile number yet, the badge indicates `Mobile not shared yet`.

### 5.3 Next Steps: Connecting with Your Mentor
1. Email or call your mentor to introduce yourself and state your University Enrollment Number.
2. Attend scheduled project orientation sessions.
3. Review submission guidelines for project reports, presentations, and research manuscript deliverables.

---

## 6. Rules, Quotas & Allocation Mechanics

### 6.1 Same-Department vs Other-Department Limits
The IDP portal enforces multidisciplinary ratios:
- Every project has a strict **Total Capacity** (typically 10 students).
- A predefined number of seats (e.g., 4) are reserved for **Same-Department** students (e.g., CSE students in a CSE-led project).
- Remaining seats (e.g., 6) are strictly reserved for **Other-Department** students (e.g., Mechanical, Management, Design, or Law students).
- Even if total seats remain unfilled, if your department quota is full, you cannot register for that project.

### 6.2 Concurrency & Real-Time Seat Updates
- The portal runs continuous synchronization via Server-Sent Events (SSE).
- If multiple students view the same project simultaneously, the seat availability meter updates in real time without refreshing the page.
- When two students click "Register" at the exact same millisecond for the final seat, the server guarantees zero overbooking via row-level database locking. The first request succeeds; the second receives an instant alert that the seat was taken.

### 6.3 Registration Window State (Kill Switch)
- The University Administrator controls the master **Registration Open/Closed** toggle.
- If the administration closes registrations, project registration buttons are disabled, and a warning banner appears: `Project registration is currently closed by the university administration.`

---

## 7. Troubleshooting & Frequently Asked Questions (FAQ)

### Q1: I logged in, but the portal says "Student Record Not Found." What should I do?
**Ans:** Ensure you entered your 12-digit enrollment number correctly or logged in with your official `@gdgu.org` Google email. If your admission is recent, contact your Department SPOC or System Administrator (`admin@gdgu.org`) to verify your entry in the master student database.

### Q2: Why is the "Register" button disabled for a project that shows 2 open seats?
**Ans:** The 2 remaining seats belong to the complementary quota. If you belong to the mentor's department, the same-department quota may already be exhausted. Look for projects where your department quota is still open.

### Q3: Can I change my project after registering?
**Ans:** No. Self-service project switches are strictly prohibited by university policy. If you have an exceptional academic conflict, you must submit a formal written request endorsed by your Department Head to the Central IDP Administrator.

### Q4: What if I entered an incorrect mobile number during declaration?
**Ans:** You can update your number prior to registration. If already registered, reach out to your Department SPOC or Administrator to update your contact record in the database.

### Q5: How do I submit my final project report or manuscript?
**Ans:** Deliverables (Reports, PPTs, and Research Manuscripts) are uploaded and submitted by your **Faculty Mentor** after internal evaluation and similarity screening. Ensure your team submits all drafts directly to your mentor according to institutional milestones.
