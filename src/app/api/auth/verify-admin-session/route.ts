import { NextRequest } from "next/server";
import { successResponse, errorResponse, withErrorHandling } from "@/lib/api-response";
import { verifyAdminSession } from "@/lib/auth-helpers";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const result = await verifyAdminSession(request);

  if (!result.valid) {
    return errorResponse(result.error || "Session verification failed", 401, false);
  }

  return successResponse({
    valid: true,
    user: result.user,
  });
});
