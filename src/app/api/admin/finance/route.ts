import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    // Check if user is admin (you might want to add an admin role check here)
    // For now, we'll assume any authenticated user can access admin data

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate total deposits (confirmed only)
    const totalDeposits = await prisma.deposit.aggregate({
      where: {
        status: "CONFIRMED",
        currency: "BRL",
      },
      _sum: {
        amount: true,
      },
    });

    const totalDepositsLastWeek = await prisma.deposit.aggregate({
      where: {
        status: "CONFIRMED",
        currency: "BRL",
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate total withdrawals (completed only)
    const totalWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        status: "COMPLETED",
        currency: "BRL",
      },
      _sum: {
        amount: true,
      },
    });

    const totalWithdrawalsLastWeek = await prisma.withdrawal.aggregate({
      where: {
        status: "COMPLETED",
        currency: "BRL",
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate total trade volume (P2P trades completed)
    const totalTrades = await prisma.p2PTrade.aggregate({
      where: {
        status: "COMPLETED",
      },
      _sum: {
        fiatAmount: true,
      },
    });

    const totalTradesLastWeek = await prisma.p2PTrade.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      _sum: {
        fiatAmount: true,
      },
    });

    // Calculate total commissions based on actual fees charged
    // 1. Commission from deposits (3% fee on confirmed deposits)
    const depositCommissions = await prisma.deposit.aggregate({
      where: {
        status: "CONFIRMED",
        currency: "BRL",
      },
      _sum: {
        fee: true,
      },
    });

    const depositCommissionsLastWeek = await prisma.deposit.aggregate({
      where: {
        status: "CONFIRMED",
        currency: "BRL",
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      _sum: {
        fee: true,
      },
    });

    // 2. Commission from P2P trades (3% fee on completed trades)
    // Calculate 3% of the fiat amount for each completed trade
    const completedTrades = await prisma.p2PTrade.findMany({
      where: {
        status: "COMPLETED",
      },
      select: {
        fiatAmount: true,
        createdAt: true,
      },
    });

    const tradeCommissions = completedTrades.reduce((sum, trade) => {
      return sum + Number(trade.fiatAmount) * 0.03; // 3% fee
    }, 0);

    const tradeCommissionsLastWeek = completedTrades
      .filter(trade => trade.createdAt >= oneWeekAgo)
      .reduce((sum, trade) => {
        return sum + Number(trade.fiatAmount) * 0.03; // 3% fee
      }, 0);

    // 3. Commission from crypto trades (3% fee on buy/sell operations)
    const cryptoTradeCommissions = await prisma.transaction.aggregate({
      where: {
        type: {
          in: ["BUY_CRYPTO", "SELL_CRYPTO"],
        },
        currency: "BRL",
      },
      _sum: {
        amount: true,
      },
    });

    const cryptoTradeCommissionsLastWeek = await prisma.transaction.aggregate({
      where: {
        type: {
          in: ["BUY_CRYPTO", "SELL_CRYPTO"],
        },
        currency: "BRL",
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate crypto trade fees (3% of the transaction amount)
    const cryptoFees = Number(cryptoTradeCommissions._sum.amount || 0) * 0.03;
    const cryptoFeesLastWeek = Number(cryptoTradeCommissionsLastWeek._sum.amount || 0) * 0.03;

    // Total commissions = deposit fees + trade fees + crypto fees
    const totalCommissions = 
      Number(depositCommissions._sum.fee || 0) + 
      tradeCommissions + 
      cryptoFees;

    const totalCommissionsLastWeek = 
      Number(depositCommissionsLastWeek._sum.fee || 0) + 
      tradeCommissionsLastWeek + 
      cryptoFeesLastWeek;

    // Calculate average user balance
    const averageBalance = await prisma.balance.aggregate({
      where: {
        currency: "BRL",
      },
      _avg: {
        amount: true,
      },
    });

    const averageBalanceLastWeek = await prisma.balance.aggregate({
      where: {
        currency: "BRL",
        updatedAt: {
          gte: oneWeekAgo,
        },
      },
      _avg: {
        amount: true,
      },
    });

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const depositsChange = calculatePercentageChange(
      Number(totalDeposits._sum.amount || 0),
      Number(totalDepositsLastWeek._sum.amount || 0)
    );

    const withdrawalsChange = calculatePercentageChange(
      Number(totalWithdrawals._sum.amount || 0),
      Number(totalWithdrawalsLastWeek._sum.amount || 0)
    );

    const tradesChange = calculatePercentageChange(
      Number(totalTrades._sum.fiatAmount || 0),
      Number(totalTradesLastWeek._sum.fiatAmount || 0)
    );

    const commissionsChange = calculatePercentageChange(
      totalCommissions,
      totalCommissionsLastWeek
    );

    const balanceChange = calculatePercentageChange(
      Number(averageBalance._avg.amount || 0),
      Number(averageBalanceLastWeek._avg.amount || 0)
    );

    // Get recent transactions for the table
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        deposit: {
          select: {
            status: true,
          },
        },
        withdrawal: {
          select: {
            status: true,
          },
        },
        buyerTrade: {
          select: {
            status: true,
          },
        },
        sellerTrade: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    // Format transactions for the frontend
    const formattedTransactions = recentTransactions.map((transaction) => {
      let status = "PENDING";
      let type = transaction.type;

      // Determine status based on related entity
      if (transaction.deposit) {
        status = transaction.deposit.status === "CONFIRMED" ? "APPROVED" : 
                 transaction.deposit.status === "REJECTED" ? "REJECTED" : "PENDING";
      } else if (transaction.withdrawal) {
        status = transaction.withdrawal.status === "COMPLETED" ? "APPROVED" : 
                 transaction.withdrawal.status === "FAILED" ? "REJECTED" : "PENDING";
      } else if (transaction.buyerTrade || transaction.sellerTrade) {
        const trade = transaction.buyerTrade || transaction.sellerTrade;
        status = trade?.status === "COMPLETED" ? "APPROVED" : 
                 trade?.status === "CANCELLED" ? "REJECTED" : "PENDING";
        type = "P2P_TRADE";
      }

      return {
        id: transaction.id,
        date: transaction.createdAt.toISOString(),
        type: type,
        user: transaction.user.name || transaction.user.email,
        value: Number(transaction.amount),
        status: status,
      };
    });

    // Get chart data for the last 30 days
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const dayDeposits = await prisma.deposit.aggregate({
        where: {
          status: "CONFIRMED",
          currency: "BRL",
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const dayWithdrawals = await prisma.withdrawal.aggregate({
        where: {
          status: "COMPLETED",
          currency: "BRL",
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const dayTrades = await prisma.p2PTrade.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: {
          fiatAmount: true,
        },
      });

      chartData.push({
        date: date.toISOString().split('T')[0],
        deposits: Number(dayDeposits._sum.amount || 0),
        withdrawals: Number(dayWithdrawals._sum.amount || 0),
        trades: Number(dayTrades._sum.fiatAmount || 0),
      });
    }

    const financeStats = {
      totalDeposits: Number(totalDeposits._sum.amount || 0),
      totalWithdrawals: Number(totalWithdrawals._sum.amount || 0),
      totalTrades: Number(totalTrades._sum.fiatAmount || 0),
      totalCommissions: totalCommissions,
      averageUserBalance: Number(averageBalance._avg.amount || 0),
      depositsChange: Number(depositsChange.toFixed(1)),
      withdrawalsChange: Number(withdrawalsChange.toFixed(1)),
      tradesChange: Number(tradesChange.toFixed(1)),
      commissionsChange: Number(commissionsChange.toFixed(1)),
      balanceChange: Number(balanceChange.toFixed(1)),
    };

    return NextResponse.json({
      success: true,
      financeStats,
      transactions: formattedTransactions,
      chartData,
    });
  } catch (error) {
    console.error("Finance data fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
