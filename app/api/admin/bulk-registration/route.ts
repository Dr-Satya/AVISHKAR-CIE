import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { executeBulkRegistration } from "@/services/registration.service";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const result = await executeBulkRegistration();
    return NextResponse.json({
      success: true,
      message: "Bulk registration finished.",
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Bulk registration failed." },
      { status: 500 }
    );
  }
}
