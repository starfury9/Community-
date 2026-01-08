import { prisma } from "@/lib/prisma";

// Event name constants to prevent typos
export const EVENTS = {
  // Auth & Onboarding
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",

  // Course Engagement
  VIDEO_1_STARTED: "video_1_started",
  VIDEO_1_COMPLETED: "video_1_completed",
  LESSON_STARTED: "lesson_started",
  LESSON_COMPLETED: "lesson_completed",
  MODULE_COMPLETED: "module_completed",
  COURSE_COMPLETED: "course_completed",

  // Monetization
  PAYWALL_VIEWED: "paywall_viewed",
  SUBSCRIPTION_PLAN_SELECTED: "subscription_plan_selected",
  SUBSCRIPTION_STARTED: "subscription_started",
  SUBSCRIPTION_RENEWED: "subscription_renewed",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",

  // Payments
  PAYMENT_FAILED: "payment_failed",

  // Admin
  ACCESS_OVERRIDE_GRANTED: "access_override_granted",
  ACCESS_OVERRIDE_REVOKED: "access_override_revoked",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

interface TrackEventOptions {
  userId: string;
  event: EventName;
  properties?: Record<string, unknown>;
}

/**
 * Track an event (server-side only)
 */
export async function trackEvent({ userId, event, properties }: TrackEventOptions) {
  try {
    await prisma.event.create({
      data: {
        userId,
        name: event,
        properties: properties || {},
      },
    });
  } catch (error) {
    console.error(`[Tracking] Failed to track event ${event}:`, error);
    // Don't throw - tracking failures shouldn't break the app
  }
}

/**
 * Track event with deduplication (prevents duplicate events within a time window)
 */
export async function trackEventOnce({
  userId,
  event,
  properties,
  windowMinutes = 1,
}: TrackEventOptions & { windowMinutes?: number }) {
  try {
    // Check if event was already tracked in the time window
    const existingEvent = await prisma.event.findFirst({
      where: {
        userId,
        name: event,
        createdAt: {
          gte: new Date(Date.now() - windowMinutes * 60 * 1000),
        },
      },
    });

    if (existingEvent) {
      return; // Already tracked
    }

    await trackEvent({ userId, event, properties });
  } catch (error) {
    console.error(`[Tracking] Failed to track event ${event}:`, error);
  }
}
