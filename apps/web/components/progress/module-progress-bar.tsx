"use client";

interface ModuleProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ModuleProgressBar({
  completed,
  total,
  showLabel = true,
  showPercentage = false,
  size = "md",
}: ModuleProgressBarProps) {
  const percentage = total === 0 ? 100 : Math.round((completed / total) * 100);
  const isComplete = completed >= total && total > 0;

  const heightClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const barHeight = heightClasses[size];

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-muted-foreground">
            {completed} of {total} {total === 1 ? "lesson" : "lessons"}
          </span>
          {showPercentage && (
            <span
              className={`font-medium ${
                isComplete
                  ? "text-green-600 dark:text-green-400"
                  : "text-foreground"
              }`}
            >
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-muted rounded-full overflow-hidden ${barHeight}`}
      >
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            isComplete
              ? "bg-green-500"
              : percentage > 0
              ? "bg-primary"
              : "bg-transparent"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
