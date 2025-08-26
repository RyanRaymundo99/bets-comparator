import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mercadoPagoService } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("=== MERCADO PAGO WEBHOOK RECEIVED ===");
    console.log("Webhook body:", JSON.stringify(body, null, 2));
    console.log("Webhook timestamp:", new Date().toISOString());

    // Verify webhook signature (implement proper verification in production)
    if (!mercadoPagoService.verifyWebhookSignature()) {
      console.warn("Webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { type, data } = body;
    console.log("Webhook type:", type);
    console.log("Webhook data:", data);

    // Handle payment notifications
    if (type === "payment") {
      const paymentId = data.id;
      console.log("Processing payment notification for ID:", paymentId);

      try {
        // Get payment details from Mercado Pago
        const payment = await mercadoPagoService.getPayment(
          paymentId.toString()
        );
        console.log("Payment details from Mercado Pago:", JSON.stringify(payment, null, 2));

        const { status, external_reference, transaction_amount } = payment;
        console.log("Payment status:", status);
        console.log("External reference:", external_reference);
        console.log("Transaction amount:", transaction_amount);

        // Find the corresponding deposit
        if (external_reference && external_reference.startsWith("deposit_")) {
          const depositId = external_reference.split("_")[1];

          // Update deposit status based on payment status
          let depositStatus = "PENDING";
          let updatedAt = new Date();

          switch (status) {
            case "approved":
              depositStatus = "CONFIRMED";
              break;
            case "rejected":
            case "cancelled":
              depositStatus = "REJECTED";
              break;
            case "pending":
              depositStatus = "PENDING";
              break;
            case "in_process":
              depositStatus = "PENDING";
              break;
            default:
              depositStatus = "PENDING";
          }

          // Update the deposit record
          await prisma.deposit.update({
            where: { id: depositId },
            data: {
              status: depositStatus,
              updatedAt,
              // Add payment details
              paymentId: paymentId.toString(),
              paymentStatus: status,
              paymentAmount: transaction_amount,
            },
          });

          console.log(
            `Deposit ${depositId} updated to status: ${depositStatus}`
          );

          // If payment is approved, credit the user's balance
          if (status === "approved") {
            try {
              // Get user ID from deposit
              const deposit = await prisma.deposit.findUnique({
                where: { id: depositId },
                select: { userId: true, amount: true },
              });

              if (deposit) {
                // Update user balance
                await prisma.user.update({
                  where: { id: deposit.userId },
                  data: {
                    balance: {
                      increment: deposit.amount,
                    },
                  },
                });

                console.log(
                  `User ${deposit.userId} balance credited with R$ ${deposit.amount}`
                );
              }
            } catch (balanceError) {
              console.error("Error crediting user balance:", balanceError);
            }
          }
        }
      } catch (paymentError) {
        console.error("Error processing payment:", paymentError);
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
