import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mercadoPagoService } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("=== MERCADO PAGO WEBHOOK RECEIVED ===");
    console.log("Webhook body:", JSON.stringify(body, null, 2));
    console.log("Webhook timestamp:", new Date().toISOString());

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      try {
        if (!mercadoPagoService.verifyWebhookSignature(request)) {
          console.warn("Webhook signature verification failed");
          return NextResponse.json(
            { error: "Invalid signature" },
            { status: 401 }
          );
        }
      } catch (verificationError) {
        console.error(
          "Webhook signature verification error:",
          verificationError
        );
        // Continue processing for now - remove this in production
        console.warn("Continuing without signature verification due to error");
      }
    } else {
      console.warn(
        "No webhook secret configured - skipping signature verification"
      );
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
        console.log(
          "Payment details from Mercado Pago:",
          JSON.stringify(payment, null, 2)
        );

        const {
          status,
          external_reference,
          transaction_amount,
          payment_method_id,
        } = payment;
        console.log("Payment status:", status);
        console.log("External reference:", external_reference);
        console.log("Transaction amount:", transaction_amount);
        console.log("Payment method:", payment_method_id);
        console.log("Payment ID:", paymentId);

        // Find the corresponding deposit
        if (external_reference && external_reference.startsWith("deposit_")) {
          const depositId = external_reference.split("_")[1];

          // Update deposit status based on payment status
          let depositStatus:
            | "PENDING"
            | "CONFIRMED"
            | "REJECTED"
            | "CANCELLED" = "PENDING";
          const updatedAt = new Date();

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
                // Check if user already has a balance record for this currency
                const existingBalance = await prisma.balance.findUnique({
                  where: {
                    userId_currency: {
                      userId: deposit.userId,
                      currency: "BRL",
                    },
                  },
                });

                if (existingBalance) {
                  // Update existing balance
                  await prisma.balance.update({
                    where: {
                      userId_currency: {
                        userId: deposit.userId,
                        currency: "BRL",
                      },
                    },
                    data: {
                      amount: {
                        increment: deposit.amount,
                      },
                      updatedAt: new Date(),
                    },
                  });
                } else {
                  // Create new balance record
                  await prisma.balance.create({
                    data: {
                      userId: deposit.userId,
                      currency: "BRL",
                      amount: deposit.amount,
                      locked: 0,
                    },
                  });
                }

                console.log(
                  `User ${deposit.userId} balance credited with R$ ${deposit.amount}`
                );

                // Create a transaction record for audit
                await prisma.transaction.create({
                  data: {
                    userId: deposit.userId,
                    type: "DEPOSIT",
                    amount: deposit.amount,
                    currency: "BRL",
                    balance: existingBalance
                      ? Number(existingBalance.amount) + Number(deposit.amount)
                      : Number(deposit.amount),
                    description: `Deposit via Mercado Pago - Payment ID: ${paymentId}`,
                    metadata: {
                      paymentId: paymentId.toString(),
                      depositId: depositId,
                      status: "completed",
                    },
                  },
                });

                console.log(
                  `Transaction record created for deposit ${depositId}`
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
