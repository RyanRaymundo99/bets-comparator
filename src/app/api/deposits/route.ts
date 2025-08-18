import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { mercadoPagoService } from "@/lib/mercadopago";
import { ledgerService } from "@/lib/ledger";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Create deposit record
    const deposit = await prisma.deposit.create({
      data: {
        userId: session.user.id,
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
      payerEmail: session.user.email,
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
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deposits = await prisma.deposit.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ deposits });
  } catch (error) {
    console.error("Deposits fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
