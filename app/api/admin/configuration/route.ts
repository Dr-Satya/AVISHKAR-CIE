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

  const config = await prisma.globalConfig.findUnique({
    where: { id: "default" },
  });

  return NextResponse.json({ config });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { registrationOpen, maxSeats, sameDeptLimit, otherDeptLimit } = await req.json();

  const numMaxSeats = parseInt(maxSeats, 10);
  const numSameDept = parseInt(sameDeptLimit, 10);
  const numOtherDept = parseInt(otherDeptLimit, 10);

  if (isNaN(numMaxSeats) || isNaN(numSameDept) || isNaN(numOtherDept)) {
    return NextResponse.json({ error: "Invalid numeric limits provided." }, { status: 400 });
  }

  if (numMaxSeats < 1 || numSameDept < 0 || numOtherDept < 0) {
    return NextResponse.json({ error: "Limits must be non-negative values." }, { status: 400 });
  }

  const updated = await prisma.globalConfig.upsert({
    where: { id: "default" },
    update: {
      registrationOpen: Boolean(registrationOpen),
      maxSeats: numMaxSeats,
      sameDeptLimit: numSameDept,
      otherDeptLimit: numOtherDept,
    },
    create: {
      id: "default",
      registrationOpen: Boolean(registrationOpen),
      maxSeats: numMaxSeats,
      sameDeptLimit: numSameDept,
      otherDeptLimit: numOtherDept,
    },
  });

  await prisma.auditLog.create({
    data: {
      actor: session.name,
      actorRole: "ADMIN",
      action: "CONFIGURATION_UPDATE",
      metadata: JSON.stringify(updated),
    },
  });

  broadcastEvent("configuration.updated", updated);

  return NextResponse.json({ success: true, config: updated });
}
