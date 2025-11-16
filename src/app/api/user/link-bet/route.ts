import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  notFoundResponse,
  withErrorHandling,
} from "@/lib/api-response";
import { getSession } from "@/lib/auth-helpers";

// POST /api/user/link-bet - Link user to a bet by Bet ID
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getSession(request);
  
  if (!session) {
    return unauthorizedResponse("Authentication required");
  }

  const body = await request.json();
  const { betId } = body;

  if (!betId) {
    return badRequestResponse("Bet ID is required");
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
        userId: session.userId,
        betId: bet.id,
      },
    },
  });

  if (existingUserBet) {
    return badRequestResponse("You have already linked to this bet");
  }

  // Check if there's already a pending request
  const existingRequest = await prisma.betLinkRequest.findUnique({
    where: {
      userId_betId: {
        userId: session.userId,
        betId: bet.id,
      },
    },
  });

  if (existingRequest) {
    if (existingRequest.status === "PENDING") {
      return badRequestResponse("You already have a pending request for this bet");
    }
    // If request was rejected, allow creating a new one
  }

  // Create a request instead of directly linking
  const linkRequest = await prisma.betLinkRequest.create({
    data: {
      userId: session.userId,
      betId: bet.id,
      status: "PENDING",
    },
    include: {
      bet: {
        select: {
          id: true,
          name: true,
          betId: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return successResponse({ 
    message: "Request submitted successfully. Waiting for admin approval.",
    request: {
      id: linkRequest.id,
      bet: linkRequest.bet,
      status: linkRequest.status,
      requestedAt: linkRequest.requestedAt,
    },
  }, 201);
});

// GET /api/user/link-bet - Check if user has linked a bet
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getSession(request);
  
  if (!session) {
    return unauthorizedResponse("Authentication required");
  }

  const userBet = await prisma.userBet.findFirst({
    where: {
      userId: session.userId,
    },
    include: {
      bet: {
        include: {
          parameters: true,
        },
      },
      parameters: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Also check for pending requests
  const pendingRequest = await prisma.betLinkRequest.findFirst({
    where: {
      userId: session.userId,
      status: "PENDING",
    },
    include: {
      bet: {
        select: {
          id: true,
          name: true,
          betId: true,
        },
      },
    },
    orderBy: { requestedAt: "desc" },
  });

  return successResponse({ 
    hasLinkedBet: !!userBet,
    userBet: userBet || null,
    pendingRequest: pendingRequest || null,
  });
});

