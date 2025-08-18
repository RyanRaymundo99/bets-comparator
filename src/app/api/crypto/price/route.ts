import { NextRequest, NextResponse } from "next/server";
import { binanceService } from "@/lib/binance";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    const price = await binanceService.getPrice(symbol);

    return NextResponse.json({ price });
  } catch (error) {
    console.error("Price fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}
