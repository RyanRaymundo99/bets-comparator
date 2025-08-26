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

    const { amount, cryptoCurrency } = await request.json();

    if (!amount || amount <= 0 || !cryptoCurrency) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    // Get current price
    const symbol = `${cryptoCurrency}BRL`;
    const price = await binanceService.getPrice(symbol);
    const total = amount * price;

    // Check user balance
    const balance = await ledgerService.getUserBalance(session.user.id, "BRL");
    if (balance.amount.lessThan(total)) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        type: "BUY",
        baseCurrency: cryptoCurrency,
        quoteCurrency: "BRL",
        amount: new Decimal(amount),
        price: new Decimal(price),
        total: new Decimal(total),
        status: "PENDING",
      },
    });

    try {
      // Execute real order on Binance
      const binanceOrder = await binanceService.createOrder({
        symbol: `${cryptoCurrency}BRL`,
        side: "BUY",
        type: "MARKET",
        quantity: amount,
      });

      // Update order status to completed
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "COMPLETED",
          externalOrderId: binanceOrder.orderId.toString(),
          executedAt: new Date(),
        },
      });

      // Update balances
      await ledgerService.updateBalance(
        session.user.id,
        "BRL",
        new Decimal(total),
        "SUBTRACT"
      );

      await ledgerService.updateBalance(
        session.user.id,
        cryptoCurrency,
        new Decimal(amount),
        "ADD"
      );

      // Create transaction records
      await ledgerService.createTransaction({
        userId: session.user.id,
        type: "BUY_CRYPTO",
        amount: new Decimal(total),
        currency: "BRL",
        description: `Bought ${amount} ${cryptoCurrency}`,
        metadata: {
          orderId: order.id,
          binanceOrderId: binanceOrder.orderId,
        },
      });

      await ledgerService.createTransaction({
        userId: session.user.id,
        type: "BUY_CRYPTO",
        amount: new Decimal(amount),
        currency: cryptoCurrency,
        description: `Received ${amount} ${cryptoCurrency}`,
        metadata: {
          orderId: order.id,
          binanceOrderId: binanceOrder.orderId,
        },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        binanceOrderId: binanceOrder.orderId,
        amount,
        price,
        total,
        message: "Crypto purchase executed successfully",
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
    console.error("Crypto buy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
