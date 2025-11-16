import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  withErrorHandling,
} from "@/lib/api-response";
import { getSession } from "@/lib/auth-helpers";
import { PARAMETER_DEFINITIONS } from "@/lib/parameter-definitions";
import { Decimal } from "@prisma/client/runtime/library";

// POST /api/user/bets - Create a user's own bet
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getSession(request);
  
  if (!session) {
    return unauthorizedResponse("Authentication required");
  }

  const body = await request.json();
  const { name, url } = body;

  if (!name || !url) {
    return badRequestResponse("Name and URL are required");
  }

  // Extract domain from URL
  let domain: string | null = null;
  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname.replace(/^www\./, "");
  } catch {
    // If URL parsing fails, use the URL as-is for domain
    domain = url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }

  // Check if user already has a bet with this URL
  const existingBet = await prisma.bet.findFirst({
    where: {
      userId: session.userId,
      url: url,
    },
  });

  if (existingBet) {
    return badRequestResponse("You already have a bet with this URL");
  }

  // Create the bet
  const bet = await prisma.bet.create({
    data: {
      name,
      url,
      domain,
      userId: session.userId,
      status: "Funcionando",
    },
  });

  // Auto-create parameters based on admin-defined parameter definitions
  // Users can fill these in later
  const parameterPromises = PARAMETER_DEFINITIONS.map((def) => {
    const paramData: {
      betId: string;
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
      betId: bet.id,
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

    return prisma.parameter.create({
      data: paramData,
    });
  });

  await Promise.all(parameterPromises);

  // Fetch the created bet with parameters
  const betWithParameters = await prisma.bet.findUnique({
    where: { id: bet.id },
    include: {
      parameters: true,
    },
  });

  return successResponse({ bet: betWithParameters }, 201);
});

// GET /api/user/bets - Get user's own bets
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getSession(request);
  
  if (!session) {
    return unauthorizedResponse("Authentication required");
  }

  const bets = await prisma.bet.findMany({
    where: {
      userId: session.userId,
    },
    include: {
      parameters: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return successResponse({ bets });
});

