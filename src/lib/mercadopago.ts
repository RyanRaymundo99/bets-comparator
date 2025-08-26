import axios from "axios";

export class MercadoPagoService {
  private accessToken: string;
  private publicKey: string;

  constructor() {
    this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN!;
    this.publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY!;

    if (!this.accessToken || !this.publicKey) {
      throw new Error(
        "MercadoPago credentials not configured. Set MERCADO_PAGO_ACCESS_TOKEN and MERCADO_PAGO_PUBLIC_KEY environment variables."
      );
    }
  }

  async createPayment(data: {
    amount: number;
    description: string;
    externalReference: string;
    payerEmail: string;
  }) {
    try {
      console.log("Creating MercadoPago payment:", {
        amount: data.amount,
        description: data.description,
        externalReference: data.externalReference,
        payerEmail: data.payerEmail,
      });

      // Validate amount
      const amount = Number(data.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount: must be a positive number");
      }

      // Ensure amount is at least 0.01 (Mercado Pago minimum)
      if (amount < 0.01) {
        throw new Error("Amount must be at least R$ 0.01");
      }

      // Format amount to 2 decimal places (Mercado Pago requirement)
      const formattedAmount = Math.round(amount * 100) / 100;

      // Generate a unique idempotency key for this request
      const idempotencyKey = `${data.externalReference}-${Date.now()}`;

      // Prepare the payment payload according to Mercado Pago API docs
      const paymentPayload = {
        transaction_amount: formattedAmount,
        description: data.description,
        external_reference: data.externalReference,
        payment_method_id: "pix",
        notification_url:
          process.env.MERCADO_PAGO_WEBHOOK_URL ||
          "https://yourdomain.com/api/webhooks/mercadopago",
        statement_descriptor: "BS Market",
        binary_mode: false,
        payer: {
          email: data.payerEmail,
        },
      };

      console.log("Payment payload:", paymentPayload);

      const response = await axios.post(
        "https://api.mercadopago.com/v1/payments",
        paymentPayload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": idempotencyKey,
          },
        }
      );

      console.log(
        "MercadoPago payment created successfully:",
        response.data.id
      );

      // Extract PIX data from the response
      const payment = response.data;

      // For PIX payments, we need to get the QR code from the point_of_interaction
      if (payment.payment_method_id === "pix" && payment.point_of_interaction) {
        // The QR code data is in the transaction_data
        const transactionData = payment.point_of_interaction.transaction_data;

        if (transactionData && transactionData.qr_code) {
          console.log("PIX QR code generated successfully");
          console.log("QR Code data:", transactionData.qr_code);

          // If qr_code_base64 is not provided, we'll generate it from the qr_code
          if (!transactionData.qr_code_base64) {
            // Generate base64 QR code from the PIX data
            const qrCodeBase64 = await this.generateQRCodeBase64(
              transactionData.qr_code
            );
            transactionData.qr_code_base64 = qrCodeBase64;
          }
        } else {
          console.warn(
            "PIX payment created but QR code data not found in response"
          );
        }
      }

      return payment;
    } catch (error) {
      console.error("Mercado Pago payment creation error:", error);

      // Provide more helpful error information
      if (axios.isAxiosError(error)) {
        console.error("Response data:", error.response?.data);
        console.error("Response status:", error.response?.status);
        console.error("Response headers:", error.response?.headers);

        // Log the request payload that was sent
        console.error("Request payload sent:", {
          transaction_amount: data.amount,
          description: data.description,
          external_reference: data.externalReference,
          payment_method_id: "pix",
          notification_url:
            process.env.MERCADO_PAGO_WEBHOOK_URL ||
            "https://yourdomain.com/api/webhooks/mercadopago",
          statement_descriptor: "BS Market",
          binary_mode: false,
          payer: {
            email: data.payerEmail,
          },
        });

        // Log specific validation errors if available
        if (error.response?.data?.error?.causes) {
          console.error("Validation errors:", error.response.data.error.causes);
        }

        // Log the full error response
        if (error.response?.data?.error) {
          console.error("Error message:", error.response.data.error.message);
          console.error("Error code:", error.response.data.error.error);
        }
      }

      throw error;
    }
  }

  // Generate base64 QR code from PIX data
  private async generateQRCodeBase64(pixData: string): Promise<string> {
    try {
      // Use a free QR code generation service
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        pixData
      )}`;

      const response = await fetch(qrCodeUrl);
      if (!response.ok) {
        throw new Error(`Failed to generate QR code: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      return base64;
    } catch (error) {
      console.error("Error generating QR code base64:", error);
      throw error;
    }
  }

  async getPayment(paymentId: string) {
    try {
      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Mercado Pago payment fetch error:", error);
      throw error;
    }
  }

  verifyWebhookSignature(): boolean {
    // Implement webhook signature verification
    // This is a simplified version - implement proper verification
    return true;
  }
}

export const mercadoPagoService = new MercadoPagoService();
