# Active Semester Upload Control (Semester 3 vs Semester 4)

## Overview
This feature allows administrators to view and configure the active academic semester milestone (`Semester 3` vs `Semester 4`). Only the selected semester's upload window is open; the inactive semester's upload actions and dialogs are locked and unclickable across the Faculty and SPOC portals.

---

## Behavior & User Experience

### 1. Admin Portal (`/admin/portal`)
- **Admin Banner (`AdminBanner.tsx`):**
  - Displays the active upload window:
    - `Active Upload Window: Sem 3` (Semester 3 Uploads Open · Sem 4 Uploads Locked)
    - `Active Upload Window: Sem 4` (Semester 4 Uploads Open · Sem 3 Uploads Locked)
  - Quick-action toggle button: `Switch to Sem 4 Uploads` / `Switch to Sem 3 Uploads`.
- **Global Configuration Card (`GlobalConfigCard.tsx`):**
  - Visual selector with real-time status badges for **Semester 3 (Interim Phase)** and **Semester 4 (Final Defense)**.
  - Displays which milestone is currently open for document uploads.

### 2. Faculty Portal (`/faculty/portal`)
- **Project Card (`FacultyProjectCard.tsx`):**
  - **When Semester 3 is Active:**
    - Semester 3 Interim submissions (`+ Consent Form`, `+ Upload for Sem 3`, and checklist pills: `Interim Report`, `Presentation PPT`, `Consent Form`) are active and clickable.
    - Semester 4 Final Defense submissions are locked:
      - Marked with `Uploads Closed (Sem 3 Active)` lock badge.
      - Buttons (`+ Consent Form`, `+ Upload for Sem 4`) and checklist pills are disabled (`opacity-50 cursor-not-allowed pointer-events-none`).
      - Deletion of Semester 4 documents is disabled with a lock icon.
  - **When Semester 4 is Active:**
    - Semester 4 Final Defense submissions are active and clickable.
    - Semester 3 Interim submissions are locked and marked with `Uploads Closed (Sem 4 Active)` lock badge.
  - Existing uploaded artifacts remain readable and downloadable in both semesters.

### 3. Upload Modal (`ArtifactUploadModal.tsx`)
- Displays `Semester X Uploads Open Only` badge.
- Gated semester toggle buttons:
  - The inactive semester is disabled, greyed out, marked with a lock icon, and shows `(Closed)`.
  - The form client-side validates that only the active semester can be submitted.

### 4. SPOC Portal (`/spoc/portal` & `SpocProjectVerificationTab.tsx`)
- `+ Upload Sem 3` and `+ Upload Sem 4` buttons are dynamically enabled or disabled based on `activeSemester`.
- SPOC's instance of `ArtifactUploadModal` adheres to the same active semester lock.

### 5. Backend Server Enforcement (`/api/faculty/artifacts`)
- **POST `/api/faculty/artifacts`:**
  - Verifies `formData.get("semester") === globalConfig.activeSemester`.
  - Rejects attempts to upload for the inactive semester with HTTP `403 Forbidden`:
    `"Uploads for Semester <sem> are currently closed by Administrator. Only Semester <activeSem> uploads are permitted."`
- **DELETE `/api/faculty/artifacts`:**
  - For faculty users, verifies that the artifact belongs to `globalConfig.activeSemester`.
  - Rejects deletion of artifacts from closed semesters with HTTP `403 Forbidden`.

### 6. Real-time Live Synchronization (`/api/events`)
- Server-Sent Events (`configuration.updated`) trigger immediate background re-fetch in faculty and SPOC dashboards whenever the administrator toggles the semester window, updating the UI in real time without requiring manual page reload.
