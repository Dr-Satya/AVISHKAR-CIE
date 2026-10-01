import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

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
    if (scope === "TEMPLATE_STUDENTS") {
      title = "GDGU_Students_Import_Template";
      rows = [
        {
          "Enrolment No.": "230101001",
          "Name": "Aarav Sharma",
          "Department": "School of Engineering & Sciences",
          "Programme Name": "B.Tech Computer Science & Engineering",
          "Semester": 3,
          "Batch": "2025",
          "Admission No.": "ADM2023001",
        },
        {
          "Enrolment No.": "230102002",
          "Name": "Diya Patel",
          "Department": "School of Management",
          "Programme Name": "BBA Marketing",
          "Semester": 3,
          "Batch": "2025",
          "Admission No.": "ADM2023002",
        },
        {
          "Enrolment No.": "230103003",
          "Name": "Rohan Gupta",
          "Department": "School of Law",
          "Programme Name": "BA LLB (Hons)",
          "Semester": 3,
          "Batch": "2025",
          "Admission No.": "ADM2023003",
        },
      ];
    } else if (scope === "TEMPLATE_FACULTY") {
      title = "GDGU_Faculty_Import_Template";
      rows = [
        {
          "Faculty Name": "Dr. Ramesh Verma",
          "Email ID": "ramesh.verma@gdgu.org",
          "School / Department": "School of Engineering & Sciences",
          "Contact No.": "9876543210",
        },
        {
          "Faculty Name": "Dr. Ananya Sen",
          "Email ID": "ananya.sen@gdgu.org",
          "School / Department": "School of Management",
          "Contact No.": "9876543211",
        },
        {
          "Faculty Name": "Prof. Vikram Malhotra",
          "Email ID": "vikram.malhotra@gdgu.org",
          "School / Department": "School of Law",
          "Contact No.": "9876543212",
        },
      ];
    } else if (scope === "TEMPLATE_SPOC") {
      title = "GDGU_SPOC_Import_Template";
      rows = [
        {
          "Faculty Name": "Dr. Ramesh Verma",
          "Official Email": "ramesh.verma@gdgu.org",
          "Department": "School of Engineering & Sciences",
          "Contact No.": "9876543210",
        },
        {
          "Faculty Name": "Dr. Ananya Sen",
          "Official Email": "ananya.sen@gdgu.org",
          "Department": "School of Management",
          "Contact No.": "9876543211",
        },
      ];
    } else if (scope === "TEMPLATE_PROJECTS") {
      title = "GDGU_Projects_Import_Template";
      rows = [
        {
          "Project ID": "IDP2601_01",
          "Project Title": "Smart Agro-Tech Monitoring System",
          "Faculty Email": "ramesh.verma@gdgu.org",
          "School": "School of Engineering & Sciences",
          "Category": "IDP2601",
          "Theme": "Internet of Things",
          "Description": "An IoT-based crop health and moisture tracking platform.",
        },
        {
          "Project ID": "IDP2602_02",
          "Project Title": "Sustainable Supply Chain Optimization",
          "Faculty Email": "ananya.sen@gdgu.org",
          "School": "School of Management",
          "Category": "IDP2602",
          "Theme": "Sustainability",
          "Description": "Optimizing FMCG supply routes with lower carbon footprint.",
        },
      ];
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
      const ws = XLSX.utils.json_to_sheet(rows);
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
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Data");
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
