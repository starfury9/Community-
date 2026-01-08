import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserDetail } from "@/lib/data";
import { AccessOverrideToggle } from "./access-override-toggle";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const user = await getUserDetail(userId);

  if (!user) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/users"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Users
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {user.name || "No name"}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role={user.role} />
              {user.accessOverride && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Access Override
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Info */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email Verified</dt>
                <dd>{user.emailVerified ? formatDate(user.emailVerified) : "No"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">User Type</dt>
                <dd>{user.userType || "Not set"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Experience Level</dt>
                <dd>{user.experienceLevel || "Not set"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Onboarding</dt>
                <dd>{user.onboardingComplete ? "Complete" : "Incomplete"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Marketing Emails</dt>
                <dd>{user.marketingOptOut ? "Opted Out" : "Subscribed"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Joined</dt>
                <dd>{formatDate(user.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Login</dt>
                <dd>{user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}</dd>
              </div>
            </dl>
          </div>

          {/* Subscription */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Subscription</h2>
            {user.subscription ? (
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <SubscriptionBadge status={user.subscription.status} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd>{user.subscription.plan || "Unknown"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Period End</dt>
                  <dd>
                    {user.subscription.currentPeriodEnd
                      ? formatDate(user.subscription.currentPeriodEnd)
                      : "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cancel at Period End</dt>
                  <dd>{user.subscription.cancelAtPeriodEnd ? "Yes" : "No"}</dd>
                </div>
                {user.stripeCustomerId && (
                  <div className="pt-3 border-t">
                    <a
                      href={`https://dashboard.stripe.com/customers/${user.stripeCustomerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View in Stripe Dashboard →
                    </a>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-muted-foreground">No active subscription</p>
            )}

            {/* Access Override Toggle */}
            <div className="mt-6 pt-4 border-t">
              <AccessOverrideToggle
                userId={user.id}
                initialValue={user.accessOverride}
              />
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Course Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{user.progress.completedLessons} / {user.progress.totalLessons} lessons</span>
                  <span className="font-medium">{user.progress.percentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${user.progress.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
            {user.events.length === 0 ? (
              <p className="text-muted-foreground">No events recorded</p>
            ) : (
              <ul className="space-y-2">
                {user.events.slice(0, 10).map((event) => (
                  <li key={event.id} className="flex justify-between text-sm">
                    <span className="font-mono">{event.name}</span>
                    <span className="text-muted-foreground">
                      {formatDateTime(event.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Email History */}
          <div className="rounded-lg border bg-card p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Email History</h2>
            {user.emailLogs.length === 0 ? (
              <p className="text-muted-foreground">No emails sent</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Template</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.emailLogs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="py-2 font-mono">{log.template}</td>
                        <td className="py-2">
                          <EmailStatusBadge status={log.status} />
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
      User
    </span>
  );
}

function SubscriptionBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    PAST_DUE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    INCOMPLETE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.INCOMPLETE}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function EmailStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SENT: "text-green-600",
    PENDING: "text-yellow-600",
    FAILED: "text-red-600",
    CANCELLED: "text-gray-600",
  };

  return (
    <span className={`font-medium ${styles[status] || ""}`}>
      {status}
    </span>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
