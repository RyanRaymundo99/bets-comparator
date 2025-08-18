# P2P Crypto Exchange - Complete Implementation Guide

## 🏗️ Architecture Overview

This guide outlines how to build a full-stack P2P crypto exchange using Next.js, PostgreSQL with Prisma ORM, Mercado Pago for BRL transactions, and Binance API for crypto operations.

## 📋 System Requirements

### Core Technologies

- **Frontend**: Next.js 15+ with TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth (already implemented)
- **Payment Processing**: Mercado Pago PJ Account
- **Crypto Operations**: Binance API
- **UI Components**: Radix UI + Tailwind CSS

### External Integrations

- **Mercado Pago**: BRL deposits/withdrawals
- **Binance API**: Live crypto prices and execution
- **Banco Inter** (optional): Alternative BRL processing

## 🗂️ Project Structure

```
bs-market/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # Authentication routes
│   │   │   ├── deposits/       # Deposit management
│   │   │   ├── withdrawals/    # Withdrawal processing
│   │   │   ├── crypto/         # Crypto operations
│   │   │   ├── orders/         # Order management
│   │   │   ├── p2p/           # P2P trading
│   │   │   └── webhooks/      # External webhooks
│   │   ├── dashboard/         # Main dashboard
│   │   ├── portfolio/         # User portfolio
│   │   ├── trade/            # Trading interface
│   │   ├── p2p/              # P2P trading
│   │   ├── deposits/         # Deposit page
│   │   └── withdrawals/      # Withdrawal page
│   ├── components/
│   │   ├── trading/          # Trading components
│   │   ├── p2p/             # P2P components
│   │   ├── portfolio/       # Portfolio components
│   │   └── ui/              # Reusable UI components
│   ├── lib/
│   │   ├── mercadopago.ts   # Mercado Pago integration
│   │   ├── binance.ts       # Binance API integration
│   │   ├── ledger.ts        # Ledger operations
│   │   └── types.ts         # TypeScript types
│   └── hooks/
│       ├── use-trading.ts   # Trading hooks
│       └── use-p2p.ts       # P2P hooks
├── prisma/
│   └── schema.prisma        # Database schema
└── public/
    └── webhooks/           # Webhook endpoints
```

## 🗄️ Database Schema

### Enhanced Prisma Schema

```prisma
// User model (enhanced)
model User {
  id            String    @id @map("_id")
  name          String
  email         String
  emailVerified Boolean
  image         String?
  kycStatus     KYCStatus @default(PENDING)
  kycData       Json?     // KYC information
  createdAt     DateTime
  updatedAt     DateTime

  // Relations
  sessions      Session[]
  accounts      Account[]
  balances      Balance[]
  deposits      Deposit[]
  withdrawals   Withdrawal[]
  orders        Order[]
  p2pOffers     P2POffer[]
  p2pTrades     P2PTrade[]
  transactions  Transaction[]

  @@unique([email])
  @@map("user")
}

// Balance tracking
model Balance {
  id        String   @id @default(cuid())
  userId    String
  currency  String   // BRL, BTC, ETH, USDT, etc.
  amount    Decimal  @db.Decimal(20, 8)
  locked    Decimal  @db.Decimal(20, 8) @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, currency])
  @@map("balance")
}

// Deposit management
model Deposit {
  id              String        @id @default(cuid())
  userId          String
  amount          Decimal       @db.Decimal(20, 2)
  currency        String        @default("BRL")
  status          DepositStatus @default(PENDING)
  paymentMethod   String        // "mercadopago", "inter"
  externalId      String?       // External payment ID
  proofUrl        String?       // Payment proof
  confirmedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transaction     Transaction?  @relation(fields: [transactionId], references: [id])
  transactionId   String?       @unique

  @@map("deposit")
}

// Withdrawal management
model Withdrawal {
  id              String           @id @default(cuid())
  userId          String
  amount          Decimal          @db.Decimal(20, 2)
  currency        String           @default("BRL")
  status          WithdrawalStatus @default(PENDING)
  paymentMethod   String           // "mercadopago", "inter"
  externalId      String?          // External payment ID
  bankAccount     Json?            // Bank account details
  processedAt     DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  transaction     Transaction?     @relation(fields: [transactionId], references: [id])
  transactionId   String?          @unique

  @@map("withdrawal")
}

// Crypto orders
model Order {
  id              String      @id @default(cuid())
  userId          String
  type            OrderType   // BUY, SELL
  baseCurrency    String      // BTC, ETH, USDT
  quoteCurrency   String      // BRL
  amount          Decimal     @db.Decimal(20, 8)
  price           Decimal     @db.Decimal(20, 2)
  total           Decimal     @db.Decimal(20, 2)
  status          OrderStatus @default(PENDING)
  externalOrderId String?     // Binance order ID
  executedAt      DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  transaction     Transaction? @relation(fields: [transactionId], references: [id])
  transactionId   String?     @unique

  @@map("order")
}

// P2P Trading
model P2POffer {
  id              String      @id @default(cuid())
  userId          String
  type            OfferType   // BUY, SELL
  cryptoCurrency  String      // BTC, ETH, USDT
  fiatCurrency    String      @default("BRL")
  cryptoAmount    Decimal     @db.Decimal(20, 8)
  fiatAmount      Decimal     @db.Decimal(20, 2)
  price           Decimal     @db.Decimal(20, 2)
  status          OfferStatus @default(ACTIVE)
  paymentMethods  Json         // Accepted payment methods
  minTrade        Decimal     @db.Decimal(20, 2)
  maxTrade        Decimal     @db.Decimal(20, 2)
  expiresAt       DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  trades          P2PTrade[]

  @@map("p2p_offer")
}

model P2PTrade {
  id              String      @id @default(cuid())
  offerId         String
  buyerId         String
  sellerId        String
  cryptoAmount    Decimal     @db.Decimal(20, 8)
  fiatAmount      Decimal     @db.Decimal(20, 2)
  status          TradeStatus @default(PENDING)
  paymentProof    String?     // Payment proof URL
  cryptoReleased  Boolean     @default(false)
  fiatConfirmed   Boolean     @default(false)
  disputeReason   String?
  expiresAt       DateTime
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  offer           P2POffer    @relation(fields: [offerId], references: [id], onDelete: Cascade)
  buyer           User        @relation("BuyerTrades", fields: [buyerId], references: [id])
  seller          User        @relation("SellerTrades", fields: [sellerId], references: [id])
  buyerTransaction Transaction? @relation("BuyerTransaction", fields: [buyerTransactionId], references: [id])
  buyerTransactionId String?  @unique
  sellerTransaction Transaction? @relation("SellerTransaction", fields: [sellerTransactionId], references: [id])
  sellerTransactionId String? @unique

  @@map("p2p_trade")
}

// Transaction ledger
model Transaction {
  id              String          @id @default(cuid())
  userId          String
  type            TransactionType
  amount          Decimal         @db.Decimal(20, 8)
  currency        String
  balance         Decimal         @db.Decimal(20, 8) // Balance after transaction
  description     String
  metadata        Json?           // Additional transaction data
  createdAt       DateTime        @default(now())

  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  deposit         Deposit?
  withdrawal      Withdrawal?
  order           Order?
  buyerTrade      P2PTrade?       @relation("BuyerTransaction")
  sellerTrade     P2PTrade?       @relation("SellerTransaction")

  @@map("transaction")
}

// Enums
enum KYCStatus {
  PENDING
  APPROVED
  REJECTED
}

enum DepositStatus {
  PENDING
  CONFIRMED
  REJECTED
  CANCELLED
}

enum WithdrawalStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum OrderType {
  BUY
  SELL
}

enum OrderStatus {
  PENDING
  EXECUTING
  COMPLETED
  FAILED
  CANCELLED
}

enum OfferType {
  BUY
  SELL
}

enum OfferStatus {
  ACTIVE
  PAUSED
  CANCELLED
  EXPIRED
}

enum TradeStatus {
  PENDING
  PAYMENT_SENT
  PAYMENT_CONFIRMED
  CRYPTO_RELEASED
  COMPLETED
  DISPUTED
  CANCELLED
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  BUY_CRYPTO
  SELL_CRYPTO
  P2P_TRADE
  FEE
  REFUND
}
```

## 🔧 Implementation Steps

### Step 1: Environment Setup

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bs_market"

# Authentication
AUTH_SECRET="your-auth-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN="your-mp-access-token"
MERCADO_PAGO_PUBLIC_KEY="your-mp-public-key"
MERCADO_PAGO_WEBHOOK_SECRET="your-mp-webhook-secret"

# Binance
BINANCE_API_KEY="your-binance-api-key"
BINANCE_SECRET_KEY="your-binance-secret-key"
BINANCE_TESTNET=false

# Banco Inter (optional)
INTER_CLIENT_ID="your-inter-client-id"
INTER_CLIENT_SECRET="your-inter-client-secret"
INTER_CERT_PATH="path/to/inter-cert.p12"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY="your-mp-public-key"
```

### Step 2: Install Dependencies

```bash
9
```

### Step 3: Mercado Pago Integration

Create `src/lib/mercadopago.ts`:

```typescript
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
```

### Step 4: Binance Integration

Create `src/lib/binance.ts`:

```typescript
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
```

### Step 5: Ledger Service

Create `src/lib/ledger.ts`:

```typescript
import { prisma } from "./prisma";
import { Decimal } from "@prisma/client/runtime/library";

export class LedgerService {
  async getUserBalance(userId: string, currency: string) {
    const balance = await prisma.balance.findUnique({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
    });

    return (
      balance || {
        userId,
        currency,
        amount: new Decimal(0),
        locked: new Decimal(0),
      }
    );
  }

  async updateBalance(
    userId: string,
    currency: string,
    amount: Decimal,
    type: "ADD" | "SUBTRACT" | "LOCK" | "UNLOCK"
  ) {
    const balance = await this.getUserBalance(userId, currency);

    let newAmount = balance.amount;
    let newLocked = balance.locked;

    switch (type) {
      case "ADD":
        newAmount = newAmount.add(amount);
        break;
      case "SUBTRACT":
        newAmount = newAmount.sub(amount);
        break;
      case "LOCK":
        newLocked = newLocked.add(amount);
        newAmount = newAmount.sub(amount);
        break;
      case "UNLOCK":
        newLocked = newLocked.sub(amount);
        newAmount = newAmount.add(amount);
        break;
    }

    return await prisma.balance.upsert({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
      update: {
        amount: newAmount,
        locked: newLocked,
        updatedAt: new Date(),
      },
      create: {
        userId,
        currency,
        amount: newAmount,
        locked: newLocked,
      },
    });
  }

  async createTransaction(data: {
    userId: string;
    type: string;
    amount: Decimal;
    currency: string;
    description: string;
    metadata?: any;
  }) {
    const balance = await this.getUserBalance(data.userId, data.currency);

    return await prisma.transaction.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        amount: data.amount,
        currency: data.currency,
        balance: balance.amount,
        description: data.description,
        metadata: data.metadata,
      },
    });
  }
}

export const ledgerService = new LedgerService();
```

### Step 6: API Routes

#### Deposit API (`src/app/api/deposits/route.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import { ledgerService } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Create deposit record
    const deposit = await prisma.deposit.create({
      data: {
        userId: session.user.id,
        amount: new Decimal(amount),
        currency: "BRL",
        paymentMethod: "mercadopago",
        status: "PENDING",
      },
    });

    // Create Mercado Pago payment
    const payment = await mercadoPagoService.createPayment({
      amount,
      description: `Deposit ${amount} BRL`,
      externalReference: deposit.id,
      payerEmail: session.user.email,
    });

    // Update deposit with external ID
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { externalId: payment.id.toString() },
    });

    return NextResponse.json({
      depositId: deposit.id,
      paymentId: payment.id,
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64:
        payment.point_of_interaction?.transaction_data?.qr_code_base64,
    });
  } catch (error) {
    console.error("Deposit creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### Webhook Handler (`src/app/api/webhooks/mercadopago/route.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import { ledgerService } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-signature");

    if (
      !signature ||
      !mercadoPagoService.verifyWebhookSignature(body, signature)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(body);

    if (data.type === "payment" && data.data?.id) {
      const payment = await mercadoPagoService.getPayment(data.data.id);

      if (payment.status === "approved") {
        const deposit = await prisma.deposit.findFirst({
          where: { externalId: payment.id.toString() },
        });

        if (deposit && deposit.status === "PENDING") {
          // Update deposit status
          await prisma.deposit.update({
            where: { id: deposit.id },
            data: {
              status: "CONFIRMED",
              confirmedAt: new Date(),
            },
          });

          // Credit user balance
          await ledgerService.updateBalance(
            deposit.userId,
            "BRL",
            deposit.amount,
            "ADD"
          );

          // Create transaction record
          await ledgerService.createTransaction({
            userId: deposit.userId,
            type: "DEPOSIT",
            amount: deposit.amount,
            currency: "BRL",
            description: `Deposit via Mercado Pago - ${payment.id}`,
            metadata: { paymentId: payment.id, depositId: deposit.id },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### Crypto Trading API (`src/app/api/crypto/buy/route.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { binanceService } from "@/lib/binance";
import { ledgerService } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, cryptoCurrency } = await request.json();

    if (!amount || amount <= 0 || !cryptoCurrency) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    // Get current price
    const symbol = `${cryptoCurrency}BRL`;
    const price = await binanceService.getPrice(symbol);
    const total = amount * price;

    // Check user balance
    const balance = await ledgerService.getUserBalance(session.user.id, "BRL");
    if (balance.amount.lessThan(total)) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        type: "BUY",
        baseCurrency: cryptoCurrency,
        quoteCurrency: "BRL",
        amount: new Decimal(amount),
        price: new Decimal(price),
        total: new Decimal(total),
        status: "PENDING",
      },
    });

    try {
      // Execute on Binance
      const binanceOrder = await binanceService.createOrder({
        symbol,
        side: "BUY",
        type: "MARKET",
        quantity: amount,
      });

      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "COMPLETED",
          externalOrderId: binanceOrder.orderId.toString(),
          executedAt: new Date(),
        },
      });

      // Update balances
      await ledgerService.updateBalance(
        session.user.id,
        "BRL",
        new Decimal(total),
        "SUBTRACT"
      );

      await ledgerService.updateBalance(
        session.user.id,
        cryptoCurrency,
        new Decimal(amount),
        "ADD"
      );

      // Create transaction records
      await ledgerService.createTransaction({
        userId: session.user.id,
        type: "BUY_CRYPTO",
        amount: new Decimal(total),
        currency: "BRL",
        description: `Bought ${amount} ${cryptoCurrency}`,
        metadata: { orderId: order.id, binanceOrderId: binanceOrder.orderId },
      });

      await ledgerService.createTransaction({
        userId: session.user.id,
        type: "BUY_CRYPTO",
        amount: new Decimal(amount),
        currency: cryptoCurrency,
        description: `Received ${amount} ${cryptoCurrency}`,
        metadata: { orderId: order.id, binanceOrderId: binanceOrder.orderId },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        binanceOrderId: binanceOrder.orderId,
        amount,
        price,
        total,
      });
    } catch (error) {
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });

      throw error;
    }
  } catch (error) {
    console.error("Crypto buy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Step 7: Frontend Components

#### Trading Interface (`src/components/trading/TradingInterface.tsx`):

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export function TradingInterface() {
  const [amount, setAmount] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const cryptos = [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDT", name: "Tether" },
  ];

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedCrypto]);

  const fetchPrice = async () => {
    try {
      const response = await fetch(
        `/api/crypto/price?symbol=${selectedCrypto}BRL`
      );
      const data = await response.json();
      setPrice(data.price);
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  };

  const handleBuy = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/crypto/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          cryptoCurrency: selectedCrypto,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Successfully bought ${amount} ${selectedCrypto}`,
        });
        setAmount("");
        setCryptoAmount("");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to buy crypto",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/crypto/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(cryptoAmount),
          cryptoCurrency: selectedCrypto,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Successfully sold ${cryptoAmount} ${selectedCrypto}`,
        });
        setAmount("");
        setCryptoAmount("");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to sell crypto",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Trade Crypto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Crypto</label>
            <select
              value={selectedCrypto}
              onChange={(e) => setSelectedCrypto(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              {cryptos.map((crypto) => (
                <option key={crypto.symbol} value={crypto.symbol}>
                  {crypto.name} ({crypto.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Current Price: R$ {price.toFixed(2)}
            </label>
          </div>

          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount in BRL</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in BRL"
                />
              </div>
              <Button onClick={handleBuy} disabled={loading} className="w-full">
                {loading ? "Processing..." : `Buy ${selectedCrypto}`}
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Amount in {selectedCrypto}
                </label>
                <Input
                  type="number"
                  value={cryptoAmount}
                  onChange={(e) => setCryptoAmount(e.target.value)}
                  placeholder={`Enter amount in ${selectedCrypto}`}
                />
              </div>
              <Button
                onClick={handleSell}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? "Processing..." : `Sell ${selectedCrypto}`}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 8: P2P Trading Implementation

#### P2P Offer Creation (`src/app/api/p2p/offers/route.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      type,
      cryptoCurrency,
      fiatCurrency,
      cryptoAmount,
      fiatAmount,
      paymentMethods,
      minTrade,
      maxTrade,
      expiresInHours,
    } = await request.json();

    // Validate user has sufficient balance for sell offers
    if (type === "SELL") {
      const balance = await prisma.balance.findUnique({
        where: {
          userId_currency: {
            userId: session.user.id,
            currency: cryptoCurrency,
          },
        },
      });

      if (!balance || balance.amount.lessThan(cryptoAmount)) {
        return NextResponse.json(
          { error: "Insufficient crypto balance" },
          { status: 400 }
        );
      }
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (expiresInHours || 24));

    const offer = await prisma.p2POffer.create({
      data: {
        userId: session.user.id,
        type,
        cryptoCurrency,
        fiatCurrency,
        cryptoAmount: new Decimal(cryptoAmount),
        fiatAmount: new Decimal(fiatAmount),
        price: new Decimal(fiatAmount).div(cryptoAmount),
        paymentMethods,
        minTrade: new Decimal(minTrade),
        maxTrade: new Decimal(maxTrade),
        expiresAt,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ offer });
  } catch (error) {
    console.error("P2P offer creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## 🔒 Security Considerations

### 1. API Security

- Implement rate limiting for all API endpoints
- Use HTTPS for all communications
- Validate all input data
- Implement proper error handling

### 2. Database Security

- Use parameterized queries (Prisma handles this)
- Implement row-level security
- Regular database backups
- Audit logging for all transactions

### 3. Payment Security

- Verify webhook signatures
- Implement idempotency for payments
- Use secure API keys
- Monitor for suspicious activity

### 4. KYC Integration

- Store KYC data securely
- Implement document verification
- Follow local regulations
- Regular compliance audits

## 📊 Monitoring & Analytics

### 1. Transaction Monitoring

- Real-time transaction tracking
- Automated fraud detection
- Suspicious activity alerts
- Performance metrics

### 2. System Health

- API response times
- Database performance
- Error rates
- User activity metrics

## 🚀 Deployment

### 1. Production Setup

```bash
# Build the application
pnpm build

# Run database migrations
npx prisma migrate deploy

# Start the application
pnpm start
```

### 2. Environment Variables

Ensure all environment variables are set in production:

- Database connection string
- API keys for external services
- Webhook secrets
- Application secrets

### 3. SSL/TLS

- Configure HTTPS certificates
- Set up proper domain routing
- Implement security headers

## 📈 Scaling Considerations

### 1. Database Scaling

- Implement read replicas
- Use connection pooling
- Optimize queries
- Consider sharding for high volume

### 2. Application Scaling

- Use load balancers
- Implement caching (Redis)
- Use CDN for static assets
- Consider microservices architecture

### 3. Payment Processing

- Implement queue systems for payments
- Use webhook retry mechanisms
- Monitor payment success rates
- Implement fallback payment methods

## 🔄 Testing Strategy

### 1. Unit Tests

- Test all business logic
- Mock external API calls
- Test error scenarios
- Validate data transformations

### 2. Integration Tests

- Test API endpoints
- Test database operations
- Test external integrations
- Test webhook handling

### 3. End-to-End Tests

- Test complete user flows
- Test payment processes
- Test trading operations
- Test P2P functionality

## 📚 Additional Resources

### Documentation

- [Mercado Pago API Documentation](https://www.mercadopago.com.br/developers)
- [Binance API Documentation](https://binance-docs.github.io/apidocs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### Security Guidelines

- [OWASP Security Guidelines](https://owasp.org/)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)
- [GDPR Compliance](https://gdpr.eu/)

This implementation provides a solid foundation for a P2P crypto exchange with proper security, scalability, and compliance considerations. The modular architecture allows for easy extension and maintenance.
