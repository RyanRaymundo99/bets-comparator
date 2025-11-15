import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateBetInsights } from "@/lib/openai";

// GET /api/insights/[betId] - Generate insights for a specific bet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ betId: string }> }
) {
  try {
    const { betId } = await params;

    // Fetch bet with parameters
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: {
        parameters: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!bet) {
      return NextResponse.json(
        { success: false, error: "Bet not found" },
        { status: 404 }
      );
    }

    if (bet.parameters.length === 0) {
      return NextResponse.json(
        { success: false, error: "This bet has no parameters to analyze" },
        { status: 400 }
      );
    }

    // Transform data for OpenAI
    const betData = {
      name: bet.name,
      region: bet.region || undefined,
      license: bet.license || undefined,
      parameters: bet.parameters
        .map(p => {
          // Get the appropriate value based on type
          let value: string | number | boolean | null = null;
          if (p.valueText !== null) {
            value = p.valueText;
          } else if (p.valueNumber !== null) {
            value = p.valueNumber.toNumber();
          } else if (p.valueBoolean !== null) {
            value = p.valueBoolean;
          } else if (p.valueRating !== null) {
            value = p.valueRating;
          }
          
          // Skip parameters with null values
          if (value === null) {
            return null;
          }
          
          return {
            name: p.name,
            value: value,
            category: p.category || undefined,
            unit: p.unit || undefined,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null),
    };

    // Generate insights
    const insights = await generateBetInsights(betData);

    return NextResponse.json({
      success: true,
      bet: {
        id: bet.id,
        name: bet.name,
        region: bet.region,
        license: bet.license,
      },
      insights,
    });
  } catch (error) {
    console.error("Error generating bet insights:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate insights",
      },
      { status: 500 }
    );
  }
}

