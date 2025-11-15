import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
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

    const paramDef = getParameterDefinition(existingParameter.name);
    if (!paramDef) {
      return NextResponse.json(
        { success: false, error: `Parameter definition for '${existingParameter.name}' not found` },
        { status: 400 }
      );
    }

    const dataToUpdate: Record<string, unknown> = {};
    const historyValue: Record<string, unknown> = {};

    switch (paramDef.type) {
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
        dataToUpdate.valueRating = parseInt(value, 10);
        historyValue.valueRating = parseInt(value, 10);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unsupported parameter type: ${paramDef.type}` },
          { status: 400 }
        );
    }

    // Update parameter
    const parameter = await prisma.parameter.update({
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

