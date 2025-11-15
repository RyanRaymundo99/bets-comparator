import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/bets/[id] - Get a specific bet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bet = await prisma.bet.findUnique({
      where: { id },
      include: {
        parameters: {
          include: {
            history: {
              orderBy: { createdAt: "desc" },
              take: 10, // Get last 10 history entries
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!bet) {
      return NextResponse.json(
        { success: false, error: "Bet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, bet });
  } catch (error) {
    console.error("Error fetching bet:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bet" },
      { status: 500 }
    );
  }
}

// PATCH /api/bets/[id] - Update a bet
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      company,
      domain,
      cnpj,
      url,
      region,
      license,
      status,
      scope,
      platformType,
    } = body;

    // Check if bet exists
    const existingBet = await prisma.bet.findUnique({
      where: { id },
    });

    if (!existingBet) {
      return NextResponse.json(
        { success: false, error: "Bet not found" },
        { status: 404 }
      );
    }

    // If updating domain, check for duplicates
    if (domain && domain !== existingBet.domain) {
      const duplicateBet = await prisma.bet.findFirst({
        where: {
          domain,
          id: { not: id },
        },
      });

      if (duplicateBet) {
        return NextResponse.json(
          { success: false, error: "A bet with this domain already exists" },
          { status: 409 }
        );
      }
    }

    const bet = await prisma.bet.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(company !== undefined && { company }),
        ...(domain !== undefined && { domain }),
        ...(cnpj !== undefined && { cnpj }),
        ...(url !== undefined && { url }),
        ...(region !== undefined && { region }),
        ...(license !== undefined && { license }),
        ...(status !== undefined && { status }),
        ...(scope !== undefined && { scope }),
        ...(platformType !== undefined && { platformType }),
      },
      include: {
        parameters: {
          orderBy: { name: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, bet });
  } catch (error) {
    console.error("Error updating bet:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update bet" },
      { status: 500 }
    );
  }
}

// DELETE /api/bets/[id] - Delete a bet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if bet exists
    const existingBet = await prisma.bet.findUnique({
      where: { id },
    });

    if (!existingBet) {
      return NextResponse.json(
        { success: false, error: "Bet not found" },
        { status: 404 }
      );
    }

    // Delete the bet (parameters and history will be cascade deleted)
    await prisma.bet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Bet deleted successfully" });
  } catch (error) {
    console.error("Error deleting bet:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete bet" },
      { status: 500 }
    );
  }
}

