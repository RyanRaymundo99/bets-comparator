import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import { ledgerService } from "@/lib/ledger";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const data = JSON.parse(body);

    if (data.type === "payment" && data.data?.id) {
      const payment = await mercadoPagoService.getPayment(data.data.id);

      if (payment.status === "approved") {
        const deposit = await prisma.deposit.findFirst({
          where: { externalId: payment.id.toString() },
        });

        if (deposit && deposit.status === "PENDING") {
          // Update deposit status
          await prisma.deposit.update({
            where: { id: deposit.id },
            data: {
              status: "CONFIRMED",
              confirmedAt: new Date(),
            },
          });

          // Credit user balance
          await ledgerService.updateBalance(
            deposit.userId,
            "BRL",
            deposit.amount,
            "ADD"
          );

          // Create transaction record
          await ledgerService.createTransaction({
            userId: deposit.userId,
            type: "DEPOSIT",
            amount: deposit.amount,
            currency: "BRL",
            description: `Deposit via Mercado Pago - ${payment.id}`,
            metadata: { paymentId: payment.id, depositId: deposit.id },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
