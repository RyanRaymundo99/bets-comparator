import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { ledgerService } from "@/lib/ledger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuth().api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tradeId = (await params).id;

    // Get the trade
    const trade = await prisma.p2PTrade.findUnique({
      where: { id: tradeId },
      include: { offer: true },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Only seller can release crypto
    if (trade.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only seller can release crypto" },
        { status: 403 }
      );
    }

    if (trade.status !== "PAYMENT_SENT") {
      return NextResponse.json(
        { error: "Payment must be confirmed first" },
        { status: 400 }
      );
    }

    // Update trade status
    await prisma.p2PTrade.update({
      where: { id: tradeId },
      data: {
        status: "CRYPTO_RELEASED",
        cryptoReleased: true,
      },
    });

    // Transfer funds
    // Unlock and transfer buyer's BRL to seller
    await ledgerService.updateBalance(
      trade.buyerId,
      "BRL",
      trade.fiatAmount,
      "UNLOCK"
    );

    await ledgerService.updateBalance(
      trade.sellerId,
      "BRL",
      trade.fiatAmount,
      "ADD"
    );

    // Unlock and transfer seller's crypto to buyer
    await ledgerService.updateBalance(
      trade.sellerId,
      trade.offer.cryptoCurrency,
      trade.cryptoAmount,
      "UNLOCK"
    );

    await ledgerService.updateBalance(
      trade.buyerId,
      trade.offer.cryptoCurrency,
      trade.cryptoAmount,
      "ADD"
    );

    // Create transaction records
    await ledgerService.createTransaction({
      userId: trade.buyerId,
      type: "P2P_TRADE",
      amount: trade.fiatAmount,
      currency: "BRL",
      description: `P2P trade payment - ${trade.offer.cryptoCurrency}`,
      metadata: { tradeId: trade.id, type: "payment" },
    });

    await ledgerService.createTransaction({
      userId: trade.sellerId,
      type: "P2P_TRADE",
      amount: trade.fiatAmount,
      currency: "BRL",
      description: `P2P trade received - ${trade.offer.cryptoCurrency}`,
      metadata: { tradeId: trade.id, type: "received" },
    });

    await ledgerService.createTransaction({
      userId: trade.buyerId,
      type: "P2P_TRADE",
      amount: trade.cryptoAmount,
      currency: trade.offer.cryptoCurrency,
      description: `P2P trade received - ${trade.offer.cryptoCurrency}`,
      metadata: { tradeId: trade.id, type: "received" },
    });

    await ledgerService.createTransaction({
      userId: trade.sellerId,
      type: "P2P_TRADE",
      amount: trade.cryptoAmount,
      currency: trade.offer.cryptoCurrency,
      description: `P2P trade sent - ${trade.offer.cryptoCurrency}`,
      metadata: { tradeId: trade.id, type: "sent" },
    });

    // Finalize trade
    await prisma.p2PTrade.update({
      where: { id: tradeId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Crypto release error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
