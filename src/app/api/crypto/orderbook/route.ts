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

    // Get order book from Binance
    const orderBook = await binanceService.getOrderBook(symbol, 20);

    // Format the data for the frontend
    const formattedOrderBook = {
      bids: orderBook.bids.map(([price, quantity]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
      asks: orderBook.asks.map(([price, quantity]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
    };

    return NextResponse.json({
      success: true,
      data: formattedOrderBook,
      symbol,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Order book API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch order book",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
