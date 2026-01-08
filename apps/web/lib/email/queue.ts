import { prisma } from "@/lib/prisma";
import { EmailStatus } from "@prisma/client";
import { getEmailService, EmailTemplateKey, TemplateVariables } from "./index";

/**
 * Queue an email to be sent at a specific time
 */
export async function queueEmail(
  userId: string,
  template: EmailTemplateKey,
  scheduledFor: Date,
  data?: TemplateVariables
): Promise<{ success: boolean; queueId?: string; error?: string }> {
  try {
    // Check for existing pending email of same type
    const existing = await prisma.emailQueue.findFirst({
      where: {
        userId,
        template,
        status: "PENDING",
      },
    });

    if (existing) {
      return {
        success: false,
        error: `Email ${template} already queued for this user`,
      };
    }

    const queue = await prisma.emailQueue.create({
      data: {
        userId,
        template,
        scheduledFor,
        data: data ? (data as never) : undefined,
        status: "PENDING",
      },
    });

    return {
      success: true,
      queueId: queue.id,
    };
  } catch (error) {
    console.error("Failed to queue email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Queue multiple emails at once
 */
export async function queueEmails(
  emails: Array<{
    userId: string;
    template: EmailTemplateKey;
    scheduledFor: Date;
    data?: TemplateVariables;
  }>
): Promise<{ success: boolean; queued: number; errors: string[] }> {
  const errors: string[] = [];
  let queued = 0;

  for (const email of emails) {
    const result = await queueEmail(
      email.userId,
      email.template,
      email.scheduledFor,
      email.data
    );

    if (result.success) {
      queued++;
    } else if (result.error) {
      errors.push(`${email.template}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    queued,
    errors,
  };
}

/**
 * Cancel pending emails for a user
 */
export async function cancelQueuedEmails(
  userId: string,
  templates?: EmailTemplateKey[]
): Promise<{ cancelled: number }> {
  const where = {
    userId,
    status: "PENDING" as EmailStatus,
    ...(templates ? { template: { in: templates } } : {}),
  };

  const result = await prisma.emailQueue.updateMany({
    where,
    data: {
      status: "CANCELLED",
      processedAt: new Date(),
    },
  });

  return {
    cancelled: result.count,
  };
}

/**
 * Cancel a specific queued email by ID
 */
export async function cancelQueuedEmail(
  queueId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.emailQueue.update({
      where: {
        id: queueId,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
        processedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process the email queue (called by cron job)
 * 
 * This function:
 * 1. Finds all PENDING emails where scheduledFor <= now
 * 2. Checks if email should still be sent (user hasn't unsubscribed, etc.)
 * 3. Sends the email
 * 4. Updates the queue status
 */
export async function processEmailQueue(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  const MAX_BATCH_SIZE = 100;
  const MAX_RETRY_COUNT = 3;
  const STALE_THRESHOLD_DAYS = 7;

  const results = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  // Find pending emails that are due
  const now = new Date();
  const staleDate = new Date(now.getTime() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  const pendingEmails = await prisma.emailQueue.findMany({
    where: {
      status: "PENDING",
      scheduledFor: {
        lte: now,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          marketingOptOut: true,
          subscription: {
            select: {
              status: true,
            },
          },
        },
      },
    },
    take: MAX_BATCH_SIZE,
    orderBy: {
      scheduledFor: "asc",
    },
  });

  const emailService = getEmailService();

  for (const queuedEmail of pendingEmails) {
    results.processed++;

    try {
      // Skip if email is stale (older than threshold)
      if (queuedEmail.scheduledFor < staleDate) {
        await prisma.emailQueue.update({
          where: { id: queuedEmail.id },
          data: {
            status: "CANCELLED",
            processedAt: now,
            error: "Email expired (scheduled more than 7 days ago)",
          },
        });
        results.skipped++;
        continue;
      }

      // Skip if user no longer exists
      if (!queuedEmail.user || !queuedEmail.user.email) {
        await prisma.emailQueue.update({
          where: { id: queuedEmail.id },
          data: {
            status: "CANCELLED",
            processedAt: now,
            error: "User not found or has no email",
          },
        });
        results.skipped++;
        continue;
      }

      // For abandonment emails, check if user has subscribed since queuing
      const isAbandonmentEmail = queuedEmail.template.startsWith("ABANDONMENT");
      if (
        isAbandonmentEmail &&
        queuedEmail.user.subscription?.status === "ACTIVE"
      ) {
        await prisma.emailQueue.update({
          where: { id: queuedEmail.id },
          data: {
            status: "CANCELLED",
            processedAt: now,
            error: "User subscribed since email was queued",
          },
        });
        results.skipped++;
        continue;
      }

      // Send the email
      const templateKey = queuedEmail.template as EmailTemplateKey;
      const variables = (queuedEmail.data as TemplateVariables) || {};

      const sendResult = await emailService.send({
        userId: queuedEmail.userId,
        template: templateKey,
        variables,
      });

      if (sendResult.success) {
        if (sendResult.skipped) {
          // User opted out
          await prisma.emailQueue.update({
            where: { id: queuedEmail.id },
            data: {
              status: "CANCELLED",
              processedAt: now,
              error: sendResult.reason,
            },
          });
          results.skipped++;
        } else {
          // Successfully sent
          await prisma.emailQueue.update({
            where: { id: queuedEmail.id },
            data: {
              status: "SENT",
              processedAt: now,
            },
          });
          results.sent++;
        }
      } else {
        // Failed to send
        const newRetryCount = queuedEmail.retryCount + 1;

        if (newRetryCount >= MAX_RETRY_COUNT) {
          // Max retries exceeded
          await prisma.emailQueue.update({
            where: { id: queuedEmail.id },
            data: {
              status: "FAILED",
              processedAt: now,
              error: sendResult.error,
              retryCount: newRetryCount,
            },
          });
          results.failed++;
        } else {
          // Will retry
          await prisma.emailQueue.update({
            where: { id: queuedEmail.id },
            data: {
              error: sendResult.error,
              retryCount: newRetryCount,
            },
          });
          // Don't count as processed since it will retry
          results.processed--;
        }
      }
    } catch (error) {
      console.error(`Error processing queued email ${queuedEmail.id}:`, error);
      
      await prisma.emailQueue.update({
        where: { id: queuedEmail.id },
        data: {
          status: "FAILED",
          processedAt: now,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
      results.failed++;
    }
  }

  return results;
}

/**
 * Get pending email count (for monitoring)
 */
export async function getPendingEmailCount(): Promise<number> {
  return prisma.emailQueue.count({
    where: {
      status: "PENDING",
    },
  });
}

/**
 * Get queue stats (for admin dashboard)
 */
export async function getQueueStats(): Promise<{
  pending: number;
  sent: number;
  failed: number;
  cancelled: number;
}> {
  const [pending, sent, failed, cancelled] = await Promise.all([
    prisma.emailQueue.count({ where: { status: "PENDING" } }),
    prisma.emailQueue.count({ where: { status: "SENT" } }),
    prisma.emailQueue.count({ where: { status: "FAILED" } }),
    prisma.emailQueue.count({ where: { status: "CANCELLED" } }),
  ]);

  return { pending, sent, failed, cancelled };
}
