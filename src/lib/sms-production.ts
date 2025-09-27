/**
 * Production SMS Service with Multiple Providers
 * Fallback system for reliable SMS delivery
 */

import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

interface SMSResult {
  success: boolean;
  messageId?: string;
  message?: string;
  provider?: string;
}

export class ProductionSMSService {
  private static snsClient: SNSClient | null = null;

  /**
   * Send SMS with production-grade reliability
   */
  static async sendSMS(to: string, message: string): Promise<SMSResult> {
    console.log(`📱 [PRODUCTION] Attempting to send SMS to ${to}`);

    // Try providers in order of reliability
    const providers = [
      { name: "AWS SNS", method: this.sendViaAWSSNS },
      { name: "TextBelt-API", method: this.sendViaTextBeltAPI },
      { name: "TextBelt-Basic", method: this.sendViaTextBelt },
    ];

    for (const provider of providers) {
      try {
        console.log(`📱 Trying ${provider.name}...`);
        const result = await provider.method(to, message);

        if (result.success) {
          console.log(
            `✅ SMS sent successfully via ${provider.name}: ${result.messageId}`
          );
          return {
            ...result,
            provider: provider.name,
          };
        } else {
          console.warn(`⚠️ ${provider.name} failed: ${result.message}`);
        }
      } catch (error) {
        console.error(`❌ ${provider.name} error:`, error);
      }
    }

    // If all providers fail, log for manual processing
    console.error(`❌ All SMS providers failed for ${to}`);
    return {
      success: false,
      message: "SMS service temporarily unavailable. Please try again later.",
      provider: "None",
    };
  }

  /**
   * Send via AWS SNS (most reliable)
   */
  private static async sendViaAWSSNS(
    to: string,
    message: string
  ): Promise<SMSResult> {
    const hasAWSCredentials =
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

    if (!hasAWSCredentials) {
      throw new Error("AWS credentials not configured");
    }

    if (!this.snsClient) {
      const region = process.env.AWS_REGION || "us-east-1";
      this.snsClient = new SNSClient({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
      });
    }

    const command = new PublishCommand({
      Message: message,
      PhoneNumber: to,
    });

    const result = await this.snsClient.send(command);

    return {
      success: true,
      messageId: result.MessageId,
      message: "SMS sent successfully via AWS SNS",
    };
  }

  /**
   * Send via TextBelt with API key
   */
  private static async sendViaTextBeltAPI(
    to: string,
    message: string
  ): Promise<SMSResult> {
    const apiKey = process.env.TEXTBELT_API_KEY;
    if (!apiKey || apiKey === "textbelt") {
      throw new Error("TextBelt API key not configured");
    }

    const response = await fetch("https://textbelt.com/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: to,
        message: message,
        key: apiKey,
      }),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        messageId: result.textId,
        message: "SMS sent successfully via TextBelt API",
      };
    } else {
      return {
        success: false,
        message: result.error || "TextBelt API error",
      };
    }
  }

  /**
   * Send via TextBelt basic (fallback)
   */
  private static async sendViaTextBelt(
    to: string,
    message: string
  ): Promise<SMSResult> {
    const response = await fetch("https://textbelt.com/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: to,
        message: message,
        key: "textbelt",
      }),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        messageId: result.textId,
        message: "SMS sent successfully via TextBelt",
      };
    } else {
      return {
        success: false,
        message: result.error || "TextBelt error",
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
    const cleaned = phone.replace(/\D/g, "");
    const brazilianPattern = /^55\d{10,11}$/;
    const localPattern = /^\d{10,11}$/;
    return brazilianPattern.test(cleaned) || localPattern.test(cleaned);
  }

  /**
   * Format phone number to international format
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length === 10 || cleaned.length === 11) {
      return `+55${cleaned}`;
    }

    if (
      cleaned.startsWith("55") &&
      (cleaned.length === 12 || cleaned.length === 13)
    ) {
      return `+${cleaned}`;
    }

    return phone;
  }
}

export default ProductionSMSService;
