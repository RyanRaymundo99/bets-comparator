import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, paymentMethod, bankAccount } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount is required and must be greater than 0" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      );
    }

    // For development, use a mock user ID (in production, get from session)
    const userId = "dev-user-id";

    // Check if user has sufficient balance
    const userBalance = await prisma.balance.findFirst({
      where: {
        userId,
        currency: "BRL",
      },
    });

    if (!userBalance || userBalance.amount < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create withdrawal record
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        currency: "BRL",
        status: "PENDING",
        paymentMethod,
        bankAccount: bankAccount ? JSON.stringify(bankAccount) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: "WITHDRAWAL",
        amount: -amount, // Negative for withdrawals
        currency: "BRL",
        balance: userBalance.amount, // Current balance after withdrawal
        description: `Withdrawal via ${paymentMethod}`,
        metadata: { withdrawalId: withdrawal.id },
      },
    });

    // Update user balance (lock the amount)
    await prisma.balance.update({
      where: {
        id: userBalance.id,
      },
      data: {
        locked: userBalance.locked + amount,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        paymentMethod: withdrawal.paymentMethod,
        createdAt: withdrawal.createdAt,
      },
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
      },
    });
  } catch (error) {
    console.error("Withdrawal creation error:", error);
    return NextResponse.json(
      { error: "Failed to create withdrawal" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // For development, use a mock user ID (in production, get from session)
    const userId = "dev-user-id";

    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to last 50 withdrawals
    });

    // Convert Decimal to Number for frontend
    const formattedWithdrawals = withdrawals.map((withdrawal) => ({
      ...withdrawal,
      amount: Number(withdrawal.amount),
      createdAt: withdrawal.createdAt.toISOString(),
      updatedAt: withdrawal.updatedAt.toISOString(),
      processedAt: withdrawal.processedAt?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      withdrawals: formattedWithdrawals,
    });
  } catch (error) {
    console.error("Failed to fetch withdrawals:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}
