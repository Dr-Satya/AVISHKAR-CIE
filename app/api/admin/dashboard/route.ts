import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanErrorMessage } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    // Execute sequentially to prevent SQLite/D1 concurrency lock contention
    const totalStudents = await prisma.student.count();
    const totalRegistrations = await prisma.registration.count();
    const config = await prisma.globalConfig.findUnique({ where: { id: "default" } });

    const defaultMaxSeats = config?.maxSeats ?? 10;
    const projectSeats = await prisma.project.findMany({ select: { maxSeats: true } });
    const totalProjects = projectSeats.length;
    const totalCapacity = projectSeats.reduce(
      (sum, p) => sum + (p.maxSeats && p.maxSeats > 0 ? p.maxSeats : defaultMaxSeats),
      0
    );
    const unregisteredTotal = Math.max(0, totalStudents - totalRegistrations);

    return NextResponse.json({
      kpi: {
        totalStudents,
        totalProjects,
        totalRegistrations,
        totalCapacity,
        seatsFilledRatio: `${totalRegistrations}/${totalCapacity}`,
        unregisteredTotal,
      },
      registrationOpen: config?.registrationOpen ?? true,
    });
  } catch (error: any) {
    console.error("Admin dashboard fetch error:", error);
    return NextResponse.json(
      { error: cleanErrorMessage(error, "Failed to load dashboard metrics.") },
      { status: 500 }
    );
  }
}
