import { NextRequest, NextResponse } from "next/server";
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
        academicYear: p.academicYear,
        semester: p.semester,
        submissionStatus: p.submissionStatus,
        spocReviewNote: p.spocReviewNote,
        reviewedAt: p.reviewedAt?.toISOString() || null,
        // Research Manuscript & Publication (Optional)
        hasCommunicatedManuscript: p.hasCommunicatedManuscript,
        draftManuscriptUrl: p.draftManuscriptUrl,
        draftManuscriptFileName: p.draftManuscriptFileName,
        journalName: p.journalName,
        avishkarAffiliationCommunicated: p.avishkarAffiliationCommunicated,
        isManuscriptPublished: p.isManuscriptPublished,
        publicationDoi: p.publicationDoi,
        publishedManuscriptUrl: p.publishedManuscriptUrl,
        publishedManuscriptFileName: p.publishedManuscriptFileName,
        avishkarAffiliationPublished: p.avishkarAffiliationPublished,
        manuscriptPlagiarismUrl: p.manuscriptPlagiarismUrl,
        manuscriptPlagiarismFileName: p.manuscriptPlagiarismFileName,
        manuscriptSimilarityPercent: p.manuscriptSimilarityPercent,
        manuscriptAiPercent: p.manuscriptAiPercent,
        manuscriptSubmittedAt: p.manuscriptSubmittedAt?.toISOString() || null,
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
          academicYear: a.academicYear,
          semester: a.semester,
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
        })),
        students: p.registrations.map((r) => ({
          id: r.student.id,
          registrationId: r.id,
          enrollment: r.student.enrollmentNumber,
          name: r.student.name,
          department: r.student.department,
          programme: r.student.programme,
          phone: r.student.phone,
          phoneVerified: Boolean(r.student.phoneVerified),
          email: r.student.email,
          semester: r.student.semester,
          batch: r.student.batch,
          registeredAt: r.createdAt.toISOString(),
          status: r.status,
          internalMarks: r.student.internalMarks ?? 0,
          externalMarks: r.student.externalMarks ?? 0,
          attendancePercent: r.student.attendancePercent ?? 100,
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

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "FACULTY" && session.role !== "SPOC" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { phone } = body;

    const clean = (phone || "").replace(/\D/g, "");
    if (clean.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const normalizedPhone = clean.slice(-10);

    const updated = await prisma.faculty.update({
      where: { id: session.id },
      data: { phone: normalizedPhone },
    });

    return NextResponse.json({
      success: true,
      message: "Mobile number verified and saved successfully.",
      phone: updated.phone,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update phone number." },
      { status: 500 }
    );
  }
}
