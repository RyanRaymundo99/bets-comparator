import { NextRequest, NextResponse } from "next/server";
import prisma, { Decimal } from "@/lib/prisma";

// POST /api/parameters - Create or update a parameter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      betId,
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
      notes,
    } = body;

    if (!betId || !name) {
      return NextResponse.json(
        { success: false, error: "betId and name are required" },
        { status: 400 }
      );
    }

    // Check if at least one value is provided
    if (
      valueText === undefined &&
      valueNumber === undefined &&
      valueBoolean === undefined &&
      valueRating === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "At least one value must be provided" },
        { status: 400 }
      );
    }

    // Check if bet exists
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
    });

    if (!bet) {
      return NextResponse.json(
        { success: false, error: "Bet not found" },
        { status: 404 }
      );
    }

    // Check if parameter already exists
    const existingParameter = await prisma.parameter.findUnique({
      where: {
        betId_name: {
          betId,
          name,
        },
      },
    });

    let parameter;
    // Determine which value type to use and clear others
    const isRating = type === "rating" || name.startsWith('__category_rating_');
    const isBoolean = type === "boolean";
    const isNumber = type === "number" || type === "currency" || type === "percentage";
    const isText = type === "text" || type === "select" || !type;
    
    const paramData: {
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
      category,
      unit,
      description,
      type: type || (isRating ? "rating" : undefined),
      options: options || [],
      // Only set the value for the correct type, clear others
      valueText: isText && valueText !== undefined ? valueText : null,
      valueNumber: isNumber && valueNumber !== undefined ? new Decimal(valueNumber) : null,
      valueBoolean: isBoolean && valueBoolean !== undefined ? valueBoolean : null,
      valueRating: isRating && valueRating !== undefined ? Math.round(Math.max(0, Math.min(parseFloat(String(valueRating)), 5)) * 10) : null,
    };
    
    console.log("POST parameter data:", {
      name,
      type,
      isRating,
      valueRating: paramData.valueRating,
      paramData,
    });

    if (existingParameter) {
      // Update existing parameter
      console.log("POST: Updating existing parameter:", {
        id: existingParameter.id,
        name,
        type,
        isRating,
        currentValueRating: existingParameter.valueRating,
        newValueRating: paramData.valueRating,
        paramData,
      });
      
      parameter = await prisma.parameter.update({
        where: { id: existingParameter.id },
        data: paramData,
      });
      
      console.log("POST: Parameter updated:", {
        id: parameter.id,
        name: parameter.name,
        type: parameter.type,
        valueRating: parameter.valueRating,
      });

      // Create history entry if value changed
      // For rating, compare the integer values (stored as ×10)
      const existingRatingInt = existingParameter.valueRating;
      const newRatingInt = isRating && valueRating !== undefined 
        ? Math.round(Math.max(0, Math.min(parseFloat(String(valueRating)), 5)) * 10)
        : null;
      
      const hasChanged =
        existingParameter.valueText !== (isText ? valueText : null) ||
        existingParameter.valueNumber?.toString() !== (isNumber && valueNumber !== undefined ? new Decimal(valueNumber).toString() : null) ||
        existingParameter.valueBoolean !== (isBoolean ? valueBoolean : null) ||
        existingRatingInt !== newRatingInt;

      if (hasChanged) {
        await prisma.parameterHistory.create({
          data: {
            parameterId: parameter.id,
            valueText: isText && valueText !== undefined ? valueText : null,
            valueNumber: isNumber && valueNumber !== undefined ? new Decimal(valueNumber) : null,
            valueBoolean: isBoolean && valueBoolean !== undefined ? valueBoolean : null,
            valueRating: isRating && valueRating !== undefined ? Math.round(Math.max(0, Math.min(parseFloat(String(valueRating)), 5)) * 10) : null,
            notes: notes || "Atualização via admin",
          },
        });
      }
    } else {
      // Create new parameter
      console.log("POST: Creating new parameter:", {
        name,
        type,
        isRating,
        valueRating: paramData.valueRating,
        paramData,
      });
      
      parameter = await prisma.parameter.create({
        data: {
          betId,
          name,
          ...paramData,
        },
      });
      
      console.log("POST: Parameter created:", {
        id: parameter.id,
        name: parameter.name,
        type: parameter.type,
        valueRating: parameter.valueRating,
      });

      // Create initial history entry
      await prisma.parameterHistory.create({
        data: {
          parameterId: parameter.id,
          valueText: isText && valueText !== undefined ? valueText : null,
          valueNumber: isNumber && valueNumber !== undefined ? new Decimal(valueNumber) : null,
          valueBoolean: isBoolean && valueBoolean !== undefined ? valueBoolean : null,
          valueRating: isRating && valueRating !== undefined ? Math.min(5, Math.max(0, parseFloat(String(valueRating)))) : null,
          notes: notes || "Valor inicial",
        },
      });
    }

    return NextResponse.json(
      { success: true, parameter },
      { status: existingParameter ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error creating/updating parameter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create/update parameter" },
      { status: 500 }
    );
  }
}

// GET /api/parameters?betId=xxx - Get parameters for a bet
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const betId = searchParams.get("betId");
    const category = searchParams.get("category");

    const where: {
      betId?: string;
      category?: string;
    } = {};

    if (betId) {
      where.betId = betId;
    }

    if (category) {
      where.category = category;
    }

    const parameters = await prisma.parameter.findMany({
      where,
      include: {
        bet: {
          select: {
            id: true,
            name: true,
          },
        },
        history: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, parameters });
  } catch (error) {
    console.error("Error fetching parameters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch parameters" },
      { status: 500 }
    );
  }
}
