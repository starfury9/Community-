import { prisma } from "@/lib/prisma";
import { getMailgunClient, emailConfig, validateEmailConfig, isEmailConfigured } from "./config";
import { getTemplate, EmailTemplateKey } from "./templates";
import { renderEmail, TemplateVariables } from "./render";
import { EmailStatus } from "@prisma/client";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

export interface SendEmailOptions {
  userId: string;
  template: EmailTemplateKey;
  variables?: TemplateVariables;
  // Override recipient email (for testing)
  toEmail?: string;
}

export interface BatchEmailResult {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  results: Array<{
    userId: string;
    result: SendEmailResult;
  }>;
}

/**
 * Email Service
 * 
 * Handles sending emails via Mailgun with:
 * - Template rendering
 * - Marketing opt-out respect
 * - EmailLog creation
 * - Error handling
 */
export class EmailService {
  private configValid: boolean;
  private configErrors: string[];

  constructor() {
    const validation = validateEmailConfig();
    this.configValid = validation.valid;
    this.configErrors = validation.errors;
  }

  /**
   * Send a single email
   */
  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const { userId, template: templateKey, variables = {}, toEmail } = options;

    // Check configuration
    if (!this.configValid) {
      console.error("Email config invalid:", this.configErrors);
      return {
        success: false,
        error: `Email configuration invalid: ${this.configErrors.join(", ")}`,
      };
    }

    try {
      // Get the template
      const template = getTemplate(templateKey);
      if (!template) {
        return {
          success: false,
          error: `Unknown email template: ${templateKey}`,
        };
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          marketingOptOut: true,
        },
      });

      if (!user || !user.email) {
        return {
          success: false,
          error: "User not found or has no email",
        };
      }

      // Check marketing opt-out
      if (template.isMarketing && user.marketingOptOut) {
        // Log as cancelled
        await this.logEmail(userId, templateKey, "CANCELLED", {
          reason: "User opted out of marketing emails",
        });
        
        return {
          success: true,
          skipped: true,
          reason: "User opted out of marketing emails",
        };
      }

      // Prepare variables
      const mergedVariables: TemplateVariables = {
        name: user.name || "there",
        email: user.email,
        ...variables,
      };

      // Render the email
      const rendered = renderEmail(template, mergedVariables);

      // Get Mailgun client
      const mailgunClient = getMailgunClient();
      if (!mailgunClient) {
        console.log(`[Email] Mailgun not configured - would have sent ${templateKey} to ${user.email}`);
        // Log as sent in development for testing
        await this.logEmail(userId, templateKey, "SENT", {
          mockSend: true,
          recipient: user.email,
        });
        return {
          success: true,
          messageId: "mock-" + Date.now(),
        };
      }

      // Send via Mailgun
      const recipientEmail = toEmail || user.email;
      
      const messageData = {
        from: emailConfig.fromEmail,
        to: recipientEmail,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
        "h:Reply-To": emailConfig.replyTo,
      };

      const result = await mailgunClient.messages.create(emailConfig.domain, messageData);

      // Log success
      await this.logEmail(userId, templateKey, "SENT", {
        messageId: result.id,
        recipient: recipientEmail,
      });

      return {
        success: true,
        messageId: result.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Log failure
      await this.logEmail(userId, templateKey, "FAILED", {
        error: errorMessage,
      });

      console.error(`Failed to send email ${templateKey} to user ${userId}:`, error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send batch emails (same template to multiple users)
   */
  async sendBatch(
    userIds: string[],
    templateKey: EmailTemplateKey,
    getVariables?: (userId: string) => Promise<TemplateVariables>
  ): Promise<BatchEmailResult> {
    const results: BatchEmailResult = {
      total: userIds.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      results: [],
    };

    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (userId) => {
          const variables = getVariables 
            ? await getVariables(userId) 
            : {};
          
          const result = await this.send({
            userId,
            template: templateKey,
            variables,
          });

          results.results.push({ userId, result });

          if (result.skipped) {
            results.skipped++;
          } else if (result.success) {
            results.sent++;
          } else {
            results.failed++;
          }
        })
      );

      // Small delay between batches to avoid rate limits
      if (i + batchSize < userIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Check if an email was already sent to a user
   * (for preventing duplicates)
   */
  async wasEmailSent(
    userId: string,
    templateKey: EmailTemplateKey,
    withinHours = 24
  ): Promise<boolean> {
    const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);

    const existing = await prisma.emailLog.findFirst({
      where: {
        userId,
        template: templateKey,
        status: "SENT",
        sentAt: {
          gte: since,
        },
      },
    });

    return !!existing;
  }

  /**
   * Log an email send attempt
   */
  private async logEmail(
    userId: string,
    template: EmailTemplateKey,
    status: EmailStatus,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await prisma.emailLog.create({
        data: {
          userId,
          template,
          status,
          sentAt: new Date(),
          metadata: metadata as never,
        },
      });
    } catch (error) {
      console.error("Failed to log email:", error);
    }
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}
