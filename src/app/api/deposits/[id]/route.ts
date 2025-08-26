import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/session";
import prisma from "@/lib/prisma";

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

    const { id } = await params;

    // Get the deposit
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        amount: true,
        currency: true,
        status: true,
        paymentMethod: true,
        paymentId: true,
        paymentStatus: true,
        paymentAmount: true,
        fee: true,
        createdAt: true,
        updatedAt: true,
        confirmedAt: true,
      },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    // Check if the user owns this deposit
    if (deposit.userId !== session.userId) {
      return NextResponse.json(
        { error: "Unauthorized access to deposit" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      deposit,
    });
  } catch (error) {
    console.error("Error fetching deposit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
