// Configuration
export { getMailgunClient, emailConfig, validateEmailConfig, isEmailConfigured } from "./config";

// Templates
export {
  EMAIL_TEMPLATES,
  getTemplate,
  getMarketingTemplates,
  getTransactionalTemplates,
} from "./templates";
export type { EmailTemplateKey, EmailTemplate } from "./templates";

// Rendering
export { renderEmail, renderTemplate, validateVariables } from "./render";
export type { TemplateVariables } from "./render";

// Service
export { EmailService, getEmailService } from "./service";
export type { SendEmailResult, SendEmailOptions, BatchEmailResult } from "./service";

// Queue
export {
  queueEmail,
  queueEmails,
  cancelQueuedEmails,
  cancelQueuedEmail,
  processEmailQueue,
  getPendingEmailCount,
  getQueueStats,
} from "./queue";

// Triggers
export {
  // Immediate triggers
  triggerWelcomeEmail,
  triggerModuleCompleteEmail,
  triggerCourseCompleteEmail,
  triggerPaymentFailedEmail,
  triggerSubscriptionCancelledEmail,
  // Scheduled triggers
  triggerAbandonmentSequence,
  scheduleInactiveNudge,
  scheduleRenewalReminder,
  // Cancellation helpers
  cancelAbandonmentEmails,
  cancelPaymentFailedEmails,
  shouldTriggerAbandonmentOnComplete,
} from "./triggers";
