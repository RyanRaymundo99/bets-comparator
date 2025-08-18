import axios from "axios";
import crypto from "crypto";

export class BinanceService {
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY!;
    this.secretKey = process.env.BINANCE_SECRET_KEY!;
    this.baseUrl =
      process.env.BINANCE_TESTNET === "true"
        ? "https://testnet.binance.vision"
        : "https://api.binance.com";
  }

  private generateSignature(queryString: string): string {
    return crypto
      .createHmac("sha256", this.secretKey)
      .update(queryString)
      .digest("hex");
  }

  async getPrice(symbol: string): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/ticker/price`, {
        params: { symbol },
      });
      return parseFloat(response.data.price);
    } catch (error) {
      console.error("Binance price fetch error:", error);
      throw error;
    }
  }

  async createOrder(data: {
    symbol: string;
    side: "BUY" | "SELL";
    type: "MARKET" | "LIMIT";
    quantity: number;
    price?: number;
  }) {
    try {
      const timestamp = Date.now();
      const params = {
        symbol: data.symbol,
        side: data.side,
        type: data.type,
        quantity: data.quantity,
        timestamp,
        ...(data.price && { price: data.price }),
      };

      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      const signature = this.generateSignature(queryString);

      const response = await axios.post(`${this.baseUrl}/api/v3/order`, null, {
        params: { ...params, signature },
        headers: {
          "X-MBX-APIKEY": this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Binance order creation error:", error);
      throw error;
    }
  }

  async getAccountInfo() {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await axios.get(`${this.baseUrl}/api/v3/account`, {
        params: { timestamp, signature },
        headers: {
          "X-MBX-APIKEY": this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Binance account info error:", error);
      throw error;
    }
  }
}

export const binanceService = new BinanceService();
