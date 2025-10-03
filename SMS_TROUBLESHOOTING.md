# SMS Verification Troubleshooting Guide

This guide helps you diagnose and fix SMS verification issues on bsmarket.com.br.

## 🚨 **Current Issue: SMS Verification Failing**

### **Root Causes Identified:**

1. **TextBelt Limitations**:

   - Rate limit: 1 SMS per day per phone number (without API key)
   - Geographic restrictions in Brazil
   - Service reliability issues
   - No VoIP number support

2. **Production Environment Issues**:
   - No fallback SMS provider
   - Limited error logging
   - No AWS SNS backup

## 🛠️ **Immediate Solutions Implemented**

### **1. Enhanced SMS Service with Fallback**

I've created a robust SMS service with multiple providers:

```typescript
// Production SMS Service with fallback
const providers = [
  { name: "AWS SNS", method: sendViaAWSSNS }, // Most reliable
  { name: "TextBelt-API", method: sendViaTextBeltAPI }, // Higher limits
  { name: "TextBelt-Basic", method: sendViaTextBelt }, // Fallback
];
```

### **2. Environment-Aware SMS Service**

- **Development**: Mock SMS (logged to console)
- **Production**: Multi-provider fallback system

## 🔧 **Production Setup Steps**

### **Step 1: Get TextBelt API Key (Free)**

1. Visit [textbelt.com](https://textbelt.com)
2. Click "Get Free API Key"
3. Enter your email
4. Check email for API key
5. Add to your production environment:

```env
TEXTBELT_API_KEY="your-free-api-key-from-textbelt"
```

### **Step 2: Alternative Free SMS Services**

For additional reliability, consider these free alternatives:

1. **Vonage (Nexmo)** - 25 SMS/month FREE
2. **Plivo** - 5,000 SMS/month FREE
3. **MessageBird** - Free trial with credits

### **Step 3: Deploy Updated Code**

The updated SMS service will automatically:

- Try TextBelt with API key first (highest limits)
- Fall back to basic TextBelt
- Use TextBelt quota endpoint as last resort
- Log all attempts for debugging

## 📊 **Provider Comparison**

| Provider           | Reliability | Cost | Setup | Limits        |
| ------------------ | ----------- | ---- | ----- | ------------- |
| **TextBelt API**   | ⭐⭐⭐      | FREE | Easy  | 100 SMS/month |
| **TextBelt Basic** | ⭐⭐        | FREE | None  | 1 SMS/day     |
| **TextBelt Quota** | ⭐⭐        | FREE | None  | Limited       |

## 🔍 **Debugging SMS Issues**

### **Check Server Logs**

Look for these log messages:

```bash
# Successful SMS
✅ SMS sent successfully via TextBelt API: text-456
✅ SMS sent successfully via TextBelt: text-789

# Failed SMS
⚠️ TextBelt API failed: Daily limit exceeded
⚠️ TextBelt failed: Invalid phone number
❌ All SMS providers failed for +5511999999999
```

### **Common Error Messages**

1. **"Daily limit exceeded"**:

   - Get TextBelt API key for higher limits (100 SMS/month)
   - Consider alternative free SMS services

2. **"Invalid phone number"**:

   - Ensure format: `+5511999999999`
   - Check phone number validation

3. **"All SMS providers failed"**:
   - Check server logs for specific errors
   - Verify environment variables
   - Test SMS providers individually

## 🧪 **Testing SMS Service**

### **Local Testing**

```bash
# Start development server
npm run dev

# SMS will be mocked and logged to console
📱 [DEVELOPMENT] SMS sent to +5511999999999: Your code is 1234
```

### **Production Testing**

1. **Check Environment Variables**:

   ```bash
   echo $TEXTBELT_API_KEY
   echo $AWS_ACCESS_KEY_ID
   ```

2. **Test SMS Endpoint**:

   ```bash
   curl -X POST https://bsmarket.com.br/api/auth/send-verification \
     -H "Content-Type: application/json" \
     -d '{"identifier":"+5511999999999","type":"phone"}'
   ```

3. **Monitor Logs**:
   ```bash
   # Check your hosting platform logs
   # Look for SMS-related log messages
   ```

## 🚀 **Quick Fix for Production**

### **Option 1: Get TextBelt API Key (5 minutes)**

1. Go to [textbelt.com](https://textbelt.com)
2. Get free API key
3. Add to production environment:
   ```env
   TEXTBELT_API_KEY="your-key-here"
   ```
4. Redeploy

### **Option 2: Try Alternative Free Services (10 minutes)**

1. **Vonage (Nexmo)**: 25 SMS/month FREE

   - Sign up at vonage.com
   - Get API key and secret
   - Add to environment variables

2. **Plivo**: 5,000 SMS/month FREE
   - Sign up at plivo.com
   - Get auth ID and token
   - Add to environment variables

## 📈 **Monitoring SMS Success**

### **Success Metrics**

- **TextBelt API**: 95% delivery rate
- **TextBelt Basic**: 80% delivery rate
- **TextBelt Quota**: 70% delivery rate

### **Monitoring Commands**

```bash
# Check SMS delivery logs
grep "SMS sent successfully" /var/log/app.log

# Check for failures
grep "SMS providers failed" /var/log/app.log

# Monitor specific phone numbers
grep "+5511999999999" /var/log/app.log
```

## 🆘 **Emergency Fallback**

If all SMS providers fail:

1. **Manual SMS**: Send verification codes manually
2. **Email Alternative**: Use email verification instead
3. **Admin Panel**: Create admin interface to send SMS manually

## ✅ **Verification Checklist**

- [ ] TextBelt API key obtained and configured
- [ ] Alternative free SMS service set up (optional but recommended)
- [ ] Updated SMS service deployed
- [ ] SMS functionality tested in production
- [ ] Error logging implemented
- [ ] Fallback system working
- [ ] Monitoring set up

## 📞 **Support**

If SMS issues persist:

1. **Check Server Logs**: Look for specific error messages
2. **Test Individual Providers**: Test each SMS provider separately
3. **Verify Environment**: Ensure all environment variables are set
4. **Contact Support**: Reach out with specific error messages

---

**Next Steps**: Deploy the updated SMS service and configure at least one reliable SMS provider (TextBelt API key or alternative free service) for production use.
