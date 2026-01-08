import { prisma } from "@/lib/prisma";
import { getEmailService, queueEmail, cancelQueuedEmails, EmailTemplateKey, TemplateVariables } from "./index";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ===========================================
// IMMEDIATE TRIGGERS
// ===========================================

/**
 * Send welcome email immediately after signup
 * Also queues the "Start Journey" email for 24hr later if they haven't started Video 1
 */
export async function triggerWelcomeEmail(userId: string): Promise<void> {
  const emailService = getEmailService();

  // Check if already sent (prevent duplicates from OAuth callbacks)
  const alreadySent = await emailService.wasEmailSent(userId, "WELCOME", 24);
  if (alreadySent) {
    console.log(`[Email] Welcome email already sent to user ${userId}`);
    return;
  }

  // Send welcome immediately
  await emailService.send({
    userId,
    template: "WELCOME",
    variables: {
      profileUrl: `${APP_URL}/onboarding`,
      firstLessonUrl: `${APP_URL}/dashboard`,
      discordUrl: "https://discord.gg/aisystemsarchitect",
    },
  });

  // Queue "Start Journey" for 24 hours later
  const startJourneyTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await queueEmail(userId, "START_JOURNEY", startJourneyTime, {
    firstLessonUrl: `${APP_URL}/dashboard`,
  });

  console.log(`[Email] Welcome sequence started for user ${userId}`);
}

/**
 * Send module completion email
 */
export async function triggerModuleCompleteEmail(
  userId: string,
  moduleId: string
): Promise<void> {
  const emailService = getEmailService();

  // Get module details and next module
  const [module, nextModule, courseProgress] = await Promise.all([
    prisma.module.findUnique({
      where: { id: moduleId },
      select: { order: true, title: true },
    }),
    prisma.module.findFirst({
      where: {
        published: true,
        order: { gt: (await prisma.module.findUnique({ where: { id: moduleId } }))?.order || 999 },
      },
      orderBy: { order: "asc" },
      select: { id: true, title: true, order: true, description: true },
    }),
    prisma.module.count({ where: { published: true } }),
  ]);

  if (!module) return;

  // Check if this is the final module (course complete)
  const isCourseComplete = !nextModule;

  if (isCourseComplete) {
    // Send course complete email instead
    await triggerCourseCompleteEmail(userId);
    return;
  }

  // Get user's progress percentage
  const totalLessons = await prisma.lesson.count({ where: { published: true } });
  const completedLessons = await prisma.lessonProgress.count({
    where: { userId, completed: true },
  });
  const progressPercentage = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;

  await emailService.send({
    userId,
    template: "MODULE_COMPLETE",
    variables: {
      moduleNumber: module.order,
      moduleTitle: module.title,
      nextModuleNumber: nextModule?.order,
      nextModuleDescription: nextModule?.description || "Continue your learning journey",
      nextModuleUrl: `${APP_URL}/course/${nextModule?.id}`,
      progressPercentage,
    },
  });
}

/**
 * Send course completion email
 */
export async function triggerCourseCompleteEmail(userId: string): Promise<void> {
  const emailService = getEmailService();

  // Get user stats
  const completedLessons = await prisma.lessonProgress.count({
    where: { userId, completed: true },
  });

  await emailService.send({
    userId,
    template: "COURSE_COMPLETE",
    variables: {
      lessonsCompleted: completedLessons,
      discordAlumniUrl: "https://discord.gg/aisystemsarchitect-alumni",
      shareUrl: `${APP_URL}/share/course-complete`,
      certificateUrl: `${APP_URL}/certificate`,
    },
  });
}

/**
 * Send payment failed email immediately
 * Also queues the final warning email
 */
export async function triggerPaymentFailedEmail(userId: string): Promise<void> {
  const emailService = getEmailService();

  // Send immediate notification
  await emailService.send({
    userId,
    template: "PAYMENT_FAILED",
    variables: {
      updatePaymentUrl: `${APP_URL}/dashboard/billing`,
    },
  });

  // Queue final warning for 3 days later
  const finalWarningTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  await queueEmail(userId, "PAYMENT_FAILED_FINAL", finalWarningTime, {
    updatePaymentUrl: `${APP_URL}/dashboard/billing`,
  });

  console.log(`[Email] Payment failed sequence started for user ${userId}`);
}

/**
 * Send subscription cancelled email
 */
export async function triggerSubscriptionCancelledEmail(
  userId: string,
  accessEndDate: Date
): Promise<void> {
  const emailService = getEmailService();

  await emailService.send({
    userId,
    template: "SUBSCRIPTION_CANCELLED",
    variables: {
      accessEndDate: accessEndDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      resubscribeUrl: `${APP_URL}/pricing`,
    },
  });
}

// ===========================================
// SCHEDULED TRIGGERS (queue for later)
// ===========================================

/**
 * Queue abandonment sequence after Video 1 completion
 * Only if user hasn't subscribed
 */
export async function triggerAbandonmentSequence(userId: string): Promise<void> {
  // Check if user has active subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true },
  });

  if (subscription?.status === "ACTIVE") {
    console.log(`[Email] Skipping abandonment sequence - user ${userId} is subscribed`);
    return;
  }

  const now = Date.now();
  
  // Queue 3 abandonment emails
  await queueEmail(
    userId,
    "ABANDONMENT_1",
    new Date(now + 1 * 60 * 60 * 1000), // 1 hour
    { pricingUrl: `${APP_URL}/pricing` }
  );

  await queueEmail(
    userId,
    "ABANDONMENT_2",
    new Date(now + 24 * 60 * 60 * 1000), // 24 hours
    { pricingUrl: `${APP_URL}/pricing` }
  );

  await queueEmail(
    userId,
    "ABANDONMENT_3",
    new Date(now + 3 * 24 * 60 * 60 * 1000), // 3 days
    { pricingUrl: `${APP_URL}/pricing` }
  );

  console.log(`[Email] Abandonment sequence queued for user ${userId}`);
}

/**
 * Queue inactive nudge email
 * Called when activity is detected, resets the timer
 */
export async function scheduleInactiveNudge(userId: string): Promise<void> {
  // Cancel any existing inactive nudge
  await cancelQueuedEmails(userId, ["INACTIVE_NUDGE"]);

  // Queue new nudge for 7 days from now
  const nudgeTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  // Get user's progress for the nudge
  const lastProgress = await prisma.lessonProgress.findFirst({
    where: { userId, completed: true },
    orderBy: { completedAt: "desc" },
    include: {
      lesson: {
        select: { title: true },
      },
    },
  });

  const nextLesson = await prisma.lesson.findFirst({
    where: {
      published: true,
      lessonProgress: {
        none: {
          userId,
          completed: true,
        },
      },
    },
    orderBy: [
      { module: { order: "asc" } },
      { order: "asc" },
    ],
    select: { title: true },
  });

  await queueEmail(userId, "INACTIVE_NUDGE", nudgeTime, {
    lastLesson: lastProgress?.lesson.title || "Getting started",
    nextLesson: nextLesson?.title || "Your next lesson",
    resumeUrl: `${APP_URL}/dashboard`,
  });
}

/**
 * Queue renewal reminder
 * Called when subscription is about to renew
 */
export async function scheduleRenewalReminder(
  userId: string,
  renewalDate: Date,
  amount: number
): Promise<void> {
  // Cancel any existing renewal reminders
  await cancelQueuedEmails(userId, ["RENEWAL_REMINDER"]);

  // Schedule for 3 days before renewal
  const reminderTime = new Date(renewalDate.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  // Only queue if reminder time is in the future
  if (reminderTime > new Date()) {
    // Get user's progress
    const [modulesCompleted, totalModules, completedLessons, totalLessons] = await Promise.all([
      prisma.lessonProgress.groupBy({
        by: ["lessonId"],
        where: { userId, completed: true },
        _count: true,
      }).then(async (progress) => {
        // Get unique module IDs from completed lessons
        const completedLessonIds = progress.map(p => p.lessonId);
        const modules = await prisma.lesson.findMany({
          where: { id: { in: completedLessonIds } },
          select: { moduleId: true },
        });
        return new Set(modules.map(m => m.moduleId)).size;
      }),
      prisma.module.count({ where: { published: true } }),
      prisma.lessonProgress.count({ where: { userId, completed: true } }),
      prisma.lesson.count({ where: { published: true } }),
    ]);

    const progressPercentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    await queueEmail(userId, "RENEWAL_REMINDER", reminderTime, {
      renewalDate: renewalDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      amount: `£${(amount / 100).toFixed(2)}`,
      modulesCompleted,
      progressPercentage,
      billingUrl: `${APP_URL}/dashboard/billing`,
      pricingUrl: `${APP_URL}/pricing`,
    });

    console.log(`[Email] Renewal reminder scheduled for user ${userId} on ${reminderTime.toISOString()}`);
  }
}

// ===========================================
// CANCELLATION HELPERS
// ===========================================

/**
 * Cancel all abandonment emails when user subscribes
 */
export async function cancelAbandonmentEmails(userId: string): Promise<void> {
  const result = await cancelQueuedEmails(userId, [
    "ABANDONMENT_1",
    "ABANDONMENT_2",
    "ABANDONMENT_3",
    "START_JOURNEY",
  ]);

  if (result.cancelled > 0) {
    console.log(`[Email] Cancelled ${result.cancelled} abandonment emails for user ${userId}`);
  }
}

/**
 * Cancel payment failed final email when payment succeeds
 */
export async function cancelPaymentFailedEmails(userId: string): Promise<void> {
  const result = await cancelQueuedEmails(userId, ["PAYMENT_FAILED_FINAL"]);

  if (result.cancelled > 0) {
    console.log(`[Email] Cancelled payment failed final email for user ${userId}`);
  }
}

/**
 * Check if the completed lesson triggers abandonment sequence
 * (i.e., is it the first free lesson?)
 */
export async function shouldTriggerAbandonmentOnComplete(
  lessonId: string
): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      isFree: true,
      order: true,
      module: {
        select: { order: true },
      },
    },
  });

  // Trigger if this is a free lesson in the first module
  return !!(lesson?.isFree && lesson.module.order === 1);
}
