import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get("better-auth.session");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: "No session cookie found" },
        { status: 401 }
      );
    }

    // Find the session in the database
    const session = await prisma.session.findUnique({
      where: { token: sessionCookie.value },
      include: { user: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const balances = await prisma.balance.findMany({
      where: { userId: session.user.id },
      orderBy: { currency: "asc" },
    });

    // Convert Decimal to number for frontend compatibility
    const formattedBalances = balances.map((balance) => ({
      ...balance,
      amount: Number(balance.amount),
      locked: Number(balance.locked),
    }));

    return NextResponse.json({ balances: formattedBalances });
  } catch (error) {
    console.error("Balance fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
