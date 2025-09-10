# Crypto Wallet Setup Guide

This guide explains how to set up and use the real crypto wallet system integrated with Binance API for buying USDT and other cryptocurrencies.

## 🚀 Features

- **Real Crypto Wallet**: Users can hold multiple cryptocurrencies
- **Binance Integration**: Real-time prices and trading from Binance exchange
- **USDT Trading**: Buy/sell USDT with BRL (Brazilian Real)
- **Multi-Crypto Support**: Trade various cryptocurrencies like BTC, ETH, BNB, etc.
- **Real-Time Prices**: Live price feeds from Binance
- **Order Management**: Track orders and transaction history
- **Portfolio Overview**: View total portfolio value in USDT

## 🔧 Setup Requirements

### 1. Binance API Keys

1. **Create Binance Account**: Sign up at [Binance.com](https://binance.com)
2. **Enable API Access**: Go to API Management in your account
3. **Create API Key**: Generate new API key and secret
4. **Set Permissions**: Enable spot trading permissions
5. **Get API Keys**: Copy your API key and secret

### 2. Environment Configuration

Add these variables to your `.env` file:

```bash
# Binance API Configuration
BINANCE_API_KEY="your-binance-api-key"
BINANCE_SECRET_KEY="your-binance-secret-key"
BINANCE_TESTNET="true"  # Set to "false" for production
```

### 3. Database Setup

The system uses the existing Prisma schema with these key models:

- **User**: User accounts and authentication
- **Balance**: Crypto and fiat balances
- **Order**: Trading orders and execution
- **Transaction**: Transaction history
- **Deposit/Withdrawal**: Fiat operations

## 📱 User Experience

### 1. Crypto Wallet (`/wallet`)

Users can access their crypto wallet at `/wallet` which includes:

- **Portfolio Overview**: Total value and asset distribution
- **Asset Balances**: View all crypto and fiat balances
- **Trading Interface**: Buy/sell USDT with BRL
- **Real-Time Prices**: Live crypto prices from Binance
- **Transaction History**: Complete trading history

### 2. Advanced Trading (`/advanced-trading`)

Professional trading interface at `/advanced-trading` featuring:

- **Multiple Trading Pairs**: BTC/USDT, ETH/USDT, BNB/USDT, etc.
- **Order Types**: Market and limit orders
- **Real-Time Data**: Live prices, order book, recent trades
- **Advanced Charts**: Price charts and market analysis

### 3. Trading Flow

#### Buying USDT with BRL:

1. User deposits BRL via Mercado Pago
2. User navigates to wallet or trading interface
3. Selects amount of BRL to spend
4. System calculates USDT amount based on current rate
5. Order is executed on Binance (or simulated in development)
6. Balances are updated in real-time

#### Selling USDT for BRL:

1. User selects amount of USDT to sell
2. System calculates BRL amount based on current rate
3. Order is executed on Binance (or simulated in development)
4. USDT is deducted and BRL is added to balance

## 🔒 Security Features

### 1. API Key Security

- API keys are stored in environment variables
- Never commit API keys to version control
- Use testnet for development and testing

### 2. User Authentication

- Session-based authentication
- User-specific balance isolation
- Transaction verification and logging

### 3. Rate Limiting

- Binance API rate limiting compliance
- Request throttling to prevent abuse

## 🧪 Testing

### 1. Testnet Mode

Set `BINANCE_TESTNET="true"` for development:

- Uses Binance testnet API
- No real money involved
- Test all features safely

### 2. Production Mode

Set `BINANCE_TESTNET="false"` for production:

- Uses real Binance API
- Real trading and real money
- Ensure proper testing before switching

## 📊 API Endpoints

### Crypto Wallet

- `GET /api/crypto/wallet` - Get user wallet data
- `GET /api/crypto/popular-pairs` - Get popular trading pairs
- `POST /api/crypto/buy-usdt` - Buy USDT with BRL
- `POST /api/crypto/sell-usdt` - Sell USDT for BRL

### Trading

- `POST /api/crypto/buy` - Buy any cryptocurrency
- `POST /api/crypto/sell` - Sell any cryptocurrency
- `GET /api/crypto/orderbook` - Get order book for pair
- `GET /api/crypto/recent-trades` - Get recent trades for pair

### Price Data

- `GET /api/crypto/price` - Get price for specific symbol
- Real-time price updates from Binance

## 🚨 Important Notes

### 1. Real Trading

- **This system executes real trades on Binance**
- **Users can lose money if not careful**
- **Always test thoroughly on testnet first**

### 2. Brazilian Market

- USDT/BRL trading requires special handling
- Consider integrating with Brazilian exchanges for better rates
- Current implementation uses approximate conversion rates

### 3. Compliance

- Ensure compliance with local financial regulations
- Implement proper KYC/AML procedures
- Consider legal requirements for crypto trading

## 🔄 Future Enhancements

### 1. Additional Features

- Stop-loss and take-profit orders
- Advanced charting with TradingView
- Mobile app support
- WebSocket for real-time updates

### 2. Exchange Integration

- Support for multiple exchanges
- Arbitrage opportunities
- Better liquidity management

### 3. Risk Management

- Position sizing tools
- Portfolio rebalancing
- Risk assessment algorithms

## 📞 Support

For technical support or questions:

1. Check the existing documentation
2. Review the code comments
3. Test with testnet first
4. Ensure proper API key configuration

## ⚠️ Disclaimer

This system is for educational and development purposes. Real cryptocurrency trading involves significant financial risk. Users should:

- Understand the risks involved
- Never invest more than they can afford to lose
- Seek professional financial advice
- Test thoroughly before using with real money

---

**Remember**: Always start with testnet and small amounts when moving to production!
