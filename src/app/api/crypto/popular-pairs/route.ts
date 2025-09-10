import { NextRequest, NextResponse } from "next/server";
import { binanceService } from "@/lib/binance";

export async function GET(request: NextRequest) {
  try {
    // Get popular trading pairs
    const popularPairs = await binanceService.getPopularPairs();

    // Get real-time prices for all popular pairs
    const pricesPromises = popularPairs.map(async (symbol) => {
      try {
        const price = await binanceService.getPrice(symbol);
        const ticker = await binanceService.get24hrTicker(symbol);

        return {
          symbol,
          price: parseFloat(ticker.lastPrice),
          priceChange: parseFloat(ticker.priceChange),
          priceChangePercent: parseFloat(ticker.priceChangePercent),
          volume: parseFloat(ticker.volume),
          high24h: parseFloat(ticker.highPrice),
          low24h: parseFloat(ticker.lowPrice),
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return null;
      }
    });

    const prices = (await Promise.all(pricesPromises)).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Popular pairs API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch popular pairs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
