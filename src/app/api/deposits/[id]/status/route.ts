import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/session";
import { mercadoPagoService } from "@/lib/mercadopago";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate session
    const session = await validateSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const { id: depositId } = await params;

    // Check if force refresh is requested
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("force") === "true";

    console.log(
      `Status check requested for deposit ${depositId}, force refresh: ${forceRefresh}`
    );

    // Get the deposit
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      select: {
        id: true,
        userId: true,
        amount: true,
        currency: true,
        status: true,
        paymentId: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    // Check if user owns this deposit
    if (deposit.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If deposit has a payment ID, check with Mercado Pago regardless of current status
    if (deposit.paymentId) {
      try {
        console.log(
          `Checking payment status for deposit ${depositId}, payment ${deposit.paymentId}`
        );

        const payment = await mercadoPagoService.getPayment(deposit.paymentId);
        console.log("Payment status from Mercado Pago:", payment.status);
        console.log("Payment ID:", deposit.paymentId);
        console.log("Payment method:", payment.payment_method_id);
        console.log("Payment amount:", payment.transaction_amount);
        console.log("Payment description:", payment.description);
        console.log("Payment external reference:", payment.external_reference);
        console.log("Full payment response:", JSON.stringify(payment, null, 2));

        console.log(
          `Current deposit paymentStatus: "${deposit.paymentStatus}"`
        );
        console.log(`Mercado Pago payment status: "${payment.status}"`);
        console.log(
          `Status comparison: ${payment.status} !== ${
            deposit.paymentStatus
          } = ${payment.status !== deposit.paymentStatus}`
        );

        // Update deposit status if it has changed
        if (payment.status !== deposit.paymentStatus) {
          let newStatus: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED" =
            "PENDING";

          switch (payment.status) {
            case "approved":
              newStatus = "CONFIRMED";
              break;
            case "rejected":
            case "cancelled":
              newStatus = "REJECTED";
              break;
            case "pending":
              newStatus = "PENDING";
              break;
            case "in_process":
              newStatus = "PENDING";
              break;
            default:
              newStatus = "PENDING";
          }

          console.log(
            `Updating deposit ${depositId} with new status: ${newStatus} and payment status: ${payment.status}`
          );

          // Update the deposit
          await prisma.deposit.update({
            where: { id: depositId },
            data: {
              status: newStatus,
              paymentStatus: payment.status,
              updatedAt: new Date(),
            },
          });

          console.log(
            `Deposit ${depositId} updated to status: ${newStatus} and payment status: ${payment.status}`
          );

          // If payment is approved, credit the user's balance
          if (payment.status === "approved" && newStatus === "CONFIRMED") {
            try {
              // Check if user already has a balance record for this currency
              const existingBalance = await prisma.balance.findUnique({
                where: {
                  userId_currency: {
                    userId: deposit.userId,
                    currency: deposit.currency,
                  },
                },
              });

              if (existingBalance) {
                // Update existing balance
                await prisma.balance.update({
                  where: {
                    userId_currency: {
                      userId: deposit.userId,
                      currency: deposit.currency,
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
                    currency: deposit.currency,
                    amount: deposit.amount,
                    locked: 0,
                  },
                });
              }

              console.log(
                `User ${deposit.userId} balance credited with ${deposit.currency} ${deposit.amount}`
              );

              // Create a transaction record for audit
              await prisma.transaction.create({
                data: {
                  userId: deposit.userId,
                  type: "DEPOSIT",
                  amount: deposit.amount,
                  currency: deposit.currency,
                  balance: existingBalance
                    ? Number(existingBalance.amount) + Number(deposit.amount)
                    : Number(deposit.amount),
                  description: `Deposit via Mercado Pago - Payment ID: ${deposit.paymentId}`,
                  metadata: {
                    paymentId: deposit.paymentId,
                    depositId: depositId,
                    status: "completed",
                  },
                },
              });

              console.log(
                `Transaction record created for deposit ${depositId}`
              );
            } catch (balanceError) {
              console.error("Error crediting user balance:", balanceError);
            }
          }

          // Verify the update was successful
          const updatedDeposit = await prisma.deposit.findUnique({
            where: { id: depositId },
            select: { status: true, paymentStatus: true, updatedAt: true },
          });

          console.log(
            `Verification - Updated deposit in database:`,
            updatedDeposit
          );

          // Return updated deposit info
          return NextResponse.json({
            success: true,
            deposit: {
              id: depositId,
              status: newStatus,
              paymentStatus: payment.status,
              updatedAt: new Date(),
            },
            message: `Payment status updated to: ${payment.status}`,
          });
        } else {
          console.log(
            `No status update needed - payment status unchanged: ${payment.status}`
          );
        }
      } catch (error) {
        console.error("Error checking payment status:", error);

        // Log detailed error information
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }

        // Continue and return current deposit status
        console.log("Continuing with current deposit status due to error");
      }
    } else {
      console.log(`No payment ID found for deposit ${depositId}`);
    }

    // Return current deposit status with improved payment status handling
    const currentPaymentStatus = deposit.paymentStatus || "pending";
    const currentDepositStatus = deposit.status || "PENDING";

    console.log(
      `Returning deposit status: ${currentDepositStatus}, payment status: ${currentPaymentStatus}`
    );

    return NextResponse.json({
      success: true,
      deposit: {
        id: depositId,
        status: currentDepositStatus,
        paymentStatus: currentPaymentStatus,
        amount: deposit.amount,
        currency: deposit.currency,
        createdAt: deposit.createdAt,
        updatedAt: deposit.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error checking deposit status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
