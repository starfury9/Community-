import { prisma } from "@/lib/prisma";
import { isModuleUnlocked } from "@/lib/data/progress";

export interface AccessResult {
  hasAccess: boolean;
  reason: "free" | "subscribed" | "override" | "past_due" | "grace_period" | "no_access";
  softLock: boolean;
  subscription: {
    status: string | null;
    plan: string | null;
    currentPeriodEnd: Date | null;
  } | null;
}

export interface LessonAccessResult extends AccessResult {
  isFree: boolean;
  moduleUnlocked: boolean;
  lockedByModule?: {
    moduleId: string;
    moduleTitle: string;
    moduleOrder: number;
  };
}

/**
 * Check if a user has access to premium content
 * 
 * Access is granted in the following order:
 * 1. accessOverride === true → Full access
 * 2. Subscription status === ACTIVE → Full access
 * 3. Subscription status === PAST_DUE → Access with soft lock
 * 4. Subscription cancelled but currentPeriodEnd > now → Access (grace period)
 * 5. Otherwise → No access
 */
export async function checkUserAccess(userId: string): Promise<AccessResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
    },
  });

  if (!user) {
    return {
      hasAccess: false,
      reason: "no_access",
      softLock: false,
      subscription: null,
    };
  }

  // Check 1: Admin override
  if (user.accessOverride) {
    return {
      hasAccess: true,
      reason: "override",
      softLock: false,
      subscription: user.subscription
        ? {
            status: user.subscription.status,
            plan: user.subscription.plan,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
          }
        : null,
    };
  }

  // No subscription
  if (!user.subscription) {
    return {
      hasAccess: false,
      reason: "no_access",
      softLock: false,
      subscription: null,
    };
  }

  const { subscription } = user;
  const now = new Date();

  // Check 2: Active subscription
  if (subscription.status === "ACTIVE") {
    return {
      hasAccess: true,
      reason: "subscribed",
      softLock: false,
      subscription: {
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    };
  }

  // Check 3: Past due - access with soft lock
  if (subscription.status === "PAST_DUE") {
    return {
      hasAccess: true,
      reason: "past_due",
      softLock: true,
      subscription: {
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    };
  }

  // Check 4: Cancelled but within grace period
  if (
    subscription.status === "CANCELLED" &&
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd > now
  ) {
    return {
      hasAccess: true,
      reason: "grace_period",
      softLock: false,
      subscription: {
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    };
  }

  // No access
  return {
    hasAccess: false,
    reason: "no_access",
    softLock: false,
    subscription: {
      status: subscription.status,
      plan: subscription.plan,
      currentPeriodEnd: subscription.currentPeriodEnd,
    },
  };
}

/**
 * Check if a specific lesson is accessible
 * Access requires:
 * 1. Module is unlocked (previous module completed)
 * 2. Lesson is free OR user has subscription access
 */
export async function checkLessonAccess(
  userId: string,
  lessonId: string
): Promise<LessonAccessResult> {
  // Get lesson with module info
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          order: true,
          published: true,
        },
      },
    },
  });

  if (!lesson || !lesson.module.published) {
    return {
      hasAccess: false,
      isFree: false,
      moduleUnlocked: false,
      reason: "no_access",
      softLock: false,
      subscription: null,
    };
  }

  // Check if module is unlocked
  const moduleUnlocked = await isModuleUnlocked(userId, lesson.module.id);

  // Get previous module info if locked
  let lockedByModule: LessonAccessResult["lockedByModule"] | undefined;
  if (!moduleUnlocked && lesson.module.order > 1) {
    const previousModule = await prisma.module.findFirst({
      where: {
        published: true,
        order: { lt: lesson.module.order },
      },
      orderBy: { order: "desc" },
      select: {
        id: true,
        title: true,
        order: true,
      },
    });
    if (previousModule) {
      lockedByModule = {
        moduleId: previousModule.id,
        moduleTitle: previousModule.title,
        moduleOrder: previousModule.order,
      };
    }
  }

  // If module is locked, no access regardless of lesson type
  if (!moduleUnlocked) {
    return {
      hasAccess: false,
      isFree: lesson.isFree,
      moduleUnlocked: false,
      lockedByModule,
      reason: "no_access",
      softLock: false,
      subscription: null,
    };
  }

  // Module is unlocked - now check lesson-level access
  
  // Free lessons are always accessible if module is unlocked
  if (lesson.isFree) {
    return {
      hasAccess: true,
      isFree: true,
      moduleUnlocked: true,
      reason: "free",
      softLock: false,
      subscription: null,
    };
  }

  // Check user access for non-free lessons
  const access = await checkUserAccess(userId);
  return {
    ...access,
    isFree: false,
    moduleUnlocked: true,
  };
}

/**
 * Toggle access override for a user (admin function)
 */
export async function toggleAccessOverride(
  userId: string,
  adminId: string,
  override: boolean
): Promise<void> {
  await prisma.$transaction([
    // Update user
    prisma.user.update({
      where: { id: userId },
      data: { accessOverride: override },
    }),
    // Log the action
    prisma.event.create({
      data: {
        userId,
        name: override ? "access_override_granted" : "access_override_revoked",
        properties: {
          adminId,
          timestamp: new Date().toISOString(),
        },
      },
    }),
  ]);
}
