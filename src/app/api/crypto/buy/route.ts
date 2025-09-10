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

    const {
      amount,
      cryptoCurrency,
      quoteCurrency = "USDT",
    } = await request.json();

    if (!amount || amount <= 0 || !cryptoCurrency) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    // Validate the trading pair
    const symbol = `${cryptoCurrency}${quoteCurrency}`;

    // Check if the pair is supported
    let price: number;
    try {
      price = await binanceService.getPrice(symbol);
    } catch (error) {
      console.error(`Price fetch error for ${symbol}:`, error);
      return NextResponse.json(
        {
          error: `Trading pair ${symbol} is not supported or price fetch failed`,
        },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: `Invalid price received for ${symbol}: ${price}` },
        { status: 400 }
      );
    }

    const total = amount * price;

    // Check user balance for the quote currency
    const balance = await ledgerService.getUserBalance(
      session.user.id,
      quoteCurrency
    );

    if (balance.amount.lessThan(total)) {
      return NextResponse.json(
        {
          error: `Insufficient ${quoteCurrency} balance. Required: ${total.toFixed(
            2
          )}, Available: ${balance.amount.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Format quantity for Binance (minimum 6 decimal places for most pairs)
    const formattedQuantity = parseFloat(amount.toFixed(6));

    // Validate minimum quantity
    if (formattedQuantity < 0.000001) {
      return NextResponse.json(
        { error: `Minimum quantity for ${symbol} is 0.000001` },
        { status: 400 }
      );
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        type: "BUY",
        baseCurrency: cryptoCurrency,
        quoteCurrency: quoteCurrency,
        amount: new Decimal(formattedQuantity),
        price: new Decimal(price),
        total: new Decimal(total),
        status: "PENDING",
      },
    });

    try {
      // Execute real order on Binance
      const binanceOrder = await binanceService.createOrder({
        symbol: symbol,
        side: "BUY",
        type: "MARKET",
        quantity: formattedQuantity,
      });

      // Update order status to completed
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "COMPLETED",
          externalOrderId: binanceOrder.orderId?.toString() || "unknown",
          executedAt: new Date(),
        },
      });

      // Update balances
      await ledgerService.updateBalance(
        session.user.id,
        quoteCurrency,
        new Decimal(total),
        "SUBTRACT"
      );

      await ledgerService.updateBalance(
        session.user.id,
        cryptoCurrency,
        new Decimal(formattedQuantity),
        "ADD"
      );

      // Create transaction records
      await ledgerService.createTransaction({
        userId: session.user.id,
        type: "BUY_CRYPTO",
        amount: new Decimal(total),
        currency: quoteCurrency,
        description: `Bought ${formattedQuantity} ${cryptoCurrency}`,
        metadata: {
          orderId: order.id,
          binanceOrderId: binanceOrder.orderId,
          symbol,
          price,
        },
      });

      await ledgerService.createTransaction({
        userId: session.user.id,
        type: "BUY_CRYPTO",
        amount: new Decimal(formattedQuantity),
        currency: cryptoCurrency,
        description: `Received ${formattedQuantity} ${cryptoCurrency}`,
        metadata: {
          orderId: order.id,
          binanceOrderId: binanceOrder.orderId,
          symbol,
          price,
        },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        binanceOrderId: binanceOrder.orderId,
        amount: formattedQuantity,
        price,
        total,
        symbol,
        message: `${cryptoCurrency} purchase executed successfully`,
      });
    } catch (error) {
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });

      console.error("Binance order execution error:", error);

      // Return more specific error information
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        {
          error: "Failed to execute order on Binance",
          details: errorMessage,
          symbol,
          quantity: formattedQuantity,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Crypto buy error:", error);
    return NextResponse.json(
      {
        error: "Failed to execute crypto purchase",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
