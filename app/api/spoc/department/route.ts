import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let department: string | null = null;

    if (session.role === "SPOC") {
      let dept = session.spocDepartment || session.department;
      if (!dept) {
        const spoc = await prisma.spoc.findUnique({
          where: { id: session.id },
        });
        if (spoc) {
          dept = spoc.department;
        } else {
          const faculty = await prisma.faculty.findUnique({
            where: { id: session.id },
          });
          if (faculty?.isSpoc) {
            dept = faculty.spocDepartment || faculty.department;
          }
        }
      }
      department = dept || null;
      if (!department) {
        return NextResponse.json(
          { error: "SPOC department authorization not found." },
          { status: 404 }
        );
      }
    } else if (session.role === "ADMIN") {
      const { searchParams } = new URL(req.url);
      department = searchParams.get("department");
    } else if (session.role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({
        where: { id: session.id },
      });
      if (!faculty || !faculty.isSpoc || !faculty.spocDepartment) {
        return NextResponse.json(
          { error: "Access forbidden. You are not designated as a Department SPOC." },
          { status: 403 }
        );
      }
      department = faculty.spocDepartment;
    } else {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!department) {
      return NextResponse.json({ error: "Department is required." }, { status: 400 });
    }

    // 1. Fetch Faculty in this department
    const facultyList = await prisma.faculty.findMany({
      where: { department },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        phone: true,
        isSpoc: true,
        projects: {
          select: {
            id: true,
            projectId: true,
            title: true,
            submissionStatus: true,
            _count: {
              select: { registrations: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // 2. Fetch Projects in this department with full artifacts & registrations
    const projects = await prisma.project.findMany({
      where: { department },
      include: {
        faculty: {
          select: { id: true, name: true, email: true, department: true, phone: true },
        },
        artifacts: {
          orderBy: { createdAt: "desc" },
          include: {
            reviewedBy: {
              select: { name: true, email: true },
            },
          },
        },
        registrations: {
          include: {
            student: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { projectId: "asc" },
    });

    // 3. Flatten list of enrolled students in this department's projects
    const studentsMap = new Map<string, any>();
    projects.forEach((proj) => {
      proj.registrations.forEach((reg) => {
        if (!studentsMap.has(reg.student.id)) {
          studentsMap.set(reg.student.id, {
            id: reg.student.id,
            enrollmentNumber: reg.student.enrollmentNumber,
            name: reg.student.name,
            department: reg.student.department,
            programme: reg.student.programme,
            semester: reg.student.semester,
            batch: reg.student.batch,
            email: reg.student.email,
            phone: reg.student.phone,
            internalMarks: reg.student.internalMarks,
            externalMarks: reg.student.externalMarks,
            attendancePercent: reg.student.attendancePercent,
            projectId: proj.projectId,
            projectTitle: proj.title,
            facultyName: proj.faculty.name,
            facultyEmail: proj.faculty.email,
            registeredAt: reg.createdAt.toISOString(),
          });
        }
      });
    });

    const students = Array.from(studentsMap.values());

    // 4. Compute KPIs
    const totalProjects = projects.length;
    const totalFaculty = facultyList.length;
    const totalStudents = students.length;

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let notSubmittedCount = 0;

    projects.forEach((p) => {
      if (p.submissionStatus === "PENDING") pendingCount++;
      else if (p.submissionStatus === "APPROVED") approvedCount++;
      else if (p.submissionStatus === "REJECTED") rejectedCount++;
      else notSubmittedCount++;
    });

    return NextResponse.json({
      department,
      kpis: {
        totalProjects,
        totalFaculty,
        totalStudents,
        pendingCount,
        approvedCount,
        rejectedCount,
        notSubmittedCount,
      },
      faculty: facultyList.map((f) => ({
        id: f.id,
        name: f.name,
        email: f.email,
        phone: f.phone,
        isSpoc: f.isSpoc,
        projectsCount: f.projects.length,
        studentsCount: f.projects.reduce((acc, curr) => acc + curr._count.registrations, 0),
        projects: f.projects,
      })),
      projects: projects.map((p) => ({
        id: p.id,
        projectId: p.projectId,
        title: p.title,
        description: p.description,
        theme: p.theme,
        category: p.category,
        semester: p.semester,
        academicYear: p.academicYear,
        submissionStatus: p.submissionStatus,
        spocReviewNote: p.spocReviewNote,
        reviewedAt: p.reviewedAt?.toISOString() || null,
        faculty: p.faculty,
        studentsCount: p.registrations.length,
        artifacts: p.artifacts.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
          semester: a.semester,
          academicYear: a.academicYear,
          similarityPercent: a.similarityPercent,
          aiPercent: a.aiPercent,
          similarityChecked: a.similarityChecked,
          aiChecked: a.aiChecked,
          plagiarismReportFileName: a.plagiarismReportFileName,
          plagiarismReportUrl: a.plagiarismReportUrl,
          selfDeclaration: a.selfDeclaration,
          status: a.status,
          spocNote: a.spocNote,
          submittedAt: a.submittedAt.toISOString(),
          reviewedAt: a.reviewedAt?.toISOString() || null,
          reviewedBy: a.reviewedBy?.name || null,
        })),
        students: p.registrations.map((r) => ({
          id: r.student.id,
          enrollment: r.student.enrollmentNumber,
          name: r.student.name,
          department: r.student.department,
          programme: r.student.programme,
          semester: r.student.semester,
          batch: r.student.batch,
        })),
      })),
      students,
    });
  } catch (error: any) {
    console.error("SPOC department API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load SPOC department data." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SPOC" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. SPOC or Admin access required." }, { status: 401 });
    }

    const body = await req.json();
    const { action, updates, studentId, attendancePercent, internalMarks, externalMarks } = body;

    if (action === "UPDATE_STUDENT_MARKS" || action === "BULK_UPDATE_MARKS") {
      let recordsToUpdate: Array<{
        studentId?: string;
        enrollmentNumber?: string;
        attendancePercent?: number | null;
        internalMarks?: number | null;
        externalMarks?: number | null;
      }> = [];

      if (Array.isArray(updates) && updates.length > 0) {
        recordsToUpdate = updates;
      } else if (studentId) {
        recordsToUpdate = [
          {
            studentId,
            attendancePercent: attendancePercent !== undefined ? Number(attendancePercent) : undefined,
            internalMarks: internalMarks !== undefined ? Number(internalMarks) : undefined,
            externalMarks: externalMarks !== undefined ? Number(externalMarks) : undefined,
          },
        ];
      } else {
        return NextResponse.json({ error: "No student update data provided." }, { status: 400 });
      }

      let updatedCount = 0;
      for (const item of recordsToUpdate) {
        const updateData: any = {};
        if (item.attendancePercent !== undefined && item.attendancePercent !== null && !isNaN(Number(item.attendancePercent))) {
          updateData.attendancePercent = Math.min(100, Math.max(0, Number(item.attendancePercent)));
        }
        if (item.internalMarks !== undefined && item.internalMarks !== null && !isNaN(Number(item.internalMarks))) {
          updateData.internalMarks = Math.max(0, Number(item.internalMarks));
        }
        if (item.externalMarks !== undefined && item.externalMarks !== null && !isNaN(Number(item.externalMarks))) {
          updateData.externalMarks = Math.max(0, Number(item.externalMarks));
        }

        if (Object.keys(updateData).length === 0) continue;

        if (item.studentId) {
          await prisma.student.update({
            where: { id: item.studentId },
            data: updateData,
          });
          updatedCount++;
        } else if (item.enrollmentNumber) {
          const res = await prisma.student.updateMany({
            where: { enrollmentNumber: String(item.enrollmentNumber).trim() },
            data: updateData,
          });
          if (res.count > 0) updatedCount += res.count;
        }
      }

      await prisma.auditLog.create({
        data: {
          actor: session.name,
          actorRole: session.role,
          action: "SPOC_STUDENT_MARKS_UPLOADED",
          metadata: JSON.stringify({ count: updatedCount }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated attendance & assessment for ${updatedCount} student(s).`,
        updatedCount,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("SPOC marks update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update student assessments." },
      { status: 500 }
    );
  }
}

