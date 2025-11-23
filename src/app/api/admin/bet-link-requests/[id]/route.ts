import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  unauthorizedResponse,
  withErrorHandling,
  ApiResponse,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { PARAMETER_DEFINITIONS } from "@/lib/parameter-definitions";
import { Decimal } from "@/lib/prisma";

// PATCH /api/admin/bet-link-requests/[id] - Approve or reject a request
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireAdmin(request);
  if (session instanceof Response) {
    return session as NextResponse<ApiResponse>;
  }

  const { id } = await params;
  const body = await request.json();
  const { action, notes } = body; // action: "approve" or "reject"

  if (!action || (action !== "approve" && action !== "reject")) {
    return badRequestResponse("Action must be 'approve' or 'reject'");
  }

  // Find the request
  const linkRequest = await prisma.betLinkRequest.findUnique({
    where: { id },
    include: {
      user: true,
      bet: true,
    },
  });

  if (!linkRequest) {
    return notFoundResponse("Request not found");
  }

  if (linkRequest.status !== "PENDING") {
    return badRequestResponse("Request has already been processed");
  }

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

  // Update the request
  await prisma.betLinkRequest.update({
    where: { id },
    data: {
      status: newStatus,
      reviewedAt: new Date(),
      reviewedBy: session.userId,
      notes: notes || null,
    },
  });

  // If approved, create the UserBet and parameters
  if (action === "approve") {
    // Check if user already has this bet linked (shouldn't happen, but safety check)
    const existingUserBet = await prisma.userBet.findUnique({
      where: {
        userId_betId: {
          userId: linkRequest.userId,
          betId: linkRequest.betId,
        },
      },
    });

    if (!existingUserBet) {
      // Create UserBet
      const userBet = await prisma.userBet.create({
        data: {
          userId: linkRequest.userId,
          betId: linkRequest.betId,
        },
      });

      // Auto-create user parameters based on admin parameter definitions
      const parameterPromises = PARAMETER_DEFINITIONS.map((def) => {
        const paramData: {
          userBetId: string;
          name: string;
          category: string;
          type: string;
          unit?: string;
          description?: string;
          options?: string[];
          valueText?: string | null;
          valueNumber?: Decimal | null;
          valueBoolean?: boolean | null;
          valueRating?: number | null;
        } = {
          userBetId: userBet.id,
          name: def.name,
          category: def.category,
          type: def.type,
          unit: def.unit,
          description: def.description,
          options: def.options || [],
          valueText: null,
          valueNumber: null,
          valueBoolean: null,
          valueRating: null,
        };

        return prisma.userParameter.create({
          data: paramData,
        });
      });

      await Promise.all(parameterPromises);
    }
  }

  // Fetch updated request
  const updatedRequest = await prisma.betLinkRequest.findUnique({
    where: { id },
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
        },
      },
    },
  });

  return successResponse({
    request: updatedRequest,
    message: action === "approve" 
      ? "Request approved and user linked to bet" 
      : "Request rejected",
  });
});

