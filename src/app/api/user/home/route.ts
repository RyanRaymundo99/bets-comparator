import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  withErrorHandling,
} from "@/lib/api-response";
import { getSession } from "@/lib/auth-helpers";
import { PARAMETER_DEFINITIONS } from "@/lib/parameter-definitions";

// Helper function to calculate overall score for a bet
function calculateOverallScore(bet: {
  parameters: Array<{
    valueText?: string | null;
    valueNumber?: number | null;
    valueBoolean?: boolean | null;
    valueRating?: number | null;
    category?: string | null;
  }>;
}): number {
  let totalScore = 0;
  let validParams = 0;

  bet.parameters.forEach((param) => {
    let paramScore = 0;
    let hasValue = false;

    // Boolean: true = 100, false = 30
    if (param.valueBoolean !== null && param.valueBoolean !== undefined) {
      paramScore = param.valueBoolean ? 100 : 30;
      hasValue = true;
    }
    // Rating: multiplica por 20 para ficar de 0-100
    else if (param.valueRating !== null && param.valueRating !== undefined) {
      paramScore = param.valueRating * 20; // 5 stars = 100
      hasValue = true;
    }
    // Number: normalização simples
    else if (param.valueNumber !== null && param.valueNumber !== undefined) {
      const numValue = Number(param.valueNumber);
      if (numValue > 1000) {
        paramScore = Math.min(100, 50 + (numValue / 10000) * 50);
      } else if (numValue > 100) {
        paramScore = Math.min(100, numValue);
      } else {
        paramScore = Math.min(100, numValue * 2);
      }
      hasValue = true;
    }
    // Text: considera como preenchido (70 pontos)
    else if (param.valueText !== null && param.valueText !== undefined && param.valueText.trim() !== "") {
      paramScore = 70;
      hasValue = true;
    }

    if (hasValue) {
      totalScore += paramScore;
      validParams++;
    }
  });

  if (validParams === 0) return 0;
  return Math.round(totalScore / validParams);
}

// Helper function to get parameter trend
function getParameterTrend(
  currentValue: number | string | boolean | null | undefined,
  previousValue: number | string | boolean | null | undefined
): "up" | "down" | "stable" {
  if (currentValue === null || currentValue === undefined) return "stable";
  if (previousValue === null || previousValue === undefined) return "stable";

  // Handle numeric values
  if (typeof currentValue === "number" && typeof previousValue === "number") {
    if (currentValue > previousValue) return "up";
    if (currentValue < previousValue) return "down";
    return "stable";
  }

  // Handle boolean values
  if (typeof currentValue === "boolean" && typeof previousValue === "boolean") {
    if (currentValue && !previousValue) return "up";
    if (!currentValue && previousValue) return "down";
    return "stable";
  }

  // Handle rating values (same as number)
  return "stable";
}

// GET /api/user/home - Get home page data for user's linked bet
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getSession(request);

  if (!session) {
    return unauthorizedResponse("Authentication required");
  }

  // Get user's linked bet
  const userBet = await prisma.userBet.findFirst({
    where: {
      userId: session.userId,
    },
    include: {
      bet: {
        include: {
          parameters: {
            include: {
              history: {
                orderBy: { createdAt: "desc" },
                take: 1, // Get most recent history entry for trend calculation
              },
            },
            orderBy: { name: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!userBet) {
    return notFoundResponse("No linked bet found. Please link a bet first.");
  }

  const bet = userBet.bet;

  // Convert bet parameters to format expected by calculateOverallScore
  const betForScoring = {
    parameters: bet.parameters.map((p) => ({
      valueText: p.valueText,
      valueNumber: p.valueNumber !== null && p.valueNumber !== undefined ? Number(p.valueNumber) : null,
      valueBoolean: p.valueBoolean,
      valueRating: p.valueRating,
      category: p.category,
    })),
  };

  // Calculate overall score
  const overallScore = calculateOverallScore(betForScoring);
  const overallRating = overallScore / 20; // Convert to 0-5 scale
  const starRating = Math.round(overallRating * 2) / 2; // Round to nearest 0.5

  // Get all bets to calculate ranking
  const allBets = await prisma.bet.findMany({
    include: {
      parameters: true,
    },
  });

  // Calculate scores for all bets
  const betsWithScores = allBets.map((b) => ({
    bet: b,
    score: calculateOverallScore({
      parameters: b.parameters.map((p) => ({
        valueText: p.valueText,
        valueNumber: p.valueNumber !== null && p.valueNumber !== undefined ? Number(p.valueNumber) : null,
        valueBoolean: p.valueBoolean,
        valueRating: p.valueRating,
        category: p.category,
      })),
    }),
  }));

  // Sort by score descending
  betsWithScores.sort((a, b) => b.score - a.score);

  // Find current bet position
  const currentPosition = betsWithScores.findIndex((b) => b.bet.id === bet.id) + 1;
  const totalBets = betsWithScores.length;

  // Get top 10
  const top10 = betsWithScores.slice(0, 10).map((b, index) => ({
    id: b.bet.id,
    name: b.bet.name,
    score: b.score,
    position: index + 1,
  }));

  // Get 3 positions above current (if available and not in top 3)
  const aboveCurrent = currentPosition > 3
    ? betsWithScores
        .slice(Math.max(0, currentPosition - 4), currentPosition - 1) // Get positions before current
        .filter((b) => b.bet.id !== bet.id) // Exclude current bet
        .slice(-3) // Take only last 3
        .map((b) => {
          const actualIndex = betsWithScores.findIndex((item) => item.bet.id === b.bet.id);
          return {
            id: b.bet.id,
            name: b.bet.name,
            score: b.score,
            position: actualIndex + 1,
          };
        })
    : [];

  // Get 3 positions below current (if available)
  const belowCurrent = betsWithScores
    .slice(currentPosition, currentPosition + 4) // +4 to get 3 below (excluding current)
    .filter((b) => b.bet.id !== bet.id) // Exclude current bet
    .slice(0, 3) // Take only 3
    .map((b, index) => {
      const actualIndex = betsWithScores.findIndex((item) => item.bet.id === b.bet.id);
      return {
        id: b.bet.id,
        name: b.bet.name,
        score: b.score,
        position: actualIndex + 1,
      };
    });

  // Get all bets for expansion (full ranking)
  const allRanking = betsWithScores.map((b, index) => ({
    id: b.bet.id,
    name: b.bet.name,
    score: b.score,
    position: index + 1,
  }));

  // Create a map of existing parameters by name
  const existingParamsMap = new Map(
    bet.parameters.map((param) => [param.name, param])
  );

  // Process all defined parameters, filling in missing ones
  const parametersWithTrends = PARAMETER_DEFINITIONS.map((paramDef) => {
    const existingParam = existingParamsMap.get(paramDef.name);
    
    if (existingParam) {
      // Parameter exists in database
      const previousHistory = existingParam.history[0];
      let currentValue: number | string | boolean | null = null;
      let previousValue: number | string | boolean | null = null;

      // Get current value
      if (existingParam.valueNumber !== null && existingParam.valueNumber !== undefined) {
        currentValue = Number(existingParam.valueNumber);
      } else if (existingParam.valueText !== null && existingParam.valueText !== undefined) {
        currentValue = existingParam.valueText;
      } else if (existingParam.valueBoolean !== null && existingParam.valueBoolean !== undefined) {
        currentValue = existingParam.valueBoolean;
      } else if (existingParam.valueRating !== null && existingParam.valueRating !== undefined) {
        currentValue = existingParam.valueRating;
      }

      // Get previous value from history
      if (previousHistory) {
        if (previousHistory.valueNumber !== null && previousHistory.valueNumber !== undefined) {
          previousValue = Number(previousHistory.valueNumber);
        } else if (previousHistory.valueText !== null && previousHistory.valueText !== undefined) {
          previousValue = previousHistory.valueText;
        } else if (previousHistory.valueBoolean !== null && previousHistory.valueBoolean !== undefined) {
          previousValue = previousHistory.valueBoolean;
        } else if (previousHistory.valueRating !== null && previousHistory.valueRating !== undefined) {
          previousValue = previousHistory.valueRating;
        }
      }

      const trend = getParameterTrend(currentValue, previousValue);

      // Format display value
      let displayValue = "-";
      if (existingParam.valueText !== null && existingParam.valueText !== undefined) {
        displayValue = existingParam.valueText;
      } else if (existingParam.valueNumber !== null && existingParam.valueNumber !== undefined) {
        displayValue = Number(existingParam.valueNumber).toLocaleString("pt-BR");
      } else if (existingParam.valueBoolean !== null && existingParam.valueBoolean !== undefined) {
        displayValue = existingParam.valueBoolean ? "Sim" : "Não";
      } else if (existingParam.valueRating !== null && existingParam.valueRating !== undefined) {
        displayValue = `${existingParam.valueRating}/5`;
      }

      return {
        id: existingParam.id,
        name: existingParam.name,
        category: existingParam.category || paramDef.category,
        value: displayValue,
        unit: existingParam.unit || paramDef.unit,
        trend,
        type: existingParam.type || paramDef.type,
      };
    } else {
      // Parameter doesn't exist in database - return empty
      return {
        id: null, // No ID for non-existent parameters
        name: paramDef.name,
        category: paramDef.category,
        value: "-",
        unit: paramDef.unit,
        trend: "stable" as const,
        type: paramDef.type,
      };
    }
  });

  return successResponse({
    bet: {
      id: bet.id,
      name: bet.name,
      company: bet.company,
      url: bet.url,
      domain: bet.domain,
      cnpj: bet.cnpj,
      status: bet.status,
      scope: bet.scope,
      platformType: bet.platformType,
      region: bet.region,
      license: bet.license,
      betId: bet.betId,
      logo: bet.logo,
      coverImage: bet.coverImage,
    },
    rating: {
      overall: overallRating,
      score: overallScore,
      stars: starRating,
    },
    ranking: {
      position: currentPosition,
      total: totalBets,
      top10,
      aboveCurrent,
      belowCurrent,
      allRanking, // Full ranking for expansion
    },
    parameters: parametersWithTrends,
  });
});

