import ProductionSMSService from "./sms-production";

interface SMSResult {
  success: boolean;
  messageId?: string;
  message?: string;
  provider?: string;
}

export class SMSService {
  /**
   * Send SMS with environment-aware provider selection
   */
  static async sendSMS(to: string, message: string): Promise<SMSResult> {
    console.log(`📱 Attempting to send SMS to ${to}: ${message}`);

    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment) {
      // Mock SMS for development
      console.log(`📱 [DEVELOPMENT] SMS sent to ${to}: ${message}`);
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        message: "SMS sent successfully (development mode)",
        provider: "Development",
      };
    }

    // Use production SMS service for production
    return ProductionSMSService.sendSMS(to, message);
  }

  /**
   * Send verification code via SMS
   */
  static async sendVerificationCode(
    phone: string,
    code: string
  ): Promise<SMSResult> {
    const message = `Your BS Market verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`;

    return this.sendSMS(phone, message);
  }

  /**
   * Send password reset code via SMS
   */
  static async sendPasswordResetCode(
    phone: string,
    code: string
  ): Promise<SMSResult> {
    const message = `Your BS Market password reset code is: ${code}. This code expires in 10 minutes. If you didn't request this, please ignore this message.`;

    return this.sendSMS(phone, message);
  }

  /**
   * Validate phone number format (Brazilian format)
   */
  static validatePhoneNumber(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // Brazilian phone numbers: 11 digits (country code 55 + area code + number)
    // Format: +55 11 99999-9999 or variations

    // Check if it's a valid Brazilian phone number
    const brazilianPattern = /^55\d{10,11}$/; // With country code
    const localPattern = /^\d{10,11}$/; // Without country code

    return brazilianPattern.test(cleaned) || localPattern.test(cleaned);
  }

  /**
   * Format phone number to international format
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");

    // Add Brazil country code if not present
    if (cleaned.length === 10 || cleaned.length === 11) {
      return `+55${cleaned}`;
    }

    // Already has country code
    if (
      cleaned.startsWith("55") &&
      (cleaned.length === 12 || cleaned.length === 13)
    ) {
      return `+${cleaned}`;
    }

    return phone; // Return as-is if format is unclear
  }
}

export default SMSService;
