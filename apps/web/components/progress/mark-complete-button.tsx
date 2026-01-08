"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { CelebrationModal } from "./celebration-modal";

interface CompletionResult {
  lessonComplete: boolean;
  moduleComplete: boolean;
  moduleId: string;
  courseComplete: boolean;
}

interface MarkCompleteButtonProps {
  lessonId: string;
  isComplete: boolean;
  moduleTitle?: string;
  moduleOrder?: number;
  nextModuleId?: string;
  nextModuleTitle?: string;
  onComplete?: (result: CompletionResult) => void;
}

export function MarkCompleteButton({
  lessonId,
  isComplete: initialIsComplete,
  moduleTitle,
  moduleOrder,
  nextModuleId,
  nextModuleTitle,
  onComplete,
}: MarkCompleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isComplete, setIsComplete] = useState(initialIsComplete);
  const [optimisticComplete, setOptimisticComplete] = useState(initialIsComplete);
  
  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<"module" | "course">("module");

  async function handleToggle() {
    // Optimistic update
    const newState = !optimisticComplete;
    setOptimisticComplete(newState);

    try {
      const method = newState ? "POST" : "DELETE";
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method,
      });

      if (!response.ok) {
        // Revert optimistic update
        setOptimisticComplete(!newState);
        console.error("Failed to toggle completion");
        return;
      }

      const result = await response.json();
      setIsComplete(result.lessonCompleted);

      // Call the callback if provided
      if (onComplete && result.lessonCompleted) {
        onComplete({
          lessonComplete: result.lessonCompleted,
          moduleComplete: result.moduleCompleted,
          moduleId: result.moduleId,
          courseComplete: result.courseCompleted,
        });
      }

      // Show celebration if module or course completed
      if (result.lessonCompleted && (result.moduleCompleted || result.courseCompleted)) {
        setCelebrationType(result.courseCompleted ? "course" : "module");
        setShowCelebration(true);
      }

      // Refresh the page data
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      // Revert optimistic update
      setOptimisticComplete(!newState);
      console.error("Error toggling completion:", error);
    }
  }

  const showComplete = optimisticComplete;

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`
          group inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium
          transition-all duration-200 ease-in-out
          ${
            showComplete
              ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-pressed={showComplete}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : showComplete ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5 group-hover:hidden" />
        )}
        
        {!isPending && !showComplete && (
          <CheckCircle className="h-5 w-5 hidden group-hover:block" />
        )}

        <span>
          {isPending
            ? "Saving..."
            : showComplete
            ? "Completed!"
            : "Mark as Complete"}
        </span>
      </button>

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        type={celebrationType}
        moduleTitle={moduleTitle}
        moduleOrder={moduleOrder}
        nextModuleId={nextModuleId}
        nextModuleTitle={nextModuleTitle}
      />
    </>
  );
}
