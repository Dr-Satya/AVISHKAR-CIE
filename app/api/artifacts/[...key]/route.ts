import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "ppt":
      return "application/vnd.ms-powerpoint";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "doc":
      return "application/msword";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "xls":
      return "application/vnd.ms-excel";
    case "zip":
      return "application/zip";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string[] | string } }
) {
  // Normalize catch-all segments (handles both raw slashes and %2F-encoded paths)
  let rawKey = "";
  if (Array.isArray(params.key)) {
    rawKey = params.key.join("/");
  } else if (typeof params.key === "string") {
    rawKey = params.key;
  }

  if (!rawKey) {
    return new Response("File path key required", { status: 400 });
  }

  const decodedKey = decodeURIComponent(rawKey);
  const baseName = decodedKey.split("/").pop() || "download";
  const mimeType = getMimeType(baseName);

  // 1. Try Cloudflare R2 bucket
  try {
    const ctx = getCloudflareContext();
    const env = ctx?.env as any;
    if (env?.ARTIFACTS) {
      let object = await env.ARTIFACTS.get(decodedKey);
      if (!object && decodedKey !== rawKey) {
        object = await env.ARTIFACTS.get(rawKey);
      }
      if (object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("cache-control", "public, max-age=31536000, immutable");
        headers.set("x-content-type-options", "nosniff");

        if (!headers.has("content-type")) {
          headers.set("content-type", mimeType);
        }
        if (!headers.has("content-disposition")) {
          headers.set("content-disposition", `inline; filename="${encodeURIComponent(baseName)}"`);
        }

        return new Response(object.body, { headers });
      }
    }
  } catch (err) {
    console.error("R2 retrieval error:", err);
  }

  // 2. Fallback to local public/uploads (local development only)
  try {
    const rootUploads = path.join(process.cwd(), "public", "uploads");
    const localPath = path.normalize(path.join(rootUploads, ...decodedKey.split("/")));
    if (localPath.startsWith(rootUploads) && !localPath.includes("\0") && fs.existsSync(localPath)) {
      const fileBuffer = fs.readFileSync(localPath);
      return new Response(fileBuffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${encodeURIComponent(baseName)}"`,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  } catch (err) {
    console.error("Local file retrieval error:", err);
  }

  return new Response("File not found", { status: 404 });
}
