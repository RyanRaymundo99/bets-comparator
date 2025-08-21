import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // For dev mode, get user ID from query params or use a dev user
    // In production, you'd get this from the session/JWT
    const userId = request.nextUrl.searchParams.get("userId");

    // For now, let's find any dev user to show data
    let targetUserId = userId;
    if (!targetUserId) {
      const devUser = await prisma.user.findFirst({
        where: {
          email: { startsWith: "dev" },
          approvalStatus: "APPROVED",
        },
        orderBy: { createdAt: "desc" },
      });
      targetUserId = devUser?.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    const balances = await prisma.balance.findMany({
      where: { userId: targetUserId },
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
