import { prisma } from "@/lib/prisma";

// ============================================
// TYPES
// ============================================

export interface CreateModuleInput {
  title: string;
  description?: string;
}

export interface UpdateModuleInput {
  title?: string;
  description?: string;
  published?: boolean;
}

// ============================================
// ADMIN OPERATIONS (All modules, any state)
// ============================================

/**
 * Get all modules for admin (includes unpublished)
 */
export async function getAllModules() {
  return prisma.module.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          published: true,
          isFree: true,
        },
      },
      _count: {
        select: { lessons: true },
      },
    },
  });
}

/**
 * Get a single module by ID (admin)
 */
export async function getModuleById(id: string) {
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
 * Create a new module
 */
export async function createModule(data: CreateModuleInput) {
  // Get the current max order
  const maxOrder = await prisma.module.aggregate({
    _max: { order: true },
  });

  const nextOrder = (maxOrder._max.order ?? 0) + 1;

  return prisma.module.create({
    data: {
      title: data.title,
      description: data.description,
      order: nextOrder,
      published: false, // New modules are unpublished by default
    },
  });
}

/**
 * Update a module
 */
export async function updateModule(id: string, data: UpdateModuleInput) {
  return prisma.module.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      published: data.published,
    },
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
 * Reorder modules
 * @param moduleIds - Array of module IDs in new order
 */
export async function reorderModules(moduleIds: string[]) {
  // Use a transaction to update all orders atomically
  const updates = moduleIds.map((id, index) =>
    prisma.module.update({
      where: { id },
      data: { order: index + 1 },
    })
  );

  return prisma.$transaction(updates);
}

/**
 * Toggle module published state
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

// ============================================
// USER OPERATIONS (Published only)
// ============================================

/**
 * Get all published modules with their published lessons
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
 * Get a published module by ID with its published lessons
 */
export async function getPublishedModuleById(id: string) {
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
 * Get the next/previous module for navigation
 */
export async function getAdjacentModules(currentOrder: number) {
  const [previous, next] = await Promise.all([
    prisma.module.findFirst({
      where: { published: true, order: { lt: currentOrder } },
      orderBy: { order: "desc" },
      select: { id: true, title: true },
    }),
    prisma.module.findFirst({
      where: { published: true, order: { gt: currentOrder } },
      orderBy: { order: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return { previous, next };
}
