import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/bets/[id]/parameters/history - Get all parameter history for a bet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: betId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    // Check if bet exists
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!bet) {
      return NextResponse.json(
        { success: false, error: "Bet not found" },
        { status: 404 }
      );
    }

    // Get all parameters for this bet
    const parameters = await prisma.parameter.findMany({
      where: { betId },
      select: {
        id: true,
        name: true,
        category: true,
      },
    });

    if (parameters.length === 0) {
      return NextResponse.json({
        success: true,
        bet: {
          id: bet.id,
          name: bet.name,
        },
        history: [],
      });
    }

    const parameterIds = parameters.map((p) => p.id);

    // Get all history entries for all parameters of this bet
    const history = await prisma.parameterHistory.findMany({
      where: {
        parameterId: {
          in: parameterIds,
        },
      },
      include: {
        parameter: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(limit && { take: parseInt(limit) }),
    });

    return NextResponse.json({
      success: true,
      bet: {
        id: bet.id,
        name: bet.name,
      },
      history,
    });
  } catch (error) {
    console.error("Error fetching bet parameter history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bet parameter history" },
      { status: 500 }
    );
  }
}

