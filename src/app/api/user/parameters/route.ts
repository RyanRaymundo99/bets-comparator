import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  badRequestResponse,
  unauthorizedResponse,
  withErrorHandling,
} from "@/lib/api-response";
import { getSession } from "@/lib/auth-helpers";
import { Decimal } from "@/lib/prisma";

// POST /api/user/parameters - Create or update a user parameter
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getSession(request);
  
  if (!session) {
    return unauthorizedResponse("Authentication required");
  }

  const body = await request.json();
  const {
    userBetId,
    name,
    category,
    valueText,
    valueNumber,
    valueBoolean,
    valueRating,
    unit,
    description,
    type,
    options,
  } = body;

  if (!userBetId || !name) {
    return badRequestResponse("userBetId and name are required");
  }

  // Verify the userBet belongs to the current user
  const userBet = await prisma.userBet.findUnique({
    where: { id: userBetId },
  });

  if (!userBet) {
    return badRequestResponse("User bet not found");
  }

  if (userBet.userId !== session.userId) {
    return unauthorizedResponse("You don't have access to this bet");
  }

  // Check if parameter already exists
  const existingParameter = await prisma.userParameter.findUnique({
    where: {
      userBetId_name: {
        userBetId,
        name,
      },
    },
  });

  const paramData: {
    userBetId: string;
    name: string;
    category?: string;
    unit?: string;
    description?: string;
    type?: string;
    options?: string[];
    valueText?: string | null;
    valueNumber?: InstanceType<typeof Decimal> | null;
    valueBoolean?: boolean | null;
    valueRating?: number | null;
  } = {
    userBetId,
    name,
    category: category || null,
    unit: unit || null,
    description: description || null,
    type: type || null,
    options: options || [],
    valueText: valueText !== undefined ? (valueText || null) : null,
    valueNumber: valueNumber !== undefined ? (valueNumber ? new Decimal(valueNumber) : null) : null,
    valueBoolean: valueBoolean !== undefined ? (valueBoolean || null) : null,
    valueRating: valueRating !== undefined ? (valueRating ? Math.min(5, Math.max(0, valueRating)) : null) : null,
  };

  let parameter;
  if (existingParameter) {
    // Update existing parameter
    parameter = await prisma.userParameter.update({
      where: { id: existingParameter.id },
      data: paramData,
    });
  } else {
    // Create new parameter
    parameter = await prisma.userParameter.create({
      data: paramData,
    });
  }

  return successResponse({ parameter }, existingParameter ? 200 : 201);
});

