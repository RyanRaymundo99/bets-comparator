import axios from "axios";

export class MercadoPagoService {
  private accessToken: string;
  private publicKey: string;

  constructor() {
    this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN!;
    this.publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY!;
  }

  async createPayment(data: {
    amount: number;
    description: string;
    externalReference: string;
    payerEmail: string;
  }) {
    try {
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
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Mercado Pago payment creation error:", error);
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
