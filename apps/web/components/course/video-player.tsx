"use client";

import dynamic from "next/dynamic";

// Dynamically import Mux Player to reduce initial bundle size
const MuxPlayer = dynamic(
  () => import("@mux/mux-player-react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <svg
            className="h-12 w-12 mx-auto mb-2 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">Loading video player...</p>
        </div>
      </div>
    ),
  }
);

interface VideoPlayerProps {
  playbackId: string;
  playbackToken: string;
  title?: string;
}

export function VideoPlayer({ playbackId, playbackToken, title }: VideoPlayerProps) {
  return (
    <div className="rounded-xl overflow-hidden bg-black">
      <MuxPlayer
        playbackId={playbackId}
        tokens={{
          playback: playbackToken,
        }}
        metadata={{
          video_title: title || "Lesson Video",
        }}
        streamType="on-demand"
        primaryColor="#FFFFFF"
        accentColor="#3B82F6"
        style={{ 
          aspectRatio: "16/9",
          width: "100%",
        }}
      />
    </div>
  );
}

interface VideoLockedProps {
  message?: string;
}

export function VideoLocked({ message }: VideoLockedProps) {
  return (
    <div className="aspect-video rounded-xl bg-muted/50 border-2 border-dashed flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Video Locked</h3>
        <p className="text-sm text-muted-foreground">
          {message || "Subscribe to unlock this video and all course content."}
        </p>
      </div>
    </div>
  );
}

export function VideoPlaceholder() {
  return (
    <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <svg
          className="h-12 w-12 mx-auto mb-2"
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
        <p className="text-sm">No video available for this lesson</p>
      </div>
    </div>
  );
}
