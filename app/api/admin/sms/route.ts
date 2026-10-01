import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCustomSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

// GET: Summary of SMS recipients (Admin only)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  const faculties = await prisma.faculty.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      department: true,
      isSpoc: true,
      spocDepartment: true,
    },
    orderBy: { name: "asc" },
  });

  const schools = Array.from(new Set(faculties.map((f) => f.department))).filter(Boolean);

  const stats = {
    totalFaculty: faculties.length,
    facultyWithPhone: faculties.filter((f) => f.phone && f.phone.trim().length >= 10).length,
    totalSpocs: faculties.filter((f) => f.isSpoc).length,
    spocsWithPhone: faculties.filter((f) => f.isSpoc && f.phone && f.phone.trim().length >= 10).length,
    schools,
  };

  return NextResponse.json(stats);
}

// POST: Dispatch Targeted SMS Broadcast (Admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const { message, targetRole = "ALL", department = "all" } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "SMS message content cannot be empty." }, { status: 400 });
    }

    const where: any = {};
    if (department && department !== "all") {
      where.department = department;
    }

    if (targetRole === "SPOC") {
      where.isSpoc = true;
    } else if (targetRole === "FACULTY") {
      where.isSpoc = false;
    }

    const recipients = await prisma.faculty.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        department: true,
        isSpoc: true,
      },
    });

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found matching the selected filter criteria." },
        { status: 404 }
      );
    }

    // Prepare SMS payloads
    const smsPayloads = recipients.map((r) => ({
      to: r.phone || "9999999999", // fallback for sandbox delivery
      message: message.trim(),
      recipientName: r.name,
      role: (r.isSpoc ? "SPOC" : "FACULTY") as "SPOC" | "FACULTY",
    }));

    const result = await sendCustomSms(smsPayloads);

    // Map departments to recipient details
    result.recipients = result.recipients.map((rec, i) => ({
      ...rec,
      department: recipients[i]?.department || "General",
      role: recipients[i]?.isSpoc ? "SPOC" : "Faculty",
    }));

    // Record administrative audit trail
    await prisma.auditLog.create({
      data: {
        actor: session.name,
        actorRole: "ADMIN",
        action: "SMS_BROADCAST",
        target: `${targetRole} (${department})`,
        metadata: JSON.stringify({
          message: message.slice(0, 80),
          totalTargeted: result.totalTargeted,
          sentCount: result.sentCount,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      summary: result,
      message: `SMS broadcast dispatched successfully to ${result.sentCount} recipient(s).`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to dispatch SMS." }, { status: 500 });
  }
}
