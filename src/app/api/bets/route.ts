import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  badRequestResponse,
  conflictResponse,
  withErrorHandling,
} from "@/lib/api-response";

// GET /api/bets - List all bets with optional filters
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};

  if (region) {
    where.region = region;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { cnpj: { contains: search, mode: "insensitive" } },
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

// POST /api/bets - Create a new bet
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { name, cnpj, url, region, license } = body;

  if (!name) {
    return badRequestResponse("Name is required");
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

  const bet = await prisma.bet.create({
    data: {
      name,
      cnpj,
      url,
      region,
      license,
    },
    include: {
      parameters: true,
    },
  });

  return successResponse({ bet }, 201);
});

