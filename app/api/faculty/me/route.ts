import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanErrorMessage, safeIsoString, parseNum } from "@/lib/api-response";
import { resolveProjectLimits } from "@/services/registration.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
          semester: parseNum(p.semester, 3),
          submissionStatus: p.submissionStatus,
          spocReviewNote: p.spocReviewNote,
          reviewedAt: safeIsoString(p.reviewedAt),
          // Research Manuscript & Publication (Optional)
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
          maxSeats: parseNum(limits.maxSeats, 10),
          currentRegistrations: p.registrations.length,
          availableSeats: Math.max(0, parseNum(limits.maxSeats, 10) - p.registrations.length),
          artifacts: p.artifacts.map((a) => ({
            id: a.id,
            type: a.type,
            title: a.title,
            fileName: a.fileName,
            fileUrl: a.fileUrl,
            fileSize: a.fileSize != null ? parseNum(a.fileSize) : null,
            mimeType: a.mimeType,
            academicYear: a.academicYear,
            semester: parseNum(a.semester, 3),
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
            semester: parseNum(r.student.semester, 3),
            batch: r.student.batch,
            registeredAt: safeIsoString(r.createdAt) || "",
            status: r.status,
            internalMarks: r.student.internalMarks != null ? parseNum(r.student.internalMarks) : 0,
            externalMarks: r.student.externalMarks != null ? parseNum(r.student.externalMarks) : 0,
            attendancePercent: r.student.attendancePercent != null ? parseNum(r.student.attendancePercent, 100) : 100,
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
        isAdmin: Boolean(faculty.isAdmin),
        isSpoc: Boolean(faculty.isSpoc),
        spocDepartment: faculty.spocDepartment,
      },
      projects: enrichedProjects,
      smsOtpEnabled: false,
    });
  } catch (err: any) {
    console.error("GET /api/faculty/me error:", err);
    return NextResponse.json(
      { error: cleanErrorMessage(err, "Failed to load faculty dashboard.") },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "FACULTY" && session.role !== "SPOC" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { phone, confirmPhone, consent } = body;

    const clean = (phone || "").replace(/\D/g, "");
    if (clean.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const normalizedPhone = clean.slice(-10);

    const cleanConfirm = (confirmPhone || "").replace(/\D/g, "").slice(-10);
    if (!cleanConfirm || cleanConfirm !== normalizedPhone) {
      return NextResponse.json(
        { error: "Mobile numbers do not match. Please re-enter to confirm." },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { error: "Consent is required: please tick 'this will be used for further communication'." },
        { status: 400 }
      );
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id: session.id },
    });
    if (!faculty) {
      return NextResponse.json({ error: "Faculty record not found." }, { status: 404 });
    }

    const updated = await prisma.faculty.update({
      where: { id: faculty.id },
      data: { phone: normalizedPhone },
    });

    return NextResponse.json({
      success: true,
      message: "Mobile number verified and saved successfully.",
      phone: updated.phone,
    });
  } catch (err: any) {
    console.error("Faculty profile update error:", err);
    return NextResponse.json(
      { error: cleanErrorMessage(err, "Failed to update phone number. Please try again.") },
      { status: 500 }
    );
  }
}
