import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/comparisons - Get user's saved comparisons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const comparisons = await prisma.comparison.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, comparisons });
  } catch (error) {
    console.error("Error fetching comparisons:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comparisons" },
      { status: 500 }
    );
  }
}

// POST /api/comparisons - Save a comparison
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, selectedBets, filters, insights } = body;

    if (!userId || !selectedBets || selectedBets.length === 0) {
      return NextResponse.json(
        { success: false, error: "userId and selectedBets are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const comparison = await prisma.comparison.create({
      data: {
        userId,
        name,
        selectedBets,
        filters: filters || {},
        insights,
      },
    });

    return NextResponse.json({ success: true, comparison }, { status: 201 });
  } catch (error) {
    console.error("Error creating comparison:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comparison" },
      { status: 500 }
    );
  }
}

