"use client";

import { useState } from "react";
import MuxUploader from "@mux/mux-uploader-react";

interface VideoUploadProps {
  lessonId: string;
  currentAssetId?: string | null;
  currentPlaybackId?: string | null;
  videoDuration?: number | null;
  onUploadComplete?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoUpload({
  lessonId,
  currentAssetId,
  currentPlaybackId,
  videoDuration,
  onUploadComplete,
}: VideoUploadProps) {
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [isGettingUrl, setIsGettingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "complete"
  >("idle");

  // Determine current state
  const hasVideo = !!currentPlaybackId;
  const isProcessing = currentAssetId && !currentPlaybackId;

  async function getUploadUrl() {
    setIsGettingUrl(true);
    setError(null);

    try {
      const response = await fetch("/api/mux/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { uploadUrl } = await response.json();
      setUploadUrl(uploadUrl);
      setUploadStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get upload URL");
    } finally {
      setIsGettingUrl(false);
    }
  }

  function handleUploadStart() {
    setUploadStatus("uploading");
    setError(null);
  }

  function handleUploadSuccess() {
    setUploadStatus("processing");
    setUploadUrl(null);
    // Refresh the page after a short delay to show processing state
    setTimeout(() => {
      onUploadComplete?.();
    }, 1000);
  }

  function handleUploadError(event: unknown) {
    const errorEvent = event as { detail?: unknown };
    console.error("Upload error:", errorEvent.detail || event);
    setError("Upload failed. Please try again.");
    setUploadStatus("idle");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Lesson Video</h3>
      </div>

      {/* Current video status */}
      {hasVideo && (
        <div className="rounded-md border bg-green-50 dark:bg-green-900/20 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Video Ready
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Duration: {videoDuration ? formatDuration(videoDuration) : "Unknown"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing state */}
      {isProcessing && (
        <div className="rounded-md border bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40">
              <svg
                className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Processing Video
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                This may take a few minutes. Refresh to check status.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload interface */}
      {!isProcessing && (
        <>
          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Get upload URL button */}
          {!uploadUrl && (
            <button
              onClick={getUploadUrl}
              disabled={isGettingUrl}
              className="w-full rounded-md border-2 border-dashed p-6 text-center hover:border-primary hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {isGettingUrl ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Preparing upload...</span>
                </div>
              ) : (
                <>
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm font-medium">
                    {hasVideo ? "Replace Video" : "Upload Video"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to select a video file
                  </p>
                </>
              )}
            </button>
          )}

          {/* Mux Uploader */}
          {uploadUrl && (
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <MuxUploader
                  endpoint={uploadUrl}
                  onUploadStart={handleUploadStart}
                  onSuccess={handleUploadSuccess}
                  onError={handleUploadError}
                  className="w-full"
                />
              </div>

              {uploadStatus === "uploading" && (
                <p className="text-sm text-muted-foreground text-center">
                  Uploading video... Please don&apos;t close this page.
                </p>
              )}

              {uploadStatus === "processing" && (
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 text-center">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Upload complete! Processing video...
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    This may take a few minutes. The page will refresh when ready.
                  </p>
                </div>
              )}

              <button
                onClick={() => setUploadUrl(null)}
                className="w-full rounded-md border px-4 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
