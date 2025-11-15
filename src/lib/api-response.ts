import { NextResponse } from "next/server";
import { logger } from "./logger";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Creates a successful API response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return NextResponse.json(response, { status });
}

/**
 * Creates an error API response
 */
export function errorResponse(
  error: string | Error,
  status: number = 500,
  logError: boolean = true
): NextResponse<ApiResponse> {
  const errorMessage = error instanceof Error ? error.message : error;

  if (logError) {
    logger.error("API Error", { error: errorMessage, status });
  }

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
    },
    { status }
  );
}

/**
 * Creates a not found response
 */
export function notFoundResponse(resource: string = "Resource"): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, 404, false);
}

/**
 * Creates a bad request response
 */
export function badRequestResponse(message: string): NextResponse<ApiResponse> {
  return errorResponse(message, 400, false);
}

/**
 * Creates an unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse<ApiResponse> {
  return errorResponse(message, 401, false);
}

/**
 * Creates a forbidden response
 */
export function forbiddenResponse(message: string = "Forbidden"): NextResponse<ApiResponse> {
  return errorResponse(message, 403, false);
}

/**
 * Creates a conflict response
 */
export function conflictResponse(message: string): NextResponse<ApiResponse> {
  return errorResponse(message, 409, false);
}

/**
 * Wraps an API handler with consistent error handling
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse<ApiResponse>>
) {
  return async (...args: T): Promise<NextResponse<ApiResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "Internal server error",
        500
      );
    }
  };
}

