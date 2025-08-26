import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    const { amount, paymentMethod, bankAccount } = await request.json();

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

    // Check if user has sufficient balance
    const userBalance = await prisma.balance.findFirst({
      where: {
        userId: session.user.id,
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
        userId: session.user.id,
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
        userId: session.user.id,
        type: "WITHDRAWAL",
        amount: -amount, // Negative for withdrawals
        currency: "BRL",
        balance: Number(userBalance.amount), // Current balance after withdrawal
        description: `Withdrawal via ${paymentMethod}`,
        metadata: { withdrawalId: withdrawal.id },
      },
    });

    // Update user balance (lock the amount)
    await prisma.balance.update({
      where: { id: userBalance.id },
      data: {
        amount: Number(userBalance.amount) - amount,
        locked: Number(userBalance.locked) + amount,
      },
    });

    // Link withdrawal to transaction
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: { transactionId: transaction.id },
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      withdrawal: {
        id: withdrawal.id,
        amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
