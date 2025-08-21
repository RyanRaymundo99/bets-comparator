import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
  try {
    // For dev mode, get user ID from query params or use a dev user
    const { amount, userId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // For now, let's find any dev user to create deposits
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
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    // Get user email for MercadoPago
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create deposit record
    const deposit = await prisma.deposit.create({
      data: {
        userId: targetUserId,
        amount: new Decimal(amount),
        currency: "BRL",
        paymentMethod: "mercadopago",
        status: "PENDING",
      },
    });

    // Create Mercado Pago payment
    const payment = await mercadoPagoService.createPayment({
      amount,
      description: `Deposit ${amount} BRL`,
      externalReference: deposit.id,
      payerEmail: user.email,
    });

    // Update deposit with external ID
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { externalId: payment.id.toString() },
    });

    return NextResponse.json({
      depositId: deposit.id,
      paymentId: payment.id,
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64:
        payment.point_of_interaction?.transaction_data?.qr_code_base64,
    });
  } catch (error) {
    console.error("Deposit creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // For dev mode, get user ID from query params or use a dev user
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // For now, let's find any dev user to show deposits
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
      return NextResponse.json({ deposits: [] });
    }

    const deposits = await prisma.deposit.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Convert Decimal to number for frontend compatibility
    const formattedDeposits = deposits.map((deposit) => ({
      ...deposit,
      amount: Number(deposit.amount),
    }));

    return NextResponse.json({ deposits: formattedDeposits });
  } catch (error) {
    console.error("Deposits fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
