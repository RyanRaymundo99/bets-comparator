import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  withErrorHandling,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";

// GET /api/admin/bet-link-requests - Get all bet link requests
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAdmin(request);
  if (session instanceof Response) return session;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED, or all

  const where: Record<string, unknown> = {};
  if (status && status !== "all") {
    where.status = status;
  }

  const requests = await prisma.betLinkRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      bet: {
        select: {
          id: true,
          name: true,
          betId: true,
          company: true,
        },
      },
    },
    orderBy: { requestedAt: "desc" },
  });

  return successResponse({ requests });
});

