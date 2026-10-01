import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

let cachedResult: { categories: string[]; themesByCategory: Record<string, string[]> } | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000;

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = Date.now();
  if (cachedResult && now - lastCacheTime < CACHE_TTL_MS) {
    return NextResponse.json(cachedResult, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  }

  const config = await prisma.globalConfig.findUnique({ where: { id: "default" } });
  const activeYear = config?.activeAcademicYear || "2025-2026";

  // Fetch unique categories and themes for active academic year
  const projects = await prisma.project.findMany({
    where: {
      academicYear: activeYear,
    },
    select: {
      category: true,
      theme: true,
    },
    distinct: ["category", "theme"],
  });

  const categoriesMap: Record<string, string[]> = {};
  for (const p of projects) {
    if (!categoriesMap[p.category]) {
      categoriesMap[p.category] = [];
    }
    if (!categoriesMap[p.category].includes(p.theme)) {
      categoriesMap[p.category].push(p.theme);
    }
  }

  cachedResult = {
    categories: Object.keys(categoriesMap).sort(),
    themesByCategory: categoriesMap,
  };
  lastCacheTime = now;

  return NextResponse.json(cachedResult, {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
    },
  });
}
