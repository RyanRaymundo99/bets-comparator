import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { ledgerService } from "@/lib/ledger";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { offerId, cryptoAmount, fiatAmount } = await request.json();

    // Get the offer
    const offer = await prisma.p2POffer.findUnique({
      where: { id: offerId },
      include: { user: true },
    });

    if (!offer || offer.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Offer not found or inactive" },
        { status: 404 }
      );
    }

    if (offer.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot trade with yourself" },
        { status: 400 }
      );
    }

    // Validate amounts
    if (
      fiatAmount < offer.minTrade.toNumber() ||
      fiatAmount > offer.maxTrade.toNumber()
    ) {
      return NextResponse.json(
        { error: "Amount outside allowed range" },
        { status: 400 }
      );
    }

    // Check buyer has sufficient balance
    const buyerBalance = await ledgerService.getUserBalance(
      session.user.id,
      "BRL"
    );
    if (buyerBalance.amount.lessThan(fiatAmount)) {
      return NextResponse.json(
        { error: "Insufficient BRL balance" },
        { status: 400 }
      );
    }

    // Check seller has sufficient crypto balance
    const sellerBalance = await ledgerService.getUserBalance(
      offer.userId,
      offer.cryptoCurrency
    );
    if (sellerBalance.amount.lessThan(cryptoAmount)) {
      return NextResponse.json(
        { error: "Seller has insufficient crypto balance" },
        { status: 400 }
      );
    }

    // Create trade
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // 2 hours to complete

    const trade = await prisma.p2PTrade.create({
      data: {
        offerId,
        buyerId: session.user.id,
        sellerId: offer.userId,
        cryptoAmount: new Decimal(cryptoAmount),
        fiatAmount: new Decimal(fiatAmount),
        status: "PENDING",
        expiresAt,
      },
      include: {
        offer: true,
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
      },
    });

    // Lock buyer's BRL
    await ledgerService.updateBalance(
      session.user.id,
      "BRL",
      new Decimal(fiatAmount),
      "LOCK"
    );

    // Lock seller's crypto
    await ledgerService.updateBalance(
      offer.userId,
      offer.cryptoCurrency,
      new Decimal(cryptoAmount),
      "LOCK"
    );

    return NextResponse.json({ trade });
  } catch (error) {
    console.error("P2P trade creation error:", error);
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

    const trades = await prisma.p2PTrade.findMany({
      where: {
        OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
      },
      include: {
        offer: true,
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ trades });
  } catch (error) {
    console.error("P2P trades fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
