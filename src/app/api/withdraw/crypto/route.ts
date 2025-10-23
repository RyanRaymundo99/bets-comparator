import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get("better-auth.session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const user = session.user;

    // Parse request body
    const { amount, walletAddress, network } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (!walletAddress || !network) {
      return NextResponse.json(
        { error: "Wallet address and network are required" },
        { status: 400 }
      );
    }

    // Validate network
    const validNetworks = ["TRC20", "ERC20", "BSC"];
    if (!validNetworks.includes(network)) {
      return NextResponse.json(
        { error: "Invalid network. Must be TRC20, ERC20, or BSC" },
        { status: 400 }
      );
    }

    // Check USDT balance
    const usdtBalance = await prisma.balance.findFirst({
      where: {
        userId: user.id,
        currency: "USDT",
      },
    });

    if (!usdtBalance || usdtBalance.amount < amount) {
      return NextResponse.json(
        { error: "Insufficient USDT balance" },
        { status: 400 }
      );
    }

    // Calculate fee (1 USDT fixed)
    const fee = 1;
    const netAmount = amount - fee;

    if (netAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 1 USDT to cover network fee" },
        { status: 400 }
      );
    }

    // Generate transaction hash (simulated)
    const hash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`;

    // Create withdrawal record
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.id,
        type: "USDT",
        amount: amount,
        fee: fee,
        netAmount: netAmount,
        status: "PENDING",
        paymentMethod: "USDT",
        walletAddress: walletAddress,
        network: network,
        hash: hash,
        createdAt: new Date(),
      },
    });

    // Update user balance (subtract the amount)
    await prisma.balance.update({
      where: {
        id: usdtBalance.id,
      },
      data: {
        amount: Number(usdtBalance.amount) - amount,
        updatedAt: new Date(),
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "WITHDRAWAL",
        amount: amount,
        currency: "USDT",
        balance: Number(usdtBalance.amount) - amount,
        description: `USDT withdrawal to ${walletAddress} (${network})`,
        createdAt: new Date(),
      },
    });

    // TODO: In a real implementation, you would:
    // 1. Send the transaction to the blockchain
    // 2. Monitor the transaction status
    // 3. Update the withdrawal status based on confirmations
    // 4. Handle failed transactions and refunds

    return NextResponse.json({
      success: true,
      message: "USDT withdrawal request created successfully",
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        netAmount: withdrawal.netAmount,
        fee: withdrawal.fee,
        hash: withdrawal.hash,
        network: withdrawal.network,
        walletAddress: withdrawal.walletAddress,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    });
  } catch (error) {
    console.error("USDT withdrawal error:", error);
    return NextResponse.json(
      { error: "Failed to process USDT withdrawal" },
      { status: 500 }
    );
  }
}
