import { prisma } from "@/lib/prisma";

// ===========================================
// MODULE CRUD OPERATIONS
// ===========================================

/**
 * Create a new module with auto-incremented order
 */
export async function createModule(data: {
  title: string;
  description?: string;
  published?: boolean;
}) {
  // Get the current max order
  const maxOrderResult = await prisma.module.aggregate({
    _max: { order: true },
  });

  const nextOrder = (maxOrderResult._max.order ?? 0) + 1;

  return prisma.module.create({
    data: {
      title: data.title,
      description: data.description,
      published: data.published ?? false,
      order: nextOrder,
    },
  });
}

/**
 * Get a single module by ID
 */
export async function getModule(id: string) {
  return prisma.module.findUnique({
    where: { id },
  });
}

/**
 * Get a module with all its lessons
 */
export async function getModuleWithLessons(id: string) {
  return prisma.module.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { order: "asc" },
      },
    },
  });
}

/**
 * Get all modules (admin view - includes unpublished)
 */
export async function getAllModules() {
  return prisma.module.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { lessons: true },
      },
    },
  });
}

/**
 * Get all modules with lessons (admin view)
 */
export async function getAllModulesWithLessons() {
  return prisma.module.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
      },
    },
  });
}

/**
 * Get published modules only (user view)
 */
export async function getPublishedModules() {
  return prisma.module.findMany({
    where: { published: true },
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
      _count: {
        select: {
          lessons: {
            where: { published: true },
          },
        },
      },
    },
  });
}

/**
 * Get published module with published lessons (user view)
 */
export async function getPublishedModuleWithLessons(id: string) {
  return prisma.module.findFirst({
    where: { id, published: true },
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
 * Update a module
 */
export async function updateModule(
  id: string,
  data: {
    title?: string;
    description?: string;
    published?: boolean;
  }
) {
  return prisma.module.update({
    where: { id },
    data,
  });
}

/**
 * Toggle module published status
 */
export async function toggleModulePublished(id: string) {
  const existingModule = await prisma.module.findUnique({
    where: { id },
    select: { published: true },
  });

  if (!existingModule) {
    throw new Error("Module not found");
  }

  return prisma.module.update({
    where: { id },
    data: { published: !existingModule.published },
  });
}

/**
 * Delete a module (cascades to lessons and assets)
 */
export async function deleteModule(id: string) {
  return prisma.module.delete({
    where: { id },
  });
}

/**
 * Reorder modules by providing an array of IDs in new order
 * Uses a transaction to ensure atomic updates
 */
export async function reorderModules(orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    prisma.module.update({
      where: { id },
      data: { order: index + 1 },
    })
  );

  return prisma.$transaction(updates);
}

/**
 * Get module count (total)
 */
export async function getModuleCount() {
  return prisma.module.count();
}

/**
 * Get published module count
 */
export async function getPublishedModuleCount() {
  return prisma.module.count({
    where: { published: true },
  });
}
