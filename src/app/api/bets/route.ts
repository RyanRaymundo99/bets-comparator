import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  badRequestResponse,
  conflictResponse,
  withErrorHandling,
} from "@/lib/api-response";

// GET /api/bets - List all bets with optional filters (includes admin bets and user bets)
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};

  if (region && region !== "all") {
    where.region = region;
  }

  if (search) {
    where.OR = [
      { betId: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { cnpj: { contains: search, mode: "insensitive" } },
      { domain: { contains: search, mode: "insensitive" } },
    ];
  }

  const bets = await prisma.bet.findMany({
    where,
    include: {
      parameters: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return successResponse({ bets });
});

// POST /api/bets - Create a new bet (Admin only)
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { betId, name, cnpj, url, region, license, company, domain, status, scope, platformType } = body;

  if (!name) {
    return badRequestResponse("Name is required");
  }

  if (!betId) {
    return badRequestResponse("Bet ID is required (e.g., UF87F)");
  }

  // Check if Bet ID already exists
  const existingBetById = await prisma.bet.findUnique({
    where: { betId },
  });

  if (existingBetById) {
    return conflictResponse("A bet with this Bet ID already exists");
  }

  // Check if CNPJ already exists
  if (cnpj) {
    const existingBet = await prisma.bet.findFirst({
      where: { cnpj },
    });

    if (existingBet) {
      return conflictResponse("A bet with this CNPJ already exists");
    }
  }

  // Check if domain already exists
  if (domain) {
    const existingDomain = await prisma.bet.findUnique({
      where: { domain },
    });

    if (existingDomain) {
      return conflictResponse("A bet with this domain already exists");
    }
  }

  const bet = await prisma.bet.create({
    data: {
      betId,
      name,
      company,
      domain,
      cnpj,
      url,
      region,
      license,
      status: status || "Funcionando",
      scope,
      platformType,
    },
    include: {
      parameters: true,
    },
  });

  return successResponse({ bet }, 201);
});

