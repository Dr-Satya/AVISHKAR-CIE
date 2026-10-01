import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

const IDP_COHORT_HEADERS = [
  "Faculty Name",
  "School",
  "Email ID",
  "Contact No.",
  "Projet Title",
  "Project  Category  (IDP2501/IDP2502)",
  "Theme",
  "Description  of IDP  project",
  "Project ID",
  "Enrollment",
  "Student Name",
] as const;

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || searchParams.get("type"); // "FACULTY_STUDENTS" | "SPOC_STUDENTS" | "SPOC_FACULTY" | "SPOC_PROJECTS" | "ADMIN_STUDENTS" | TEMPLATE_*
    const rawFormat = searchParams.get("format");
    const format = (rawFormat || (scope?.startsWith("TEMPLATE_") ? "xlsx" : "csv")).toLowerCase(); // "csv" | "xlsx" | "pdf"
    const projectId = searchParams.get("projectId");
    const departmentParam = searchParams.get("department");

    let rows: Record<string, any>[] = [];
    let title = "GDGU_IDP_Export";

    // Templates for Admin bulk imports
    // 1. TEMPLATE_STUDENTS (Exact IDP Mapping Format - Mohit Maan structure)
    if (scope === "TEMPLATE_STUDENTS") {
      title = "IDP_Mapping_Format_Students_Template";
      rows = [
        {
          "S.No.": 1,
          "Enrolment No.": "250010201001",
          "Admission No.": "25260005",
          "Name ": "Saidi Bin Saidi",
          "Department": "School of Management",
          "Programme Name": "BBA (Bachelor of Business Administration)",
          "Batch": "2025",
          "Course Code": "IDP2502",
          "Course Name": "Interdisciplinary Project",
          "Faculty Name": "Ms. Shipra Khanna",
          "Faculty Department": "United World Institute of Design (UID)",
          "Faculty Official Email id": "shipra@uid.edu.in",
        },
        {
          "S.No.": 2,
          "Enrolment No.": "250160258001",
          "Admission No.": "25260013",
          "Name ": "Gracia Kisimba Safi",
          "Department": "School of Engineering & Sciences",
          "Programme Name": "Bachelor of Technology - Civil Engineering (Smart Infrastructures)",
          "Batch": "2025",
          "Course Code": "IDP2501",
          "Course Name": "Interdisciplinary Project",
          "Faculty Name": "Asst. Prof. Pawan Kumar Ahirwar",
          "Faculty Department": "United World Institute of Design (UID)",
          "Faculty Official Email id": "Pawan@uid.edu.in",
        },
        {
          "S.No.": 3,
          "Enrolment No.": "250160258002",
          "Admission No.": "25260014",
          "Name ": "Mbumba Yav Elie",
          "Department": "School of Engineering & Sciences",
          "Programme Name": "Bachelor of Technology - Civil Engineering (Smart Infrastructures)",
          "Batch": "2025",
          "Course Code": "IDP2502",
          "Course Name": "Interdisciplinary Project",
          "Faculty Name": "Dr. Dheeraj Miglani",
          "Faculty Department": "Center of Aerospace and Energy Studies",
          "Faculty Official Email id": "dheeraj.miglani@gdgu.org",
        },
      ];
    }
    // 2. TEMPLATE_PROJECTS / TEMPLATE_CHC (Exact CHC Service Report structure)
    else if (scope === "TEMPLATE_PROJECTS" || scope === "TEMPLATE_CHC") {
      title = "CHC_Service_Report_Projects_Template";
      rows = [
        {
          "Name  ( Workflow  Version   -   1)": "Dr. Khushbu  Parik",
          "Department  ( Workflow  Version   -   1)": "School of Engineering & Sciences",
          "Email  ( Workflow  Version   -   1)": "khushbu.parik@gdgu.org",
          "Phone  ( Workflow  Version   -   1)": "91-7357899500",
          "Project  Title  ( Workflow  Version   -   1)": "Smart Water Monitoring and Conservation System",
          "Project/Title Code": "P001",
          "Category": "IDP2502",
          "Project  Category  ( Workflow  Version   -   1)": "Research",
          "SD G  Mapping  ( Workflow  Version   -   1)": "SDG 11: Sustainable Cities and Communities",
          "Select  One  Theme  ( Workflow  Version   -   1)": "Sustainable Energy Environmental Tech Smart Infrastructure and Climate Resilience",
          "Description  of ID P  project  ( Workflow  Version   -   1)": "This project aims to develop a low-cost smart system for monitoring water levels and consumption in a setting. The system will use simple sensors to monitor tank water levels and water flow, with alerts for low water levels, overflow, and abnormal water usage.",
        },
        {
          "Name  ( Workflow  Version   -   1)": "Mr. Saurabh  Shekhar",
          "Department  ( Workflow  Version   -   1)": "School of Healthcare and Allied Sciences",
          "Email  ( Workflow  Version   -   1)": "saurabh.shekhar@gdgu.org",
          "Phone  ( Workflow  Version   -   1)": "91-9773741909",
          "Project  Title  ( Workflow  Version   -   1)": "Isolation and screening of native soil bacteria for low density polyethylene (LDPE) Biodegradation",
          "Project/Title Code": "P002",
          "Category": "IDP2501",
          "Project  Category  ( Workflow  Version   -   1)": "Research",
          "SD G  Mapping  ( Workflow  Version   -   1)": "SDG 9: Industry, Innovation, and Infrastructure, SDG 12: Responsible Consumption and Production",
          "Select  One  Theme  ( Workflow  Version   -   1)": "Bio Engineering Synthetic Biology and Molecular Systems",
          "Description  of ID P  project  ( Workflow  Version   -   1)": "Objective: Isolates naturally occurring bacteria from plastic-contaminated soil (landfills/dumping sites) to find strains capable of digesting Low-Density Polyethylene (LDPE).",
        },
        {
          "Name  ( Workflow  Version   -   1)": "Asst. Prof. Daksh  Mehta",
          "Department  ( Workflow  Version   -   1)": "School of Engineering & Sciences",
          "Email  ( Workflow  Version   -   1)": "daksh.mehta@gdgu.org",
          "Phone  ( Workflow  Version   -   1)": "91-9643431907",
          "Project  Title  ( Workflow  Version   -   1)": "Gamification in education",
          "Project/Title Code": "P003",
          "Category": "IDP2502",
          "Project  Category  ( Workflow  Version   -   1)": "Research",
          "SD G  Mapping  ( Workflow  Version   -   1)": "SDG 4: Quality Education",
          "Select  One  Theme  ( Workflow  Version   -   1)": "Others",
          "Description  of ID P  project  ( Workflow  Version   -   1)": "This research explores the use of gamification techniques in education to improve student engagement, motivation, and learning outcomes.",
        },
      ];
    }
    // 3. TEMPLATE_COHORTS (Exact IDP Cohorts Details 5Sep-2026 structure)
    else if (scope === "TEMPLATE_COHORTS") {
      title = "IDP_Cohorts_Details_Template";
      rows = [
        {
          "Faculty Name": "Ms. Shipra Khanna",
          "School": "United World Institute of Design (UID)",
          "Email ID": "shipra@uid.edu.in",
          "Contact No.": "",
          "Projet Title": "Impact of Biophilic Design in Interior Spaces",
          "Project  Category  (IDP2501/IDP2502)": "IDP2502",
          "Theme": "Others",
          "Description  of IDP  project": "Qualitative and quantitative analysis measures biophilic design’s impact on well-being, comfort, productivity, and stress through user responses and measurable data.",
          "Project ID": "P114",
          "Enrollment": 250180203019,
          "Student Name": "MANVI SINGH",
        },
        {
          "Faculty Name": "Asst. Prof. Pawan Kumar Ahirwar",
          "School": "United World Institute of Design (UID)",
          "Email ID": "Pawan@uid.edu.in",
          "Contact No.": "",
          "Projet Title": "“Affordable Circular Packaging Systems for Indian SMEs and E-commerce Businesses.”",
          "Project  Category  (IDP2501/IDP2502)": "IDP2501",
          "Theme": "Others",
          "Description  of IDP  project": "The rapid growth of e-commerce and direct-to-consumer businesses in India has significantly increased the use of packaging materials...",
          "Project ID": "P106",
          "Enrollment": 250180210108,
          "Student Name": "HARSHIT SAKLANI",
        },
        {
          "Faculty Name": "Dr. Dheeraj Miglani",
          "School": "Center of Aerospace and Energy Studies",
          "Email ID": "dheeraj.miglani@gdgu.org",
          "Contact No.": "91-9557280632",
          "Projet Title": "CubeSat Thermal Control",
          "Project  Category  (IDP2501/IDP2502)": "IDP2502",
          "Theme": "Intelligent Systems for Autonomous Sensing and Control",
          "Description  of IDP  project": "Instrumented CubeSat thermal model with heaters, sensors and thermal-control logic",
          "Project ID": "P043",
          "Enrollment": 250160226066,
          "Student Name": "CHUKKA PRAVITH LAKSHMAN SRI",
        },
      ];
    }
    // 4. TEMPLATE_FACULTY (Aligned with live GDGU faculty roster)
    else if (scope === "TEMPLATE_FACULTY") {
      title = "GDGU_Faculty_Import_Template";
      rows = [
        {
          "Faculty Name": "Ms. Shipra Khanna",
          "Email ID": "shipra@uid.edu.in",
          "School / Department": "United World Institute of Design (UID)",
          "Contact No.": "",
        },
        {
          "Faculty Name": "Dr. Khushbu  Parik",
          "Email ID": "khushbu.parik@gdgu.org",
          "School / Department": "School of Engineering & Sciences",
          "Contact No.": "91-7357899500",
        },
        {
          "Faculty Name": "Dr. Dheeraj Miglani",
          "Email ID": "dheeraj.miglani@gdgu.org",
          "School / Department": "Center of Aerospace and Energy Studies",
          "Contact No.": "91-9557280632",
        },
        {
          "Faculty Name": "Mr. Saurabh  Shekhar",
          "Email ID": "saurabh.shekhar@gdgu.org",
          "School / Department": "School of Healthcare and Allied Sciences",
          "Contact No.": "91-9773741909",
        },
      ];
    }
    // 5. TEMPLATE_SPOC (Aligned with live department structure)
    else if (scope === "TEMPLATE_SPOC") {
      title = "GDGU_SPOC_Import_Template";
      rows = [
        {
          "Faculty Name": "Ms. Shipra Khanna",
          "Official Email": "shipra@uid.edu.in",
          "Department": "United World Institute of Design (UID)",
          "Contact No.": "",
        },
        {
          "Faculty Name": "Dr. Khushbu  Parik",
          "Official Email": "khushbu.parik@gdgu.org",
          "Department": "School of Engineering & Sciences",
          "Contact No.": "91-7357899500",
        },
        {
          "Faculty Name": "Dr. Dheeraj Miglani",
          "Official Email": "dheeraj.miglani@gdgu.org",
          "Department": "Center of Aerospace and Energy Studies",
          "Contact No.": "91-9557280632",
        },
        {
          "Faculty Name": "Mr. Saurabh  Shekhar",
          "Official Email": "saurabh.shekhar@gdgu.org",
          "Department": "School of Healthcare and Allied Sciences",
          "Contact No.": "91-9773741909",
        },
      ];
    }
    // 0. IDP_COHORTS scope (Admin-Only - exact IDP Cohorts Details 5Sep-2026 format)
    else if (scope === "IDP_COHORTS") {
      if (session.role !== "ADMIN" && !session.isAdmin) {
        return NextResponse.json(
          { error: "Forbidden. Only administrators can download IDP cohort details." },
          { status: 403 }
        );
      }

      const schoolParam = searchParams.get("school") || searchParams.get("department");
      const filterParam = searchParams.get("filter") || "registered"; // "registered" | "all" | "unregistered"
      const academicYearParam = searchParams.get("academicYear");

      if (filterParam === "all" || filterParam === "unregistered") {
        const whereStudent: any = {};
        if (schoolParam && schoolParam !== "all") {
          whereStudent.department = schoolParam;
        }
        if (academicYearParam && academicYearParam !== "all") {
          whereStudent.academicYear = academicYearParam;
        }
        if (filterParam === "unregistered") {
          whereStudent.registration = null;
        }

        const studentsList = await prisma.student.findMany({
          where: whereStudent,
          include: {
            registration: {
              include: {
                project: {
                  include: { faculty: true },
                },
              },
            },
          },
          orderBy: [
            { department: "asc" },
            { enrollmentNumber: "asc" },
          ],
        });

        rows = studentsList.map((st) => {
          const reg = st.registration;
          const proj = reg?.project;
          const fac = proj?.faculty;

          const enrNum = /^\d+$/.test(st.enrollmentNumber)
            ? Number(st.enrollmentNumber)
            : st.enrollmentNumber;

          return {
            "Faculty Name": fac?.name || "",
            "School": proj?.department || fac?.department || st.department || "",
            "Email ID": fac?.email || "",
            "Contact No.": fac?.phone || "",
            "Projet Title": proj?.title || (reg ? "Allocated" : "UNREGISTERED"),
            "Project  Category  (IDP2501/IDP2502)": proj?.category || "",
            "Theme": proj?.theme || "",
            "Description  of IDP  project": proj?.description || "",
            "Project ID": proj?.projectId || (reg ? "N/A" : "UNREGISTERED"),
            "Enrollment": enrNum,
            "Student Name": st.name || "",
          };
        });
      } else {
        const whereRegistration: any = {};
        if (schoolParam && schoolParam !== "all") {
          whereRegistration.OR = [
            { project: { department: schoolParam } },
            { project: { faculty: { department: schoolParam } } },
            { student: { department: schoolParam } },
          ];
        }
        if (academicYearParam && academicYearParam !== "all") {
          whereRegistration.project = {
            academicYear: academicYearParam,
          };
        }

        const registrations = await prisma.registration.findMany({
          where: whereRegistration,
          include: {
            student: true,
            project: {
              include: { faculty: true },
            },
          },
          orderBy: [
            { project: { department: "asc" } },
            { project: { projectId: "asc" } },
            { student: { enrollmentNumber: "asc" } },
          ],
        });

        rows = registrations.map((r) => {
          const st = r.student;
          const proj = r.project;
          const fac = proj?.faculty;

          const enrNum = /^\d+$/.test(st.enrollmentNumber)
            ? Number(st.enrollmentNumber)
            : st.enrollmentNumber;

          return {
            "Faculty Name": fac?.name || "",
            "School": proj?.department || fac?.department || st?.department || "",
            "Email ID": fac?.email || "",
            "Contact No.": fac?.phone || "",
            "Projet Title": proj?.title || "",
            "Project  Category  (IDP2501/IDP2502)": proj?.category || "",
            "Theme": proj?.theme || "",
            "Description  of IDP  project": proj?.description || "",
            "Project ID": proj?.projectId || "",
            "Enrollment": enrNum,
            "Student Name": st?.name || "",
          };
        });
      }

      const dateStr = new Date().toISOString().split("T")[0];
      title = `IDP_Cohorts_Details_${dateStr}`;
    }
    // 1. FACULTY_STUDENTS scope
    else if (scope === "FACULTY_STUDENTS") {
      if (session.role !== "FACULTY" && session.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
      }

      const whereClause: any = {
        project: {
          facultyId: session.role === "FACULTY" ? session.id : undefined,
        },
      };

      if (projectId) {
        whereClause.projectId = projectId;
      }

      const registrations = await prisma.registration.findMany({
        where: whereClause,
        include: {
          student: true,
          project: {
            include: { faculty: true },
          },
        },
        orderBy: [{ project: { projectId: "asc" } }, { createdAt: "asc" }],
      });

      rows = registrations.map((r, idx) => ({
        "Sr. No": idx + 1,
        "Enrollment Number": r.student.enrollmentNumber,
        "Student Name": r.student.name,
        "Student Email": r.student.email || "N/A",
        "Student Department": r.student.department,
        "Programme": r.student.programme || "N/A",
        "Semester": r.student.semester,
        "Batch": r.student.batch,
        "Project ID": r.project.projectId,
        "Project Title": r.project.title,
        "Theme": r.project.theme,
        "Category": r.project.category,
        "Faculty Mentor": r.project.faculty.name,
        "Faculty Email": r.project.faculty.email,
        "Registration Date": r.createdAt.toISOString().split("T")[0],
        "Status": r.status,
      }));

      title = `Students_${projectId || "All_Projects"}`;
    }

    // 2. SPOC SCOPES
    else if (scope?.startsWith("SPOC_")) {
      let dept = departmentParam;
      if (session.role === "SPOC") {
        dept = session.spocDepartment || session.department || departmentParam;
      } else if (session.role === "FACULTY") {
        const fac = await prisma.faculty.findUnique({ where: { id: session.id } });
        if (!fac?.isSpoc || !fac.spocDepartment) {
          return NextResponse.json({ error: "Forbidden. Not a SPOC." }, { status: 403 });
        }
        dept = fac.spocDepartment;
      } else if (session.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
      }

      if (!dept) {
        return NextResponse.json({ error: "Department is required." }, { status: 400 });
      }

      if (scope === "SPOC_STUDENTS") {
        const registrations = await prisma.registration.findMany({
          where: {
            project: { department: dept },
          },
          include: {
            student: true,
            project: { include: { faculty: true } },
          },
          orderBy: [{ project: { projectId: "asc" } }, { student: { name: "asc" } }],
        });

        rows = registrations.map((r, idx) => ({
          "Sr. No": idx + 1,
          "Enrollment Number": r.student.enrollmentNumber,
          "Student Name": r.student.name,
          "Department": r.student.department,
          "Programme": r.student.programme || "N/A",
          "Semester": r.student.semester,
          "Batch": r.student.batch,
          "Project ID": r.project.projectId,
          "Project Title": r.project.title,
          "Faculty Mentor": r.project.faculty.name,
          "Registration Date": r.createdAt.toISOString().split("T")[0],
          "Status": r.status,
        }));
        title = `SPOC_${dept.replace(/[^a-zA-Z0-9]/g, "_")}_Students`;
      } else if (scope === "SPOC_FACULTY") {
        const faculties = await prisma.faculty.findMany({
          where: { department: dept },
          include: {
            projects: {
              include: {
                _count: { select: { registrations: true } },
              },
            },
          },
          orderBy: { name: "asc" },
        });

        rows = faculties.map((f, idx) => ({
          "Sr. No": idx + 1,
          "Faculty Name": f.name,
          "Email": f.email,
          "Department": f.department,
          "Phone": f.phone || "N/A",
          "Is SPOC": f.isSpoc ? "Yes" : "No",
          "Total Projects": f.projects.length,
          "Total Students": f.projects.reduce((acc, p) => acc + p._count.registrations, 0),
          "Projects": f.projects.map((p) => p.projectId).join(", "),
        }));
        title = `SPOC_${dept.replace(/[^a-zA-Z0-9]/g, "_")}_Faculty`;
      } else if (scope === "SPOC_PROJECTS") {
        const projects = await prisma.project.findMany({
          where: { department: dept },
          include: {
            faculty: true,
            artifacts: true,
            _count: { select: { registrations: true } },
          },
          orderBy: { projectId: "asc" },
        });

        rows = projects.map((p, idx) => ({
          "Sr. No": idx + 1,
          "Project ID": p.projectId,
          "Title": p.title,
          "Category": p.category,
          "Theme": p.theme,
          "Faculty Mentor": p.faculty.name,
          "Enrolled Students": p._count.registrations,
          "Submission Status": p.submissionStatus,
          "SPOC Review Note": p.spocReviewNote || "N/A",
          "Uploaded Artifacts Count": p.artifacts.length,
          "Report Similarity %":
            p.artifacts.find((a) => a.type === "REPORT")?.similarityPercent ?? "N/A",
          "Report AI %":
            p.artifacts.find((a) => a.type === "REPORT")?.aiPercent ?? "N/A",
        }));
        title = `SPOC_${dept.replace(/[^a-zA-Z0-9]/g, "_")}_Projects`;
      }
    } else {
      return NextResponse.json({ error: "Invalid scope parameter." }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No records found to export." }, { status: 404 });
    }

    // GENERATE FORMAT

    // 1. CSV
    if (format === "csv") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(
        rows,
        scope === "IDP_COHORTS" ? { header: [...IDP_COHORT_HEADERS] } : undefined
      );
      const csvOutput = XLSX.utils.sheet_to_csv(ws);

      return new NextResponse(csvOutput, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${title}.csv"`,
        },
      });
    }

    // 2. XLSX (Excel)
    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      const isCohortScope = scope === "IDP_COHORTS";
      const ws = XLSX.utils.json_to_sheet(
        rows,
        isCohortScope ? { header: [...IDP_COHORT_HEADERS] } : undefined
      );

      if (isCohortScope) {
        ws["!cols"] = [
          { wch: 28 }, // Faculty Name
          { wch: 40 }, // School
          { wch: 30 }, // Email ID
          { wch: 18 }, // Contact No.
          { wch: 45 }, // Projet Title
          { wch: 25 }, // Project  Category  (IDP2501/IDP2502)
          { wch: 32 }, // Theme
          { wch: 60 }, // Description  of IDP  project
          { wch: 14 }, // Project ID
          { wch: 18 }, // Enrollment
          { wch: 30 }, // Student Name
        ];
      }
      
      const sheetName =
        scope === "TEMPLATE_PROJECTS" || scope === "TEMPLATE_CHC"
          ? "SERVICE_REQUESTS"
          : (isCohortScope || scope?.startsWith("TEMPLATE_") ? "Sheet1" : "Data");
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${title}.xlsx"`,
        },
      });
    }

    // 3. PDF / Printable Structured View
    if (format === "pdf") {
      const headers = Object.keys(rows[0] || {});
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 15px; font-size: 11px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0d2137; padding-bottom: 12px; margin-bottom: 16px; }
    .title { font-size: 18px; font-weight: bold; color: #0d2137; margin: 0; }
    .meta { font-size: 11px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #0d2137; color: #ffffff; text-align: left; padding: 6px 8px; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .footer { margin-top: 20px; font-size: 9px; color: #94a3b8; text-align: right; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">GD GUENKA UNIVERSITY · IDP PORTAL</h1>
      <div class="meta">${title.replace(/_/g, " ")} · Generated on ${new Date().toLocaleString()} · Total Records: ${rows.length}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        ${headers.map((h) => `<th>${h}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (r) =>
            `<tr>${headers
              .map((h) => `<td>${r[h] !== undefined && r[h] !== null ? r[h] : ""}</td>`)
              .join("")}</tr>`
        )
        .join("")}
    </tbody>
  </table>
  <div class="footer">Confidential · G.D. Goenka University Institutional Project Portal</div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format." }, { status: 400 });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate export." },
      { status: 500 }
    );
  }
}
