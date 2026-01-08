import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ===========================================
// LESSON CRUD OPERATIONS
// ===========================================

/**
 * Create a new lesson in a module with auto-incremented order
 */
export async function createLesson(data: {
  moduleId: string;
  title: string;
  content?: Prisma.InputJsonValue;
  published?: boolean;
  isFree?: boolean;
}) {
  // Get the current max order within this module
  const maxOrderResult = await prisma.lesson.aggregate({
    where: { moduleId: data.moduleId },
    _max: { order: true },
  });

  const nextOrder = (maxOrderResult._max.order ?? 0) + 1;

  return prisma.lesson.create({
    data: {
      moduleId: data.moduleId,
      title: data.title,
      content: data.content ?? Prisma.JsonNull,
      published: data.published ?? false,
      isFree: data.isFree ?? false,
      order: nextOrder,
    },
  });
}

/**
 * Get a single lesson by ID
 */
export async function getLesson(id: string) {
  return prisma.lesson.findUnique({
    where: { id },
    include: {
      module: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

/**
 * Get a lesson with its assets
 */
export async function getLessonWithAssets(id: string) {
  return prisma.lesson.findUnique({
    where: { id },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
      assets: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Get published lesson (user view) - checks isFree or requires access
 */
export async function getPublishedLesson(id: string) {
  return prisma.lesson.findFirst({
    where: {
      id,
      published: true,
    },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          order: true,
          published: true,
        },
      },
      assets: {
        select: {
          id: true,
          filename: true,
          url: true,
          mimeType: true,
          size: true,
        },
      },
    },
  });
}

/**
 * Get all lessons in a module (admin view)
 */
export async function getLessonsByModule(moduleId: string) {
  return prisma.lesson.findMany({
    where: { moduleId },
    orderBy: { order: "asc" },
  });
}

/**
 * Get published lessons in a module (user view)
 */
export async function getPublishedLessonsByModule(moduleId: string) {
  return prisma.lesson.findMany({
    where: {
      moduleId,
      published: true,
    },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      isFree: true,
      videoDuration: true,
    },
  });
}

/**
 * Get the first free lesson (Video 1)
 */
export async function getFirstFreeLesson() {
  return prisma.lesson.findFirst({
    where: {
      isFree: true,
      published: true,
    },
    orderBy: [
      { module: { order: "asc" } },
      { order: "asc" },
    ],
    include: {
      module: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

/**
 * Update a lesson
 */
export async function updateLesson(
  id: string,
  data: {
    title?: string;
    content?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    published?: boolean;
    isFree?: boolean;
    muxAssetId?: string | null;
    muxPlaybackId?: string | null;
    videoDuration?: number | null;
  }
) {
  return prisma.lesson.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      published: data.published,
      isFree: data.isFree,
      muxAssetId: data.muxAssetId,
      muxPlaybackId: data.muxPlaybackId,
      videoDuration: data.videoDuration,
    },
  });
}

/**
 * Toggle lesson published status
 */
export async function toggleLessonPublished(id: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { published: true },
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  return prisma.lesson.update({
    where: { id },
    data: { published: !lesson.published },
  });
}

/**
 * Toggle lesson isFree status
 */
export async function toggleLessonFree(id: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { isFree: true },
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  return prisma.lesson.update({
    where: { id },
    data: { isFree: !lesson.isFree },
  });
}

/**
 * Delete a lesson (cascades to assets)
 */
export async function deleteLesson(id: string) {
  return prisma.lesson.delete({
    where: { id },
  });
}

/**
 * Reorder lessons within a module
 * Uses a transaction to ensure atomic updates
 */
export async function reorderLessons(moduleId: string, orderedIds: string[]) {
  // Verify all lessons belong to the module
  const lessons = await prisma.lesson.findMany({
    where: { moduleId },
    select: { id: true },
  });

  const lessonIds = new Set(lessons.map((l) => l.id));
  const allBelong = orderedIds.every((id) => lessonIds.has(id));

  if (!allBelong) {
    throw new Error("Some lesson IDs do not belong to this module");
  }

  const updates = orderedIds.map((id, index) =>
    prisma.lesson.update({
      where: { id },
      data: { order: index + 1 },
    })
  );

  return prisma.$transaction(updates);
}

/**
 * Move a lesson to a different module
 */
export async function moveLessonToModule(lessonId: string, newModuleId: string) {
  // Get max order in new module
  const maxOrderResult = await prisma.lesson.aggregate({
    where: { moduleId: newModuleId },
    _max: { order: true },
  });

  const nextOrder = (maxOrderResult._max.order ?? 0) + 1;

  return prisma.lesson.update({
    where: { id: lessonId },
    data: {
      moduleId: newModuleId,
      order: nextOrder,
    },
  });
}

/**
 * Get lesson count for a module
 */
export async function getLessonCount(moduleId: string) {
  return prisma.lesson.count({
    where: { moduleId },
  });
}

/**
 * Get total lesson count (all modules)
 */
export async function getTotalLessonCount() {
  return prisma.lesson.count();
}

/**
 * Get published lesson count
 */
export async function getPublishedLessonCount() {
  return prisma.lesson.count({
    where: { published: true },
  });
}

/**
 * Get next and previous lessons for navigation
 */
export async function getAdjacentLessons(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { moduleId: true, order: true },
  });

  if (!lesson) return { previous: null, next: null };

  const [previous, next] = await Promise.all([
    prisma.lesson.findFirst({
      where: {
        moduleId: lesson.moduleId,
        order: { lt: lesson.order },
        published: true,
      },
      orderBy: { order: "desc" },
      select: { id: true, title: true },
    }),
    prisma.lesson.findFirst({
      where: {
        moduleId: lesson.moduleId,
        order: { gt: lesson.order },
        published: true,
      },
      orderBy: { order: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return { previous, next };
}
