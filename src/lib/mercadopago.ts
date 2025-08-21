import axios from "axios";

export class MercadoPagoService {
  private accessToken: string;
  private publicKey: string;

  constructor() {
    this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN!;
    this.publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY!;

    if (!this.accessToken || !this.publicKey) {
      console.warn(
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
      if (!this.accessToken) {
        console.warn(
          "MercadoPago access token not configured. Returning mock payment for development."
        );

        // Return mock payment data for development
        return {
          id: `mock-payment-${Date.now()}`,
          status: "pending",
          point_of_interaction: {
            transaction_data: {
              qr_code: "mock-qr-code-data",
              qr_code_base64: "mock-qr-code-base64-data",
            },
          },
        };
      }

      console.log("Creating MercadoPago payment:", {
        amount: data.amount,
        description: data.description,
        externalReference: data.externalReference,
        payerEmail: data.payerEmail,
      });

      // Generate a unique idempotency key for this request
      const idempotencyKey = `${data.externalReference}-${Date.now()}`;

      const response = await axios.post(
        "https://api.mercadopago.com/v1/payments",
        {
          transaction_amount: data.amount,
          description: data.description,
          external_reference: data.externalReference,
          payment_method_id: "pix",
          payer: {
            email: data.payerEmail,
          },
        },
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
      return response.data;
    } catch (error) {
      console.error("Mercado Pago payment creation error:", error);

      // Provide more helpful error information
      if (axios.isAxiosError(error)) {
        console.error("Response data:", error.response?.data);
        console.error("Response status:", error.response?.status);
      }

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

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implement webhook signature verification
    // This is a simplified version - implement proper verification
    return true;
  }
}

export const mercadoPagoService = new MercadoPagoService();
