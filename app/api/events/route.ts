import { NextRequest } from "next/server";
import { appEventEmitter, PortalEventMessage } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`));

      const handleEvent = (event: PortalEventMessage) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`));
        } catch (e) {
          // stream might be closed
        }
      };

      appEventEmitter.on("portal_event", handleEvent);

      // Periodic ping every 25 seconds to keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (e) {
          clearInterval(interval);
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        appEventEmitter.off("portal_event", handleEvent);
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
