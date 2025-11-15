import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateBetInsights, generateComparativeInsights } from "@/lib/openai";

// POST /api/insights - Generate insights for one or more bets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { betIds, type = "single" } = body;

    if (!betIds || (Array.isArray(betIds) && betIds.length === 0)) {
      return NextResponse.json(
        { success: false, error: "betIds is required" },
        { status: 400 }
      );
    }

    // Fetch bets with parameters
    const bets = await prisma.bet.findMany({
      where: {
        id: {
          in: Array.isArray(betIds) ? betIds : [betIds],
        },
      },
      include: {
        parameters: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (bets.length === 0) {
      return NextResponse.json(
        { success: false, error: "No bets found" },
        { status: 404 }
      );
    }

    // Transform data for OpenAI
    const betsData = bets.map(bet => ({
      name: bet.name,
      region: bet.region || undefined,
      license: bet.license || undefined,
      parameters: bet.parameters.map(p => {
        // Get value based on type
        let value: string | number | boolean | null = null;
        if (p.valueText !== null) {
          value = p.valueText;
        } else if (p.valueNumber !== null) {
          value = Number(p.valueNumber);
        } else if (p.valueBoolean !== null) {
          value = p.valueBoolean;
        } else if (p.valueRating !== null) {
          value = p.valueRating;
        }
        
        return {
          name: p.name,
          value: value,
          category: p.category || undefined,
          unit: p.unit || undefined,
        };
      }),
    }));

    let result;

    if (type === "comparative" && betsData.length > 1) {
      // Generate comparative insights
      result = await generateComparativeInsights(betsData);
    } else {
      // Generate single bet insights
      const insights = await generateBetInsights(betsData[0]);
      result = { insights: [insights] };
    }

    return NextResponse.json({
      success: true,
      type,
      ...result,
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate insights",
      },
      { status: 500 }
    );
  }
}

