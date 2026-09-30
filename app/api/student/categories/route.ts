import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

  return NextResponse.json({
    categories: Object.keys(categoriesMap).sort(),
    themesByCategory: categoriesMap,
  });
}
