import Link from "next/link";
import {
  getDashboardMetrics,
  getConversionFunnel,
  getRecentActivity,
  getContentStats,
  getEmailStats,
} from "@/lib/data";

export default async function AdminDashboardPage() {
  // Fetch all metrics in parallel
  const [metrics, funnel, activity, content, emailStats] = await Promise.all([
    getDashboardMetrics(),
    getConversionFunnel("30d"),
    getRecentActivity("7d"),
    getContentStats(),
    getEmailStats("30d"),
  ]);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mb-8">
          Business metrics and platform overview
        </p>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Monthly Revenue"
            value={metrics.mrrFormatted}
            subtext="MRR"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            title="Active Subscribers"
            value={metrics.activeSubscribers.toString()}
            subtext={`${metrics.conversionRate}% of users`}
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <MetricCard
            title="Total Users"
            value={metrics.totalUsers.toString()}
            subtext={`${activity.newUsers} new this week`}
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <MetricCard
            title="Avg. Progress"
            value={`${metrics.averageProgress}%`}
            subtext="course completion"
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* Conversion Funnel & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Conversion Funnel */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Conversion Funnel (30 days)</h2>
            <div className="space-y-4">
              <FunnelStep
                label="Signups"
                value={funnel.signups}
                percentage={100}
                color="bg-blue-500"
              />
              <FunnelStep
                label="Activated"
                value={funnel.activated}
                percentage={funnel.activationRate}
                color="bg-yellow-500"
                sublabel={`${funnel.activationRate}% of signups`}
              />
              <FunnelStep
                label="Converted"
                value={funnel.converted}
                percentage={funnel.overallConversionRate}
                color="bg-green-500"
                sublabel={`${funnel.overallConversionRate}% of signups`}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Link
              href="/admin/content"
              className="block rounded-lg border bg-card p-6 hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Course Content</h3>
                  <p className="text-sm text-muted-foreground">
                    {content.publishedModules} / {content.totalModules} modules • {content.publishedLessons} / {content.totalLessons} lessons
                  </p>
                </div>
                <svg className="h-5 w-5 text-muted-foreground group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="block rounded-lg border bg-card p-6 hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">User Management</h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage users, subscriptions, and access
                  </p>
                </div>
                <svg className="h-5 w-5 text-muted-foreground group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Activity & Email Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity (7 days)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{activity.newUsers}</div>
                <div className="text-sm text-muted-foreground">New Users</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{activity.newSubscriptions}</div>
                <div className="text-sm text-muted-foreground">New Subs</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{activity.lessonsCompleted}</div>
                <div className="text-sm text-muted-foreground">Lessons Done</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{activity.modulesCompleted}</div>
                <div className="text-sm text-muted-foreground">Modules Done</div>
              </div>
            </div>
          </div>

          {/* Email Stats */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Email Stats (30 days)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-green-600">{emailStats.sent}</div>
                <div className="text-sm text-muted-foreground">Sent</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-yellow-600">{emailStats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-red-600">{emailStats.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-muted-foreground">{emailStats.cancelled}</div>
                <div className="text-sm text-muted-foreground">Cancelled</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  subtext,
  icon,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{subtext}</div>
    </div>
  );
}

// Funnel Step Component
function FunnelStep({
  label,
  value,
  percentage,
  color,
  sublabel,
}: {
  label: string;
  value: number;
  percentage: number;
  color: string;
  sublabel?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{value}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {sublabel && (
        <span className="text-xs text-muted-foreground">{sublabel}</span>
      )}
    </div>
  );
}
