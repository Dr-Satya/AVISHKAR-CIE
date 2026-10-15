import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  exportAllTables,
  purgeData,
  exportAndPurge,
  getTableSnapshot,
  type DataAction,
  type PurgeScope,
} from "@/lib/data-management";

export const dynamic = "force-dynamic";

const VALID_ACTIONS: DataAction[] = ["EXPORT_ALL", "PURGE", "EXPORT_AND_PURGE"];
const VALID_SCOPES: PurgeScope[] = [
  "STUDENTS",
  "STUDENTS_AND_UPLOADS",
  "REGISTRATIONS",
  "PROJECTS",
  "FACULTY",
  "ALL",
];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const academicYear = searchParams.get("academicYear") || undefined;
    const format = searchParams.get("format");

    if (action === "EXPORT_ALL" && format === "xlsx") {
      const result = await exportAllTables(session.name, academicYear);
      const dateStr = new Date().toISOString().split("T")[0];
      const body = result.fileBuffer ? new Uint8Array(result.fileBuffer) : null;
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="GDGU_IDP_Full_Database_Export_${dateStr}.xlsx"`,
        },
      });
    }

    if (action === "DATABASE_MASTER") {
      const [students, faculty, registrations, projects, snapshot] = await Promise.all([
        prisma.student.findMany({
          where: academicYear && academicYear !== "all" ? { academicYear } : undefined,
          include: {
            registration: {
              include: {
                project: {
                  include: {
                    faculty: {
                      select: { id: true, name: true, email: true, department: true, phone: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { enrollmentNumber: "asc" },
        }),
        prisma.faculty.findMany({
          include: {
            projects: {
              select: {
                id: true,
                projectId: true,
                title: true,
                category: true,
                theme: true,
                _count: { select: { registrations: true } },
              },
            },
          },
          orderBy: { name: "asc" },
        }),
        prisma.registration.findMany({
          where: academicYear && academicYear !== "all" ? { project: { academicYear } } : undefined,
          include: {
            student: true,
            project: {
              include: {
                faculty: {
                  select: { id: true, name: true, email: true, department: true, phone: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.project.findMany({
          where: academicYear && academicYear !== "all" ? { academicYear } : undefined,
          include: {
            faculty: {
              select: { id: true, name: true, email: true, department: true, phone: true },
            },
            _count: { select: { registrations: true } },
          },
          orderBy: { projectId: "asc" },
        }),
        getTableSnapshot(),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          students,
          faculty,
          registrations,
          projects,
          snapshot,
        },
      });
    }

    const snapshot = await getTableSnapshot();
    return NextResponse.json({ success: true, snapshot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch data status." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only administrators can perform data management operations." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, scope, academicYear, confirmCode } = body as {
      action?: DataAction;
      scope?: PurgeScope;
      academicYear?: string;
      confirmCode?: string;
    };

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // ── EXPORT_ALL ─────────────────────────────────────────────────────────
    if (action === "EXPORT_ALL") {
      const result = await exportAllTables(session.name, academicYear);
      return NextResponse.json(result);
    }

    // ── PURGE ──────────────────────────────────────────────────────────────
    if (action === "PURGE") {
      if (!scope || !VALID_SCOPES.includes(scope)) {
        return NextResponse.json(
          { error: `Scope is required for PURGE. Must be one of: ${VALID_SCOPES.join(", ")}` },
          { status: 400 }
        );
      }

      if (!confirmCode || (confirmCode !== "PURGE_CONFIRMED" && confirmCode !== "WIPE_AND_EXPORT")) {
        return NextResponse.json(
          { error: 'Safety check: confirmCode is required. Send { confirmCode: "PURGE_CONFIRMED" } to proceed.' },
          { status: 400 }
        );
      }

      const result = await purgeData(scope, session.name, confirmCode, academicYear);
      return NextResponse.json(result);
    }

    // ── EXPORT_AND_PURGE ───────────────────────────────────────────────────
    if (action === "EXPORT_AND_PURGE") {
      if (!scope || !VALID_SCOPES.includes(scope)) {
        return NextResponse.json(
          { error: `Scope is required for EXPORT_AND_PURGE. Must be one of: ${VALID_SCOPES.join(", ")}` },
          { status: 400 }
        );
      }

      if (!confirmCode || (confirmCode !== "PURGE_CONFIRMED" && confirmCode !== "WIPE_AND_EXPORT")) {
        return NextResponse.json(
          { error: 'Safety check: confirmCode is required. Send { confirmCode: "PURGE_CONFIRMED" } to proceed.' },
          { status: 400 }
        );
      }

      const result = await exportAndPurge(scope, session.name, confirmCode, academicYear);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unhandled action." }, { status: 400 });
  } catch (error: any) {
    console.error("Data management error:", error);
    return NextResponse.json(
      { error: error.message || "Data management operation failed." },
      { status: 500 }
    );
  }
}
