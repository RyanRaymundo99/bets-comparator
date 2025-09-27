interface SMSResult {
  success: boolean;
  messageId?: string;
  message?: string;
}

export class SMSService {
  /**
   * Send SMS using TextBelt (100% Free) or mock for development
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
      };
    }

    try {
      // TextBelt API - 100% Free, no registration required
      const response = await fetch("https://textbelt.com/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: to,
          message: message,
          key: process.env.TEXTBELT_API_KEY || "textbelt", // Optional API key for higher limits
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ SMS sent successfully via TextBelt: ${result.textId}`);
        return {
          success: true,
          messageId: result.textId,
          message: "SMS sent successfully via TextBelt",
        };
      } else {
        console.error("❌ TextBelt API error:", result.error);
        return {
          success: false,
          message: result.error || "Failed to send SMS via TextBelt",
        };
      }
    } catch (error) {
      console.error("❌ Error sending SMS via TextBelt:", error);

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to send SMS via TextBelt",
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
