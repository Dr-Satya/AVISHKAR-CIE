import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";
import { cleanErrorMessage, safeIsoString } from "@/lib/api-response";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

function canonicalDepartment(dept: string): string {
  if (!dept) return "";
  const trimmed = dept.trim();
  if (/^Cent(er|re)\s+of\s+Aerospace\s+and\s+Energy\s+Studies$/i.test(trimmed)) {
    return "Centre of Aerospace and Energy Studies";
  }
  return trimmed;
}

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

const DEFAULT_DEPARTMENTS = [
  "Centre of Aerospace and Energy Studies",
  "Centre Of Excellence: Occupational Health, Safety, Fire & Environment",
  "School of Agricultural Sciences",
  "School of Engineering & Sciences",
  "School of Healthcare and Allied Sciences",
  "School of Hospitality & Tourism",
  "School of Law",
  "School of Liberal Arts",
  "School of Management",
  "United World Institute of Design (UID)",
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 1. Get all SPOC profiles
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
      orderBy: [{ department: "asc" }, { name: "asc" }],
    });

    // 2. Get all faculty list for dropdown selection (optional association)
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

    // 3. Derive unique canonical departments
    const deptSet = new Set<string>(DEFAULT_DEPARTMENTS.map(canonicalDepartment));
    allFaculty.forEach((f) => {
      if (f.department) deptSet.add(canonicalDepartment(f.department));
    });
    spocProfiles.forEach((s) => {
      if (s.department) deptSet.add(canonicalDepartment(s.department));
    });
    const departments = Array.from(deptSet).sort();

    // 4. Map SPOCs by canonical department as array (supports MULTIPLE SPOCs per school)
    const spocByDepartment: Record<string, any[]> = {};
    spocProfiles.forEach((s) => {
      const canonDept = canonicalDepartment(s.department);
      const item = {
        id: s.id,
        name: s.name,
        email: s.email, // Dedicated SPOC login email
        department: canonDept,
        facultyId: s.facultyId,
        facultyName: s.faculty?.name || "N/A",
        facultyEmail: s.faculty?.email || "N/A",
        createdAt: safeIsoString(s.createdAt) || "",
      };
      if (!spocByDepartment[canonDept]) {
        spocByDepartment[canonDept] = [];
      }
      spocByDepartment[canonDept].push(item);
    });

    return NextResponse.json({
      departments,
      spocs: spocProfiles.map((s) => ({
        id: s.id,
        name: s.name,
        spocEmail: s.email,
        email: s.email,
        department: canonicalDepartment(s.department),
        facultyId: s.facultyId,
        facultyName: s.faculty?.name || "N/A",
        facultyEmail: s.faculty?.email || "N/A",
        createdAt: safeIsoString(s.createdAt) || "",
      })),
      spocByDepartment,
      facultyList: allFaculty,
    });
  } catch (error: any) {
    console.error("Admin SPOC fetch error:", error);
    return NextResponse.json(
      { error: cleanErrorMessage(error, "Failed to fetch SPOC assignments.") },
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

    const body = await req.json();
    const {
      id,
      spocId,
      department,
      name,
      email,
      spocEmail,
      passcode,
      spocPasscode,
      facultyId,
      isSpoc,
      action = "ASSIGN",
    } = body;

    const targetDept = canonicalDepartment(department || "");
    const cleanId = id || spocId;
    const cleanEmail = (email || spocEmail || "").toLowerCase().trim();
    const cleanPasscode = (passcode || spocPasscode || "").trim();
    const cleanName = (name || "").trim();
    const linkedFacultyId = facultyId || null;

    // 1. DELETE / REVOKE / REMOVE SPOC
    if (isSpoc === false || action === "REVOKE" || action === "DELETE" || action === "REMOVE") {
      let existingSpoc = null;
      if (cleanId) {
        existingSpoc = await prisma.spoc.findUnique({ where: { id: cleanId } });
      }
      if (!existingSpoc && cleanEmail) {
        existingSpoc = await prisma.spoc.findUnique({ where: { email: cleanEmail } });
      }
      if (!existingSpoc && targetDept) {
        existingSpoc = await prisma.spoc.findFirst({ where: { department: targetDept } });
      }

      if (existingSpoc) {
        if (existingSpoc.facultyId) {
          await prisma.faculty.update({
            where: { id: existingSpoc.facultyId },
            data: { isSpoc: false, spocDepartment: null },
          });
        }
        await prisma.spoc.delete({ where: { id: existingSpoc.id } });
      } else if (facultyId) {
        await prisma.faculty.update({
          where: { id: facultyId },
          data: { isSpoc: false, spocDepartment: null },
        });
      }

      const auditDept = existingSpoc?.department || targetDept;
      await prisma.auditLog.create({
        data: {
          actor: session.name,
          actorRole: "ADMIN",
          action: "SPOC_DELETED",
          target: `${existingSpoc?.email || "Unknown"} (${auditDept})`,
          metadata: JSON.stringify({ department: auditDept, spocId: existingSpoc?.id }),
        },
      });

      broadcastEvent("spoc.updated", { department: auditDept, isSpoc: false });

      return NextResponse.json({
        success: true,
        message: `SPOC profile for ${auditDept} removed successfully.`,
      });
    }

    // 2. RESET PASSCODE FOR EXISTING SPOC
    if (action === "RESET_PASSCODE") {
      let existingSpoc = null;
      if (cleanId) {
        existingSpoc = await prisma.spoc.findUnique({ where: { id: cleanId } });
      }
      if (!existingSpoc && cleanEmail) {
        existingSpoc = await prisma.spoc.findUnique({ where: { email: cleanEmail } });
      }
      if (!existingSpoc && targetDept) {
        existingSpoc = await prisma.spoc.findFirst({ where: { department: targetDept } });
      }

      if (!existingSpoc) {
        return NextResponse.json({ error: "No SPOC profile found to update passcode." }, { status: 404 });
      }

      if (cleanPasscode && cleanPasscode.length < 6) {
        return NextResponse.json({ error: "New passcode must be at least 6 characters long." }, { status: 400 });
      }

      const slug = getDepartmentSlug(existingSpoc.department);
      const newPasscode = cleanPasscode || `spoc@${slug}2026`;
      const passcodeHash = await bcrypt.hash(newPasscode, 8);

      await prisma.spoc.update({
        where: { id: existingSpoc.id },
        data: { passcodeHash },
      });

      await prisma.auditLog.create({
        data: {
          actor: session.name,
          actorRole: "ADMIN",
          action: "SPOC_PASSCODE_RESET",
          target: `${existingSpoc.email} (${existingSpoc.department})`,
          metadata: JSON.stringify({ department: existingSpoc.department, email: existingSpoc.email }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "SPOC passcode updated successfully.",
        credentials: {
          email: existingSpoc.email,
          passcode: newPasscode,
        },
      });
    }

    // 3. EDIT / UPDATE EXISTING SPOC (Name, Email, Department, optional Passcode, optional FacultyId)
    if (action === "EDIT" || action === "UPDATE" || (cleanId && action !== "CREATE")) {
      const existingSpoc = await prisma.spoc.findUnique({ where: { id: cleanId } });
      if (!existingSpoc) {
        return NextResponse.json({ error: "SPOC profile not found for editing." }, { status: 404 });
      }

      const newDept = targetDept || existingSpoc.department;
      const newEmail = cleanEmail || existingSpoc.email;
      const newName = cleanName || existingSpoc.name;

      // Validate email uniqueness if changing email
      if (newEmail !== existingSpoc.email) {
        const emailConflict = await prisma.spoc.findUnique({ where: { email: newEmail } });
        if (emailConflict && emailConflict.id !== existingSpoc.id) {
          return NextResponse.json(
            { error: `The email "${newEmail}" is already in use by SPOC "${emailConflict.name}" (${emailConflict.department}).` },
            { status: 400 }
          );
        }
      }

      const updateData: any = {
        name: newName,
        email: newEmail,
        department: newDept,
      };

      if (linkedFacultyId !== undefined) {
        updateData.facultyId = linkedFacultyId;
      }

      if (cleanPasscode) {
        if (cleanPasscode.length < 6) {
          return NextResponse.json({ error: "Passcode must be at least 6 characters long." }, { status: 400 });
        }
        updateData.passcodeHash = await bcrypt.hash(cleanPasscode, 8);
      }

      const updatedSpoc = await prisma.spoc.update({
        where: { id: existingSpoc.id },
        data: updateData,
        include: { faculty: true },
      });

      if (linkedFacultyId) {
        await prisma.faculty.update({
          where: { id: linkedFacultyId },
          data: { isSpoc: true, spocDepartment: newDept },
        });
      }

      await prisma.auditLog.create({
        data: {
          actor: session.name,
          actorRole: "ADMIN",
          action: "SPOC_EDITED",
          target: `${updatedSpoc.email} (${updatedSpoc.department})`,
          metadata: JSON.stringify({ spocId: updatedSpoc.id, email: updatedSpoc.email, department: updatedSpoc.department }),
        },
      });

      broadcastEvent("spoc.updated", { department: updatedSpoc.department, spocId: updatedSpoc.id, isSpoc: true });

      return NextResponse.json({
        success: true,
        message: `SPOC profile for ${updatedSpoc.name} updated successfully.`,
        spoc: updatedSpoc,
      });
    }

    // 4. CREATE NEW / ADDITIONAL SPOC (Allows MULTIPLE SPOCs per department!)
    if (!targetDept) {
      return NextResponse.json({ error: "School / Department is required." }, { status: 400 });
    }

    if (!cleanEmail) {
      return NextResponse.json({ error: "Login email is required." }, { status: 400 });
    }

    // Check email conflict with existing SPOC
    const emailConflict = await prisma.spoc.findUnique({ where: { email: cleanEmail } });
    if (emailConflict) {
      return NextResponse.json(
        {
          error: `The email "${cleanEmail}" is already assigned to SPOC "${emailConflict.name}" (${emailConflict.department}). Please use a unique email address or edit that SPOC profile.`,
        },
        { status: 400 }
      );
    }

    const slug = getDepartmentSlug(targetDept);
    const spocNameFinal = cleanName || `${targetDept} Coordinator`;
    const spocPasscodeFinal = cleanPasscode || `spoc@${slug}2026`;

    if (spocPasscodeFinal.length < 6) {
      return NextResponse.json({ error: "Passcode must be at least 6 characters long." }, { status: 400 });
    }

    const passcodeHash = await bcrypt.hash(spocPasscodeFinal, 8);

    // Optional faculty linkage if facultyId passed or email matches an existing faculty
    let finalFacultyId: string | null = linkedFacultyId;
    if (!finalFacultyId) {
      const matchedFaculty = await prisma.faculty.findUnique({ where: { email: cleanEmail } });
      if (matchedFaculty) {
        finalFacultyId = matchedFaculty.id;
      }
    }

    // Create a new SPOC record in database (never overwriting existing SPOCs)
    const spocProfile = await prisma.spoc.create({
      data: {
        name: spocNameFinal,
        email: cleanEmail,
        department: targetDept,
        passcodeHash,
        facultyId: finalFacultyId,
      },
      include: { faculty: true },
    });

    if (finalFacultyId) {
      await prisma.faculty.update({
        where: { id: finalFacultyId },
        data: {
          isSpoc: true,
          spocDepartment: targetDept,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "SPOC_PROFILE_CREATED",
        target: `${cleanEmail} (${targetDept})`,
        metadata: JSON.stringify({
          spocId: spocProfile.id,
          spocEmail: cleanEmail,
          department: targetDept,
          name: spocNameFinal,
        }),
      },
    });

    broadcastEvent("spoc.updated", {
      department: targetDept,
      spocId: spocProfile.id,
      isSpoc: true,
    });

    return NextResponse.json({
      success: true,
      message: `SPOC profile for ${spocNameFinal} (${targetDept}) created successfully!`,
      spoc: {
        id: spocProfile.id,
        name: spocProfile.name,
        spocLoginEmail: spocProfile.email,
        spocPasscode: spocPasscodeFinal,
        department: spocProfile.department,
        facultyName: spocProfile.faculty?.name || spocProfile.name,
        facultyEmail: spocProfile.faculty?.email || spocProfile.email,
      },
      credentials: {
        spocLoginEmail: spocProfile.email,
        spocPasscode: spocPasscodeFinal,
      },
    });
  } catch (error: any) {
    console.error("Admin SPOC update error:", error);
    return NextResponse.json(
      { error: cleanErrorMessage(error, "Failed to update SPOC profile.") },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const department = url.searchParams.get("department");

    let existingSpoc = null;
    if (id) {
      existingSpoc = await prisma.spoc.findUnique({ where: { id } });
    }
    if (!existingSpoc && department) {
      existingSpoc = await prisma.spoc.findFirst({ where: { department: canonicalDepartment(department) } });
    }

    if (!existingSpoc) {
      return NextResponse.json({ error: "SPOC profile not found." }, { status: 404 });
    }

    if (existingSpoc.facultyId) {
      await prisma.faculty.update({
        where: { id: existingSpoc.facultyId },
        data: { isSpoc: false, spocDepartment: null },
      });
    }

    await prisma.spoc.delete({ where: { id: existingSpoc.id } });

    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "SPOC_DELETED",
        target: `${existingSpoc.email} (${existingSpoc.department})`,
        metadata: JSON.stringify({ department: existingSpoc.department, spocId: existingSpoc.id }),
      },
    });

    broadcastEvent("spoc.updated", { department: existingSpoc.department, isSpoc: false });

    return NextResponse.json({
      success: true,
      message: `SPOC profile for ${existingSpoc.name} (${existingSpoc.department}) deleted successfully.`,
    });
  } catch (error: any) {
    console.error("Admin SPOC delete error:", error);
    return NextResponse.json(
      { error: cleanErrorMessage(error, "Failed to delete SPOC profile.") },
      { status: 500 }
    );
  }
}
