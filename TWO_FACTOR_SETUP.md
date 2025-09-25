# Two-Factor Authentication (2FA) Setup Guide

This guide explains how to use the 2FA system implemented in BS Market.

## 🔧 **Installation Completed**

The following packages were installed:

- `speakeasy` - TOTP generation and verification
- `qrcode` - QR code generation for easy setup
- `react-otp-input` - User-friendly OTP input component
- `@types/speakeasy` & `@types/qrcode` - TypeScript support

## 📊 **Database Schema Updated**

Added to the `User` model:

```prisma
// 2FA fields
twoFactorEnabled    Boolean @default(false)
twoFactorSecret     String?
twoFactorBackupCodes String[] @default([])
```

## 🛠 **Components Created**

### 1. **TwoFactorSetup** (`src/components/auth/TwoFactorSetup.tsx`)

- Complete setup wizard for enabling 2FA
- QR code generation and display
- Backup codes generation
- Step-by-step guided process

### 2. **TwoFactorVerification** (`src/components/auth/TwoFactorVerification.tsx`)

- Login verification component
- Supports both TOTP codes and backup codes
- Error handling and user guidance

### 3. **TwoFactorManagement** (`src/components/auth/TwoFactorManagement.tsx`)

- Dashboard for managing 2FA settings
- Enable/disable 2FA
- Generate new backup codes
- View backup code status

### 4. **OTPInput** (`src/components/ui/otp-input.tsx`)

- Reusable 6-digit code input component
- Auto-focus and keyboard navigation
- Error state styling

## 🔌 **API Routes**

### Setup Routes

- `POST /api/auth/2fa/setup` - Initialize 2FA setup
- `POST /api/auth/2fa/verify-setup` - Verify and enable 2FA

### Verification Routes

- `POST /api/auth/2fa/verify` - Verify 2FA during login

### Management Routes

- `POST /api/auth/2fa/disable` - Disable 2FA
- `GET /api/auth/2fa/backup-codes` - Get backup codes
- `POST /api/auth/2fa/backup-codes` - Generate new backup codes

## 📱 **Usage Examples**

### Enable 2FA in User Dashboard

```tsx
import { TwoFactorManagement } from "@/components/auth/TwoFactorManagement";

export default function SecurityPage() {
  return (
    <div>
      <h1>Security Settings</h1>
      <TwoFactorManagement />
    </div>
  );
}
```

### Add 2FA Verification to Login Flow

```tsx
import { TwoFactorVerification } from "@/components/auth/TwoFactorVerification";

export default function LoginPage() {
  const [needs2FA, setNeeds2FA] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  if (needs2FA) {
    return (
      <TwoFactorVerification
        email={userEmail}
        onSuccess={() => {
          // Complete login process
          window.location.href = "/dashboard";
        }}
        onBack={() => setNeeds2FA(false)}
      />
    );
  }

  // Regular login form...
}
```

## 🔒 **Security Features**

### TOTP (Time-based One-Time Password)

- 6-digit codes that change every 30 seconds
- Works with Google Authenticator, Authy, Microsoft Authenticator
- Time window tolerance for clock drift

### Backup Codes

- 8 single-use backup codes generated during setup
- Formatted as XXXX-XXXX for readability
- Automatic removal when used
- Can be regenerated with 2FA verification

### Additional Security

- Session-based authentication for API routes
- Rate limiting can be added to prevent brute force
- Secure secret storage in database
- Input validation for all 2FA tokens

## 🎯 **Integration with Better Auth**

To integrate with your existing Better Auth system, you'll need to:

1. **Update Login Flow**

   - After successful password verification, check if user has 2FA enabled
   - If enabled, show TwoFactorVerification component
   - Only create session after both password and 2FA verification

2. **Add 2FA Status to User Session**

   ```typescript
   // In your auth configuration
   session: {
     strategy: "database",
     // Add 2FA verification step
   }
   ```

3. **Protect Sensitive Operations**
   - Require 2FA re-verification for sensitive actions
   - Check 2FA status before allowing critical operations

## 📋 **Setup Checklist**

- [x] Install required packages
- [x] Update database schema
- [x] Create 2FA service layer
- [x] Build UI components
- [x] Implement API routes
- [x] Create security management page
- [ ] **TODO: Integrate with login flow**
- [ ] **TODO: Add to sensitive operations**
- [ ] **TODO: Test complete flow**

## 🧪 **Testing**

1. **Navigate to Security Page**: Go to `/security`
2. **Enable 2FA**: Click "Enable 2FA" and follow the setup wizard
3. **Test Verification**: Use your authenticator app to verify codes
4. **Test Backup Codes**: Try using a backup code
5. **Management Features**: Generate new backup codes, disable 2FA

## 🔧 **Next Steps**

1. **Integrate with login flow** - Add 2FA check to Better Auth
2. **Add to navigation** - Link to `/security` page in user menu
3. **Enhance security** - Add 2FA requirement for sensitive operations
4. **Add rate limiting** - Prevent brute force attacks on 2FA endpoints
5. **Email notifications** - Alert users when 2FA is enabled/disabled

## 🎉 **Ready to Use!**

Your 2FA system is now implemented and ready for integration. The components are modular and can be easily integrated into your existing authentication flow.

For any questions or customization needs, refer to the component documentation in the source files.

