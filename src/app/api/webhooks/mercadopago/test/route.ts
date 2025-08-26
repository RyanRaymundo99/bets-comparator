import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Mercado Pago webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
    endpoint: "/api/webhooks/mercadopago",
    instructions: [
      "1. Go to Mercado Pago Dashboard",
      "2. Navigate to Webhooks/Notifications",
      "3. Add this URL: https://yourdomain.com/api/webhooks/mercadopago",
      "4. Select 'payment' as the event type",
      "5. Save the webhook configuration",
    ],
  });
}

export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json();
    return NextResponse.json({
      success: true,
      message: "Test webhook received successfully",
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to parse webhook body",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
}
