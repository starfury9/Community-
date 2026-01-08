"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  createLesson as createLessonData,
  updateLesson as updateLessonData,
  deleteLesson as deleteLessonData,
  reorderLessons as reorderLessonsData,
  toggleLessonPublished as toggleLessonPublishedData,
  toggleLessonFree as toggleLessonFreeData,
  moveLessonToModule as moveLessonToModuleData,
} from "@/lib/data";

/**
 * Server action to create a new lesson
 * Requires ADMIN role
 */
export async function createLessonAction(data: {
  moduleId: string;
  title: string;
  content?: Prisma.InputJsonValue;
  isFree?: boolean;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (!data.moduleId) {
    return { error: "Module ID is required" };
  }

  if (!data.title || data.title.trim().length === 0) {
    return { error: "Title is required" };
  }

  try {
    const lesson = await createLessonData({
      moduleId: data.moduleId,
      title: data.title.trim(),
      content: data.content,
      isFree: data.isFree,
    });

    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/modules/${data.moduleId}`);
    return { success: true, lesson };
  } catch (error) {
    console.error("Failed to create lesson:", error);
    return { error: "Failed to create lesson" };
  }
}

/**
 * Server action to update a lesson
 * Requires ADMIN role
 */
export async function updateLessonAction(
  id: string,
  data: {
    title?: string;
    content?: Prisma.InputJsonValue;
    published?: boolean;
    isFree?: boolean;
    muxAssetId?: string | null;
    muxPlaybackId?: string | null;
    videoDuration?: number | null;
  }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (data.title !== undefined && data.title.trim().length === 0) {
    return { error: "Title cannot be empty" };
  }

  try {
    const lesson = await updateLessonData(id, {
      title: data.title?.trim(),
      content: data.content,
      published: data.published,
      isFree: data.isFree,
      muxAssetId: data.muxAssetId,
      muxPlaybackId: data.muxPlaybackId,
      videoDuration: data.videoDuration,
    });

    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/lessons/${id}`);
    revalidatePath("/dashboard");
    return { success: true, lesson };
  } catch (error) {
    console.error("Failed to update lesson:", error);
    return { error: "Failed to update lesson" };
  }
}

/**
 * Server action to toggle lesson published status
 * Requires ADMIN role
 */
export async function toggleLessonPublishedAction(id: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const lesson = await toggleLessonPublishedData(id);

    revalidatePath("/admin/content");
    revalidatePath("/dashboard");
    return { success: true, lesson };
  } catch (error) {
    console.error("Failed to toggle lesson published:", error);
    return { error: "Failed to update lesson" };
  }
}

/**
 * Server action to toggle lesson isFree status
 * Requires ADMIN role
 */
export async function toggleLessonFreeAction(id: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const lesson = await toggleLessonFreeData(id);

    revalidatePath("/admin/content");
    revalidatePath("/dashboard");
    return { success: true, lesson };
  } catch (error) {
    console.error("Failed to toggle lesson free status:", error);
    return { error: "Failed to update lesson" };
  }
}

/**
 * Server action to delete a lesson
 * Requires ADMIN role
 */
export async function deleteLessonAction(id: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    await deleteLessonData(id);

    revalidatePath("/admin/content");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete lesson:", error);
    return { error: "Failed to delete lesson" };
  }
}

/**
 * Server action to reorder lessons within a module
 * Requires ADMIN role
 */
export async function reorderLessonsAction(
  moduleId: string,
  orderedIds: string[]
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (!moduleId) {
    return { error: "Module ID is required" };
  }

  if (!orderedIds || orderedIds.length === 0) {
    return { error: "No lesson IDs provided" };
  }

  try {
    await reorderLessonsData(moduleId, orderedIds);

    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/modules/${moduleId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder lessons:", error);
    return { error: "Failed to reorder lessons" };
  }
}

/**
 * Server action to move a lesson to a different module
 * Requires ADMIN role
 */
export async function moveLessonAction(lessonId: string, newModuleId: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (!lessonId || !newModuleId) {
    return { error: "Lesson ID and Module ID are required" };
  }

  try {
    const lesson = await moveLessonToModuleData(lessonId, newModuleId);

    revalidatePath("/admin/content");
    revalidatePath("/dashboard");
    return { success: true, lesson };
  } catch (error) {
    console.error("Failed to move lesson:", error);
    return { error: "Failed to move lesson" };
  }
}
