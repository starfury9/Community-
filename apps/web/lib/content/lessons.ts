import { prisma, Prisma } from "@/lib/prisma";

// ============================================
// TYPES
// ============================================

export interface CreateLessonInput {
  moduleId: string;
  title: string;
  content?: Prisma.InputJsonValue;
  isFree?: boolean;
}

export interface UpdateLessonInput {
  title?: string;
  content?: Prisma.InputJsonValue;
  published?: boolean;
  isFree?: boolean;
}

// ============================================
// ADMIN OPERATIONS (All lessons, any state)
// ============================================

/**
 * Get all lessons for a module (admin)
 */
export async function getLessonsByModuleId(moduleId: string) {
  return prisma.lesson.findMany({
    where: { moduleId },
    orderBy: { order: "asc" },
    include: {
      assets: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Get a single lesson by ID (admin)
 */
export async function getLessonById(id: string) {
  return prisma.lesson.findUnique({
    where: { id },
    include: {
      module: {
        select: {
          id: true,
          title: true,
        },
      },
      assets: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Create a new lesson
 */
export async function createLesson(data: CreateLessonInput) {
  // Get the current max order for this module
  const maxOrder = await prisma.lesson.aggregate({
    where: { moduleId: data.moduleId },
    _max: { order: true },
  });

  const nextOrder = (maxOrder._max.order ?? 0) + 1;

  return prisma.lesson.create({
    data: {
      moduleId: data.moduleId,
      title: data.title,
      content: data.content ?? Prisma.JsonNull,
      order: nextOrder,
      published: false, // New lessons are unpublished by default
      isFree: data.isFree ?? false,
    },
  });
}

/**
 * Update a lesson
 */
export async function updateLesson(id: string, data: UpdateLessonInput) {
  return prisma.lesson.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      published: data.published,
      isFree: data.isFree,
    },
  });
}

/**
 * Update lesson content (TipTap JSON)
 */
export async function updateLessonContent(id: string, content: Prisma.InputJsonValue) {
  return prisma.lesson.update({
    where: { id },
    data: { content },
  });
}

/**
 * Update lesson video data (from Mux webhook)
 */
export async function updateLessonVideo(
  id: string,
  data: {
    muxAssetId?: string;
    muxPlaybackId?: string;
    videoDuration?: number;
  }
) {
  return prisma.lesson.update({
    where: { id },
    data: {
      muxAssetId: data.muxAssetId,
      muxPlaybackId: data.muxPlaybackId,
      videoDuration: data.videoDuration,
    },
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
 * @param lessonIds - Array of lesson IDs in new order
 */
export async function reorderLessons(lessonIds: string[]) {
  // Use a transaction to update all orders atomically
  const updates = lessonIds.map((id, index) =>
    prisma.lesson.update({
      where: { id },
      data: { order: index + 1 },
    })
  );

  return prisma.$transaction(updates);
}

/**
 * Toggle lesson published state
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
 * Toggle lesson isFree state
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

// ============================================
// USER OPERATIONS (Published only)
// ============================================

/**
 * Get a published lesson with its assets
 */
export async function getPublishedLessonById(id: string) {
  return prisma.lesson.findFirst({
    where: { id, published: true },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          published: true,
        },
      },
      assets: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Get the next/previous lesson for navigation (within same module)
 */
export async function getAdjacentLessons(moduleId: string, currentOrder: number) {
  const [previous, next] = await Promise.all([
    prisma.lesson.findFirst({
      where: { moduleId, published: true, order: { lt: currentOrder } },
      orderBy: { order: "desc" },
      select: { id: true, title: true },
    }),
    prisma.lesson.findFirst({
      where: { moduleId, published: true, order: { gt: currentOrder } },
      orderBy: { order: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return { previous, next };
}

/**
 * Get the first lesson of a module (for "Start Module" button)
 */
export async function getFirstLessonOfModule(moduleId: string) {
  return prisma.lesson.findFirst({
    where: { moduleId, published: true },
    orderBy: { order: "asc" },
    select: { id: true, title: true },
  });
}

/**
 * Check if a lesson is free (isFree flag)
 * Critical: Video 1 is FREE rule from .cursorrules
 */
export async function isLessonFree(id: string): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { isFree: true },
  });

  return lesson?.isFree ?? false;
}
