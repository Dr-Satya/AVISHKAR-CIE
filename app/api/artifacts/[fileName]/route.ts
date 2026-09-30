import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { fileName: string } }
) {
  const fileName = params.fileName;

  if (!fileName) {
    return new Response("File name required", { status: 400 });
  }

  // 1. Try Cloudflare R2 bucket
  try {
    const ctx = getCloudflareContext();
    const env = ctx?.env as any;
    if (env?.ARTIFACTS) {
      const object = await env.ARTIFACTS.get(fileName);
      if (object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("cache-control", "public, max-age=31536000, immutable");
        return new Response(object.body, { headers });
      }
    }
  } catch {}

  // 2. Fallback to local public/uploads
  try {
    const localPath = path.join(process.cwd(), "public", "uploads", fileName);
    if (fs.existsSync(localPath)) {
      const fileBuffer = fs.readFileSync(localPath);
      return new Response(fileBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch {}

  return new Response("File not found", { status: 404 });
}
