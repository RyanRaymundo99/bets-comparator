import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { ledgerService } from "@/lib/ledger";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tradeId = params.id;
    const { paymentProof } = await request.json();

    // Get the trade
    const trade = await prisma.p2PTrade.findUnique({
      where: { id: tradeId },
      include: { offer: true },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Only buyer can confirm payment
    if (trade.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only buyer can confirm payment" },
        { status: 403 }
      );
    }

    if (trade.status !== "PENDING") {
      return NextResponse.json(
        { error: "Trade is not in pending status" },
        { status: 400 }
      );
    }

    // Update trade status
    await prisma.p2PTrade.update({
      where: { id: tradeId },
      data: {
        status: "PAYMENT_SENT",
        paymentProof,
        fiatConfirmed: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
