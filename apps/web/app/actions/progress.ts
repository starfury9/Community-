"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  markLessonComplete as dbMarkComplete,
  markLessonIncomplete as dbMarkIncomplete,
  isModuleComplete,
  getCourseProgress,
  wouldCompleteLessonCompleteModule,
  wouldCompleteModuleCompleteCourse,
} from "@/lib/data";

// ===========================================
// Types
// ===========================================

interface CompletionResult {
  success: boolean;
  error?: string;
  lessonComplete: boolean;
  moduleComplete: boolean;
  moduleId: string | null;
  courseComplete: boolean;
}

// ===========================================
// Server Actions
// ===========================================

/**
 * Mark a lesson as complete
 */
export async function markLessonCompleteAction(
  lessonId: string
): Promise<CompletionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
        lessonComplete: false,
        moduleComplete: false,
        moduleId: null,
        courseComplete: false,
      };
    }

    const userId = session.user.id;

    // Verify lesson exists and is published
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        moduleId: true,
        published: true,
        module: {
          select: {
            id: true,
            published: true,
          },
        },
      },
    });

    if (!lesson || !lesson.published || !lesson.module.published) {
      return {
        success: false,
        error: "Lesson not found",
        lessonComplete: false,
        moduleComplete: false,
        moduleId: null,
        courseComplete: false,
      };
    }

    // Check if completing this lesson would complete the module
    const { wouldComplete: wouldCompleteModule, moduleId } =
      await wouldCompleteLessonCompleteModule(userId, lessonId);

    // Mark the lesson as complete
    await dbMarkComplete(userId, lessonId);

    // Track lesson_completed event
    await prisma.event.create({
      data: {
        userId,
        name: "lesson_completed",
        properties: {
          lessonId,
          moduleId: lesson.moduleId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Check if module is now complete
    let moduleComplete = false;
    let courseComplete = false;

    if (wouldCompleteModule && moduleId) {
      moduleComplete = await isModuleComplete(userId, moduleId);

      if (moduleComplete) {
        // Track module_completed event
        await prisma.event.create({
          data: {
            userId,
            name: "module_completed",
            properties: {
              moduleId,
              timestamp: new Date().toISOString(),
            },
          },
        });

        // Check if course is now complete
        courseComplete = await wouldCompleteModuleCompleteCourse(userId, moduleId);

        if (courseComplete) {
          // Track course_completed event
          await prisma.event.create({
            data: {
              userId,
              name: "course_completed",
              properties: {
                timestamp: new Date().toISOString(),
              },
            },
          });
        }
      }
    }

    // Revalidate relevant paths
    revalidatePath(`/course/${lesson.moduleId}/${lessonId}`);
    revalidatePath(`/course/${lesson.moduleId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      lessonComplete: true,
      moduleComplete,
      moduleId: lesson.moduleId,
      courseComplete,
    };
  } catch (error) {
    console.error("Error marking lesson complete:", error);
    return {
      success: false,
      error: "Failed to mark lesson complete",
      lessonComplete: false,
      moduleComplete: false,
      moduleId: null,
      courseComplete: false,
    };
  }
}

/**
 * Mark a lesson as incomplete (undo completion)
 */
export async function markLessonIncompleteAction(
  lessonId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        moduleId: true,
      },
    });

    if (!lesson) {
      return { success: false, error: "Lesson not found" };
    }

    // Mark incomplete
    await dbMarkIncomplete(userId, lessonId);

    // Revalidate relevant paths
    revalidatePath(`/course/${lesson.moduleId}/${lessonId}`);
    revalidatePath(`/course/${lesson.moduleId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error marking lesson incomplete:", error);
    return { success: false, error: "Failed to mark lesson incomplete" };
  }
}

/**
 * Get user's course progress
 */
export async function getUserProgressAction() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", progress: null };
    }

    const progress = await getCourseProgress(session.user.id);

    return { success: true, progress };
  } catch (error) {
    console.error("Error getting user progress:", error);
    return { success: false, error: "Failed to get progress", progress: null };
  }
}
