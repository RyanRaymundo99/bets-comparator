import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
    const { name, category, value, unit, description, notes } = body;

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

    // Update parameter
    const parameter = await prisma.parameter.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category !== undefined && { category }),
        ...(value !== undefined && { value: new Prisma.Decimal(value) }),
        ...(unit !== undefined && { unit }),
        ...(description !== undefined && { description }),
      },
      include: {
        bet: true,
        history: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    // Create history entry if value changed
    if (value !== undefined && existingParameter.value.toString() !== value.toString()) {
      await prisma.parameterHistory.create({
        data: {
          parameterId: parameter.id,
          value: new Prisma.Decimal(value),
          notes: notes || `Updated from ${existingParameter.value} to ${value}`,
        },
      });
    }

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

