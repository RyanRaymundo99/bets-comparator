import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  withErrorHandling,
} from "@/lib/api-response";
import { getSession } from "@/lib/auth-helpers";

// GET /api/user/bet/[id] - Get user's bet by userBet ID
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getSession(request);
  
  if (!session) {
    return unauthorizedResponse("Authentication required");
  }

  const userBetId = params.id;

  const userBet = await prisma.userBet.findUnique({
    where: { id: userBetId },
    include: {
      bet: {
        include: {
          parameters: true,
        },
      },
      parameters: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!userBet) {
    return notFoundResponse("User bet not found");
  }

  // Verify this userBet belongs to the current user
  if (userBet.userId !== session.userId) {
    return unauthorizedResponse("You don't have access to this bet");
  }

  return successResponse({ 
    userBet,
    bet: userBet.bet,
    parameters: userBet.parameters,
  });
});

