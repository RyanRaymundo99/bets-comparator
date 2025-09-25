# Email Setup Guide

This guide will help you set up email functionality for the BS Market application.

## Option 1: Resend (Recommended for Production)

### Quick Testing Setup

For immediate testing, you can use Resend's sandbox domain:

```env
RESEND_API_KEY=re_your_actual_api_key
# Leave FROM_EMAIL empty to use sandbox domain automatically
```

The system will automatically use `onboarding@resend.dev` for testing.

### Production Setup

For production, you need to verify your domain:

1. **Get Resend API Key:**

   - Go to [resend.com](https://resend.com)
   - Sign up and create an API key

2. **Verify Your Domain:**

   - Go to [resend.com/domains](https://resend.com/domains)
   - Add your domain (e.g., `bsmarket.com.br`)
   - Add the required DNS records
   - Wait for verification

3. **Configure Environment:**
   ```env
   RESEND_API_KEY=re_your_actual_api_key
   FROM_EMAIL=noreply@yourdomain.com
   ```

## Option 2: Gmail SMTP (Good for Development)

### Setup Gmail App Password

1. **Enable 2-Factor Authentication** on your Google account
2. **Go to Google Account Settings** → Security → 2-Step Verification
3. **Generate App Password:**
   - Select "Mail" as the app
   - Copy the 16-character password
4. **Configure Environment:**
   ```env
   EMAIL_SERVER_USER=your-email@gmail.com
   EMAIL_SERVER_PASSWORD=abcd efgh ijkl mnop
   ```

## Option 3: Local Development (MailDev)

For local development without external email services:

1. **Install MailDev:**

   ```bash
   npm install -g maildev
   ```

2. **Run MailDev:**

   ```bash
   maildev
   ```

3. **View Emails:**

   - Open `http://localhost:1080` in your browser
   - All emails will be captured locally

4. **No Environment Variables Needed** - the system will automatically use local SMTP

## Testing Your Setup

1. **Start the application:**

   ```bash
   npm run dev
   ```

2. **Test email functionality:**

   - Go to `http://localhost:3000/test-forgot-password`
   - Test basic email sending first
   - Then test forgot password flow

3. **Use the actual forgot password:**
   - Go to `http://localhost:3000/forgot-password`
   - Enter a valid email address
   - Check your email (or MailDev interface)

## Common Issues

### Resend Domain Not Verified Error

**Error:** `The yourdomain.com domain is not verified`

**Solution:**

- Use `onboarding@resend.dev` for testing (set FROM_EMAIL or leave empty)
- For production, verify your domain at https://resend.com/domains

### Gmail Authentication Error

**Error:** `Invalid login`

**Solution:**

- Make sure 2FA is enabled
- Use App Password (not your regular password)
- Check that EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD are correct

### Local Development Not Working

**Error:** `Connection refused`

**Solution:**

- Install and run MailDev: `npm install -g maildev && maildev`
- Check that MailDev is running on port 1025

## Environment Variables Summary

```env
# Required for Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Database
DATABASE_URL=your-database-url

# Email Option 1: Resend (Production)
RESEND_API_KEY=re_your_api_key
FROM_EMAIL=onboarding@resend.dev  # or your verified domain

# Email Option 2: Gmail (Development)
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password

# Email Option 3: Local (no variables needed)
# Just run: maildev
```

## Security Notes

- **Never commit real API keys** to version control
- **Use environment variables** for all sensitive data
- **For production:** Always use verified domains with Resend
- **For Gmail:** Always use App Passwords, never your main password
