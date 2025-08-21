import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuth().api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      type,
      cryptoCurrency,
      fiatCurrency,
      cryptoAmount,
      fiatAmount,
      paymentMethods,
      minTrade,
      maxTrade,
      expiresInHours,
    } = await request.json();

    // Validate user has sufficient balance for sell offers
    if (type === "SELL") {
      const balance = await prisma.balance.findUnique({
        where: {
          userId_currency: {
            userId: session.user.id,
            currency: cryptoCurrency,
          },
        },
      });

      if (!balance || balance.amount.lessThan(cryptoAmount)) {
        return NextResponse.json(
          { error: "Insufficient crypto balance" },
          { status: 400 }
        );
      }
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (expiresInHours || 24));

    const offer = await prisma.p2POffer.create({
      data: {
        userId: session.user.id,
        type,
        cryptoCurrency,
        fiatCurrency,
        cryptoAmount: new Decimal(cryptoAmount),
        fiatAmount: new Decimal(fiatAmount),
        price: new Decimal(fiatAmount).div(cryptoAmount),
        paymentMethods,
        minTrade: new Decimal(minTrade),
        maxTrade: new Decimal(maxTrade),
        expiresAt,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ offer });
  } catch (error) {
    console.error("P2P offer creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cryptoCurrency = searchParams.get("cryptoCurrency");
    const type = searchParams.get("type");
    const status = searchParams.get("status") || "ACTIVE";

    const where: any = { status };

    if (cryptoCurrency) {
      where.cryptoCurrency = cryptoCurrency;
    }

    if (type) {
      where.type = type;
    }

    const offers = await prisma.p2POffer.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("P2P offers fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
