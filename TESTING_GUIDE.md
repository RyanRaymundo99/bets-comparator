# 🧪 P2P Crypto Exchange Testing Guide

## 📋 **Prerequisites**

### **1. Environment Variables Setup**

Create a `.env.local` file in the root directory with:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bs_market"

# Better Auth
AUTH_SECRET="your-auth-secret-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN="your-mercado-pago-access-token"
MERCADO_PAGO_PUBLIC_KEY="your-mercado-pago-public-key"

# Binance API
BINANCE_API_KEY="your-binance-api-key"
BINANCE_SECRET_KEY="your-binance-secret-key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### **2. Database Setup**

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations (if you have a database)
npx prisma migrate dev --name init
```

## 🚀 **Testing Steps**

### **Step 1: Start Development Server**

```bash
npm run dev
```

### **Step 2: Test Authentication**

1. **Navigate to:** `http://localhost:3000/login`
2. **Test Login:** Use Google OAuth or dev mode
3. **Verify:** You should be redirected to `/dashboard`

### **Step 3: Test Dashboard**

1. **Navigate to:** `http://localhost:3000/dashboard`
2. **Verify:**
   - Portfolio overview loads
   - Quick action buttons work
   - Navigation menu functions

### **Step 4: Test Portfolio Page**

1. **Navigate to:** `http://localhost:3000/portfolio`
2. **Verify:**
   - Balance display (may show 0 initially)
   - Transaction history (may be empty initially)

### **Step 5: Test Deposits**

1. **Navigate to:** `http://localhost:3000/deposits`
2. **Test Deposit Creation:**
   - Enter amount (e.g., 100 BRL)
   - Click "Create Deposit"
   - **Expected:** QR code should appear (if Mercado Pago is configured)

### **Step 6: Test Trading Interface**

1. **Navigate to:** `http://localhost:3000/wallet`
2. **Test Crypto Trading:**
   - Select cryptocurrency (BTC, ETH, etc.)
   - Enter amount
   - Click "Buy" or "Sell"
   - **Expected:** Should show current price and execute trade

### **Step 7: Test P2P Trading**

1. **Navigate to:** `http://localhost:3000/p2p`
2. **Test P2P Offers:**
   - View existing offers
   - Create new offer (if authenticated)
   - **Expected:** Should display P2P marketplace

## 🔧 **API Testing**

### **Test Balance API**

```bash
curl -X GET http://localhost:3000/api/balance \
  -H "Content-Type: application/json"
```

### **Test Crypto Price API**

```bash
curl -X GET "http://localhost:3000/api/crypto/price?symbol=BTCUSDT" \
  -H "Content-Type: application/json"
```

### **Test Deposits API**

```bash
curl -X POST http://localhost:3000/api/deposits \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

## 🐛 **Common Issues & Solutions**

### **Issue 1: Database Connection Error**

**Error:** `password authentication failed for user`
**Solution:**

- Check DATABASE_URL in `.env.local`
- Ensure database is running
- Verify credentials

### **Issue 2: Mercado Pago Error**

**Error:** `Invalid access token`
**Solution:**

- Verify MERCADO_PAGO_ACCESS_TOKEN
- Check if token is valid and has proper permissions

### **Issue 3: Binance API Error**

**Error:** `Invalid API key`
**Solution:**

- Verify BINANCE_API_KEY and BINANCE_SECRET_KEY
- Ensure API keys have trading permissions

### **Issue 4: Authentication Error**

**Error:** `AUTH_SECRET is required`
**Solution:**

- Add AUTH_SECRET to `.env.local`
- Restart development server

## 📊 **Expected Test Results**

### **✅ Successful Tests Should Show:**

- Dashboard loads with portfolio overview
- Navigation between pages works
- Deposit creation generates QR code
- Trading interface shows real-time prices
- P2P marketplace displays offers
- Balance updates after transactions

### **⚠️ Expected Limitations (Development):**

- Real transactions won't execute without proper API keys
- Webhooks won't work without public URL
- Database may be empty initially

## 🔄 **Next Steps After Testing**

1. **Configure Real APIs:** Add valid Mercado Pago and Binance credentials
2. **Set Up Database:** Run migrations and seed initial data
3. **Configure Webhooks:** Set up Mercado Pago webhook endpoints
4. **Test Real Transactions:** Execute actual crypto trades
5. **Security Testing:** Verify authentication and authorization

## 📞 **Support**

If you encounter issues:

1. Check browser console for errors
2. Check terminal for server errors
3. Verify all environment variables are set
4. Ensure database is accessible
5. Test API endpoints individually
