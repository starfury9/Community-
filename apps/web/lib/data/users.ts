import { prisma } from "@/lib/prisma";
import { SubscriptionStatus, Role } from "@prisma/client";

export interface UserListItem {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  createdAt: Date;
  lastLoginAt: Date | null;
  subscriptionStatus: SubscriptionStatus | null;
  onboardingComplete: boolean;
}

export interface UserDetail {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  role: Role;
  userType: string | null;
  buildGoal: string | null;
  experienceLevel: string | null;
  onboardingComplete: boolean;
  accessOverride: boolean;
  marketingOptOut: boolean;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  subscription: {
    id: string;
    status: SubscriptionStatus;
    plan: string | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    stripeSubscriptionId: string | null;
  } | null;
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
  emailLogs: {
    id: string;
    template: string;
    status: string;
    createdAt: Date;
  }[];
  events: {
    id: string;
    name: string;
    createdAt: Date;
  }[];
}

export type UserFilterStatus = "all" | "active" | "free" | "past_due" | "cancelled";

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserFilterStatus;
  sortBy?: "createdAt" | "lastLoginAt" | "name" | "email";
  sortOrder?: "asc" | "desc";
}

export interface UserListResult {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Get paginated list of users with optional filtering
 */
export async function getUserList(params: UserListParams = {}): Promise<UserListResult> {
  const {
    page = 1,
    limit = 20,
    search,
    status = "all",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  // Build where clause
  const where: Record<string, unknown> = {};

  // Search filter
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  // Status filter
  if (status !== "all") {
    if (status === "free") {
      where.subscription = null;
    } else {
      where.subscription = {
        status: status.toUpperCase() as SubscriptionStatus,
      };
    }
  }

  // Execute query with pagination
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: where as any,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        onboardingComplete: true,
        subscription: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where: where as any }),
  ]);

  return {
    users: users.map((user) => ({
      ...user,
      subscriptionStatus: user.subscription?.status ?? null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get detailed user information
 */
export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
      emailLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          template: true,
          status: true,
          createdAt: true,
        },
      },
      lessonProgress: {
        where: { completed: true },
        select: { id: true },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) return null;

  // Get total lessons for progress calculation
  const totalLessons = await prisma.lesson.count({ where: { published: true } });
  const completedLessons = user.lessonProgress.length;
  const percentage = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    role: user.role,
    userType: user.userType,
    buildGoal: user.buildGoal,
    experienceLevel: user.experienceLevel,
    onboardingComplete: user.onboardingComplete,
    accessOverride: user.accessOverride,
    marketingOptOut: user.marketingOptOut,
    stripeCustomerId: user.stripeCustomerId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    subscription: user.subscription ? {
      id: user.subscription.id,
      status: user.subscription.status,
      plan: user.subscription.plan,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
      cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
      stripeSubscriptionId: user.subscription.stripeSubscriptionId,
    } : null,
    progress: {
      completedLessons,
      totalLessons,
      percentage,
    },
    emailLogs: user.emailLogs,
    events: user.events,
  };
}

/**
 * Toggle access override for a user
 */
export async function toggleAccessOverride(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accessOverride: true },
  });

  if (!user) return false;

  await prisma.user.update({
    where: { id: userId },
    data: { accessOverride: !user.accessOverride },
  });

  return !user.accessOverride;
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: Role): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

/**
 * Delete a user and all related data
 */
export async function deleteUser(userId: string): Promise<void> {
  // Due to cascade deletes, this will remove all related data
  await prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * Search users by email or name (for quick lookup)
 */
export async function searchUsers(query: string, limit = 10): Promise<UserListItem[]> {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      onboardingComplete: true,
      subscription: {
        select: { status: true },
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return users.map((user) => ({
    ...user,
    subscriptionStatus: user.subscription?.status ?? null,
  }));
}
