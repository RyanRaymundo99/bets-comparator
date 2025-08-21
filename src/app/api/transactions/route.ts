import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // For dev mode, get user ID from query params or use a dev user
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const currency = searchParams.get("currency");

    // For now, let's find any dev user to show data
    let targetUserId = userId;
    if (!targetUserId) {
      const devUser = await prisma.user.findFirst({
        where: {
          email: { startsWith: "dev" },
          approvalStatus: "APPROVED",
        },
        orderBy: { createdAt: "desc" },
      });
      targetUserId = devUser?.id;
    }

    if (!targetUserId) {
      return NextResponse.json({
        transactions: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
      });
    }

    const where: any = { userId: targetUserId };

    if (type) {
      where.type = type;
    }

    if (currency) {
      where.currency = currency;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.transaction.count({ where });

    // Convert Decimal amounts to numbers for frontend compatibility
    const formattedTransactions = transactions.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Transactions fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
