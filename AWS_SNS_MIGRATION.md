# AWS SNS Migration Guide

This guide will help you migrate from Twilio to AWS SNS for SMS verification in your BS Market application.

## 🎯 **Why AWS SNS?**

- **Free Tier**: 100 SMS messages per month (vs Twilio's $15/month minimum)
- **Pay-as-you-go**: Only $0.75 per 100 SMS after free tier
- **Reliable**: AWS infrastructure with 99.9% uptime
- **No phone number required**: Unlike Twilio, you don't need to purchase a phone number
- **Global coverage**: Works worldwide

## 🚀 **Setup Steps**

### 1. Create AWS Account (Free)

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Follow the registration process (requires credit card for verification, but won't charge you)
4. Complete the account setup

### 2. Create IAM User for SNS

1. **Go to IAM Console**:

   - Log into AWS Console
   - Search for "IAM" in the services
   - Click "Users" in the left sidebar

2. **Create New User**:

   - Click "Create user"
   - Username: `bs-market-sns-user`
   - Select "Programmatic access"

3. **Set Permissions**:

   - Click "Attach policies directly"
   - Search for "SNS" and select "AmazonSNSFullAccess"
   - Click "Next" and "Create user"

4. **Generate Access Keys**:
   - Click on your new user
   - Go to "Security credentials" tab
   - Click "Create access key"
   - Select "Application running outside AWS"
   - **IMPORTANT**: Copy the Access Key ID and Secret Access Key immediately

### 3. Update Environment Variables

Replace your Twilio environment variables with AWS SNS variables:

```env
# Remove these Twilio variables:
# TWILIO_ACCOUNT_SID="..."
# TWILIO_AUTH_TOKEN="..."
# TWILIO_PHONE_NUMBER="..."

# Add these AWS SNS variables:
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_REGION="us-east-1"  # Optional, defaults to us-east-1
```

### 4. Test the Migration

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
   - In development mode, SMS will be logged to console if AWS credentials are not set

## 📊 **Cost Comparison**

| Service     | Free Tier          | Cost After Free Tier |
| ----------- | ------------------ | -------------------- |
| **Twilio**  | $15/month minimum  | $0.0075 per SMS      |
| **AWS SNS** | 100 SMS/month FREE | $0.0075 per SMS      |

**Savings**: $15/month minimum with AWS SNS vs Twilio!

## 🔧 **Code Changes Made**

### Updated Files:

1. **`src/lib/sms.ts`**:

   - Replaced Twilio SDK with AWS SNS SDK
   - Updated authentication method
   - Maintained same API interface for compatibility

2. **`env.example`**:
   - Replaced Twilio environment variables with AWS SNS variables
   - Added setup instructions

### No Breaking Changes:

- All existing API endpoints work the same
- Same SMS functionality
- Same verification flow
- Same development mode behavior

## 🧪 **Testing**

### Development Mode:

- If AWS credentials are not set, SMS will be mocked and logged to console
- Perfect for local development and testing

### Production Mode:

- Set your AWS credentials in environment variables
- SMS will be sent via AWS SNS
- Monitor usage in AWS Console

## 📈 **Monitoring Usage**

1. **AWS Console**:

   - Go to SNS service
   - Click "Text messaging (SMS)" in left sidebar
   - View delivery statistics and usage

2. **Billing**:
   - Go to AWS Billing Dashboard
   - Monitor SNS charges
   - Set up billing alerts if needed

## 🚨 **Important Notes**

1. **Phone Number Format**: AWS SNS requires international format (e.g., `+5511999999999` for Brazil)

2. **Rate Limits**: AWS SNS has rate limits:

   - 20 SMS per second per account
   - 200 SMS per day per destination number (for unverified accounts)

3. **Spending Limits**: Set up AWS billing alerts to avoid unexpected charges

4. **Security**: Keep your AWS credentials secure and never commit them to version control

## 🔄 **Rollback Plan**

If you need to rollback to Twilio:

1. Revert the changes to `src/lib/sms.ts`
2. Restore Twilio environment variables
3. Reinstall Twilio SDK: `pnpm add twilio`
4. Remove AWS SDK: `pnpm remove @aws-sdk/client-sns`

## ✅ **Verification Checklist**

- [ ] AWS account created
- [ ] IAM user created with SNS permissions
- [ ] Access keys generated and saved securely
- [ ] Environment variables updated
- [ ] Application tested in development
- [ ] SMS functionality verified
- [ ] Production deployment tested

## 🆘 **Troubleshooting**

### Common Issues:

1. **"Access Denied" Error**:

   - Check IAM user has SNS permissions
   - Verify access keys are correct

2. **"Invalid Phone Number" Error**:

   - Ensure phone number is in international format (+55...)
   - Check phone number validation in your code

3. **SMS Not Delivered**:
   - Check AWS SNS delivery logs
   - Verify phone number format
   - Check if destination country is supported

### Support:

- AWS SNS Documentation: [docs.aws.amazon.com/sns](https://docs.aws.amazon.com/sns)
- AWS Support (if you have a support plan)

---

**Congratulations!** You've successfully migrated from Twilio to AWS SNS and are now saving $15/month while maintaining the same SMS functionality! 🎉

