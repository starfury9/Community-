import Mailgun from "mailgun.js";
import formData from "form-data";

// Type for Mailgun client
type MailgunClient = ReturnType<InstanceType<typeof Mailgun>["client"]>;

// Mailgun configuration - lazily initialized
let mgClient: MailgunClient | null = null;

// Get Mailgun client (lazy initialization)
export function getMailgunClient(): MailgunClient | null {
  if (mgClient) return mgClient;
  
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) {
    console.warn("[Email] MAILGUN_API_KEY not set - emails will not be sent");
    return null;
  }

  const mailgun = new Mailgun(formData);
  mgClient = mailgun.client({
    username: "api",
    key: apiKey,
    // EU region - required for buddy-mail.co.uk domain
    url: "https://api.eu.mailgun.net",
  });

  return mgClient;
}

// Legacy export for backwards compatibility
export const mg = {
  get messages() {
    const client = getMailgunClient();
    if (!client) {
      throw new Error("Mailgun not configured - MAILGUN_API_KEY is required");
    }
    return client.messages;
  }
};

// Email configuration
export const emailConfig = {
  domain: process.env.MAILGUN_DOMAIN || "buddy-mail.co.uk",
  fromEmail: process.env.EMAIL_FROM || "AI Systems Architect <postmaster@buddy-mail.co.uk>",
  fromName: "AI Systems Architect",
  replyTo: process.env.EMAIL_REPLY_TO || "support@buddy-mail.co.uk",
  // Sandbox mode - only send to verified recipients
  isSandbox: process.env.NODE_ENV !== "production" || !process.env.MAILGUN_DOMAIN?.includes("mailgun.org") === false,
};

// Validate configuration
export function validateEmailConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.MAILGUN_API_KEY) {
    errors.push("MAILGUN_API_KEY is not set");
  }

  if (!process.env.MAILGUN_DOMAIN) {
    errors.push("MAILGUN_DOMAIN is not set");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Check if email is configured (for conditional logic)
export function isEmailConfigured(): boolean {
  return !!process.env.MAILGUN_API_KEY && !!process.env.MAILGUN_DOMAIN;
}
