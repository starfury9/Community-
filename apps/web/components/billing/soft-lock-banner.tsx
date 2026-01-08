"use client";

import Link from "next/link";

interface SoftLockBannerProps {
  reason: "past_due" | "grace_period";
  periodEnd?: Date | null;
}

export function SoftLockBanner({ reason, periodEnd }: SoftLockBannerProps) {
  if (reason === "past_due") {
    return (
      <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-800 dark:text-amber-200">
              Payment Failed
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              We couldn&apos;t process your last payment. Please update your payment method to continue uninterrupted access.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-800 dark:text-amber-200 hover:underline"
            >
              Update payment method
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (reason === "grace_period" && periodEnd) {
    const daysRemaining = Math.ceil(
      (periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">
              Subscription Cancelled
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Your subscription has been cancelled. You have access until{" "}
              <strong>
                {periodEnd.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>{" "}
              ({daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining).
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-800 dark:text-blue-200 hover:underline"
            >
              Resubscribe
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
