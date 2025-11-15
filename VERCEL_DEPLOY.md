# Vercel Configuration for Bets Comparator

## 🚀 Deploy Instructions

### 1. Connect to Vercel

**Via GitHub (Recommended):**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js settings

**Via Vercel CLI:**
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 2. Environment Variables

Set these in Vercel Dashboard > Settings > Environment Variables:

#### Required
```env
DATABASE_URL=postgresql://user:pass@host:port/db
BETTER_AUTH_SECRET=your-secret-minimum-32-characters
BETTER_AUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NODE_ENV=production
```

#### Optional but Recommended
```env
RESEND_API_KEY=re_your-resend-key
FROM_EMAIL=noreply@your-domain.com
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-your-token
MERCADO_PAGO_PUBLIC_KEY=your-public-key
MERCADO_PAGO_PIX_KEY=your-pix-key
DEMO_MODE=false
BINANCE_API_KEY=your-binance-key
BINANCE_SECRET_KEY=your-binance-secret
BINANCE_TESTNET=false
TEXTBELT_API_KEY=textbelt
```

### 3. Build Settings

Vercel will auto-detect these settings:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### 4. Database Setup

After deployment:
1. Go to Vercel Dashboard > Functions
2. Open terminal
3. Run: `npx prisma db push`

### 5. Domain Configuration

1. Go to Vercel Dashboard > Settings > Domains
2. Add your custom domain
3. Update environment variables:
   - `BETTER_AUTH_URL=https://your-domain.com`
   - `NEXT_PUBLIC_BASE_URL=https://your-domain.com`

### 6. Performance Optimizations

The project is already optimized for Vercel:
- ✅ Next.js 15 with App Router
- ✅ Server-side rendering
- ✅ Image optimization
- ✅ Bundle splitting
- ✅ Edge functions ready
- ✅ Security headers configured

### 7. Monitoring

- **Analytics:** Enable Vercel Analytics
- **Logs:** Monitor in Vercel Dashboard
- **Performance:** Use Core Web Vitals
- **Errors:** Set up error tracking

### 8. Troubleshooting

**Build Fails:**
- Check environment variables
- Verify database connection
- Run `npm run build` locally first

**Database Issues:**
- Verify `DATABASE_URL` format
- Check database permissions
- Run `npx prisma db push`

**Auth Issues:**
- Verify `BETTER_AUTH_SECRET` (32+ chars)
- Check `BETTER_AUTH_URL` matches domain
- Clear browser cookies

### 9. Production Checklist

- [ ] Environment variables configured
- [ ] Database connected and migrated
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Admin user created
- [ ] Payment methods configured
- [ ] Email service configured
- [ ] Analytics enabled
- [ ] Error monitoring set up
- [ ] Backup strategy in place

---

**Ready for Production! 🎉**
