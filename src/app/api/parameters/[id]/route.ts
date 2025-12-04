import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Decimal } from "@/lib/prisma";
import { getParameterDefinition } from "@/lib/parameter-definitions";

// GET /api/parameters/[id] - Get a specific parameter with history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const parameter = await prisma.parameter.findUnique({
      where: { id },
      include: {
        bet: true,
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!parameter) {
      return NextResponse.json(
        { success: false, error: "Parameter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, parameter });
  } catch (error) {
    console.error("Error fetching parameter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch parameter" },
      { status: 500 }
    );
  }
}

// PATCH /api/parameters/[id] - Update a parameter
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { value, notes } = body;

    if (value === undefined) {
      return NextResponse.json(
        { success: false, error: "value is required for update" },
        { status: 400 }
      );
    }

    let parameter = await prisma.parameter.findUnique({
      where: { id },
    });

    if (!parameter) {
      return NextResponse.json(
        { success: false, error: "Parameter not found" },
        { status: 404 }
      );
    }

    // Determinar o tipo do parâmetro
    // Primeiro tenta buscar da definição, senão usa o tipo salvo no banco
    const paramDef = getParameterDefinition(parameter.name);
    const paramType = paramDef?.type || parameter.type;
    
    // Se não tiver tipo definido, tenta inferir pelo valor existente ou pelo nome
    let effectiveType = paramType;
    if (!effectiveType) {
      // Parâmetros de categoria (notas gerais)
      if (parameter.name.startsWith('__category_rating_')) {
        effectiveType = 'rating';
      } else if (parameter.valueRating !== null) {
        effectiveType = 'rating';
      } else if (parameter.valueBoolean !== null) {
        effectiveType = 'boolean';
      } else if (parameter.valueNumber !== null) {
        effectiveType = 'number';
      } else {
        effectiveType = 'text';
      }
    }

    const dataToUpdate: Record<string, unknown> = {};
    const historyValue: Record<string, unknown> = {};

    switch (effectiveType) {
      case "text":
      case "select":
        dataToUpdate.valueText = String(value);
        historyValue.valueText = String(value);
        break;
      case "number":
      case "currency":
      case "percentage":
        dataToUpdate.valueNumber = new Decimal(value);
        historyValue.valueNumber = new Decimal(value);
        break;
      case "boolean":
        dataToUpdate.valueBoolean = Boolean(value);
        historyValue.valueBoolean = Boolean(value);
        break;
      case "rating":
        // Armazena como inteiro multiplicado por 10 (4.5 → 45) para suportar decimais
        const ratingValue = Math.max(0, Math.min(parseFloat(value), 5));
        const ratingInt = Math.round(ratingValue * 10);
        dataToUpdate.valueRating = ratingInt;
        historyValue.valueRating = ratingInt;
        break;
      default:
        // Fallback para text se tipo desconhecido
        dataToUpdate.valueText = String(value);
        historyValue.valueText = String(value);
        break;
    }

    parameter = await prisma.parameter.update({
      where: { id },
      data: dataToUpdate,
      include: {
        bet: true,
        history: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    // Create history entry
    await prisma.parameterHistory.create({
      data: {
        parameterId: parameter.id,
        notes: notes || null,
        ...historyValue,
      },
    });

    return NextResponse.json({ success: true, parameter });
  } catch (error) {
    console.error("Error updating parameter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update parameter" },
      { status: 500 }
    );
  }
}

// DELETE /api/parameters/[id] - Delete a parameter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if parameter exists
    const existingParameter = await prisma.parameter.findUnique({
      where: { id },
    });

    if (!existingParameter) {
      return NextResponse.json(
        { success: false, error: "Parameter not found" },
        { status: 404 }
      );
    }

    // Delete the parameter (history will be cascade deleted)
    await prisma.parameter.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Parameter deleted successfully" });
  } catch (error) {
    console.error("Error deleting parameter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete parameter" },
      { status: 500 }
    );
  }
}

