# TextBelt SMS Setup Guide

This guide will help you set up TextBelt as your SMS provider for BS Market - a **100% FREE** alternative to Twilio and AWS SNS.

## 🎯 **Why TextBelt?**

- **🆓 100% FREE** - No registration, no credit card required
- **⚡ Works Immediately** - No setup process needed
- **🌍 Global Coverage** - Works worldwide
- **🔒 No Data Collection** - Privacy-focused
- **📱 Simple API** - Easy to integrate
- **💰 Zero Cost** - Completely free forever

## 🚀 **Setup Steps**

### 1. No Registration Required!

TextBelt works out of the box with no registration needed. However, for higher limits, you can get a free API key.

### 2. Get Free API Key (Optional)

1. **Visit TextBelt**: Go to [textbelt.com](https://textbelt.com)
2. **Get Free Key**: Click "Get Free API Key"
3. **Enter Email**: Provide your email address
4. **Receive Key**: Check your email for the API key
5. **Add to Environment**: Add the key to your `.env` file

### 3. Update Environment Variables

Add this to your `.env` file:

```env
# SMS Configuration (TextBelt - 100% FREE)
TEXTBELT_API_KEY="your-free-api-key"  # Optional: Get from textbelt.com
```

**Note**: If you don't set `TEXTBELT_API_KEY`, it will use the default "textbelt" key with basic limits.

### 4. Test the Setup

1. **Start your development server**:

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. **Test SMS functionality**:
   - Go to your signup page
   - Enter a phone number
   - Check if SMS is sent successfully
   - In development mode, SMS will be logged to console

## 📊 **Cost Comparison**

| Service      | Cost                                   | Registration Required | Credit Card Required |
| ------------ | -------------------------------------- | --------------------- | -------------------- |
| **Twilio**   | $15/month minimum                      | ✅ Yes                | ✅ Yes               |
| **AWS SNS**  | 100 SMS/month FREE, then $0.75/100 SMS | ✅ Yes                | ✅ Yes               |
| **TextBelt** | **100% FREE**                          | ❌ No                 | ❌ No                |

**Savings**: $15/month minimum with TextBelt vs Twilio!

## 🔧 **Code Changes Made**

### Updated Files:

1. **`src/lib/sms.ts`**:

   - Replaced AWS SNS with TextBelt API
   - Simple HTTP requests to textbelt.com
   - No external SDK dependencies

2. **`env.example`**:
   - Updated with TextBelt configuration
   - Added setup instructions

### No Breaking Changes:

- All existing API endpoints work the same
- Same SMS functionality
- Same verification flow
- Same development mode behavior

## 🧪 **Testing**

### Development Mode:

- SMS is mocked and logged to console
- Perfect for local development and testing
- No actual SMS sent during development

### Production Mode:

- SMS sent via TextBelt API
- Real SMS delivery to phone numbers
- Monitor delivery in TextBelt dashboard (if using API key)

## 📈 **Monitoring Usage**

### With Free API Key:

1. **TextBelt Dashboard**: Log into textbelt.com with your email
2. **View Statistics**: See delivery rates and usage
3. **Monitor Limits**: Track your monthly usage

### Without API Key:

- Basic usage with default limits
- No dashboard access
- Still works perfectly for development

## 🚨 **Important Notes**

1. **Phone Number Format**: TextBelt accepts international format (e.g., `+5511999999999` for Brazil)

2. **Rate Limits**:

   - **Without API Key**: 1 SMS per day per phone number
   - **With Free API Key**: 100 SMS per month
   - **With Paid Key**: Higher limits available

3. **Geographic Coverage**: TextBelt works in most countries, including Brazil

4. **Message Content**: Keep messages appropriate and follow local SMS regulations

## 🔄 **Migration from Other Services**

### From Twilio:

1. Remove Twilio environment variables
2. Add TextBelt configuration
3. No code changes needed (already updated)

### From AWS SNS:

1. Remove AWS environment variables
2. Add TextBelt configuration
3. No code changes needed (already updated)

## ✅ **Verification Checklist**

- [ ] TextBelt API key obtained (optional)
- [ ] Environment variables updated
- [ ] Application tested in development
- [ ] SMS functionality verified
- [ ] Production deployment tested

## 🆘 **Troubleshooting**

### Common Issues:

1. **"Invalid Phone Number" Error**:

   - Ensure phone number is in international format (+55...)
   - Check phone number validation in your code

2. **"Daily Limit Exceeded" Error**:

   - Get a free API key from textbelt.com for higher limits
   - Or wait 24 hours for the limit to reset

3. **SMS Not Delivered**:
   - Check phone number format
   - Verify the destination country is supported
   - Check TextBelt status page

### Support:

- TextBelt Documentation: [textbelt.com](https://textbelt.com)
- TextBelt Support: Available through their website

## 🎉 **Benefits Summary**

✅ **Zero Cost** - Completely free forever  
✅ **No Registration** - Works immediately  
✅ **No Credit Card** - No payment required  
✅ **Global Coverage** - Works worldwide  
✅ **Simple Setup** - Just add environment variable  
✅ **Reliable** - Used by thousands of developers  
✅ **Privacy Focused** - No data collection

---

**Congratulations!** You've successfully set up TextBelt and are now using a completely free SMS service with zero setup requirements! 🎉

Your SMS verification will work exactly the same as before, but now it's 100% free and requires no registration or credit card!

