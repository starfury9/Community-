/**
 * Email Template Definitions
 * 
 * Each template has:
 * - subject: Email subject line with variable substitution
 * - body: Plain text body with variable substitution
 * - html: HTML body with variable substitution (optional)
 * - isMarketing: Whether this is a marketing email (respects opt-out)
 */

export type EmailTemplateKey =
  | "WELCOME"
  | "START_JOURNEY"
  | "ABANDONMENT_1"
  | "ABANDONMENT_2"
  | "ABANDONMENT_3"
  | "MODULE_COMPLETE"
  | "COURSE_COMPLETE"
  | "INACTIVE_NUDGE"
  | "RENEWAL_REMINDER"
  | "PAYMENT_FAILED"
  | "PAYMENT_FAILED_FINAL"
  | "SUBSCRIPTION_CANCELLED"
  | "PASSWORD_RESET";

export interface EmailTemplate {
  key: EmailTemplateKey;
  subject: string;
  body: string;
  html?: string;
  isMarketing: boolean;
}

export const EMAIL_TEMPLATES: Record<EmailTemplateKey, EmailTemplate> = {
  // ============================================
  // TRANSACTIONAL EMAILS (always send)
  // ============================================

  WELCOME: {
    key: "WELCOME",
    subject: "Welcome to AI Systems Architect, {{name}}! 🚀",
    body: `Hi {{name}},

Welcome to AI Systems Architect! I'm thrilled to have you here.

You now have access to the course platform. Here's what to do next:

1. Complete your profile: {{profileUrl}}
2. Start with Video 1 (it's free!): {{firstLessonUrl}}
3. Join our Discord community: {{discordUrl}}

If you have any questions, just reply to this email - I read every message.

Happy learning!
Chris

---
AI Systems Architect
Unsubscribe: {{unsubscribeUrl}}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">Welcome to AI Systems Architect! 🚀</h1>
  <p>Hi {{name}},</p>
  <p>Welcome to AI Systems Architect! I'm thrilled to have you here.</p>
  <p>You now have access to the course platform. Here's what to do next:</p>
  <ol>
    <li><a href="{{profileUrl}}" style="color: #2563eb;">Complete your profile</a></li>
    <li><a href="{{firstLessonUrl}}" style="color: #2563eb;">Start with Video 1 (it's free!)</a></li>
    <li><a href="{{discordUrl}}" style="color: #2563eb;">Join our Discord community</a></li>
  </ol>
  <p>If you have any questions, just reply to this email - I read every message.</p>
  <p>Happy learning!<br>Chris</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">
    AI Systems Architect<br>
    <a href="{{unsubscribeUrl}}" style="color: #666;">Unsubscribe</a>
  </p>
</body>
</html>`,
    isMarketing: false,
  },

  PAYMENT_FAILED: {
    key: "PAYMENT_FAILED",
    subject: "Action needed: Payment failed for AI Systems Architect",
    body: `Hi {{name}},

We tried to charge your card for your AI Systems Architect subscription, but the payment failed.

Don't worry - your access is still active for now. Please update your payment method to avoid any interruption:

Update payment: {{updatePaymentUrl}}

If you're having trouble, just reply to this email and we'll help sort it out.

Thanks,
Chris

---
AI Systems Architect`,
    isMarketing: false,
  },

  PAYMENT_FAILED_FINAL: {
    key: "PAYMENT_FAILED_FINAL",
    subject: "Final notice: Your AI Systems Architect access will be paused",
    body: `Hi {{name}},

We've tried several times to charge your card, but the payments have failed.

To keep your access to the course, please update your payment method now:

Update payment: {{updatePaymentUrl}}

If we don't hear from you, your access will be paused. But don't worry - your progress is saved and you can reactivate anytime.

Need help? Just reply to this email.

Thanks,
Chris

---
AI Systems Architect`,
    isMarketing: false,
  },

  SUBSCRIPTION_CANCELLED: {
    key: "SUBSCRIPTION_CANCELLED",
    subject: "Your AI Systems Architect subscription has been cancelled",
    body: `Hi {{name}},

Your AI Systems Architect subscription has been cancelled as requested.

You'll retain access until {{accessEndDate}}.

Your progress is saved - if you ever want to come back, your modules and completion status will be waiting for you.

If this was a mistake or you'd like to resubscribe, you can do so here:
{{resubscribeUrl}}

Thanks for being part of the community.

Chris

---
AI Systems Architect`,
    isMarketing: false,
  },

  PASSWORD_RESET: {
    key: "PASSWORD_RESET",
    subject: "Reset your AI Systems Architect password",
    body: `Hi {{name}},

We received a request to reset your password. Click the link below to create a new password:

{{resetUrl}}

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email.

Thanks,
AI Systems Architect Team

---
AI Systems Architect`,
    isMarketing: false,
  },

  // ============================================
  // MARKETING EMAILS (respect opt-out)
  // ============================================

  START_JOURNEY: {
    key: "START_JOURNEY",
    subject: "Ready to start your AI journey, {{name}}?",
    body: `Hi {{name}},

I noticed you signed up but haven't started the course yet.

Video 1 is completely free and gives you a solid foundation for everything that follows. It takes about 20 minutes:

Start Video 1: {{firstLessonUrl}}

Not sure if this course is right for you? Here's what others are saying:

"This finally made AI click for me. The practical examples are gold." - Sarah K.

If you have any questions about the course, just reply to this email.

See you inside!
Chris

---
AI Systems Architect
Unsubscribe: {{unsubscribeUrl}}`,
    isMarketing: true,
  },

  ABANDONMENT_1: {
    key: "ABANDONMENT_1",
    subject: "You're making great progress, {{name}}!",
    body: `Hi {{name}},

You just completed the first lesson - awesome start! 🎉

Here's what's waiting for you in the full course:

• 8 comprehensive modules covering real AI systems
• Practical examples you can apply immediately
• Downloadable resources and code
• Community access for questions

Ready to continue? Unlock all modules now:
{{pricingUrl}}

If you have questions about what's included, just reply.

Chris

---
AI Systems Architect
Unsubscribe: {{unsubscribeUrl}}`,
    isMarketing: true,
  },

  ABANDONMENT_2: {
    key: "ABANDONMENT_2",
    subject: "Quick question about AI Systems Architect",
    body: `Hi {{name}},

I noticed you haven't continued after Video 1. Is there something I can help with?

Common questions I get:

Q: Is this too advanced for me?
A: If you can write basic code, you're ready. We start from fundamentals.

Q: How much time will it take?
A: Most people complete it in 4-6 weeks at 2-3 hours/week.

Q: What if it's not what I expected?
A: 90-day money-back guarantee, no questions asked.

Still deciding? The first video is yours to keep forever.

Reply with any questions - I personally answer every email.

Chris

---
AI Systems Architect
Unsubscribe: {{unsubscribeUrl}}`,
    isMarketing: true,
  },

  ABANDONMENT_3: {
    key: "ABANDONMENT_3",
    subject: "Last call: Special offer inside 🎁",
    body: `Hi {{name}},

Since you've completed the free lesson, I'd like to offer you something special:

Use code WELCOME20 for 20% off your first month.

This code expires in 48 hours.

Claim your discount: {{pricingUrl}}?code=WELCOME20

After that, you're still welcome to join at the regular price whenever you're ready.

Happy learning!
Chris

---
AI Systems Architect
Unsubscribe: {{unsubscribeUrl}}`,
    isMarketing: true,
  },

  MODULE_COMPLETE: {
    key: "MODULE_COMPLETE",
    subject: "🎉 Module {{moduleNumber}} Complete!",
    body: `Hi {{name}},

Congratulations! You've completed Module {{moduleNumber}}: {{moduleTitle}}!

You're making fantastic progress. Here's what's coming up in Module {{nextModuleNumber}}:

{{nextModuleDescription}}

Keep the momentum going:
{{nextModuleUrl}}

You're {{progressPercentage}}% through the course - keep it up!

Chris

---
AI Systems Architect`,
    isMarketing: true,
  },

  COURSE_COMPLETE: {
    key: "COURSE_COMPLETE",
    subject: "🏆 You did it! Course Complete!",
    body: `Hi {{name}},

CONGRATULATIONS! 🎉🎉🎉

You've completed the entire AI Systems Architect course. This is a huge achievement.

Here's what you've mastered:
- Module 1-8: The complete AI systems toolkit
- {{lessonsCompleted}} lessons completed
- Real-world AI architecture patterns

What's next?

1. Join the alumni channel on Discord: {{discordAlumniUrl}}
2. Share your achievement on LinkedIn: {{shareUrl}}
3. Download your completion certificate: {{certificateUrl}}

I'd love to hear what you build with your new skills. Reply and tell me!

Congratulations again,
Chris

---
AI Systems Architect`,
    isMarketing: true,
  },

  INACTIVE_NUDGE: {
    key: "INACTIVE_NUDGE",
    subject: "Haven't seen you in a while, {{name}}",
    body: `Hi {{name}},

I noticed you haven't logged in for a bit. Life gets busy - I get it!

Just wanted to let you know your progress is saved:
- Last completed: {{lastLesson}}
- Up next: {{nextLesson}}

Ready to jump back in?
{{resumeUrl}}

If something's not working for you, I'd love to know. Just hit reply.

Chris

---
AI Systems Architect
Unsubscribe: {{unsubscribeUrl}}`,
    isMarketing: true,
  },

  RENEWAL_REMINDER: {
    key: "RENEWAL_REMINDER",
    subject: "Your subscription renews in 3 days",
    body: `Hi {{name}},

Just a heads up - your AI Systems Architect subscription renews on {{renewalDate}} for {{amount}}.

Your current progress:
- Modules completed: {{modulesCompleted}}/8
- Course progress: {{progressPercentage}}%

Everything looks good? No action needed - you'll continue automatically.

Want to make changes?
- Manage billing: {{billingUrl}}
- Change plan: {{pricingUrl}}

Thanks for being a member!
Chris

---
AI Systems Architect`,
    isMarketing: true,
  },
};

/**
 * Get a template by key
 */
export function getTemplate(key: EmailTemplateKey): EmailTemplate {
  return EMAIL_TEMPLATES[key];
}

/**
 * Get all marketing templates (for bulk opt-out)
 */
export function getMarketingTemplates(): EmailTemplate[] {
  return Object.values(EMAIL_TEMPLATES).filter((t) => t.isMarketing);
}

/**
 * Get all transactional templates
 */
export function getTransactionalTemplates(): EmailTemplate[] {
  return Object.values(EMAIL_TEMPLATES).filter((t) => !t.isMarketing);
}
