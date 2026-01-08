import { prisma } from "@/lib/prisma";

// ===========================================
// Types
// ===========================================

export interface ModuleProgress {
  moduleId: string;
  completed: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

export interface CourseProgress {
  completedModules: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  isComplete: boolean;
}

export interface NextLesson {
  id: string;
  title: string;
  order: number;
  moduleId: string;
  moduleTitle: string;
  moduleOrder: number;
}

// ===========================================
// Lesson Progress CRUD
// ===========================================

/**
 * Mark a lesson as complete for a user
 * Uses upsert to handle race conditions gracefully
 */
export async function markLessonComplete(userId: string, lessonId: string) {
  return prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: { userId, lessonId },
    },
    update: {
      completed: true,
      completedAt: new Date(),
    },
    create: {
      userId,
      lessonId,
      completed: true,
      completedAt: new Date(),
    },
  });
}

/**
 * Mark a lesson as incomplete for a user (undo completion)
 */
export async function markLessonIncomplete(userId: string, lessonId: string) {
  return prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: { userId, lessonId },
    },
    update: {
      completed: false,
      completedAt: null,
    },
    create: {
      userId,
      lessonId,
      completed: false,
      completedAt: null,
    },
  });
}

/**
 * Get progress for a single lesson
 */
export async function getLessonProgress(userId: string, lessonId: string) {
  return prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: { userId, lessonId },
    },
  });
}

/**
 * Get all lesson progress for a user
 */
export async function getAllUserProgress(userId: string) {
  return prisma.lessonProgress.findMany({
    where: { userId },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          order: true,
          moduleId: true,
          published: true,
        },
      },
    },
  });
}

/**
 * Get completed lesson IDs for a user
 */
export async function getCompletedLessonIds(userId: string): Promise<string[]> {
  const progress = await prisma.lessonProgress.findMany({
    where: {
      userId,
      completed: true,
    },
    select: {
      lessonId: true,
    },
  });
  return progress.map((p) => p.lessonId);
}

// ===========================================
// Module Progress
// ===========================================

/**
 * Get progress for a specific module
 */
export async function getModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgress> {
  // Get all published lessons in the module
  const lessons = await prisma.lesson.findMany({
    where: {
      moduleId,
      published: true,
    },
    select: {
      id: true,
    },
  });

  const total = lessons.length;

  // Handle empty module case
  if (total === 0) {
    return {
      moduleId,
      completed: 0,
      total: 0,
      percentage: 100, // Empty modules are considered complete
      isComplete: true,
    };
  }

  // Get completed lessons for this user in this module
  const completedProgress = await prisma.lessonProgress.findMany({
    where: {
      userId,
      lessonId: { in: lessons.map((l) => l.id) },
      completed: true,
    },
    select: {
      lessonId: true,
    },
  });

  const completed = completedProgress.length;
  const percentage = Math.round((completed / total) * 100);

  return {
    moduleId,
    completed,
    total,
    percentage,
    isComplete: completed >= total,
  };
}

/**
 * Check if a module is complete
 */
export async function isModuleComplete(
  userId: string,
  moduleId: string
): Promise<boolean> {
  const progress = await getModuleProgress(userId, moduleId);
  return progress.isComplete;
}

/**
 * Get progress for all modules
 */
export async function getAllModulesProgress(
  userId: string
): Promise<ModuleProgress[]> {
  // Get all published modules
  const modules = await prisma.module.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      lessons: {
        where: { published: true },
        select: { id: true },
      },
    },
  });

  // Get all completed lessons for this user
  const completedLessonIds = await getCompletedLessonIds(userId);
  const completedSet = new Set(completedLessonIds);

  // Calculate progress for each module
  return modules.map((courseModule) => {
    const total = courseModule.lessons.length;
    const completed = courseModule.lessons.filter((l) =>
      completedSet.has(l.id)
    ).length;

    return {
      moduleId: courseModule.id,
      completed,
      total,
      percentage: total === 0 ? 100 : Math.round((completed / total) * 100),
      isComplete: total === 0 || completed >= total,
    };
  });
}

// ===========================================
// Course Progress
// ===========================================

/**
 * Get overall course progress for a user
 */
export async function getCourseProgress(userId: string): Promise<CourseProgress> {
  // Get all published modules with their lessons
  const modules = await prisma.module.findMany({
    where: { published: true },
    select: {
      id: true,
      lessons: {
        where: { published: true },
        select: { id: true },
      },
    },
  });

  const totalModules = modules.length;

  // Handle empty course case
  if (totalModules === 0) {
    return {
      completedModules: 0,
      totalModules: 0,
      completedLessons: 0,
      totalLessons: 0,
      percentage: 0,
      isComplete: false,
    };
  }

  // Get all completed lessons for this user
  const completedLessonIds = await getCompletedLessonIds(userId);
  const completedSet = new Set(completedLessonIds);

  // Calculate totals
  let totalLessons = 0;
  let completedLessons = 0;
  let completedModules = 0;

  for (const courseModule of modules) {
    const moduleTotal = courseModule.lessons.length;
    const moduleCompleted = courseModule.lessons.filter((l) =>
      completedSet.has(l.id)
    ).length;

    totalLessons += moduleTotal;
    completedLessons += moduleCompleted;

    // Module is complete if all lessons complete (or no lessons)
    if (moduleTotal === 0 || moduleCompleted >= moduleTotal) {
      completedModules++;
    }
  }

  const percentage =
    totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  return {
    completedModules,
    totalModules,
    completedLessons,
    totalLessons,
    percentage,
    isComplete: completedModules >= totalModules && totalModules > 0,
  };
}

// ===========================================
// Resume / Next Lesson
// ===========================================

/**
 * Get the next incomplete lesson for a user (for "resume where you left off")
 * Returns the first incomplete lesson in the first incomplete module
 */
export async function getNextIncompleteLesson(
  userId: string
): Promise<NextLesson | null> {
  // Get all published modules with their lessons, ordered
  const modules = await prisma.module.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      lessons: {
        where: { published: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
    },
  });

  // Get all completed lessons for this user
  const completedLessonIds = await getCompletedLessonIds(userId);
  const completedSet = new Set(completedLessonIds);

  // Find first incomplete lesson
  for (const courseModule of modules) {
    for (const lesson of courseModule.lessons) {
      if (!completedSet.has(lesson.id)) {
        return {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          moduleId: courseModule.id,
          moduleTitle: courseModule.title,
          moduleOrder: courseModule.order,
        };
      }
    }
  }

  // All lessons complete
  return null;
}

/**
 * Get the first lesson in the course (for users who haven't started)
 */
export async function getFirstLesson(): Promise<NextLesson | null> {
  const firstModule = await prisma.module.findFirst({
    where: { published: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      lessons: {
        where: { published: true },
        orderBy: { order: "asc" },
        take: 1,
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
    },
  });

  if (!firstModule || firstModule.lessons.length === 0) {
    return null;
  }

  const lesson = firstModule.lessons[0];

  return {
    id: lesson.id,
    title: lesson.title,
    order: lesson.order,
    moduleId: firstModule.id,
    moduleTitle: firstModule.title,
    moduleOrder: firstModule.order,
  };
}

// ===========================================
// Module Completion Check (for gating)
// ===========================================

/**
 * Check if the previous module is complete (for sequential unlock)
 * Module 1 is always unlocked
 */
export async function isPreviousModuleComplete(
  userId: string,
  moduleOrder: number
): Promise<boolean> {
  // Module 1 is always unlocked
  if (moduleOrder <= 1) {
    return true;
  }

  // Find the previous published module
  const previousModule = await prisma.module.findFirst({
    where: {
      published: true,
      order: { lt: moduleOrder },
    },
    orderBy: { order: "desc" },
    select: { id: true },
  });

  // If no previous module exists, this module is unlocked
  if (!previousModule) {
    return true;
  }

  // Check if previous module is complete
  return isModuleComplete(userId, previousModule.id);
}

/**
 * Get all unlocked module IDs for a user
 */
export async function getUnlockedModuleIds(userId: string): Promise<string[]> {
  const modules = await prisma.module.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      order: true,
      lessons: {
        where: { published: true },
        select: { id: true },
      },
    },
  });

  const completedLessonIds = await getCompletedLessonIds(userId);
  const completedSet = new Set(completedLessonIds);

  const unlockedIds: string[] = [];
  let previousComplete = true; // First module is always unlocked

  for (const courseModule of modules) {
    if (previousComplete) {
      unlockedIds.push(courseModule.id);

      // Check if this module is complete for next iteration
      const moduleTotal = courseModule.lessons.length;
      const moduleCompleted = courseModule.lessons.filter((l) =>
        completedSet.has(l.id)
      ).length;

      previousComplete = moduleTotal === 0 || moduleCompleted >= moduleTotal;
    } else {
      // Previous module not complete, this and subsequent modules are locked
      break;
    }
  }

  return unlockedIds;
}

// ===========================================
// Module Unlock Status (for UI)
// ===========================================

export interface ModuleWithUnlockStatus {
  id: string;
  title: string;
  description: string | null;
  order: number;
  published: boolean;
  lessonCount: number;
  isUnlocked: boolean;
  progress: ModuleProgress;
}

/**
 * Check if a specific module is unlocked for a user
 */
export async function isModuleUnlocked(
  userId: string,
  moduleId: string
): Promise<boolean> {
  const courseModule = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { order: true },
  });

  if (!courseModule) {
    return false;
  }

  return isPreviousModuleComplete(userId, courseModule.order);
}

/**
 * Get all unlocked modules with their details
 */
export async function getUnlockedModules(userId: string) {
  const unlockedIds = await getUnlockedModuleIds(userId);
  
  return prisma.module.findMany({
    where: {
      id: { in: unlockedIds },
      published: true,
    },
    orderBy: { order: "asc" },
    include: {
      lessons: {
        where: { published: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          isFree: true,
          videoDuration: true,
        },
      },
    },
  });
}

/**
 * Get all modules with their unlock status and progress
 */
export async function getModulesWithUnlockStatus(
  userId: string
): Promise<ModuleWithUnlockStatus[]> {
  const modules = await prisma.module.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      order: true,
      published: true,
      lessons: {
        where: { published: true },
        select: { id: true },
      },
    },
  });

  const completedLessonIds = await getCompletedLessonIds(userId);
  const completedSet = new Set(completedLessonIds);

  const result: ModuleWithUnlockStatus[] = [];
  let previousComplete = true;

  for (const courseModule of modules) {
    const total = courseModule.lessons.length;
    const completed = courseModule.lessons.filter((l) =>
      completedSet.has(l.id)
    ).length;
    const percentage = total === 0 ? 100 : Math.round((completed / total) * 100);
    const isComplete = total === 0 || completed >= total;

    result.push({
      id: courseModule.id,
      title: courseModule.title,
      description: courseModule.description,
      order: courseModule.order,
      published: courseModule.published,
      lessonCount: total,
      isUnlocked: previousComplete,
      progress: {
        moduleId: courseModule.id,
        completed,
        total,
        percentage,
        isComplete,
      },
    });

    // Update for next iteration
    if (previousComplete) {
      previousComplete = isComplete;
    }
  }

  return result;
}

/**
 * Check if a lesson is accessible (module is unlocked)
 */
export async function isLessonAccessible(
  userId: string,
  lessonId: string
): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      moduleId: true,
      isFree: true,
    },
  });

  if (!lesson) {
    return false;
  }

  // Free lessons are always accessible
  if (lesson.isFree) {
    return true;
  }

  // Check if module is unlocked
  return isModuleUnlocked(userId, lesson.moduleId);
}

// ===========================================
// Progress with Modules (for dashboard)
// ===========================================

export interface ModuleWithProgress {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessonCount: number;
  completedCount: number;
  percentage: number;
  isComplete: boolean;
  isUnlocked: boolean;
  lessons: {
    id: string;
    title: string;
    order: number;
    isFree: boolean;
    videoDuration: number | null;
    isComplete: boolean;
  }[];
}

/**
 * Get all modules with progress for dashboard
 */
export async function getModulesWithProgress(
  userId: string
): Promise<ModuleWithProgress[]> {
  const modules = await prisma.module.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      order: true,
      lessons: {
        where: { published: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          isFree: true,
          videoDuration: true,
        },
      },
    },
  });

  const completedLessonIds = await getCompletedLessonIds(userId);
  const completedSet = new Set(completedLessonIds);

  const result: ModuleWithProgress[] = [];
  let previousComplete = true;

  for (const courseModule of modules) {
    const lessons = courseModule.lessons.map((lesson) => ({
      ...lesson,
      isComplete: completedSet.has(lesson.id),
    }));

    const total = lessons.length;
    const completedCount = lessons.filter((l) => l.isComplete).length;
    const percentage = total === 0 ? 100 : Math.round((completedCount / total) * 100);
    const isComplete = total === 0 || completedCount >= total;

    result.push({
      id: courseModule.id,
      title: courseModule.title,
      description: courseModule.description,
      order: courseModule.order,
      lessonCount: total,
      completedCount,
      percentage,
      isComplete,
      isUnlocked: previousComplete,
      lessons,
    });

    // Update for next iteration
    if (previousComplete) {
      previousComplete = isComplete;
    }
  }

  return result;
}

// ===========================================
// Completion Detection (for celebrations)
// ===========================================

/**
 * Check if completing a lesson would complete its module
 */
export async function wouldCompleteLessonCompleteModule(
  userId: string,
  lessonId: string
): Promise<{ wouldComplete: boolean; moduleId: string | null }> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      moduleId: true,
      module: {
        select: {
          lessons: {
            where: { published: true },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!lesson) {
    return { wouldComplete: false, moduleId: null };
  }

  const totalLessons = lesson.module.lessons.length;
  
  // Get currently completed lessons in this module (excluding the one being completed)
  const completedProgress = await prisma.lessonProgress.findMany({
    where: {
      userId,
      lessonId: { 
        in: lesson.module.lessons.map((l) => l.id),
        not: lessonId, // Exclude current lesson
      },
      completed: true,
    },
    select: { lessonId: true },
  });

  // If completing this lesson would bring total to all lessons
  const wouldComplete = completedProgress.length + 1 >= totalLessons;

  return { wouldComplete, moduleId: lesson.moduleId };
}

/**
 * Check if completing a module would complete the course
 */
export async function wouldCompleteModuleCompleteCourse(
  userId: string,
  moduleId: string
): Promise<boolean> {
  const modules = await prisma.module.findMany({
    where: { published: true },
    select: {
      id: true,
      lessons: {
        where: { published: true },
        select: { id: true },
      },
    },
  });

  const completedLessonIds = await getCompletedLessonIds(userId);
  const completedSet = new Set(completedLessonIds);

  let completedModules = 0;

  for (const courseModule of modules) {
    const total = courseModule.lessons.length;
    
    if (total === 0) {
      completedModules++;
      continue;
    }

    if (courseModule.id === moduleId) {
      // This module will be marked complete
      completedModules++;
    } else {
      const completed = courseModule.lessons.filter((l) =>
        completedSet.has(l.id)
      ).length;
      
      if (completed >= total) {
        completedModules++;
      }
    }
  }

  return completedModules >= modules.length;
}
