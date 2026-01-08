import { NextRequest, NextResponse } from "next/server";
import { processEmailQueue, getQueueStats } from "@/lib/email/queue";

/**
 * POST /api/cron/process-emails
 * 
 * Processes the email queue. Called by Vercel Cron or external scheduler.
 * Protected by CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  
  // Allow both Bearer token and x-cron-secret header
  const providedSecret = 
    authHeader?.replace("Bearer ", "") || 
    request.headers.get("x-cron-secret");

  if (!cronSecret) {
    console.warn("CRON_SECRET not configured - allowing request in development");
    
    // In production, require the secret
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }
  } else if (providedSecret !== cronSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    console.log("[Cron] Starting email queue processing...");
    
    const startTime = Date.now();
    const result = await processEmailQueue();
    const duration = Date.now() - startTime;

    console.log(`[Cron] Email queue processed in ${duration}ms:`, result);

    return NextResponse.json({
      success: true,
      ...result,
      duration,
    });
  } catch (error) {
    console.error("[Cron] Failed to process email queue:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-emails
 * 
 * Returns queue statistics (for monitoring)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for stats too
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const providedSecret = 
    authHeader?.replace("Bearer ", "") || 
    request.headers.get("x-cron-secret");

  if (cronSecret && providedSecret !== cronSecret) {
    // In development, allow without secret
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  try {
    const stats = await getQueueStats();
    
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Failed to get queue stats:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
