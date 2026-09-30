import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

function getDepartmentSlug(dept: string): string {
  const map: Record<string, string> = {
    "School of Engineering & Sciences": "engineering",
    "School of Law": "law",
    "School of Management": "management",
    "School of Agricultural Sciences": "agri",
    "School of Healthcare and Allied Sciences": "health",
    "School of Hospitality & Tourism": "hospitality",
    "School of Liberal Arts": "liberalarts",
    "United World Institute of Design (UID)": "design",
    "Center of Aerospace and Energy Studies": "aerospace",
    "Centre of Aerospace and Energy Studies": "aerospace",
    "Centre Of Excellence: Occupational Health, Safety, Fire & Environment": "safety",
  };
  return map[dept] || dept.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 1. Get all unique departments from faculty
    const deptRows = await prisma.faculty.findMany({
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    });
    const departments = deptRows.map((d) => d.department).filter(Boolean);

    // 2. Get all SPOC profiles
    const spocProfiles = await prisma.spoc.findMany({
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            phone: true,
          },
        },
      },
      orderBy: { department: "asc" },
    });

    // 3. Map SPOCs by department as array
    const spocByDepartment: Record<string, any[]> = {};
    spocProfiles.forEach((s) => {
      const item = {
        id: s.id,
        name: s.name,
        email: s.email, // Dedicated SPOC login email
        department: s.department,
        facultyId: s.facultyId,
        facultyName: s.faculty?.name || "N/A",
        facultyEmail: s.faculty?.email || "N/A",
        createdAt: s.createdAt.toISOString(),
      };
      if (!spocByDepartment[s.department]) {
        spocByDepartment[s.department] = [];
      }
      spocByDepartment[s.department].push(item);
    });

    // 4. Get all faculty list for dropdown selection
    const allFaculty = await prisma.faculty.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isSpoc: true,
        spocDepartment: true,
      },
      orderBy: [{ department: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      departments,
      spocs: spocProfiles.map((s) => ({
        id: s.id,
        name: s.name,
        spocEmail: s.email,
        department: s.department,
        facultyName: s.faculty?.name,
        facultyEmail: s.faculty?.email,
      })),
      spocByDepartment,
      facultyList: allFaculty,
    });
  } catch (error: any) {
    console.error("Admin SPOC fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch SPOC assignments." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const {
      facultyId,
      department,
      isSpoc,
      spocEmail: customEmail,
      spocPasscode: customPasscode,
      action = "ASSIGN",
    } = await req.json();

    if (!department) {
      return NextResponse.json({ error: "Department is required." }, { status: 400 });
    }

    const slug = getDepartmentSlug(department);

    // 1. REVOKE SPOC
    if (isSpoc === false || action === "REVOKE") {
      // Find existing SPOC record
      const existingSpoc = await prisma.spoc.findUnique({
        where: { department },
      });

      if (existingSpoc) {
        if (existingSpoc.facultyId) {
          await prisma.faculty.update({
            where: { id: existingSpoc.facultyId },
            data: { isSpoc: false, spocDepartment: null },
          });
        }
        await prisma.spoc.delete({ where: { department } });
      } else if (facultyId) {
        await prisma.faculty.update({
          where: { id: facultyId },
          data: { isSpoc: false, spocDepartment: null },
        });
      }

      await prisma.auditLog.create({
        data: {
          actor: session.name,
          actorRole: "ADMIN",
          action: "SPOC_REVOKED",
          target: department,
          metadata: JSON.stringify({ department }),
        },
      });

      broadcastEvent("spoc.updated", { department, isSpoc: false });

      return NextResponse.json({
        success: true,
        message: `SPOC profile revoked for ${department}.`,
      });
    }

    // 2. RESET PASSCODE FOR EXISTING SPOC
    if (action === "RESET_PASSCODE") {
      const existingSpoc = await prisma.spoc.findUnique({ where: { department } });
      if (!existingSpoc) {
        return NextResponse.json({ error: "No SPOC profile found for this department." }, { status: 404 });
      }

      const newPasscode = customPasscode || `spoc@${slug}2026`;
      const passcodeHash = await bcrypt.hash(newPasscode, 10);

      await prisma.spoc.update({
        where: { department },
        data: { passcodeHash },
      });

      await prisma.auditLog.create({
        data: {
          actor: session.name,
          actorRole: "ADMIN",
          action: "SPOC_PASSCODE_RESET",
          target: `${existingSpoc.email} (${department})`,
          metadata: JSON.stringify({ department, email: existingSpoc.email }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Passcode updated successfully.",
        credentials: {
          email: existingSpoc.email,
          passcode: newPasscode,
        },
      });
    }

    // 3. ASSIGN / CREATE SPOC PROFILE
    if (!facultyId) {
      return NextResponse.json({ error: "Faculty member selection is required to assign SPOC." }, { status: 400 });
    }

    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!faculty) {
      return NextResponse.json({ error: "Selected faculty member not found." }, { status: 404 });
    }

    // Generate dedicated SPOC credentials separate from faculty
    const spocEmail = (customEmail || `spoc.${slug}@gdgu.org`).toLowerCase().trim();
    const spocPasscode = customPasscode || `spoc@${slug}2026`;
    const passcodeHash = await bcrypt.hash(spocPasscode, 10);

    // Upsert SPOC profile
    const spocProfile = await prisma.spoc.upsert({
      where: { department },
      create: {
        name: `${faculty.name} (SPOC)`,
        email: spocEmail,
        department,
        passcodeHash,
        facultyId: faculty.id,
      },
      update: {
        name: `${faculty.name} (SPOC)`,
        email: spocEmail,
        passcodeHash,
        facultyId: faculty.id,
      },
      include: { faculty: true },
    });

    // Mark faculty record
    await prisma.faculty.update({
      where: { id: faculty.id },
      data: {
        isSpoc: true,
        spocDepartment: department,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "SPOC_PROFILE_CREATED",
        target: `${spocEmail} (${department})`,
        metadata: JSON.stringify({
          spocId: spocProfile.id,
          spocEmail,
          department,
          facultyId: faculty.id,
          facultyName: faculty.name,
          facultyEmail: faculty.email,
        }),
      },
    });

    // Broadcast SSE
    broadcastEvent("spoc.updated", {
      department,
      spocId: spocProfile.id,
      facultyId: faculty.id,
      isSpoc: true,
    });

    return NextResponse.json({
      success: true,
      spoc: {
        id: spocProfile.id,
        name: spocProfile.name,
        spocLoginEmail: spocProfile.email,
        spocPasscode,
        department: spocProfile.department,
        facultyName: faculty.name,
        facultyEmail: faculty.email,
      },
      credentials: {
        spocLoginEmail: spocProfile.email,
        spocPasscode,
        facultyLoginEmail: faculty.email,
        note: "SPOC login credentials and Faculty login credentials are now completely separate.",
      },
    });
  } catch (error: any) {
    console.error("Admin SPOC update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update SPOC profile." },
      { status: 500 }
    );
  }
}
