import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const limits = await prisma.departmentRegistrationLimit.findMany({
    orderBy: { department: "asc" },
  });

  return NextResponse.json({ limits });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { department, sameDeptLimit, otherDeptLimit } = await req.json();

  if (!department || typeof department !== "string") {
    return NextResponse.json({ error: "Department name is required." }, { status: 400 });
  }

  const same = parseInt(sameDeptLimit, 10);
  const other = parseInt(otherDeptLimit, 10);

  if (isNaN(same) || isNaN(other) || same < 0 || other < 0) {
    return NextResponse.json({ error: "Limits must be non-negative integers." }, { status: 400 });
  }

  const cleanDept = department.trim();

  const record = await prisma.departmentRegistrationLimit.upsert({
    where: { department: cleanDept },
    update: {
      sameDeptLimit: same,
      otherDeptLimit: other,
    },
    create: {
      department: cleanDept,
      sameDeptLimit: same,
      otherDeptLimit: other,
    },
  });

  await prisma.auditLog.create({
    data: {
      actor: session.name,
      actorRole: "ADMIN",
      action: "DEPARTMENT_LIMIT_UPDATE",
      target: cleanDept,
      metadata: JSON.stringify(record),
    },
  });

  broadcastEvent("configuration.updated", record);

  return NextResponse.json({ success: true, limit: record });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Limit ID is required." }, { status: 400 });
  }

  const deleted = await prisma.departmentRegistrationLimit.delete({
    where: { id },
  });

  await prisma.auditLog.create({
    data: {
      actor: session.name,
      actorRole: "ADMIN",
      action: "DEPARTMENT_LIMIT_DELETE",
      target: deleted.department,
    },
  });

  broadcastEvent("configuration.updated", { deleted: id });

  return NextResponse.json({ success: true, message: "Limit removed." });
}
