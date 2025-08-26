import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ledgerService } from "@/lib/ledger";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be called by admin users or webhook systems
    // For now, we'll add basic validation

    const { depositId, action } = await request.json();

    if (!depositId || !action) {
      return NextResponse.json(
        { error: "Deposit ID and action are required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the deposit
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: { user: true },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    if (deposit.status !== "PENDING") {
      return NextResponse.json(
        { error: "Deposit is not pending" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Update deposit status
      await prisma.deposit.update({
        where: { id: depositId },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update user balance
      await ledgerService.updateBalance(
        deposit.userId,
        "BRL",
        new Decimal(deposit.amount),
        "ADD"
      );

      // Create transaction record
      await ledgerService.createTransaction({
        userId: deposit.userId,
        type: "DEPOSIT",
        amount: new Decimal(deposit.amount),
        currency: "BRL",
        description: `Deposit via ${deposit.paymentMethod}`,
        metadata: { depositId: deposit.id },
      });

      return NextResponse.json({
        success: true,
        message: "Deposit approved and balance updated",
        deposit: {
          id: deposit.id,
          status: "CONFIRMED",
          amount: deposit.amount,
        },
      });
    } else {
      // Reject deposit
      await prisma.deposit.update({
        where: { id: depositId },
        data: {
          status: "REJECTED",
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Deposit rejected",
        deposit: {
          id: deposit.id,
          status: "REJECTED",
        },
      });
    }
  } catch (error) {
    console.error("Deposit processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
