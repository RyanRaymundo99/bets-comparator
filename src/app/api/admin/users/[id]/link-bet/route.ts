import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  withErrorHandling,
  ApiResponse,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { PARAMETER_DEFINITIONS } from "@/lib/parameter-definitions";
import { Decimal } from "@/lib/prisma";

// POST /api/admin/users/[id]/link-bet - Admin links a user to a bet
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireAdmin(request);
  if (session instanceof Response) {
    return session as NextResponse<ApiResponse>;
  }

  const { id: userId } = await params;
  const body = await request.json();
  const { betId } = body; // This is the Bet ID (like "UF87F"), not the database ID

  if (!betId) {
    return badRequestResponse("Bet ID is required");
  }

  // Find the user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return notFoundResponse("User not found");
  }

  // Find the bet by Bet ID
  const bet = await prisma.bet.findUnique({
    where: { betId: betId.toUpperCase() },
    include: {
      parameters: true,
    },
  });

  if (!bet) {
    return notFoundResponse("Bet not found with this Bet ID");
  }

  // Check if user already has this bet linked
  const existingUserBet = await prisma.userBet.findUnique({
    where: {
      userId_betId: {
        userId: userId,
        betId: bet.id,
      },
    },
  });

  if (existingUserBet) {
    return badRequestResponse("User already has this bet linked");
  }

  // Create UserBet - links user to the bet
  const userBet = await prisma.userBet.create({
    data: {
      userId: userId,
      betId: bet.id,
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

  // Fetch the created userBet with bet info
  const userBetWithData = await prisma.userBet.findUnique({
    where: { id: userBet.id },
    include: {
      bet: {
        include: {
          parameters: true,
        },
      },
      parameters: true,
    },
  });

  return successResponse({ userBet: userBetWithData }, 201);
});

// DELETE /api/admin/users/[id]/link-bet - Admin unlinks a user from their bet
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireAdmin(request);
  if (session instanceof Response) {
    return session as NextResponse<ApiResponse>;
  }

  const { id: userId } = await params;

  // Find the user's linked bet
  const userBet = await prisma.userBet.findFirst({
    where: { userId },
    include: {
      bet: true,
    },
  });

  if (!userBet) {
    return notFoundResponse("User does not have a linked bet");
  }

  // Delete the UserBet (cascade will delete UserParameters)
  await prisma.userBet.delete({
    where: { id: userBet.id },
  });

  return successResponse({ 
    message: "User unlinked from bet successfully",
    betName: userBet.bet.name,
  });
});

