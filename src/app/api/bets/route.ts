import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/bets - List all bets with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const search = searchParams.get("search");

    const where: any = {};
    
    if (region) {
      where.region = region;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { cnpj: { contains: search, mode: "insensitive" } },
      ];
    }

    const bets = await prisma.bet.findMany({
      where,
      include: {
        parameters: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, bets });
  } catch (error) {
    console.error("Error fetching bets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bets" },
      { status: 500 }
    );
  }
}

// POST /api/bets - Create a new bet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, cnpj, url, region, license } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    // Check if CNPJ already exists
    if (cnpj) {
      const existingBet = await prisma.bet.findUnique({
        where: { cnpj },
      });

      if (existingBet) {
        return NextResponse.json(
          { success: false, error: "A bet with this CNPJ already exists" },
          { status: 409 }
        );
      }
    }

    const bet = await prisma.bet.create({
      data: {
        name,
        cnpj,
        url,
        region,
        license,
      },
      include: {
        parameters: true,
      },
    });

    return NextResponse.json({ success: true, bet }, { status: 201 });
  } catch (error) {
    console.error("Error creating bet:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create bet" },
      { status: 500 }
    );
  }
}

