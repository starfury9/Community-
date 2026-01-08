import Stripe from "stripe";

// Initialize Stripe lazily to avoid build errors
let stripeInstance: Stripe | null = null;

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  // Validate that we're using test keys in development
  if (process.env.NODE_ENV === "development" && key.startsWith("sk_live_")) {
    throw new Error(
      "CRITICAL: Live Stripe keys detected in development environment. Use test keys (sk_test_*)."
    );
  }
  return key;
}

// Lazy initialization of Stripe client
export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(getStripeSecretKey(), {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backward compatibility - use getStripe() instead
export const stripe = {
  get customers() { return getStripe().customers; },
  get checkout() { return getStripe().checkout; },
  get subscriptions() { return getStripe().subscriptions; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
};

// Price IDs from Stripe Dashboard
// These should be created in Stripe and the IDs stored in environment variables
export const STRIPE_PRICES = {
  MONTHLY: process.env.STRIPE_PRICE_MONTHLY!,
  ANNUAL: process.env.STRIPE_PRICE_ANNUAL!,
} as const;

// Price amounts in pence (for display purposes)
// £49/month = 4900 pence, £399/year = 39900 pence
export const PRICE_AMOUNTS = {
  MONTHLY: 4900, // £49
  ANNUAL: 39900, // £399
  MONTHLY_EQUIVALENT_ANNUAL: 3325, // £33.25/month when paying annually
} as const;

// Product metadata
export const PRODUCT_INFO = {
  name: "AI Systems Architect Course",
  description: "Full access to all course modules, videos, and resources",
  features: [
    "8 comprehensive modules",
    "Video lessons with HLS streaming",
    "Downloadable resources",
    "Lifetime updates",
    "Community access (Discord)",
  ],
} as const;

// Subscription status types
export type SubscriptionStatus = 
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "TRIALING"
  | "UNPAID";

// Helper to format price for display
export function formatPrice(amountInPence: number): string {
  return `£${(amountInPence / 100).toFixed(0)}`;
}

// Helper to format price with decimal
export function formatPriceWithDecimal(amountInPence: number): string {
  return `£${(amountInPence / 100).toFixed(2)}`;
}

// Calculate savings for annual plan
export function calculateAnnualSavings(): {
  monthlyTotal: number;
  annualTotal: number;
  savings: number;
  monthsFree: number;
} {
  const monthlyTotal = PRICE_AMOUNTS.MONTHLY * 12; // £588/year if monthly
  const annualTotal = PRICE_AMOUNTS.ANNUAL; // £399/year
  const savings = monthlyTotal - annualTotal; // £189 saved
  const monthsFree = Math.round(savings / PRICE_AMOUNTS.MONTHLY); // ~4 months

  return {
    monthlyTotal,
    annualTotal,
    savings,
    monthsFree,
  };
}
