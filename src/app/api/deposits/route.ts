import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/session";

// Generate QR code using a web service
async function generateQRCodeImage(pixData: string): Promise<string | null> {
  try {
    // Use a free QR code generation service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      pixData
    )}`;

    // Fetch the QR code image and convert to base64
    const response = await fetch(qrCodeUrl);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return base64;
  } catch (error) {
    console.error("QR code generation error:", error);
    return null;
  }
}

// Mock PIX QR code generation (replace with real Mercado Pago integration later)
async function generateMockPIXData(amount: number) {
  // Generate a mock payment ID
  const paymentId = `pix_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Generate a mock QR code data (this would normally be PIX data)
  const pixData = `00020126580014br.gov.bcb.pix0136${paymentId}5204000053039865405100${amount.toFixed(
    2
  )}5802BR5913BS Market6009Sao Paulo62070503***6304`;

  // Generate actual QR code image
  const qrCodeBase64 = await generateQRCodeImage(pixData);

  // For now, return mock data that the frontend expects
  return {
    paymentId,
    qrCode: pixData,
    qrCodeBase64: qrCodeBase64,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session = await validateSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const { amount, paymentMethod } = await request.json();

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount is required and must be greater than 0" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      );
    }

    // Create deposit record
    const deposit = await prisma.deposit.create({
      data: {
        userId: session.userId,
        amount,
        currency: "BRL",
        status: "PENDING",
        paymentMethod,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Generate mock PIX data with real QR code
    const pixData = await generateMockPIXData(amount);

    return NextResponse.json({
      success: true,
      message: "Deposit request submitted successfully",
      deposit: {
        id: deposit.id,
        amount,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
      // Return PIX data for frontend display
      paymentId: pixData.paymentId,
      qrCode: pixData.qrCode,
      qrCodeBase64: pixData.qrCodeBase64,
      expiresAt: pixData.expiresAt,
    });
  } catch (error) {
    console.error("Deposit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await validateSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // Get user's deposits
    const deposits = await prisma.deposit.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ deposits });
  } catch (error) {
    console.error("Deposits fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
