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
      type,
      options: options || [],
      valueText: valueText !== undefined ? valueText : null,
      valueNumber: valueNumber !== undefined ? new Decimal(valueNumber) : null,
      valueBoolean: valueBoolean !== undefined ? valueBoolean : null,
      valueRating: valueRating !== undefined ? Math.min(5, Math.max(0, parseInt(valueRating.toString()))) : null,
    };

    if (existingParameter) {
      // Update existing parameter
      parameter = await prisma.parameter.update({
        where: { id: existingParameter.id },
        data: paramData,
      });

      // Create history entry if value changed
      const hasChanged =
        existingParameter.valueText !== valueText ||
        existingParameter.valueNumber?.toString() !== valueNumber?.toString() ||
        existingParameter.valueBoolean !== valueBoolean ||
        existingParameter.valueRating !== valueRating;

      if (hasChanged) {
        await prisma.parameterHistory.create({
          data: {
            parameterId: parameter.id,
            valueText: valueText || null,
            valueNumber: valueNumber !== undefined ? new Decimal(valueNumber) : null,
            valueBoolean: valueBoolean || null,
            valueRating: valueRating !== undefined ? Math.min(5, Math.max(0, parseInt(valueRating.toString()))) : null,
            notes: notes || "Atualização via admin",
          },
        });
      }
    } else {
      // Create new parameter
      parameter = await prisma.parameter.create({
        data: {
          betId,
          name,
          ...paramData,
        },
      });

      // Create initial history entry
      await prisma.parameterHistory.create({
        data: {
          parameterId: parameter.id,
          valueText: valueText || null,
          valueNumber: valueNumber !== undefined ? new Decimal(valueNumber) : null,
          valueBoolean: valueBoolean || null,
          valueRating: valueRating !== undefined ? Math.min(5, Math.max(0, parseInt(valueRating.toString()))) : null,
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
