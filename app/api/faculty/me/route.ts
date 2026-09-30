import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveProjectLimits } from "@/services/registration.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "FACULTY") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const faculty = await prisma.faculty.findUnique({
    where: { id: session.id },
    include: {
      projects: {
        include: {
          artifacts: {
            orderBy: { createdAt: "desc" },
          },
          registrations: {
            include: {
              student: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { projectId: "asc" },
      },
    },
  });

  if (!faculty) {
    return NextResponse.json({ error: "Faculty not found." }, { status: 404 });
  }

  const enrichedProjects = await Promise.all(
    faculty.projects.map(async (p) => {
      const limits = await resolveProjectLimits(
        p.id,
        p.department,
        p.maxSeats,
        p.sameDeptLimit,
        p.otherDeptLimit
      );
      return {
        id: p.id,
        projectId: p.projectId,
        title: p.title,
        description: p.description,
        theme: p.theme,
        category: p.category,
        submissionStatus: p.submissionStatus,
        spocReviewNote: p.spocReviewNote,
        reviewedAt: p.reviewedAt?.toISOString() || null,
        maxSeats: limits.maxSeats,
        currentRegistrations: p.registrations.length,
        availableSeats: Math.max(0, limits.maxSeats - p.registrations.length),
        artifacts: p.artifacts.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
          similarityPercent: a.similarityPercent,
          aiPercent: a.aiPercent,
          similarityChecked: a.similarityChecked,
          aiChecked: a.aiChecked,
          status: a.status,
          spocNote: a.spocNote,
          submittedAt: a.submittedAt.toISOString(),
          reviewedAt: a.reviewedAt?.toISOString() || null,
        })),
        students: p.registrations.map((r) => ({
          id: r.id,
          enrollment: r.student.enrollmentNumber,
          name: r.student.name,
          department: r.student.department,
          programme: r.student.programme,
          semester: r.student.semester,
          batch: r.student.batch,
          registeredAt: r.createdAt.toISOString(),
          status: r.status,
        })),
      };
    })
  );

  return NextResponse.json({
    faculty: {
      id: faculty.id,
      name: faculty.name,
      email: faculty.email,
      department: faculty.department,
      phone: faculty.phone,
      isAdmin: faculty.isAdmin,
      isSpoc: faculty.isSpoc,
      spocDepartment: faculty.spocDepartment,
    },
    projects: enrichedProjects,
  });
}
