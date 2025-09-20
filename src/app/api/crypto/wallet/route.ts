import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { binanceService } from "@/lib/binance";

export async function GET(request: NextRequest) {
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

    // Get all user balances
    const balances = await prisma.balance.findMany({
      where: { userId: session.user.id },
      orderBy: { amount: "desc" },
    });

    // Get popular crypto pairs for price conversion
    const popularPairs = await binanceService.getPopularPairs();

    // Calculate portfolio value in USDT
    let totalPortfolioValue = 0;
    const portfolioData = await Promise.all(
      balances.map(async (balance) => {
        if (balance.currency === "USDT" || balance.currency === "BRL") {
          // For fiat currencies, we'll convert BRL to USDT later
          const amount = parseFloat(balance.amount.toString());
          const locked = parseFloat(balance.locked.toString());

          if (balance.currency === "USDT") {
            totalPortfolioValue += amount;
            return {
              currency: balance.currency,
              amount,
              locked,
              usdtValue: amount,
              brlValue: 0,
            };
          } else {
            // BRL to USDT conversion (1 USDT = R$ 5.00)
            const usdtValue = amount / 5.0;
            totalPortfolioValue += usdtValue;
            return {
              currency: balance.currency,
              amount,
              locked,
              usdtValue,
              brlValue: amount,
            };
          }
        }

        try {
          // For crypto currencies, get USDT price
          const symbol = `${balance.currency}USDT`;
          if (popularPairs.includes(symbol)) {
            const price = await binanceService.getPrice(symbol);
            const usdtValue = parseFloat(balance.amount.toString()) * price;
            totalPortfolioValue += usdtValue;

            return {
              currency: balance.currency,
              amount: parseFloat(balance.amount.toString()),
              locked: parseFloat(balance.locked.toString()),
              usdtValue,
              usdtPrice: price,
            };
          } else {
            // If no direct USDT pair, try to get price through other means
            return {
              currency: balance.currency,
              amount: parseFloat(balance.amount.toString()),
              locked: parseFloat(balance.locked.toString()),
              usdtValue: 0,
              usdtPrice: 0,
            };
          }
        } catch (error) {
          console.error(`Error getting price for ${balance.currency}:`, error);
          return {
            currency: balance.currency,
            amount: parseFloat(balance.amount.toString()),
            locked: parseFloat(balance.locked.toString()),
            usdtValue: 0,
            usdtPrice: 0,
          };
        }
      })
    );

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        order: true,
        deposit: true,
        withdrawal: true,
      },
    });

    // Get open orders
    const openOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        balances: portfolioData,
        totalPortfolioValue,
        recentTransactions,
        openOrders,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Wallet API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch wallet data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
