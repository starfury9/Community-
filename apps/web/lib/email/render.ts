import { EmailTemplate } from "./templates";

/**
 * Variables that can be used in email templates
 */
export interface TemplateVariables {
  // User info
  name?: string;
  email?: string;
  
  // URLs
  profileUrl?: string;
  firstLessonUrl?: string;
  discordUrl?: string;
  unsubscribeUrl?: string;
  pricingUrl?: string;
  updatePaymentUrl?: string;
  resubscribeUrl?: string;
  resetUrl?: string;
  nextModuleUrl?: string;
  resumeUrl?: string;
  billingUrl?: string;
  shareUrl?: string;
  certificateUrl?: string;
  discordAlumniUrl?: string;
  
  // Module/Progress info
  moduleNumber?: number;
  moduleTitle?: string;
  nextModuleNumber?: number;
  nextModuleDescription?: string;
  progressPercentage?: number;
  lessonsCompleted?: number;
  modulesCompleted?: number;
  lastLesson?: string;
  nextLesson?: string;
  
  // Billing info
  accessEndDate?: string;
  renewalDate?: string;
  amount?: string;
  
  // Custom data
  [key: string]: string | number | undefined;
}

/**
 * Default values for common variables
 */
const DEFAULT_VALUES: Partial<TemplateVariables> = {
  name: "there",
  discordUrl: "https://discord.gg/aisystemsarchitect",
  profileUrl: process.env.NEXT_PUBLIC_APP_URL + "/onboarding",
  firstLessonUrl: process.env.NEXT_PUBLIC_APP_URL + "/dashboard",
  pricingUrl: process.env.NEXT_PUBLIC_APP_URL + "/pricing",
  billingUrl: process.env.NEXT_PUBLIC_APP_URL + "/dashboard/billing",
  resumeUrl: process.env.NEXT_PUBLIC_APP_URL + "/dashboard",
};

/**
 * Escape HTML entities for safe rendering
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Render a template string by substituting variables
 * 
 * Variables are in format {{variableName}}
 * Missing variables use default values or empty string
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables,
  escapeHtmlEntities = false
): string {
  // Merge with defaults
  const mergedVars = { ...DEFAULT_VALUES, ...variables };
  
  // Generate unsubscribe URL if not provided
  if (!mergedVars.unsubscribeUrl && mergedVars.email) {
    mergedVars.unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(mergedVars.email)}`;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = mergedVars[key];
    
    if (value === undefined || value === null) {
      console.warn(`Missing template variable: ${key}`);
      return match; // Keep original if not found
    }
    
    const stringValue = String(value);
    return escapeHtmlEntities ? escapeHtml(stringValue) : stringValue;
  });
}

/**
 * Render both subject and body for an email template
 */
export function renderEmail(
  template: EmailTemplate,
  variables: TemplateVariables
): {
  subject: string;
  text: string;
  html: string | undefined;
} {
  return {
    subject: renderTemplate(template.subject, variables, false),
    text: renderTemplate(template.body, variables, false),
    html: template.html 
      ? renderTemplate(template.html, variables, true) 
      : undefined,
  };
}

/**
 * Validate that all required variables are present
 */
export function validateVariables(
  template: string,
  variables: TemplateVariables
): { valid: boolean; missing: string[] } {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  const missing: string[] = [];
  
  for (const match of matches) {
    const key = match[1];
    const mergedVars = { ...DEFAULT_VALUES, ...variables };
    
    if (mergedVars[key] === undefined) {
      missing.push(key);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing: [...new Set(missing)], // Remove duplicates
  };
}
