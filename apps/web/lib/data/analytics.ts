import { prisma } from "@/lib/prisma";

// Price constants (in pence)
const MONTHLY_PRICE = 4900; // £49
const ANNUAL_PRICE = 39900; // £399

export interface DashboardMetrics {
  totalUsers: number;
  activeSubscribers: number;
  mrr: number; // Monthly Recurring Revenue in pence
  mrrFormatted: string;
  conversionRate: number;
  churnRate: number;
  averageProgress: number;
}

export interface ConversionFunnel {
  signups: number;
  activated: number; // Completed Video 1
  converted: number; // Started subscription
  activationRate: number;
  conversionRateFromActivated: number;
  overallConversionRate: number;
}

export interface TimeSeriesData {
  date: string;
  signups: number;
  subscriptions: number;
  mrr: number;
}

export type TimePeriod = "7d" | "30d" | "90d" | "all";

function getDateFromPeriod(period: TimePeriod): Date | null {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "all":
      return null;
  }
}

/**
 * Get main dashboard metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [
    totalUsers,
    activeSubscriptions,
    monthlySubscriptions,
    annualSubscriptions,
    allProgress,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),

    // Active subscribers
    prisma.subscription.count({
      where: { status: "ACTIVE" },
    }),

    // Monthly subscriptions (for MRR)
    prisma.subscription.count({
      where: {
        status: "ACTIVE",
        plan: "MONTHLY",
      },
    }),

    // Annual subscriptions (for MRR)
    prisma.subscription.count({
      where: {
        status: "ACTIVE",
        plan: "ANNUAL",
      },
    }),

    // Get all lesson progress for average calculation
    prisma.lessonProgress.groupBy({
      by: ["userId"],
      _count: {
        _all: true,
      },
      where: {
        completed: true,
      },
    }),
  ]);

  // Calculate MRR: Monthly = £49, Annual = £399/12 = £33.25
  const monthlyMRR = monthlySubscriptions * MONTHLY_PRICE;
  const annualMRR = Math.round(annualSubscriptions * (ANNUAL_PRICE / 12));
  const mrr = monthlyMRR + annualMRR;

  // Format MRR as currency
  const mrrFormatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(mrr / 100);

  // Calculate conversion rate (subscribers / total users)
  const conversionRate =
    totalUsers > 0
      ? Math.round((activeSubscriptions / totalUsers) * 100 * 10) / 10
      : 0;

  // Calculate churn rate (cancelled in last 30 days / active at start of period)
  // Simplified for MVP - using cancelled count
  const cancelledLast30Days = await prisma.subscription.count({
    where: {
      status: "CANCELLED",
      cancelledAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });
  const totalActiveAtStart = activeSubscriptions + cancelledLast30Days;
  const churnRate =
    totalActiveAtStart > 0
      ? Math.round((cancelledLast30Days / totalActiveAtStart) * 100 * 10) / 10
      : 0;

  // Calculate average progress
  const totalLessons = await prisma.lesson.count({ where: { published: true } });
  let averageProgress = 0;
  if (allProgress.length > 0 && totalLessons > 0) {
    const totalCompletedLessons = allProgress.reduce(
      (sum, p) => sum + p._count._all,
      0
    );
    const averageCompletedPerUser = totalCompletedLessons / allProgress.length;
    averageProgress = Math.round((averageCompletedPerUser / totalLessons) * 100);
  }

  return {
    totalUsers,
    activeSubscribers: activeSubscriptions,
    mrr,
    mrrFormatted,
    conversionRate,
    churnRate,
    averageProgress,
  };
}

/**
 * Get conversion funnel data
 */
export async function getConversionFunnel(
  period: TimePeriod = "30d"
): Promise<ConversionFunnel> {
  const startDate = getDateFromPeriod(period);

  const dateFilter = startDate
    ? { createdAt: { gte: startDate } }
    : {};

  const [signups, activated, converted] = await Promise.all([
    // Signup events
    prisma.event.count({
      where: {
        name: "signup_completed",
        ...dateFilter,
      },
    }),

    // Video 1 / first lesson completed (activated)
    prisma.event.count({
      where: {
        name: "lesson_completed",
        ...dateFilter,
        // For simplicity, count any lesson completion as activation
        // Could refine to only free lessons
      },
    }),

    // Subscription started (converted)
    prisma.event.count({
      where: {
        name: "subscription_started",
        ...dateFilter,
      },
    }),
  ]);

  // Calculate rates
  const activationRate =
    signups > 0 ? Math.round((activated / signups) * 100 * 10) / 10 : 0;

  const conversionRateFromActivated =
    activated > 0 ? Math.round((converted / activated) * 100 * 10) / 10 : 0;

  const overallConversionRate =
    signups > 0 ? Math.round((converted / signups) * 100 * 10) / 10 : 0;

  return {
    signups,
    activated,
    converted,
    activationRate,
    conversionRateFromActivated,
    overallConversionRate,
  };
}

/**
 * Get recent activity counts
 */
export async function getRecentActivity(
  period: TimePeriod = "7d"
): Promise<{
  newUsers: number;
  newSubscriptions: number;
  lessonsCompleted: number;
  modulesCompleted: number;
}> {
  const startDate = getDateFromPeriod(period);

  const dateFilter = startDate
    ? { createdAt: { gte: startDate } }
    : {};

  const [newUsers, newSubscriptions, lessonsCompleted, modulesCompleted] =
    await Promise.all([
      prisma.user.count({
        where: dateFilter,
      }),

      prisma.subscription.count({
        where: {
          ...dateFilter,
          status: "ACTIVE",
        },
      }),

      prisma.event.count({
        where: {
          name: "lesson_completed",
          ...dateFilter,
        },
      }),

      prisma.event.count({
        where: {
          name: "module_completed",
          ...dateFilter,
        },
      }),
    ]);

  return {
    newUsers,
    newSubscriptions,
    lessonsCompleted,
    modulesCompleted,
  };
}

/**
 * Get subscription breakdown by plan
 */
export async function getSubscriptionBreakdown(): Promise<{
  monthly: number;
  annual: number;
  pastDue: number;
  cancelled: number;
  total: number;
}> {
  const [monthly, annual, pastDue, cancelled] = await Promise.all([
    prisma.subscription.count({
      where: { status: "ACTIVE", plan: "MONTHLY" },
    }),
    prisma.subscription.count({
      where: { status: "ACTIVE", plan: "ANNUAL" },
    }),
    prisma.subscription.count({
      where: { status: "PAST_DUE" },
    }),
    prisma.subscription.count({
      where: { status: "CANCELLED" },
    }),
  ]);

  return {
    monthly,
    annual,
    pastDue,
    cancelled,
    total: monthly + annual + pastDue + cancelled,
  };
}

/**
 * Get content stats for admin
 */
export async function getContentStats(): Promise<{
  totalModules: number;
  publishedModules: number;
  totalLessons: number;
  publishedLessons: number;
  totalAssets: number;
}> {
  const [totalModules, publishedModules, totalLessons, publishedLessons, totalAssets] =
    await Promise.all([
      prisma.module.count(),
      prisma.module.count({ where: { published: true } }),
      prisma.lesson.count(),
      prisma.lesson.count({ where: { published: true } }),
      prisma.asset.count(),
    ]);

  return {
    totalModules,
    publishedModules,
    totalLessons,
    publishedLessons,
    totalAssets,
  };
}

/**
 * Get email stats for admin
 */
export async function getEmailStats(
  period: TimePeriod = "30d"
): Promise<{
  sent: number;
  pending: number;
  failed: number;
  cancelled: number;
}> {
  const startDate = getDateFromPeriod(period);
  const dateFilter = startDate ? { createdAt: { gte: startDate } } : {};

  const [sent, pending, failed, cancelled] = await Promise.all([
    prisma.emailLog.count({
      where: { status: "SENT", ...dateFilter },
    }),
    prisma.emailQueue.count({
      where: { status: "PENDING" },
    }),
    prisma.emailLog.count({
      where: { status: "FAILED", ...dateFilter },
    }),
    prisma.emailLog.count({
      where: { status: "CANCELLED", ...dateFilter },
    }),
  ]);

  return { sent, pending, failed, cancelled };
}
