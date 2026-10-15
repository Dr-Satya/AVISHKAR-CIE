import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveProjectLimits } from "@/services/registration.service";
import { sendStudentOtp, verifyStudentOtp } from "@/lib/sms";

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

  const globalConfig = await prisma.globalConfig.findUnique({
    where: { id: "default" },
  });

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
    smsOtpEnabled: Boolean(globalConfig?.smsOtpEnabled),
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "FACULTY" && session.role !== "SPOC" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { phone, confirmPhone, otp, consent, action = "SAVE_PHONE" } = body;

    const globalConfig = await prisma.globalConfig.findUnique({
      where: { id: "default" },
    });
    const smsOtpEnabled = Boolean(globalConfig?.smsOtpEnabled);

    const clean = (phone || "").replace(/\D/g, "");
    if (clean.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const normalizedPhone = clean.slice(-10);

    const faculty = await prisma.faculty.findUnique({
      where: { id: session.id },
    });
    if (!faculty) {
      return NextResponse.json({ error: "Faculty record not found." }, { status: 404 });
    }

    // 1. ACTION: SEND_OTP
    if (action === "SEND_OTP") {
      const result = await sendStudentOtp(faculty.email, normalizedPhone, faculty.id);
      return NextResponse.json({
        success: true,
        message: result.message,
        devOtp: result.debugOtp,
      });
    }

    // 2. ACTION: VERIFY_OTP
    if (action === "VERIFY_OTP") {
      if (!consent) {
        return NextResponse.json(
          { error: "Please check the consent box to proceed." },
          { status: 400 }
        );
      }
      if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
        return NextResponse.json(
          { error: "Please enter the valid 6-digit OTP received on your mobile." },
          { status: 400 }
        );
      }

      const cleanOtp = otp.trim();
      const isValid = await verifyStudentOtp(faculty.email, cleanOtp, normalizedPhone);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid or expired OTP. Please request a new code." },
          { status: 400 }
        );
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
    }

    // 3. ACTION: SAVE_PHONE (When SMS OTP is OFF)
    if (smsOtpEnabled) {
      return NextResponse.json(
        { error: "SMS OTP verification is currently active. Please verify using OTP." },
        { status: 400 }
      );
    }

    if (confirmPhone) {
      const cleanConfirm = confirmPhone.replace(/\D/g, "").slice(-10);
      if (cleanConfirm !== normalizedPhone) {
        return NextResponse.json(
          { error: "Mobile numbers do not match. Please re-enter to confirm." },
          { status: 400 }
        );
      }
    }

    if (!consent) {
      return NextResponse.json(
        { error: "Please check the consent box to proceed." },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: err.message || "Failed to update phone number." },
      { status: 500 }
    );
  }
}
