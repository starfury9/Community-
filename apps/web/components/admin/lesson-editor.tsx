"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { updateLessonAction } from "@/app/actions";
import { AssetUpload } from "./asset-upload";
import { VideoUpload } from "./video-upload";
import type { Prisma } from "@prisma/client";

// Dynamic import TipTap to reduce initial bundle size
const TipTapEditor = dynamic(() => import("./tiptap-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-64 rounded-md border bg-muted/50 animate-pulse" />
  ),
});

interface Asset {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

interface Lesson {
  id: string;
  title: string;
  content: Prisma.JsonValue;
  published: boolean;
  isFree: boolean;
  muxAssetId?: string | null;
  muxPlaybackId?: string | null;
  videoDuration?: number | null;
  module: {
    id: string;
    title: string;
    order: number;
  };
  assets?: Asset[];
}

interface LessonEditorProps {
  lesson: Lesson;
}

export function LessonEditor({ lesson }: LessonEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(lesson.title);
  const [content, setContent] = useState<Prisma.JsonValue>(lesson.content);
  const [isFree, setIsFree] = useState(lesson.isFree);
  const [isPublished, setIsPublished] = useState(lesson.published);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleContentChange = useCallback((newContent: Prisma.JsonValue) => {
    setContent(newContent);
    setIsDirty(true);
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    const result = await updateLessonAction(lesson.id, {
      title,
      content: content as Prisma.InputJsonValue | undefined,
      isFree,
      published: isPublished,
    });

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    setIsDirty(false);
    setLastSaved(new Date());
    setIsSaving(false);
    router.refresh();
  }

  async function handlePublishToggle() {
    const newPublished = !isPublished;
    setIsPublished(newPublished);
    setIsDirty(true);
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-4 text-sm">
          {/* Status badges */}
          <div className="flex items-center gap-2">
            {isPublished ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Published
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                Draft
              </span>
            )}
            {isFree && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Free
              </span>
            )}
          </div>

          {/* Save status */}
          {isDirty && (
            <span className="text-muted-foreground">Unsaved changes</span>
          )}
          {lastSaved && !isDirty && (
            <span className="text-muted-foreground">
              Saved at {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePublishToggle}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              isPublished
                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
            }`}
          >
            {isPublished ? "Unpublish" : "Publish"}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="lesson-title" className="block text-sm font-medium mb-2">
          Lesson Title
        </label>
        <input
          id="lesson-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setIsDirty(true);
          }}
          className="w-full rounded-md border border-input bg-background px-4 py-3 text-lg font-semibold placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Enter lesson title..."
        />
      </div>

      {/* Free Toggle */}
      <div className="flex items-center gap-3">
        <input
          id="is-free-toggle"
          type="checkbox"
          checked={isFree}
          onChange={(e) => {
            setIsFree(e.target.checked);
            setIsDirty(true);
          }}
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
        />
        <label htmlFor="is-free-toggle" className="text-sm">
          <span className="font-medium">Free lesson</span>
          <span className="text-muted-foreground ml-1">
            (accessible without subscription)
          </span>
        </label>
      </div>

      {/* Video Upload */}
      <div className="rounded-lg border p-4">
        <VideoUpload
          lessonId={lesson.id}
          currentAssetId={lesson.muxAssetId}
          currentPlaybackId={lesson.muxPlaybackId}
          videoDuration={lesson.videoDuration}
          onUploadComplete={() => router.refresh()}
        />
      </div>

      {/* Content Editor */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Lesson Content
        </label>
        <TipTapEditor
          content={content}
          onChange={handleContentChange}
        />
      </div>

      {/* Assets */}
      <div className="rounded-lg border p-4">
        <AssetUpload lessonId={lesson.id} assets={lesson.assets || []} />
      </div>

      {/* Unsaved Changes Warning */}
      {isDirty && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
          <span className="text-sm text-muted-foreground">
            You have unsaved changes
          </span>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Now"}
          </button>
        </div>
      )}
    </div>
  );
}
