import axios from "axios";
import crypto from "crypto";

export interface BinancePrice {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  count: number;
}

export interface BinanceOrderBook {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export interface BinanceTrade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

export class BinanceService {
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;
  private isTestnet: boolean;

  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY!;
    this.secretKey = process.env.BINANCE_SECRET_KEY!;
    this.isTestnet = process.env.BINANCE_TESTNET === "true";
    this.baseUrl = this.isTestnet
      ? "https://testnet.binance.vision"
      : "https://api.binance.com";
  }

  private generateSignature(queryString: string): string {
    return crypto
      .createHmac("sha256", this.secretKey)
      .update(queryString)
      .digest("hex");
  }

  // Get real-time price for a specific symbol
  async getPrice(symbol: string): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/ticker/price`, {
        params: { symbol },
      });
      return parseFloat(response.data.price);
    } catch (error) {
      console.error("Binance price fetch error:", error);
      throw new Error(`Failed to fetch price for ${symbol}`);
    }
  }

  // Get 24hr ticker price change statistics
  async get24hrTicker(symbol: string): Promise<BinancePrice> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/ticker/24hr`, {
        params: { symbol },
      });
      return response.data;
    } catch (error) {
      console.error("Binance 24hr ticker error:", error);
      throw new Error(`Failed to fetch 24hr ticker for ${symbol}`);
    }
  }

  // Get order book for a symbol
  async getOrderBook(
    symbol: string,
    limit: number = 10
  ): Promise<BinanceOrderBook> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/depth`, {
        params: { symbol, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Binance order book error:", error);
      throw new Error(`Failed to fetch order book for ${symbol}`);
    }
  }

  // Get recent trades for a symbol
  async getRecentTrades(
    symbol: string,
    limit: number = 10
  ): Promise<BinanceTrade[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/trades`, {
        params: { symbol, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Binance recent trades error:", error);
      throw new Error(`Failed to fetch recent trades for ${symbol}`);
    }
  }

  // Get all available trading pairs
  async getExchangeInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/exchangeInfo`);
      return response.data;
    } catch (error) {
      console.error("Binance exchange info error:", error);
      throw new Error("Failed to fetch exchange info");
    }
  }

  // Get popular trading pairs (USDT pairs)
  async getPopularPairs(): Promise<string[]> {
    try {
      const exchangeInfo = await this.getExchangeInfo();
      const usdtPairs = exchangeInfo.symbols
        .filter(
          (symbol: any) =>
            symbol.status === "TRADING" &&
            symbol.quoteAsset === "USDT" &&
            symbol.isSpotTradingAllowed
        )
        .map((symbol: any) => symbol.symbol)
        .slice(0, 20); // Top 20 popular pairs

      return usdtPairs;
    } catch (error) {
      console.error("Binance popular pairs error:", error);
      return ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT"];
    }
  }

  // Create a real trading order
  async createOrder(data: {
    symbol: string;
    side: "BUY" | "SELL";
    type: "MARKET" | "LIMIT";
    quantity: number;
    price?: number;
    timeInForce?: "GTC" | "IOC" | "FOK";
  }) {
    try {
      // Validate and format quantity for Binance
      if (!data.quantity || data.quantity <= 0) {
        throw new Error("Invalid quantity: must be greater than 0");
      }

      // Format quantity to 6 decimal places (Binance standard)
      const formattedQuantity = parseFloat(data.quantity.toFixed(6));

      // Validate minimum quantity
      if (formattedQuantity < 0.000001) {
        throw new Error("Quantity too small: minimum is 0.000001");
      }

      const timestamp = Date.now();
      const params = {
        symbol: data.symbol,
        side: data.side,
        type: data.type,
        quantity: formattedQuantity.toString(), // Convert to string for Binance
        timestamp,
        ...(data.price && { price: data.price.toString() }),
        ...(data.timeInForce && { timeInForce: data.timeInForce }),
      };

      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      const signature = this.generateSignature(queryString);

      console.log(`Creating ${data.side} order for ${data.symbol}:`, {
        quantity: formattedQuantity,
        price: data.price,
        type: data.type,
        symbol: data.symbol,
      });

      const response = await axios.post(`${this.baseUrl}/api/v3/order`, null, {
        params: { ...params, signature },
        headers: {
          "X-MBX-APIKEY": this.apiKey,
        },
      });

      console.log(`Order created successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("Binance order creation error:", error);

      // Provide more detailed error information
      let errorMessage = "Order creation failed";

      if (error.response?.data) {
        const binanceError = error.response.data;
        errorMessage = `${binanceError.msg || errorMessage}`;

        // Add specific error codes for common issues
        if (binanceError.code === -1013) {
          errorMessage =
            "Invalid quantity: quantity too small or precision too high";
        } else if (binanceError.code === -1015) {
          errorMessage = "Invalid symbol: trading pair not supported";
        } else if (binanceError.code === -2010) {
          errorMessage = "Insufficient balance for order";
        } else if (binanceError.code === -2011) {
          errorMessage = "Order would trigger immediate liquidation";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  // Get account information including balances
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
    } catch (error: any) {
      console.error("Binance account info error:", error);
      const errorMessage = error.response?.data?.msg || error.message;
      throw new Error(`Failed to get account info: ${errorMessage}`);
    }
  }

  // Get order status
  async getOrderStatus(symbol: string, orderId: string) {
    try {
      const timestamp = Date.now();
      const params = { symbol, orderId: orderId.toString(), timestamp };
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      const signature = this.generateSignature(queryString);

      const response = await axios.get(`${this.baseUrl}/api/v3/order`, {
        params: { ...params, signature },
        headers: {
          "X-MBX-APIKEY": this.apiKey,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Binance order status error:", error);
      const errorMessage = error.response?.data?.msg || error.message;
      throw new Error(`Failed to get order status: ${errorMessage}`);
    }
  }

  // Cancel an order
  async cancelOrder(symbol: string, orderId: string) {
    try {
      const timestamp = Date.now();
      const params = { symbol, orderId: orderId.toString(), timestamp };
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      const signature = this.generateSignature(queryString);

      const response = await axios.delete(`${this.baseUrl}/api/v3/order`, {
        params: { ...params, signature },
        headers: {
          "X-MBX-APIKEY": this.apiKey,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Binance cancel order error:", error);
      const errorMessage = error.response?.data?.msg || error.message;
      throw new Error(`Failed to cancel order: ${errorMessage}`);
    }
  }

  // Get user's open orders
  async getOpenOrders(symbol?: string) {
    try {
      const timestamp = Date.now();
      const params: any = { timestamp };
      if (symbol) params.symbol = symbol;

      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      const signature = this.generateSignature(queryString);

      const response = await axios.get(`${this.baseUrl}/api/v3/openOrders`, {
        params: { ...params, signature },
        headers: {
          "X-MBX-APIKEY": this.apiKey,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Binance open orders error:", error);
      const errorMessage = error.response?.data?.msg || error.message;
      throw new Error(`Failed to get open orders: ${errorMessage}`);
    }
  }

  // Get user's trade history
  async getTradeHistory(symbol: string, limit: number = 10) {
    try {
      const timestamp = Date.now();
      const params = { symbol, limit, timestamp };
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      const signature = this.generateSignature(queryString);

      const response = await axios.get(`${this.baseUrl}/api/v3/myTrades`, {
        params: { ...params, signature },
        headers: {
          "X-MBX-APIKEY": this.apiKey,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Binance trade history error:", error);
      const errorMessage = error.response?.data?.msg || error.message;
      throw new Error(`Failed to get trade history: ${errorMessage}`);
    }
  }
}

export const binanceService = new BinanceService();
