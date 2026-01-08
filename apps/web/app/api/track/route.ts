import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { trackEvent, trackEventOnce, EVENTS, EventName } from "@/lib/tracking";

// Events that can be tracked without authentication
const ANONYMOUS_EVENTS = new Set([
  EVENTS.SIGNUP_STARTED,
  EVENTS.PAYWALL_VIEWED,
]);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    
    const { event, properties } = body as {
      event: string;
      properties?: Record<string, unknown>;
    };

    // Validate event name
    const validEvents = Object.values(EVENTS);
    if (!validEvents.includes(event as EventName)) {
      return NextResponse.json(
        { error: "Invalid event name" },
        { status: 400 }
      );
    }

    // Check if authentication is required
    if (!session?.user?.id && !ANONYMOUS_EVENTS.has(event as EventName)) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // For anonymous events, we might not have a userId
    // In this case, we can skip tracking or use a placeholder
    const userId = session?.user?.id;
    
    if (!userId) {
      // For anonymous events without a user, we can track differently
      // For now, we'll just acknowledge but not persist
      console.log(`[Tracking] Anonymous event: ${event}`, properties);
      return NextResponse.json({ success: true, anonymous: true });
    }

    // Track the event (using trackEventOnce for certain events to prevent duplicates)
    const deduplicatedEvents = new Set([
      EVENTS.SIGNUP_STARTED,
      EVENTS.PAYWALL_VIEWED,
      EVENTS.LESSON_STARTED,
    ]);

    if (deduplicatedEvents.has(event as EventName)) {
      await trackEventOnce({
        userId,
        event: event as EventName,
        properties,
        windowMinutes: 5, // 5 minute deduplication window
      });
    } else {
      await trackEvent({
        userId,
        event: event as EventName,
        properties,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Tracking] Error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}
