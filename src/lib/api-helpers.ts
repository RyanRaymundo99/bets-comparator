import { NextRequest } from "next/server";
import { badRequestResponse, notFoundResponse } from "./api-response";

/**
 * Safely parses JSON from request body
 */
export async function parseRequestBody<T = unknown>(
  request: NextRequest
): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON in request body");
  }
}

/**
 * Validates required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (!body[field] && body[field] !== 0) {
      return `${field} is required`;
    }
  }
  return null;
}

/**
 * Validates required fields and returns error response if invalid
 */
export async function validateRequest(
  request: NextRequest,
  requiredFields: string[]
): Promise<{ body: Record<string, unknown> } | Response> {
  const body = await parseRequestBody<Record<string, unknown>>(request);
  const error = validateRequiredFields(body, requiredFields);
  if (error) {
    return badRequestResponse(error);
  }
  return { body: body as Record<string, unknown> };
}

/**
 * Gets a resource by ID or returns 404
 */
export async function getResourceOr404<T>(
  findFn: () => Promise<T | null>,
  resourceName: string = "Resource"
): Promise<T | Response> {
  const resource = await findFn();
  if (!resource) {
    return notFoundResponse(resourceName);
  }
  return resource;
}

/**
 * Extracts query parameters from request
 */
export function getQueryParams(request: NextRequest): URLSearchParams {
  const { searchParams } = new URL(request.url);
  return searchParams;
}

