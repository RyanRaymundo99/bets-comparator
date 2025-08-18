import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balances = await prisma.balance.findMany({
      where: { userId: session.user.id },
      orderBy: { currency: "asc" },
    });

    return NextResponse.json({ balances });
  } catch (error) {
    console.error("Balance fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
