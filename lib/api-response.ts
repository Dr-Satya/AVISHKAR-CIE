import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { cleanErrorMessage } from "./error-utils";

export { cleanErrorMessage };

export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
  [key: string]: any;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

/**
 * Standardized success response helper.
 */
export function apiSuccess<T = any>(
  data?: T,
  status = 200,
  extra?: Record<string, any>
): NextResponse<ApiSuccessResponse<T>> {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    ...(data !== undefined ? (typeof data === "object" && !Array.isArray(data) ? data : { data }) : {}),
    ...extra,
  };
  return NextResponse.json(payload, { status });
}

/**
 * Standardized error response helper.
 */
export function apiError(
  message: string,
  status = 400,
  code?: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  const payload: ApiErrorResponse = {
    success: false,
    error: message,
    ...(code ? { code } : {}),
    ...(details ? { details } : {}),
  };
  return NextResponse.json(payload, { status });
}

/**
 * Global API Error Interceptor.
 * Sanitizes exceptions, prevents internal database/driver leaks,
 * and maps known database/runtime exceptions to human-readable error messages.
 */
export function handleApiError(err: unknown, defaultMessage = "An unexpected error occurred."): NextResponse<ApiErrorResponse> {
  // 1. Prisma Known Client Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const fields = (err.meta?.target as string[]) || ["field"];
        return apiError(
          `A record with this ${fields.join(", ")} already exists.`,
          409,
          "DUPLICATE_RECORD"
        );
      }
      case "P2025": {
        return apiError(
          "The requested record could not be found or has already been deleted.",
          404,
          "RECORD_NOT_FOUND"
        );
      }
      case "P2003": {
        return apiError(
          "Operation rejected due to dependent related data constraints.",
          400,
          "FOREIGN_KEY_VIOLATION"
        );
      }
      case "P2014": {
        return apiError(
          "The change would violate an active relation constraint.",
          400,
          "RELATION_VIOLATION"
        );
      }
      default:
        return apiError(
          "A database query constraint error occurred.",
          400,
          `DB_${err.code}`
        );
    }
  }

  // 2. Prisma Validation Error (Bad schema arguments)
  if (err instanceof Prisma.PrismaClientValidationError) {
    return apiError(
      "Invalid data schema or missing mandatory fields in the request.",
      400,
      "SCHEMA_VALIDATION_ERROR"
    );
  }

  // 3. Generic Error instance
  if (err instanceof Error) {
    const sanitized = cleanErrorMessage(err.message, defaultMessage);

    // Detect authentication / JWT errors
    if (sanitized.toLowerCase().includes("jwt") || sanitized.toLowerCase().includes("token")) {
      return apiError("Session expired or invalid. Please log in again.", 401, "UNAUTHORIZED");
    }

    return apiError(sanitized, 400, "BAD_REQUEST");
  }

  // 4. Fallback unknown error
  return apiError(defaultMessage, 500, "INTERNAL_SERVER_ERROR");
}
