import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerStudentForProject } from "@/services/registration.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized. Student login required." }, { status: 401 });
    }

    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: session.id },
      select: { phoneVerified: true },
    });
    if (!student?.phoneVerified) {
      return NextResponse.json(
        { error: "Please verify and confirm your mobile number before registering for a project." },
        { status: 400 }
      );
    }

    const result = await registerStudentForProject(session.id, projectId, {
      name: session.name,
      role: "STUDENT",
    });

    return NextResponse.json({
      success: true,
      message: "Registration successful!",
      registration: result.registration,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Registration failed." },
      { status: 400 }
    );
  }
}
