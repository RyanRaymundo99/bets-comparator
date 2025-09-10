import { NextRequest, NextResponse } from "next/server";
import { binanceService } from "@/lib/binance";
import { ledgerService } from "@/lib/ledger";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get("better-auth.session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: "No session cookie found" },
        { status: 401 }
      );
    }

    // Find the session in the database
    const session = await prisma.session.findUnique({
      where: { token: sessionCookie.value },
      include: { user: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const { brlAmount } = await request.json();

    if (!brlAmount || brlAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid BRL amount" },
        { status: 400 }
      );
    }

    // Check user's BRL balance
    const brlBalance = await ledgerService.getUserBalance(
      session.user.id,
      "BRL"
    );
    if (brlBalance.amount.lessThan(brlAmount)) {
      return NextResponse.json(
        { error: "Insufficient BRL balance" },
        { status: 400 }
      );
    }

    // Get USDT/BRL price from Binance
    // Note: Binance doesn't have USDT/BRL pair directly, so we'll use USDT/BUSD and convert
    let usdtPrice;
    try {
      // Try to get USDT price in USD first
      const usdtUsdPrice = await binanceService.getPrice("USDTUSDC");
      // For now, we'll use a fixed rate or get from another source
      // In a real implementation, you'd integrate with a Brazilian exchange or use a different method
      usdtPrice = 5.0; // Approximate BRL/USD rate - in production, get this from a real source
    } catch (error) {
      // Fallback to a reasonable rate
      usdtPrice = 5.0;
    }

    const usdtAmount = brlAmount / usdtPrice;

    // Create order record
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        type: "BUY",
        baseCurrency: "USDT",
        quoteCurrency: "BRL",
        amount: new Decimal(usdtAmount),
        price: new Decimal(usdtPrice),
        total: new Decimal(brlAmount),
        status: "PENDING",
      },
    });

    try {
      // In a real implementation, you would:
      // 1. Execute the trade on Binance or a Brazilian exchange
      // 2. Handle the actual conversion
      // 3. Update the order status based on the result

      // For now, we'll simulate a successful trade
      // In production, replace this with actual exchange integration

      // Update order status to completed
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "COMPLETED",
          externalOrderId: `sim_${Date.now()}`,
          executedAt: new Date(),
        },
      });

      // Update balances
      await ledgerService.updateBalance(
        session.user.id,
        "BRL",
        new Decimal(brlAmount),
        "SUBTRACT"
      );

      await ledgerService.updateBalance(
        session.user.id,
        "USDT",
        new Decimal(usdtAmount),
        "ADD"
      );

      // Create transaction records
      await ledgerService.createTransaction({
        userId: session.user.id,
        type: "BUY_CRYPTO",
        amount: new Decimal(brlAmount),
        currency: "BRL",
        description: `Bought ${usdtAmount.toFixed(2)} USDT`,
        metadata: {
          orderId: order.id,
          usdtAmount,
          usdtPrice,
        },
      });

      await ledgerService.createTransaction({
        userId: session.user.id,
        type: "BUY_CRYPTO",
        amount: new Decimal(usdtAmount),
        currency: "USDT",
        description: `Received ${usdtAmount.toFixed(2)} USDT`,
        metadata: {
          orderId: order.id,
          brlAmount,
          usdtPrice,
        },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        brlAmount,
        usdtAmount: parseFloat(usdtAmount.toFixed(2)),
        usdtPrice,
        message: "USDT purchase executed successfully",
      });
    } catch (error) {
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });

      throw error;
    }
  } catch (error) {
    console.error("USDT buy error:", error);
    return NextResponse.json(
      {
        error: "Failed to execute USDT purchase",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
