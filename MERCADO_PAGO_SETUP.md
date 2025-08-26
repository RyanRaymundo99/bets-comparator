# Mercado Pago Setup Guide

## Overview

This guide will help you configure Mercado Pago to generate real, working PIX QR codes that Brazilian banks can actually scan and process.

## Prerequisites

- A Mercado Pago business account
- Access to Mercado Pago's developer dashboard

## Step 1: Get Your Mercado Pago Credentials

1. **Log in to Mercado Pago Developer Dashboard**

   - Go to [https://www.mercadopago.com/developers](https://www.mercadopago.com/developers)
   - Sign in with your Mercado Pago account

2. **Create a New Application**

   - Click on "Create Application"
   - Give it a name (e.g., "BS Market")
   - Select "Production" environment

3. **Get Your Access Token**

   - In your application dashboard, go to "Credentials"
   - Copy your "Access Token" (starts with `APP_USR-`)

4. **Get Your Public Key**
   - In the same credentials section, copy your "Public Key"

## Step 2: Configure Environment Variables

1. **Create or update your `.env` file** in the root of your project:

```env
# Mercado Pago API (for real PIX payments)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-your-access-token-here
MERCADO_PAGO_PUBLIC_KEY=your-public-key-here

# Optional: Set to false to disable demo mode
DEMO_MODE=false
```

2. **Restart your development server** after updating the `.env` file

## Step 3: Test the Integration

1. **Generate a PIX payment** through your deposits page
2. **Check the console logs** to see if Mercado Pago API calls are successful
3. **Verify the QR code** - it should now show "QR Code Real do Mercado Pago" instead of "Modo de Teste"

## Step 4: Configure PIX Key (Optional but Recommended)

For better PIX integration, you can also configure a specific PIX key:

1. **In Mercado Pago Dashboard**, go to "PIX" section
2. **Add a PIX key** (CPF, CNPJ, email, or phone)
3. **Update your environment variables**:

```env
MERCADO_PAGO_PIX_KEY=your-pix-key-here
```

## Troubleshooting

### Common Issues

1. **"Access Token not configured" error**

   - Make sure your `.env` file is in the root directory
   - Verify the variable names are exactly as shown
   - Restart your development server

2. **"Invalid credentials" error**

   - Check that your access token is correct
   - Ensure your Mercado Pago account is active
   - Verify you're using the right environment (test vs production)

3. **QR Code not generating**
   - Check browser console for errors
   - Verify Mercado Pago API is responding
   - Check network tab for failed requests

### Testing vs Production

- **Test Environment**: Use test credentials for development
- **Production Environment**: Use production credentials for live users

## Security Notes

- **Never commit your `.env` file** to version control
- **Keep your access token secure** - it provides full access to your Mercado Pago account
- **Use environment-specific credentials** for different deployment environments

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Mercado Pago credentials are correct
3. Check Mercado Pago's API documentation
4. Contact Mercado Pago support if needed

## API Endpoints Used

- `POST /v1/payments` - Create PIX payment
- `GET /v1/payments/{id}` - Get payment status

## PIX QR Code Format

The system generates PIX QR codes following the Brazilian Central Bank's EMV QR Code standard, which ensures compatibility with all Brazilian banking apps.
