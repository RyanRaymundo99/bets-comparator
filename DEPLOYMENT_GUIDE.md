# 🚀 BS Market - Complete Deployment Guide

## Quick Start (5 minutes)

### 1. Prerequisites

- [ ] GitHub account
- [ ] Vercel account
- [ ] PostgreSQL database (Neon/Supabase)
- [ ] Domain name (optional)

### 2. One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/bs-market)

## Manual Deployment

### Step 1: Database Setup

#### Option A: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech)
2. Create account and new project
3. Copy connection string
4. Set as `DATABASE_URL` in Vercel

#### Option B: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings > Database
4. Copy connection string

### Step 2: Deploy to Vercel

#### Method 1: GitHub Integration (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Configure environment variables
6. Deploy!

#### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 3: Environment Variables

Set these in Vercel Dashboard > Settings > Environment Variables:

#### Required Variables

```env
DATABASE_URL=postgresql://user:pass@host:port/db
BETTER_AUTH_SECRET=your-32-char-secret
BETTER_AUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
NODE_ENV=production
```

#### Payment Integration

```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-your-token
MERCADO_PAGO_PUBLIC_KEY=your-public-key
MERCADO_PAGO_PIX_KEY=your-pix-key
DEMO_MODE=false
```

#### Crypto Trading

```env
BINANCE_API_KEY=your-binance-key
BINANCE_SECRET_KEY=your-binance-secret
BINANCE_TESTNET=false
```

#### Communication

```env
RESEND_API_KEY=re_your-resend-key
FROM_EMAIL=noreply@your-domain.com
TEXTBELT_API_KEY=textbelt
```

### Step 4: Database Migration

After deployment, run database migration:

```bash
# In Vercel Dashboard > Functions > Terminal
npx prisma db push
```

### Step 5: Create Admin User

1. Go to `/admin/login`
2. Use default credentials or create via API
3. Enable 2FA for security

## Post-Deployment Configuration

### 1. Custom Domain

1. Go to Vercel Dashboard > Settings > Domains
2. Add your domain
3. Update environment variables:
   - `BETTER_AUTH_URL=https://your-domain.com`
   - `NEXT_PUBLIC_BASE_URL=https://your-domain.com`

### 2. SSL Certificate

- Automatically handled by Vercel
- Force HTTPS in production

### 3. Environment-Specific Settings

#### Production

```env
NODE_ENV=production
DEMO_MODE=false
BINANCE_TESTNET=false
```

#### Staging

```env
NODE_ENV=production
DEMO_MODE=true
BINANCE_TESTNET=true
```

## Monitoring & Maintenance

### 1. Vercel Analytics

- Enable in Vercel Dashboard
- Monitor Core Web Vitals
- Track performance metrics

### 2. Error Tracking

- Monitor logs in Vercel Dashboard
- Set up alerts for errors
- Use error tracking services

### 3. Database Monitoring

- Monitor connection pool
- Set up backup schedules
- Monitor query performance

### 4. Security

- Regular security audits
- Update dependencies
- Monitor for vulnerabilities

## Troubleshooting

### Common Issues

#### Build Fails

```bash
# Check build locally
npm run build

# Check environment variables
vercel env ls

# Check logs
vercel logs
```

#### Database Connection Issues

```bash
# Test connection
npx prisma db push

# Check DATABASE_URL format
echo $DATABASE_URL
```

#### Authentication Issues

- Verify `BETTER_AUTH_SECRET` (32+ chars)
- Check `BETTER_AUTH_URL` matches domain
- Clear browser cookies

#### Payment Issues

- Verify Mercado Pago credentials
- Check webhook URLs
- Test in sandbox mode first

### Performance Optimization

#### Next.js Optimizations

- Image optimization enabled
- Bundle splitting configured
- Tree shaking enabled
- Compression enabled

#### Database Optimizations

- Connection pooling
- Query optimization
- Index optimization
- Caching strategies

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Database credentials protected
- [ ] API keys rotated regularly
- [ ] 2FA enabled for admin
- [ ] Rate limiting configured
- [ ] Input validation enabled
- [ ] SQL injection prevention
- [ ] XSS protection enabled

## Backup Strategy

### Database Backups

- Automated daily backups
- Point-in-time recovery
- Cross-region replication

### Code Backups

- Git repository
- Automated deployments
- Rollback capabilities

## Scaling Considerations

### Horizontal Scaling

- Vercel handles automatically
- Edge functions for global performance
- CDN for static assets

### Database Scaling

- Connection pooling
- Read replicas
- Caching layers

### Monitoring Scaling

- Application metrics
- Database metrics
- User analytics
- Error tracking

## Support

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)

### Community

- [Vercel Discord](https://vercel.com/discord)
- [Next.js GitHub](https://github.com/vercel/next.js)

### Professional Support

- Vercel Pro support
- Database support
- Security consulting

---

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy
npm run deploy:vercel

# Database
npm run db:push
npm run db:studio

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

**Ready to deploy! 🚀**
