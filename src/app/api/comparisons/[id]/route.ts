import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/comparisons/[id] - Get a specific comparison
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const comparison = await prisma.comparison.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!comparison) {
      return NextResponse.json(
        { success: false, error: "Comparison not found" },
        { status: 404 }
      );
    }

    // Fetch the bets data
    const bets = await prisma.bet.findMany({
      where: {
        id: {
          in: comparison.selectedBets,
        },
      },
      include: {
        parameters: true,
      },
    });

    return NextResponse.json({
      success: true,
      comparison,
      bets,
    });
  } catch (error) {
    console.error("Error fetching comparison:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comparison" },
      { status: 500 }
    );
  }
}

// PATCH /api/comparisons/[id] - Update a comparison
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, selectedBets, filters, insights } = body;

    const existingComparison = await prisma.comparison.findUnique({
      where: { id },
    });

    if (!existingComparison) {
      return NextResponse.json(
        { success: false, error: "Comparison not found" },
        { status: 404 }
      );
    }

    const comparison = await prisma.comparison.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(selectedBets && { selectedBets }),
        ...(filters && { filters }),
        ...(insights !== undefined && { insights }),
      },
    });

    return NextResponse.json({ success: true, comparison });
  } catch (error) {
    console.error("Error updating comparison:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update comparison" },
      { status: 500 }
    );
  }
}

// DELETE /api/comparisons/[id] - Delete a comparison
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingComparison = await prisma.comparison.findUnique({
      where: { id },
    });

    if (!existingComparison) {
      return NextResponse.json(
        { success: false, error: "Comparison not found" },
        { status: 404 }
      );
    }

    await prisma.comparison.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Comparison deleted successfully" });
  } catch (error) {
    console.error("Error deleting comparison:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete comparison" },
      { status: 500 }
    );
  }
}

