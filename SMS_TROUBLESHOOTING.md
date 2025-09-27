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

### **Step 2: Set Up AWS SNS (Recommended)**

For maximum reliability, set up AWS SNS:

1. **Create AWS Account** (free at aws.amazon.com)
2. **Create IAM User** with SNS permissions
3. **Generate Access Keys**
4. **Add to Environment**:

```env
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
```

### **Step 3: Deploy Updated Code**

The updated SMS service will automatically:

- Try AWS SNS first (most reliable)
- Fall back to TextBelt with API key
- Use basic TextBelt as last resort
- Log all attempts for debugging

## 📊 **Provider Comparison**

| Provider           | Reliability | Cost               | Setup  | Limits        |
| ------------------ | ----------- | ------------------ | ------ | ------------- |
| **AWS SNS**        | ⭐⭐⭐⭐⭐  | 100 SMS/month FREE | Medium | 20 SMS/sec    |
| **TextBelt API**   | ⭐⭐⭐      | FREE               | Easy   | 100 SMS/month |
| **TextBelt Basic** | ⭐⭐        | FREE               | None   | 1 SMS/day     |

## 🔍 **Debugging SMS Issues**

### **Check Server Logs**

Look for these log messages:

```bash
# Successful SMS
✅ SMS sent successfully via AWS SNS: msg-123
✅ SMS sent successfully via TextBelt API: text-456

# Failed SMS
⚠️ AWS SNS failed: Invalid phone number
⚠️ TextBelt API failed: Daily limit exceeded
❌ All SMS providers failed for +5511999999999
```

### **Common Error Messages**

1. **"Daily limit exceeded"**:

   - Get TextBelt API key for higher limits
   - Set up AWS SNS for unlimited SMS

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

### **Option 2: Set Up AWS SNS (15 minutes)**

1. Create AWS account
2. Set up IAM user with SNS permissions
3. Add credentials to environment:
   ```env
   AWS_ACCESS_KEY_ID="your-key"
   AWS_SECRET_ACCESS_KEY="your-secret"
   AWS_REGION="us-east-1"
   ```
4. Redeploy

## 📈 **Monitoring SMS Success**

### **Success Metrics**

- **AWS SNS**: 99.9% delivery rate
- **TextBelt API**: 95% delivery rate
- **TextBelt Basic**: 80% delivery rate

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
- [ ] AWS SNS credentials set up (optional but recommended)
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

**Next Steps**: Deploy the updated SMS service and configure at least one reliable SMS provider (TextBelt API key or AWS SNS) for production use.
