"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditModuleDialog } from "./edit-module-dialog";
import { DeleteModuleDialog } from "./delete-module-dialog";
import { LessonList } from "./lesson-list";
import { CreateLessonButton } from "./create-lesson-button";
import { toggleModulePublishedAction } from "@/app/actions";

interface Lesson {
  id: string;
  title: string;
  order: number;
  published: boolean;
  isFree: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  published: boolean;
  lessons: Lesson[];
}

interface ModuleCardProps {
  module: Module;
}

export function ModuleCard({ module }: ModuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPublished, setIsPublished] = useState(module.published);
  const [isToggling, setIsToggling] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function handleTogglePublished() {
    setIsToggling(true);
    const previousState = isPublished;
    setIsPublished(!isPublished); // Optimistic update

    const result = await toggleModulePublishedAction(module.id);

    if (result.error) {
      setIsPublished(previousState); // Rollback
      console.error("Failed to toggle:", result.error);
    }

    setIsToggling(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      {/* Module Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          suppressHydrationWarning
          className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground"
          aria-label="Drag to reorder"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Module {module.order}
            </span>
            {isPublished ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Published
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                Draft
              </span>
            )}
          </div>
          <h3 className="font-semibold truncate">{module.title}</h3>
          {module.description && (
            <p className="text-sm text-muted-foreground truncate">
              {module.description}
            </p>
          )}
        </div>

        {/* Lesson Count */}
        <div className="text-sm text-muted-foreground">
          {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Toggle Publish */}
          <button
            onClick={handleTogglePublished}
            disabled={isToggling}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            title={isPublished ? "Unpublish" : "Publish"}
          >
            {isPublished ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>

          {/* Edit */}
          <EditModuleDialog module={module} />

          {/* Delete */}
          <DeleteModuleDialog moduleId={module.id} moduleTitle={module.title} lessonCount={module.lessons.length} />

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Lesson List */}
      {isExpanded && (
        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium">Lessons</h4>
            <CreateLessonButton moduleId={module.id} />
          </div>
          <LessonList moduleId={module.id} initialLessons={module.lessons} />
        </div>
      )}
    </div>
  );
}
