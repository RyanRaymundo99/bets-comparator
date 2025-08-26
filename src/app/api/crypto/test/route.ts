import { NextResponse } from "next/server";
import { binanceService } from "@/lib/binance";

export async function GET() {
  try {
    // Test basic connectivity with a simple price fetch
    const btcPrice = await binanceService.getPrice("BTCBRL");

    return NextResponse.json({
      success: true,
      message: "Binance API connection successful",
      testData: {
        btcPrice,
        timestamp: new Date().toISOString(),
        apiStatus: "connected",
      },
    });
  } catch (error) {
    console.error("Binance test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to Binance API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
