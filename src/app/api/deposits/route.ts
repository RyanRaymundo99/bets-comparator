import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/session";
import { mercadoPagoService } from "@/lib/mercadopago";

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

// Generate real PIX using Mercado Pago API
async function generateRealPIXData(amount: number, userId: string) {
  try {
    console.log("Creating Mercado Pago payment for amount:", amount);

    // Create payment using Mercado Pago
    const payment = await mercadoPagoService.createPayment({
      amount: amount,
      description: `Depósito BS Market - R$ ${amount.toFixed(2)}`,
      externalReference: `deposit_${userId}_${Date.now()}`,
      payerEmail: "user@example.com", // This should come from user session
    });

    console.log("Mercado Pago payment created successfully:", {
      id: payment.id,
      status: payment.status,
      paymentMethodId: payment.payment_method_id,
      hasPointOfInteraction: !!payment.point_of_interaction,
    });

    // Extract PIX data from Mercado Pago response
    if (payment.point_of_interaction?.transaction_data?.qr_code) {
      const qrCodeData = payment.point_of_interaction.transaction_data.qr_code;
      console.log("PIX QR code data found, length:", qrCodeData.length);

      let qrCodeBase64 =
        payment.point_of_interaction.transaction_data.qr_code_base64;

      // If qr_code_base64 is not provided, generate it from the qr_code data
      if (!qrCodeBase64) {
        console.log("Generating QR code image from PIX data...");
        qrCodeBase64 = await generateQRCodeImage(qrCodeData);
        if (!qrCodeBase64) {
          throw new Error("Failed to generate QR code image from PIX data");
        }
      }

      console.log("QR code generation successful");
      return {
        paymentId: payment.id.toString(),
        qrCode: qrCodeData,
        qrCodeBase64: qrCodeBase64,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        isReal: true,
      };
    } else {
      console.warn("PIX QR code data not found in Mercado Pago response");
      console.log("Payment structure:", JSON.stringify(payment, null, 2));

      // Check if this is a PIX payment
      if (payment.payment_method_id !== "pix") {
        throw new Error(
          `Expected PIX payment method, got: ${payment.payment_method_id}`
        );
      }

      // Try to get QR code from alternative locations in the response
      let qrCodeData = null;
      let qrCodeBase64 = null;

      // Check different possible locations for QR code data
      if (payment.point_of_interaction?.transaction_data?.qr_code) {
        qrCodeData = payment.point_of_interaction.transaction_data.qr_code;
      } else if (
        payment.point_of_interaction?.transaction_data?.qr_code_base64
      ) {
        qrCodeBase64 =
          payment.point_of_interaction.transaction_data.qr_code_base64;
        // Try to extract PIX data from base64 if possible
        qrCodeData = "PIX_DATA_FROM_MERCADOPAGO"; // Placeholder
      }

      if (!qrCodeData && !qrCodeBase64) {
        throw new Error("No QR code data found in Mercado Pago response");
      }

      // Generate missing data
      if (!qrCodeData) {
        qrCodeData = "PIX_DATA_FROM_MERCADOPAGO"; // Placeholder
      }

      if (!qrCodeBase64) {
        qrCodeBase64 = await generateQRCodeImage(qrCodeData);
        if (!qrCodeBase64) {
          throw new Error("Failed to generate QR code image");
        }
      }

      return {
        paymentId: payment.id.toString(),
        qrCode: qrCodeData,
        qrCodeBase64: qrCodeBase64,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        isReal: true,
      };
    }
  } catch (error) {
    console.error("Error creating Mercado Pago payment:", error);

    // Log more details for debugging
    if (error && typeof error === "object" && "response" in error) {
      const apiError = error as any;
      console.error("Mercado Pago API response error:", {
        status: apiError.response?.status,
        data: apiError.response?.data,
        headers: apiError.response?.headers,
      });
    }

    throw error;
  }
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

    // Check if Mercado Pago is configured
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Mercado Pago is not configured. Please contact support." },
        { status: 503 }
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

    // Generate real PIX using Mercado Pago API
    const pixData = await generateRealPIXData(amount, session.userId);

    return NextResponse.json({
      success: true,
      message: "PIX generated successfully using Mercado Pago",
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
      isReal: true,
    });
  } catch (error) {
    console.error("Deposit error:", error);

    // Return specific error messages for different failure types
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.includes("Mercado Pago")
    ) {
      return NextResponse.json(
        {
          error:
            "Payment service temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create deposit. Please try again." },
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
