"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PRICE_AMOUNTS,
  formatPrice,
  calculateAnnualSavings,
} from "@/lib/stripe";

export function PricingCards() {
  const router = useRouter();
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { savings, monthsFree } = calculateAnnualSavings();

  async function handleSubscribe(plan: "monthly" | "annual") {
    setLoading(plan);
    setError(null);

    // Track plan selection
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "subscription_plan_selected",
        properties: { plan },
      }),
    }).catch(() => {}); // Ignore tracking errors

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId:
            plan === "monthly"
              ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
              : process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Plan */}
        <div className="relative rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Monthly
            </h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-5xl font-bold tracking-tight">
                {formatPrice(PRICE_AMOUNTS.MONTHLY)}
              </span>
              <span className="ml-2 text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Billed monthly. Cancel anytime.
            </p>
          </div>

          <button
            onClick={() => handleSubscribe("monthly")}
            disabled={loading !== null}
            className="w-full rounded-lg border-2 border-primary px-6 py-3 font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "monthly" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Redirecting...
              </span>
            ) : (
              "Get Started"
            )}
          </button>
        </div>

        {/* Annual Plan */}
        <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-lg">
          {/* Best Value Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
              Best Value
            </span>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Annual
            </h3>
            <div className="mt-2 flex items-baseline">
              <span className="text-5xl font-bold tracking-tight">
                {formatPrice(PRICE_AMOUNTS.ANNUAL)}
              </span>
              <span className="ml-2 text-muted-foreground">/year</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {formatPrice(PRICE_AMOUNTS.MONTHLY_EQUIVALENT_ANNUAL)}/mo
              </span>
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                Save {formatPrice(savings)} ({monthsFree} months free)
              </span>
            </div>
          </div>

          <button
            onClick={() => handleSubscribe("annual")}
            disabled={loading !== null}
            className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "annual" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Redirecting...
              </span>
            ) : (
              `Get Started — Save ${formatPrice(savings)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
