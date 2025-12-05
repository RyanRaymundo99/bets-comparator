import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
  withErrorHandling,
} from "@/lib/api-response";
import { getSession } from "@/lib/auth-helpers";
import {
  PARAMETER_CATEGORIES,
  ParameterCategory,
  CATEGORY_WEIGHTS,
} from "@/lib/parameter-definitions";

// Helper function to calculate overall score for a bet
// Agora usa média ponderada das notas gerais de cada categoria
function calculateOverallScore(bet: {
  parameters: Array<{
    name?: string;
    valueText?: string | null;
    valueNumber?: number | null;
    valueBoolean?: boolean | null;
    valueRating?: number | null;
    category?: string | null;
  }>;
}): number {
  // Buscar as notas gerais de cada categoria (parâmetros __category_rating_*)
  const categoryRatings: Record<string, number> = {};
  
  bet.parameters.forEach((param) => {
    // Verificar se é um parâmetro de nota geral de categoria
    if (param.name && param.name.startsWith('__category_rating_')) {
      const category = param.name.replace('__category_rating_', '');
      // valueRating é armazenado como inteiro * 10 (4.5 → 45), então dividimos por 10
      if (param.valueRating !== null && param.valueRating !== undefined) {
        categoryRatings[category] = Number(param.valueRating) / 10;
      }
    }
  });

  // Calcular média ponderada usando os pesos das categorias
  let weightedSum = 0;
  let totalWeight = 0;

  PARAMETER_CATEGORIES.forEach((category) => {
    const rating = categoryRatings[category];
    const weight = CATEGORY_WEIGHTS[category];

    if (rating !== undefined && rating !== null && rating > 0) {
      // Converter nota de 0-5 para 0-100 para manter compatibilidade
      const ratingIn100 = (rating / 5) * 100;
      weightedSum += ratingIn100 * weight;
      totalWeight += weight;
    }
  });

  if (totalWeight === 0) return 0;
  
  // Retornar a média ponderada
  return Math.round(weightedSum / totalWeight);
}

// Helper function to calculate category score
function calculateCategoryScore(
  bet: {
    parameters: Array<{
      valueText?: string | null;
      valueNumber?: number | null;
      valueBoolean?: boolean | null;
      valueRating?: number | null;
      category?: string | null;
    }>;
  },
  category: string
): number {
  const categoryParams = bet.parameters.filter((p) => p.category === category);
  if (categoryParams.length === 0) return 0;

  let totalScore = 0;
  let validParams = 0;

  categoryParams.forEach((param) => {
    let paramScore = 0;
    let hasValue = false;

    // Boolean: true = 100, false = 30
    if (param.valueBoolean !== null && param.valueBoolean !== undefined) {
      paramScore = param.valueBoolean ? 100 : 30;
      hasValue = true;
    }
    // Rating: divide por 10 (armazenado como *10) e multiplica por 20 para ficar de 0-100
    else if (param.valueRating !== null && param.valueRating !== undefined) {
      paramScore = (Number(param.valueRating) / 10) * 20;
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
    else if (
      param.valueText !== null &&
      param.valueText !== undefined &&
      param.valueText.trim() !== ""
    ) {
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

// GET /api/bets/filtered - Get filtered bets based on ranking filters
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getSession(request);

  if (!session) {
    return unauthorizedResponse("Authentication required");
  }

  const { searchParams } = new URL(request.url);
  const filterType = searchParams.get("filter"); // "top10", "above", or category name

  if (!filterType) {
    return badRequestResponse("Filter type is required");
  }

  // Get user's linked bet to find their position
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
    },
    orderBy: { createdAt: "desc" },
  });

  if (!userBet) {
    return notFoundResponse("No linked bet found. Please link a bet first.");
  }

  // Get all bets
  const allBets = await prisma.bet.findMany({
    include: {
      parameters: true,
    },
  });

  let filteredBets: Array<{
    bet: (typeof allBets)[0];
    score: number;
    position: number;
  }> = [];

  if (filterType === "top10") {
    // Top 10 overall
    const betsWithScores = allBets.map((b) => ({
      bet: b,
      score: calculateOverallScore({
        parameters: b.parameters.map((p) => ({
          name: p.name,
          valueText: p.valueText,
          valueNumber:
            p.valueNumber !== null && p.valueNumber !== undefined
              ? Number(p.valueNumber)
              : null,
          valueBoolean: p.valueBoolean,
          valueRating: p.valueRating,
          category: p.category,
        })),
      }),
    }));

    betsWithScores.sort((a, b) => b.score - a.score);
    filteredBets = betsWithScores.slice(0, 10).map((b, index) => ({
      ...b,
      position: index + 1,
    }));
  } else if (filterType === "above") {
    // Top 10 above user's bet in overall ranking
    const betsWithScores = allBets.map((b) => ({
      bet: b,
      score: calculateOverallScore({
        parameters: b.parameters.map((p) => ({
          name: p.name,
          valueText: p.valueText,
          valueNumber:
            p.valueNumber !== null && p.valueNumber !== undefined
              ? Number(p.valueNumber)
              : null,
          valueBoolean: p.valueBoolean,
          valueRating: p.valueRating,
          category: p.category,
        })),
      }),
    }));

    betsWithScores.sort((a, b) => b.score - a.score);
    const userPosition = betsWithScores.findIndex(
      (b) => b.bet.id === userBet.bet.id
    );

    if (userPosition > 0) {
      // Get up to 10 bets above the user's position
      const startIndex = Math.max(0, userPosition - 10);
      filteredBets = betsWithScores
        .slice(startIndex, userPosition)
        .map((b, index) => ({
          ...b,
          position: startIndex + index + 1,
        }));
    }
  } else if (PARAMETER_CATEGORIES.includes(filterType as ParameterCategory)) {
    // Top 10 by category
    const category = filterType as ParameterCategory;
    const betsWithScores = allBets.map((b) => ({
      bet: b,
      score: calculateCategoryScore(
        {
          parameters: b.parameters.map((p) => ({
            valueText: p.valueText,
            valueNumber:
              p.valueNumber !== null && p.valueNumber !== undefined
                ? Number(p.valueNumber)
                : null,
            valueBoolean: p.valueBoolean,
            valueRating: p.valueRating,
            category: p.category,
          })),
        },
        category
      ),
    }));

    betsWithScores.sort((a, b) => b.score - a.score);
    filteredBets = betsWithScores.slice(0, 10).map((b, index) => ({
      ...b,
      position: index + 1,
    }));
  } else {
    return badRequestResponse("Invalid filter type");
  }

  // Format response to match Bet interface (same format as /api/bets)
  const bets = filteredBets.map((item) => ({
    id: item.bet.id,
    name: item.bet.name,
    region: item.bet.region,
    license: item.bet.license,
    url: item.bet.url,
    cnpj: item.bet.cnpj,
    domain: item.bet.domain,
    betId: item.bet.betId,
    logo: item.bet.logo,
    coverImage: item.bet.coverImage,
    parameters: item.bet.parameters.map((p) => ({
      id: p.id,
      name: p.name,
      // Preserve individual value fields for compatibility with comparison page and other pages
      valueText: p.valueText,
      valueNumber:
        p.valueNumber !== null && p.valueNumber !== undefined
          ? Number(p.valueNumber)
          : null,
      valueBoolean: p.valueBoolean,
      valueRating: p.valueRating,
      category: p.category,
      unit: p.unit,
    })),
  }));

  return successResponse({ bets, filterType });
});
