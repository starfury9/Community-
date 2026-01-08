"use client";

import { useState } from "react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toggleLessonPublishedAction, toggleLessonFreeAction, deleteLessonAction } from "@/app/actions";
import { useRouter } from "next/navigation";

interface Lesson {
  id: string;
  title: string;
  order: number;
  published: boolean;
  isFree: boolean;
}

interface LessonItemProps {
  lesson: Lesson;
  moduleId: string;
  index: number;
}

export function LessonItem({ lesson, moduleId, index }: LessonItemProps) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(lesson.published);
  const [isFree, setIsFree] = useState(lesson.isFree);
  const [isToggling, setIsToggling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function handleTogglePublished() {
    setIsToggling(true);
    const previousState = isPublished;
    setIsPublished(!isPublished);

    const result = await toggleLessonPublishedAction(lesson.id);

    if (result.error) {
      setIsPublished(previousState);
      console.error("Failed to toggle:", result.error);
    }

    setIsToggling(false);
  }

  async function handleToggleFree() {
    setIsToggling(true);
    const previousState = isFree;
    setIsFree(!isFree);

    const result = await toggleLessonFreeAction(lesson.id);

    if (result.error) {
      setIsFree(previousState);
      console.error("Failed to toggle:", result.error);
    }

    setIsToggling(false);
  }

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteLessonAction(lesson.id);

    if (result.error) {
      console.error("Failed to delete:", result.error);
      setIsDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-md border bg-background p-3 ${
        isDragging ? "opacity-50 shadow-md" : ""
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        suppressHydrationWarning
        className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Lesson Number */}
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
        {index + 1}
      </span>

      {/* Lesson Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{lesson.title}</span>
          {isFree && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Free
            </span>
          )}
          {isPublished ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✓
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Toggle Free */}
        <button
          onClick={handleToggleFree}
          disabled={isToggling}
          className={`rounded-md p-1.5 text-xs ${
            isFree
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              : "text-muted-foreground hover:bg-muted"
          } disabled:opacity-50`}
          title={isFree ? "Remove free access" : "Make free"}
        >
          Free
        </button>

        {/* Toggle Publish */}
        <button
          onClick={handleTogglePublished}
          disabled={isToggling}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          title={isPublished ? "Unpublish" : "Publish"}
        >
          {isPublished ? (
            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
        </button>

        {/* Edit */}
        <Link
          href={`/admin/content/lessons/${lesson.id}`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Edit lesson"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>

        {/* Delete */}
        {showDeleteConfirm ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isDeleting ? "..." : "Yes"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Delete lesson"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
