import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  const [totalStudents, totalProjects, totalRegistrations, config] = await Promise.all([
    prisma.student.count(),
    prisma.project.count(),
    prisma.registration.count(),
    prisma.globalConfig.findUnique({ where: { id: "default" } }),
  ]);

  const defaultMaxSeats = config?.maxSeats ?? 10;
  const totalCapacity = totalProjects * defaultMaxSeats;

  return NextResponse.json({
    kpi: {
      totalStudents,
      totalProjects,
      totalRegistrations,
      totalCapacity,
      seatsFilledRatio: `${totalRegistrations}/${totalCapacity}`,
    },
    registrationOpen: config?.registrationOpen ?? true,
  });
}
