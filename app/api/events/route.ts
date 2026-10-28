import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  // Cloudflare Workers safe event stream:
  // Emits connected status with a 30s reconnect directive and terminates cleanly
  // Prevents worker isolate starvation and 1101 execution cancellation errors
  const stream = new ReadableStream({
    start(controller) {
      try {
        controller.enqueue(encoder.encode(`retry: 30000\n\n`));
        controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`));
        controller.close();
      } catch (e) {
        // Stream closed
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store",
      Connection: "keep-alive",
    },
  });
}
