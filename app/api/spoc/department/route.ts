import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanErrorMessage, safeIsoString, parseNum } from "@/lib/api-response";

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

    // 1. Fetch Faculty associated with this department (direct affiliation or mentoring projects in it)
    const facultyList = await prisma.faculty.findMany({
      where: {
        OR: [
          { department },
          { projects: { some: { department } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        phone: true,
        isSpoc: true,
      },
      orderBy: { name: "asc" },
    });

    // 2. Fetch Projects in this department with artifacts and faculty
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
      },
      orderBy: { projectId: "asc" },
    });

    // 3. Single-query indexed JOIN to fetch all registrations and students in this department
    // Avoids D1's "too many SQL variables" parameter limit on large cohorts (>400 students)
    interface RawStudentReg {
      regId: string;
      projectId: string;
      status: string;
      regCreatedAt: unknown;
      studentId: string;
      enrollmentNumber: string;
      studentName: string;
      studentDepartment: string;
      programme: string | null;
      semester: number | bigint;
      batch: string;
      studentEmail: string | null;
      studentPhone: string | null;
      internalMarks: number | bigint | null;
      externalMarks: number | bigint | null;
      attendancePercent: number | bigint | null;
    }

    const rawRegs: RawStudentReg[] = await prisma.$queryRaw`
      SELECT 
        r.id as regId,
        r.projectId as projectId,
        r.status as status,
        r.createdAt as regCreatedAt,
        s.id as studentId,
        s.enrollmentNumber as enrollmentNumber,
        s.name as studentName,
        s.department as studentDepartment,
        s.programme as programme,
        s.semester as semester,
        s.batch as batch,
        s.email as studentEmail,
        s.phone as studentPhone,
        s.internalMarks as internalMarks,
        s.externalMarks as externalMarks,
        s.attendancePercent as attendancePercent
      FROM Registration r
      JOIN Student s ON r.studentId = s.id
      JOIN Project p ON r.projectId = p.id
      WHERE p.department = ${department}
      ORDER BY s.name ASC
    `;

    // 4. Index registrations by project and compute student directory
    const regsByProjectId = new Map<string, RawStudentReg[]>();
    const studentsMap = new Map<string, any>();
    const projectsMap = new Map(projects.map((p) => [p.id, p]));

    for (const r of rawRegs) {
      if (!regsByProjectId.has(r.projectId)) {
        regsByProjectId.set(r.projectId, []);
      }
      regsByProjectId.get(r.projectId)!.push(r);

      const proj = projectsMap.get(r.projectId);
      if (!studentsMap.has(r.studentId)) {
        studentsMap.set(r.studentId, {
          id: r.studentId,
          enrollmentNumber: r.enrollmentNumber,
          name: r.studentName,
          department: r.studentDepartment,
          programme: r.programme,
          semester: parseNum(r.semester),
          batch: r.batch,
          email: r.studentEmail,
          phone: r.studentPhone,
          internalMarks: r.internalMarks != null ? parseNum(r.internalMarks) : null,
          externalMarks: r.externalMarks != null ? parseNum(r.externalMarks) : null,
          attendancePercent: r.attendancePercent != null ? parseNum(r.attendancePercent) : null,
          projectId: proj?.projectId || "",
          projectTitle: proj?.title || "",
          facultyName: proj?.faculty.name || "",
          facultyEmail: proj?.faculty.email || "",
          registeredAt: safeIsoString(r.regCreatedAt) || "",
        });
      }
    }

    const students = Array.from(studentsMap.values());

    // 5. Index projects by faculty
    const projectsByFacultyId = new Map<string, typeof projects>();
    for (const p of projects) {
      if (!projectsByFacultyId.has(p.facultyId)) {
        projectsByFacultyId.set(p.facultyId, []);
      }
      projectsByFacultyId.get(p.facultyId)!.push(p);
    }

    // 6. Compute Faculty Marks Submission Metrics
    let facultyMarksSharedCount = 0;
    let facultyMarksPartialCount = 0;
    let facultyMarksPendingCount = 0;

    const formattedFaculty = facultyList.map((f) => {
      const facProjects = projectsByFacultyId.get(f.id) || [];
      const facultyStudentsMap = new Map<string, any>();

      facProjects.forEach((proj) => {
        const pRegs = regsByProjectId.get(proj.id) || [];
        pRegs.forEach((r) => {
          if (!facultyStudentsMap.has(r.studentId)) {
            const internalMarks = r.internalMarks != null ? parseNum(r.internalMarks) : 0;
            const externalMarks = r.externalMarks != null ? parseNum(r.externalMarks) : 0;
            const attendancePercent = r.attendancePercent != null ? parseNum(r.attendancePercent, 100) : 100;
            const marksShared = internalMarks > 0 || externalMarks > 0;
            facultyStudentsMap.set(r.studentId, {
              studentId: r.studentId,
              enrollmentNumber: r.enrollmentNumber,
              name: r.studentName,
              programme: r.programme || undefined,
              internalMarks,
              externalMarks,
              attendancePercent,
              marksShared,
              projectTitle: proj.title,
              projectId: proj.projectId,
            });
          }
        });
      });

      const studentsWithMarks = Array.from(facultyStudentsMap.values());
      const studentsCount = studentsWithMarks.length;
      const sharedCount = studentsWithMarks.filter((s) => s.marksShared).length;
      const pendingCount = studentsCount - sharedCount;

      let marksStatus: "SHARED" | "PARTIAL" | "NOT_SHARED" | "NO_STUDENTS" = "NO_STUDENTS";
      if (studentsCount === 0) {
        marksStatus = "NO_STUDENTS";
      } else if (sharedCount === studentsCount) {
        marksStatus = "SHARED";
        facultyMarksSharedCount++;
      } else if (sharedCount > 0) {
        marksStatus = "PARTIAL";
        facultyMarksPartialCount++;
      } else {
        marksStatus = "NOT_SHARED";
        facultyMarksPendingCount++;
      }

      return {
        id: f.id,
        name: f.name,
        email: f.email,
        phone: f.phone,
        isSpoc: f.isSpoc,
        projectsCount: facProjects.length,
        studentsCount,
        marksStatus,
        marksSharedCount: sharedCount,
        marksPendingCount: pendingCount,
        studentsWithMarks,
        projects: facProjects.map((p) => ({
          id: p.id,
          projectId: p.projectId,
          title: p.title,
          submissionStatus: p.submissionStatus,
        })),
      };
    });

    // 7. Compute KPIs
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
        facultyMarksSharedCount,
        facultyMarksPartialCount,
        facultyMarksPendingCount,
      },
      faculty: formattedFaculty,
      projects: projects.map((p) => {
        const pRegs = regsByProjectId.get(p.id) || [];
        return {
          id: p.id,
          projectId: p.projectId,
          title: p.title,
          description: p.description,
          theme: p.theme,
          category: p.category,
          semester: parseNum(p.semester, 3),
          academicYear: p.academicYear,
          submissionStatus: p.submissionStatus,
          spocReviewNote: p.spocReviewNote,
          reviewedAt: safeIsoString(p.reviewedAt),
          hasDraftManuscript: Boolean(p.hasDraftManuscript || p.draftManuscriptUrl),
          hasCommunicatedManuscript: Boolean(p.hasCommunicatedManuscript),
          draftManuscriptUrl: p.draftManuscriptUrl,
          draftManuscriptFileName: p.draftManuscriptFileName,
          journalName: p.journalName,
          avishkarAffiliationCommunicated: Boolean(p.avishkarAffiliationCommunicated),
          isManuscriptPublished: Boolean(p.isManuscriptPublished),
          publicationDoi: p.publicationDoi,
          publishedManuscriptUrl: p.publishedManuscriptUrl,
          publishedManuscriptFileName: p.publishedManuscriptFileName,
          avishkarAffiliationPublished: Boolean(p.avishkarAffiliationPublished),
          manuscriptPlagiarismUrl: p.manuscriptPlagiarismUrl,
          manuscriptPlagiarismFileName: p.manuscriptPlagiarismFileName,
          manuscriptSimilarityPercent: p.manuscriptSimilarityPercent != null ? parseNum(p.manuscriptSimilarityPercent) : null,
          manuscriptAiPercent: p.manuscriptAiPercent != null ? parseNum(p.manuscriptAiPercent) : null,
          manuscriptSubmittedAt: safeIsoString(p.manuscriptSubmittedAt),
          faculty: p.faculty,
          studentsCount: pRegs.length,
          artifacts: p.artifacts.map((a) => ({
            id: a.id,
            type: a.type,
            title: a.title,
            fileName: a.fileName,
            fileUrl: a.fileUrl,
            fileSize: a.fileSize != null ? parseNum(a.fileSize) : null,
            mimeType: a.mimeType,
            semester: parseNum(a.semester, 3),
            academicYear: a.academicYear,
            similarityPercent: a.similarityPercent != null ? parseNum(a.similarityPercent) : null,
            aiPercent: a.aiPercent != null ? parseNum(a.aiPercent) : null,
            similarityChecked: Boolean(a.similarityChecked),
            aiChecked: Boolean(a.aiChecked),
            plagiarismReportFileName: a.plagiarismReportFileName,
            plagiarismReportUrl: a.plagiarismReportUrl,
            selfDeclaration: Boolean(a.selfDeclaration),
            status: a.status,
            spocNote: a.spocNote,
            submittedAt: safeIsoString(a.submittedAt) || safeIsoString(a.createdAt) || "",
            reviewedAt: safeIsoString(a.reviewedAt),
            reviewedBy: a.reviewedBy?.name || null,
          })),
          students: pRegs.map((r) => ({
            id: r.studentId,
            enrollment: r.enrollmentNumber,
            name: r.studentName,
            department: r.studentDepartment,
            programme: r.programme,
            semester: parseNum(r.semester),
            batch: r.batch,
            internalMarks: r.internalMarks != null ? parseNum(r.internalMarks) : null,
            externalMarks: r.externalMarks != null ? parseNum(r.externalMarks) : null,
            attendancePercent: r.attendancePercent != null ? parseNum(r.attendancePercent) : null,
          })),
        };
      }),
      students,
    });
  } catch (error: any) {
    console.error("SPOC department API error:", error);
    return NextResponse.json(
      { error: cleanErrorMessage(error, "Failed to load SPOC department data.") },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SPOC" && session.role !== "ADMIN" && session.role !== "FACULTY")) {
      return NextResponse.json({ error: "Unauthorized. SPOC or Admin access required." }, { status: 401 });
    }

    let authorizedDepartment: string | null = null;
    if (session.role === "ADMIN") {
      authorizedDepartment = "*";
    } else if (session.role === "SPOC") {
      const spoc = await prisma.spoc.findUnique({ where: { id: session.id } });
      if (spoc) {
        authorizedDepartment = spoc.department;
      } else {
        const faculty = await prisma.faculty.findUnique({ where: { id: session.id } });
        if (faculty?.isSpoc) authorizedDepartment = faculty.spocDepartment || faculty.department;
      }
    } else if (session.role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({ where: { id: session.id } });
      if (faculty?.isSpoc && faculty.spocDepartment) {
        authorizedDepartment = faculty.spocDepartment;
      }
    }

    if (!authorizedDepartment) {
      return NextResponse.json({ error: "Access forbidden. SPOC authorization not found." }, { status: 403 });
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

      // 1. Validate marks bounds strictly (no silent clamping, no type coercion bugs)
      for (const item of recordsToUpdate) {
        if (item.internalMarks !== undefined && item.internalMarks !== null) {
          const val = Number(item.internalMarks);
          if (!Number.isFinite(val) || val < 0 || val > 50) {
            return NextResponse.json(
              { error: `Internal marks must be a valid number between 0 and 50. Received: ${item.internalMarks}` },
              { status: 400 }
            );
          }
        }
        if (item.externalMarks !== undefined && item.externalMarks !== null) {
          const val = Number(item.externalMarks);
          if (!Number.isFinite(val) || val < 0 || val > 50) {
            return NextResponse.json(
              { error: `External marks must be a valid number between 0 and 50. Received: ${item.externalMarks}` },
              { status: 400 }
            );
          }
        }
        if (item.attendancePercent !== undefined && item.attendancePercent !== null) {
          const val = Number(item.attendancePercent);
          if (!Number.isFinite(val) || val < 0 || val > 100) {
            return NextResponse.json(
              { error: `Attendance percentage must be between 0 and 100. Received: ${item.attendancePercent}` },
              { status: 400 }
            );
          }
        }
      }

      // 2. Fetch scoped students in authorized department
      const targetStudentIds = recordsToUpdate.map((r: any) => r.studentId).filter(Boolean) as string[];
      const targetEnrollments = recordsToUpdate.map((r: any) => r.enrollmentNumber).filter(Boolean).map((e: any) => String(e).trim());

      const allowedStudents = await prisma.student.findMany({
        where: {
          OR: [
            ...(targetStudentIds.length > 0 ? [{ id: { in: targetStudentIds } }] : []),
            ...(targetEnrollments.length > 0 ? [{ enrollmentNumber: { in: targetEnrollments } }] : []),
          ],
          ...(authorizedDepartment !== "*"
            ? {
                AND: [
                  {
                    OR: [
                      { department: authorizedDepartment },
                      { registration: { project: { department: authorizedDepartment } } },
                    ],
                  },
                ],
              }
            : {}),
        },
        select: { id: true, enrollmentNumber: true },
      });

      const allowedIdSet = new Set(allowedStudents.map((s) => s.id));
      const allowedEnrollMap = new Map(allowedStudents.map((s) => [s.enrollmentNumber, s.id]));

      const updateOperations: any[] = [];
      for (const item of recordsToUpdate) {
        let targetId: string | null = null;
        if (item.studentId && allowedIdSet.has(item.studentId)) {
          targetId = item.studentId;
        } else if (item.enrollmentNumber) {
          const cleanEnroll = String(item.enrollmentNumber).trim();
          if (allowedEnrollMap.has(cleanEnroll)) {
            targetId = allowedEnrollMap.get(cleanEnroll)!;
          }
        }

        if (!targetId) continue; // Out of scope

        const updateData: any = {};
        if (item.attendancePercent !== undefined && item.attendancePercent !== null) {
          updateData.attendancePercent = Number(item.attendancePercent);
        }
        if (item.internalMarks !== undefined && item.internalMarks !== null) {
          updateData.internalMarks = Number(item.internalMarks);
        }
        if (item.externalMarks !== undefined && item.externalMarks !== null) {
          updateData.externalMarks = Number(item.externalMarks);
        }

        if (Object.keys(updateData).length > 0) {
          updateOperations.push(
            prisma.student.update({
              where: { id: targetId },
              data: updateData,
            })
          );
        }
      }

      if (updateOperations.length > 0) {
        // Execute all updates and the audit log in a single atomic transaction
        await prisma.$transaction([
          ...updateOperations,
          prisma.auditLog.create({
            data: {
              actor: session.name,
              actorRole: session.role,
              action: "SPOC_STUDENT_MARKS_UPLOADED",
              metadata: JSON.stringify({ count: updateOperations.length, department: authorizedDepartment }),
            },
          }),
        ]);
      }
      const updatedCount = updateOperations.length;

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
      { error: cleanErrorMessage(error, "Failed to update student assessments.") },
      { status: 500 }
    );
  }
}

