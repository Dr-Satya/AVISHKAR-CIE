import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { registerStudentForProject } from "@/services/registration.service";
import { checkRateLimit } from "@/lib/rate-limit";
import { cleanErrorMessage } from "@/lib/api-response";

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

    // Rate Limiting: 2-second throttle per student to stop bot script spam
    const rateLimit = checkRateLimit(`student_reg:${session.id}`, {
      windowMs: 2000,
      max: 1,
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please wait 2 seconds before trying again." },
        { status: 429 }
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
    console.error("Student registration error:", error);
    return NextResponse.json(
      { error: cleanErrorMessage(error, "Registration failed. Please try again.") },
      { status: 400 }
    );
  }
}
