import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { checkUserAccess } from "@/lib/access";
import { formatPrice, PRICE_AMOUNTS } from "@/lib/stripe";
import { ManageSubscriptionButton } from "./manage-subscription-button";

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const access = await checkUserAccess(session.user.id);
  const { subscription } = access;

  // Format dates
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and billing details
          </p>
        </div>

        {/* Subscription Status */}
        <div className="rounded-lg border bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Subscription Status</h2>

          {!subscription || access.reason === "no_access" ? (
            // No subscription
            <div className="text-center py-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">No Active Subscription</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Subscribe to get full access to all course content.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                View Plans
              </Link>
            </div>
          ) : (
            // Has subscription
            <div className="space-y-4">
              {/* Status badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={subscription.status} />
              </div>

              {/* Plan */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="font-medium">
                  {subscription.plan === "ANNUAL" ? "Annual" : "Monthly"} (
                  {formatPrice(
                    subscription.plan === "ANNUAL"
                      ? PRICE_AMOUNTS.ANNUAL
                      : PRICE_AMOUNTS.MONTHLY
                  )}
                  /{subscription.plan === "ANNUAL" ? "year" : "month"})
                </span>
              </div>

              {/* Next billing / Access until */}
              {periodEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {subscription.status === "CANCELLED"
                      ? "Access until"
                      : "Next billing date"}
                  </span>
                  <span className="font-medium">{periodEnd}</span>
                </div>
              )}

              {/* Access override indicator */}
              {access.reason === "override" && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>Complimentary access granted</span>
                </div>
              )}

              {/* Soft lock warning */}
              {access.softLock && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Payment method issue</p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    Please update your payment method to continue uninterrupted access.
                  </p>
                </div>
              )}

              {/* Manage button */}
              <div className="pt-4 border-t">
                <ManageSubscriptionButton />
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-2">Need Help?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            If you have any billing questions or issues, please contact our support team.
          </p>
          <a
            href="mailto:support@example.com"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            support@example.com
          </a>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;

  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    PAST_DUE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const labels: Record<string, string> = {
    ACTIVE: "Active",
    PAST_DUE: "Past Due",
    CANCELLED: "Cancelled",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
