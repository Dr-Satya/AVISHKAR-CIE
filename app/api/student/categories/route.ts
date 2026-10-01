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

  // Fetch unique categories and themes
  const projects = await prisma.project.findMany({
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
