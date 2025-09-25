import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  usedBackupCode?: string;
}

export class TwoFactorService {
  /**
   * Generate a new 2FA secret and QR code for a user
   */
  static async generateSecret(
    userEmail: string,
    serviceName: string = "BS Market"
  ): Promise<TwoFactorSetup> {
    // Generate a secret
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: serviceName,
      length: 32,
    });

    // Generate QR code data URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32 || "",
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify a TOTP token
   */
  static verifyToken(
    secret: string,
    token: string,
    window: number = 1
  ): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window, // Allow for time drift
    });
  }

  /**
   * Verify a token or backup code
   */
  static verifyTokenOrBackupCode(
    secret: string,
    token: string,
    backupCodes: string[]
  ): TwoFactorVerification {
    // First try to verify as TOTP token
    if (this.verifyToken(secret, token)) {
      return { isValid: true };
    }

    // Then try to verify as backup code
    const normalizedToken = token.replace(/[-\s]/g, "").toLowerCase();
    const matchingCode = backupCodes.find(
      (code) => code.replace(/[-\s]/g, "").toLowerCase() === normalizedToken
    );

    if (matchingCode) {
      return { isValid: true, usedBackupCode: matchingCode };
    }

    return { isValid: false };
  }

  /**
   * Generate backup codes for account recovery
   */
  static generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString("hex").toUpperCase();
      // Format as XXXX-XXXX for readability
      const formattedCode = `${code.slice(0, 4)}-${code.slice(4)}`;
      codes.push(formattedCode);
    }
    return codes;
  }

  /**
   * Remove a used backup code from the list
   */
  static removeUsedBackupCode(
    backupCodes: string[],
    usedCode: string
  ): string[] {
    return backupCodes.filter((code) => code !== usedCode);
  }

  /**
   * Generate new backup codes (when user requests new ones)
   */
  static regenerateBackupCodes(): string[] {
    return this.generateBackupCodes();
  }

  /**
   * Validate the format of a 2FA token
   */
  static isValidTokenFormat(token: string): boolean {
    // TOTP tokens are 6 digits
    const totpPattern = /^\d{6}$/;
    // Backup codes are 8 characters with optional dash
    const backupPattern = /^[A-Fa-f0-9]{4}-?[A-Fa-f0-9]{4}$/;

    return totpPattern.test(token) || backupPattern.test(token);
  }

  /**
   * Generate a current TOTP token for testing purposes
   */
  static generateCurrentToken(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: "base32",
    });
  }
}

export default TwoFactorService;

