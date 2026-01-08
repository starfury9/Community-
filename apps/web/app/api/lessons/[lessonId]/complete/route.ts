import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  markLessonComplete,
  markLessonIncomplete,
  wouldCompleteLessonCompleteModule,
  wouldCompleteModuleCompleteCourse,
} from "@/lib/data";
import {
  triggerAbandonmentSequence,
  triggerModuleCompleteEmail,
  shouldTriggerAbandonmentOnComplete,
  scheduleInactiveNudge,
} from "@/lib/email";

interface RouteParams {
  params: Promise<{ lessonId: string }>;
}

/**
 * POST /api/lessons/[lessonId]/complete
 * Mark a lesson as complete
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const userId = session.user.id;

  try {
    // Verify the lesson exists and is published
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        published: true,
        module: {
          published: true,
        },
      },
      select: {
        id: true,
        moduleId: true,
        title: true,
        isFree: true,
        module: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check if this would complete the module
    const { wouldComplete: moduleWouldComplete, moduleId } =
      await wouldCompleteLessonCompleteModule(userId, lessonId);

    // Mark the lesson as complete
    await markLessonComplete(userId, lessonId);

    // Track the lesson_completed event (or video_1_completed for free lessons)
    await prisma.event.create({
      data: {
        userId,
        name: lesson.isFree ? "video_1_completed" : "lesson_completed",
        properties: {
          lessonId,
          lessonTitle: lesson.title,
          moduleId: lesson.moduleId,
          moduleTitle: lesson.module.title,
          isFree: lesson.isFree,
        },
      },
    });

    // Check if this triggers abandonment sequence (free lesson completion)
    const shouldTriggerAbandonment = await shouldTriggerAbandonmentOnComplete(lessonId);
    if (shouldTriggerAbandonment) {
      triggerAbandonmentSequence(userId).catch((err) => {
        console.error("Failed to trigger abandonment sequence:", err);
      });
    }

    // Reset inactive nudge timer on activity
    scheduleInactiveNudge(userId).catch((err) => {
      console.error("Failed to schedule inactive nudge:", err);
    });

    let courseCompleted = false;

    // If module was just completed, track that too
    if (moduleWouldComplete && moduleId) {
      await prisma.event.create({
        data: {
          userId,
          name: "module_completed",
          properties: {
            moduleId,
            moduleTitle: lesson.module.title,
            moduleOrder: lesson.module.order,
          },
        },
      });

      // Check if this completes the course
      courseCompleted = await wouldCompleteModuleCompleteCourse(userId, moduleId);

      if (courseCompleted) {
        await prisma.event.create({
          data: {
            userId,
            name: "course_completed",
            properties: {
              completedAt: new Date().toISOString(),
            },
          },
        });
      }

      // Trigger module/course complete email
      triggerModuleCompleteEmail(userId, moduleId).catch((err) => {
        console.error("Failed to trigger module complete email:", err);
      });
    }

    // Get next module ID for unlock animation
    let nextModuleId: string | null = null;
    if (moduleWouldComplete && moduleId) {
      const nextModule = await prisma.module.findFirst({
        where: {
          published: true,
          order: {
            gt: lesson.module.order,
          },
        },
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
        },
      });
      nextModuleId = nextModule?.id ?? null;
    }

    return NextResponse.json({
      success: true,
      lessonCompleted: true,
      moduleCompleted: moduleWouldComplete,
      courseCompleted,
      moduleId: moduleWouldComplete ? moduleId : null,
      nextModuleId,
    });
  } catch (error) {
    console.error("Error marking lesson complete:", error);
    return NextResponse.json(
      { error: "Failed to mark lesson complete" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lessons/[lessonId]/complete
 * Mark a lesson as incomplete (undo completion)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const userId = session.user.id;

  try {
    // Verify the lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Mark the lesson as incomplete
    await markLessonIncomplete(userId, lessonId);

    return NextResponse.json({
      success: true,
      lessonCompleted: false,
    });
  } catch (error) {
    console.error("Error marking lesson incomplete:", error);
    return NextResponse.json(
      { error: "Failed to mark lesson incomplete" },
      { status: 500 }
    );
  }
}
