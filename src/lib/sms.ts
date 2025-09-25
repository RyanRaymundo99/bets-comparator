interface SMSResult {
  success: boolean;
  messageId?: string;
  message?: string;
}

export class SMSService {
  private static client: unknown | null = null;

  private static getClient() {
    if (!this.client) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        throw new Error("Twilio credentials not configured");
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require("twilio");
      this.client = twilio(accountSid, authToken);
    }

    return this.client;
  }

  /**
   * Send SMS using Twilio or mock for development
   */
  static async sendSMS(to: string, message: string): Promise<SMSResult> {
    console.log(`📱 Attempting to send SMS to ${to}: ${message}`);

    // Check if we're in development mode or if Twilio is not configured
    const isDevelopment = process.env.NODE_ENV === "development";
    const hasRealTwilio =
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;

    if (isDevelopment && !hasRealTwilio) {
      // Mock SMS for development
      console.log(`📱 [DEVELOPMENT] SMS sent to ${to}: ${message}`);
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        message: "SMS sent successfully (development mode)",
      };
    }

    try {
      const client = this.getClient();
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!fromNumber) {
        throw new Error("Twilio phone number not configured");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (client as any).messages.create({
        body: message,
        from: fromNumber,
        to: to,
      });

      console.log(`✅ SMS sent successfully: ${result.sid}`);

      return {
        success: true,
        messageId: result.sid,
        message: "SMS sent successfully",
      };
    } catch (error) {
      console.error("❌ Error sending SMS:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send SMS",
      };
    }
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
