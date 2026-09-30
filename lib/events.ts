import { EventEmitter } from "events";

// Global singleton event emitter for real-time SSE broadcasts
const globalForEvents = globalThis as unknown as { appEventEmitter?: EventEmitter };

export const appEventEmitter = globalForEvents.appEventEmitter || new EventEmitter();
appEventEmitter.setMaxListeners(200);

if (process.env.NODE_ENV !== "production") {
  globalForEvents.appEventEmitter = appEventEmitter;
}

export type PortalEventType =
  | "registration.created"
  | "bulk_registration.progress"
  | "bulk_registration.completed"
  | "configuration.updated"
  | "project.updated"
  | "spoc.updated"
  | "artifact.submitted"
  | "submission.reviewed";

export interface PortalEventMessage {
  type: PortalEventType;
  data: any;
  timestamp: string;
}

export function broadcastEvent(type: PortalEventType, data: any) {
  const eventPayload: PortalEventMessage = {
    type,
    data,
    timestamp: new Date().toISOString(),
  };
  appEventEmitter.emit("portal_event", eventPayload);
}
