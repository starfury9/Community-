"use client";

import { CheckCircle, Circle, Lock } from "lucide-react";

interface LessonProgressIndicatorProps {
  isComplete: boolean;
  isLocked?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function LessonProgressIndicator({
  isComplete,
  isLocked = false,
  size = "md",
  showLabel = false,
}: LessonProgressIndicatorProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const iconSize = sizeClasses[size];

  if (isLocked) {
    return (
      <div className="flex items-center gap-2">
        <Lock className={`${iconSize} text-muted-foreground/50`} />
        {showLabel && (
          <span className="text-xs text-muted-foreground">Locked</span>
        )}
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className={`${iconSize} text-green-500`} />
        {showLabel && (
          <span className="text-xs text-green-600 dark:text-green-400">
            Complete
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Circle className={`${iconSize} text-muted-foreground/40`} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">Not started</span>
      )}
    </div>
  );
}
