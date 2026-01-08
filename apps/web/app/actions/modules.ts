"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createModule as createModuleData,
  updateModule as updateModuleData,
  deleteModule as deleteModuleData,
  reorderModules as reorderModulesData,
  toggleModulePublished as toggleModulePublishedData,
} from "@/lib/data";

/**
 * Server action to create a new module
 * Requires ADMIN role
 */
export async function createModuleAction(data: {
  title: string;
  description?: string;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (!data.title || data.title.trim().length === 0) {
    return { error: "Title is required" };
  }

  try {
    const createdModule = await createModuleData({
      title: data.title.trim(),
      description: data.description?.trim(),
    });

    revalidatePath("/admin/content");
    return { success: true, module: createdModule };
  } catch (error) {
    console.error("Failed to create module:", error);
    return { error: "Failed to create module" };
  }
}

/**
 * Server action to update a module
 * Requires ADMIN role
 */
export async function updateModuleAction(
  id: string,
  data: {
    title?: string;
    description?: string;
    published?: boolean;
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
    const updatedModule = await updateModuleData(id, {
      title: data.title?.trim(),
      description: data.description?.trim(),
      published: data.published,
    });

    revalidatePath("/admin/content");
    revalidatePath("/dashboard");
    return { success: true, module: updatedModule };
  } catch (error) {
    console.error("Failed to update module:", error);
    return { error: "Failed to update module" };
  }
}

/**
 * Server action to toggle module published status
 * Requires ADMIN role
 */
export async function toggleModulePublishedAction(id: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const toggledModule = await toggleModulePublishedData(id);

    revalidatePath("/admin/content");
    revalidatePath("/dashboard");
    return { success: true, module: toggledModule };
  } catch (error) {
    console.error("Failed to toggle module published:", error);
    return { error: "Failed to update module" };
  }
}

/**
 * Server action to delete a module
 * Requires ADMIN role
 */
export async function deleteModuleAction(id: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    await deleteModuleData(id);

    revalidatePath("/admin/content");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete module:", error);
    return { error: "Failed to delete module" };
  }
}

/**
 * Server action to reorder modules
 * Requires ADMIN role
 */
export async function reorderModulesAction(orderedIds: string[]) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (!orderedIds || orderedIds.length === 0) {
    return { error: "No module IDs provided" };
  }

  try {
    await reorderModulesData(orderedIds);

    revalidatePath("/admin/content");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder modules:", error);
    return { error: "Failed to reorder modules" };
  }
}
