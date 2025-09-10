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

    // Get recent trades from Binance
    const recentTrades = await binanceService.getRecentTrades(symbol, 20);

    // Format the data for the frontend
    const formattedTrades = recentTrades.map((trade) => ({
      id: trade.id,
      price: trade.price,
      qty: trade.qty,
      quoteQty: trade.quoteQty,
      time: trade.time,
      isBuyerMaker: trade.isBuyerMaker,
      isBestMatch: trade.isBestMatch,
    }));

    return NextResponse.json({
      success: true,
      data: formattedTrades,
      symbol,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Recent trades API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch recent trades",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
