/**
 * Universal Error Sanitizer
 * Client and server safe utility to convert raw database errors, Prisma exceptions,
 * SQLite errors, stack traces, and network timeouts into clear, descriptive human messages.
 */
export function cleanErrorMessage(
  raw: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (!raw) return fallback;
  const str = typeof raw === "string" ? raw : (raw as any)?.message || String(raw);

  const lower = str.toLowerCase();

  // 1. Prisma & Database query / schema errors
  if (
    lower.includes("prisma") ||
    lower.includes("sqlite") ||
    lower.includes("d1_error") ||
    lower.includes("connectorerror") ||
    lower.includes("queryerror") ||
    lower.includes("sql variables") ||
    lower.includes("unique constraint") ||
    lower.includes("foreign key") ||
    lower.includes("constraint failed") ||
    lower.includes("database") ||
    lower.includes("invocation:")
  ) {
    if (lower.includes("unique") || lower.includes("already exists")) {
      return "A record with this identifier, email, or enrollment number already exists.";
    }
    if (lower.includes("foreign key") || lower.includes("relation")) {
      return "Unable to complete operation because related records depend on this item.";
    }
    return "A temporary database processing error occurred. Please refresh or try again in a moment.";
  }

  // 2. Syntax / JSON / Parsing errors
  if (
    lower.includes("syntaxerror") ||
    lower.includes("unterminated string") ||
    lower.includes("unexpected token") ||
    lower.includes("json at position")
  ) {
    return "Received an incomplete response from the server. Please refresh your page.";
  }

  // 3. Network / Transport / QUIC errors
  if (
    lower.includes("err_quic_protocol_error") ||
    lower.includes("quic_too_many_rtos") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("connection reset")
  ) {
    return "Network connection was interrupted. Please check your connection and try again.";
  }

  // 4. Rate Limiting & Auth
  if (
    lower.includes("rate limit") ||
    lower.includes("too many login attempts") ||
    lower.includes("too many requests") ||
    lower.includes("temporarily locked")
  ) {
    return str;
  }

  // 5. Stack traces, object dumps, code snippets
  if (str.includes("at ") && (str.includes(".js:") || str.includes(".ts:"))) {
    return fallback;
  }
  if (str.includes("{") && str.includes("}") && (str.includes("kind:") || str.includes("code:") || str.includes("message:"))) {
    return fallback;
  }

  // 6. Clean user-facing string (< 200 chars, no raw code artifacts or stack traces)
  if (
    str.length < 200 &&
    !str.includes("Error:") &&
    !str.includes("at ") &&
    !str.includes(".ts:") &&
    !str.includes(".js:") &&
    !str.includes("node_modules") &&
    !str.includes("Some(") &&
    !str.includes("None") &&
    !str.includes("`")
  ) {
    return str;
  }

  return fallback;
}
