import OpenAI from "openai";

// Lazy initialization - only create OpenAI client when accessed
let openaiInstance: OpenAI | null = null;

export const getOpenAI = (): OpenAI => {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    openaiInstance = new OpenAI({
      apiKey,
    });
  }
  
  return openaiInstance;
};

export interface BetData {
  name: string;
  parameters: {
    name: string;
    value: number;
    category?: string;
    unit?: string;
  }[];
  region?: string;
  license?: string;
}

export interface ComparisonInsight {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketPosition?: string;
}

/**
 * Generate insights for a single betting house
 */
export async function generateBetInsights(betData: BetData): Promise<ComparisonInsight> {
  const openai = getOpenAI();

  const prompt = `
Você é um analista especializado em casas de apostas regulamentadas no Brasil.

Analise os seguintes dados de uma casa de apostas e gere um relatório executivo:

**Casa de Apostas:** ${betData.name}
**Região:** ${betData.region || "Não especificada"}
**Licença:** ${betData.license || "Não especificada"}

**Parâmetros:**
${betData.parameters.map(p => `- ${p.name}: ${p.value}${p.unit ? ` ${p.unit}` : ""} ${p.category ? `(${p.category})` : ""}`).join('\n')}

Forneça uma análise estruturada em formato JSON com os seguintes campos:
- summary: Um resumo executivo de 2-3 frases
- strengths: Array de 3-5 pontos fortes identificados
- weaknesses: Array de 3-5 pontos fracos identificados
- recommendations: Array de 3-5 recomendações de melhoria específicas
- marketPosition: Uma frase descrevendo a posição no mercado

Seja objetivo, técnico e baseie-se apenas nos dados fornecidos.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um analista especializado em casas de apostas regulamentadas. Responda sempre em português do Brasil com análises técnicas e objetivas.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return JSON.parse(content) as ComparisonInsight;
  } catch (error) {
    console.error("Error generating bet insights:", error);
    throw new Error("Failed to generate insights");
  }
}

/**
 * Generate comparative insights for multiple betting houses
 */
export async function generateComparativeInsights(
  betsData: BetData[]
): Promise<{
  overallSummary: string;
  topPerformer: string;
  rankings: { name: string; score: number; reasoning: string }[];
  insights: ComparisonInsight[];
}> {
  const openai = getOpenAI();

  const prompt = `
Você é um analista especializado em casas de apostas regulamentadas no Brasil.

Compare as seguintes casas de apostas:

${betsData.map((bet, index) => `
**Casa ${index + 1}: ${bet.name}**
Região: ${bet.region || "Não especificada"}
Licença: ${bet.license || "Não especificada"}
Parâmetros:
${bet.parameters.map(p => `- ${p.name}: ${p.value}${p.unit ? ` ${p.unit}` : ""}`).join('\n')}
`).join('\n\n')}

Forneça uma análise comparativa estruturada em formato JSON com:
- overallSummary: Resumo geral da comparação (3-4 frases)
- topPerformer: Nome da casa de apostas com melhor desempenho geral
- rankings: Array com cada casa ranqueada, contendo:
  - name: Nome da casa
  - score: Pontuação de 0-100
  - reasoning: Justificativa da pontuação (1-2 frases)

Seja objetivo, técnico e baseie-se apenas nos dados fornecidos.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um analista especializado em casas de apostas regulamentadas. Responda sempre em português do Brasil com análises técnicas e objetivas.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const comparative = JSON.parse(content);

    // Generate individual insights for each bet
    const insights = await Promise.all(
      betsData.map(bet => generateBetInsights(bet))
    );

    return {
      ...comparative,
      insights,
    };
  } catch (error) {
    console.error("Error generating comparative insights:", error);
    throw new Error("Failed to generate comparative insights");
  }
}

