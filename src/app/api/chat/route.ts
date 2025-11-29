import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { getSession } from "@/lib/auth-helpers";
import {
  successResponse,
  unauthorizedResponse,
  badRequestResponse,
  withErrorHandling,
} from "@/lib/api-response";

// POST /api/chat - Chat with ChatGPT about betting house
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getSession(request);

  if (!session) {
    return unauthorizedResponse("Authentication required");
  }

  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== "string") {
      return badRequestResponse("Message is required");
    }

    const openai = getOpenAI();

    // Build system prompt with context about the betting house
    const systemPrompt = `Você é um assistente especializado em análise de casas de apostas regulamentadas no Brasil. 
Você ajuda usuários a entender melhor suas casas de apostas, rankings, parâmetros e como melhorar sua posição.

${context ? `Contexto atual do usuário:
${JSON.stringify(context, null, 2)}
` : ""}

Responda sempre em português do Brasil de forma clara, objetiva e útil. Seja profissional mas acessível.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "No response from ChatGPT" },
        { status: 500 }
      );
    }

    return successResponse({
      message: content,
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get response from ChatGPT" },
      { status: 500 }
    );
  }
});


