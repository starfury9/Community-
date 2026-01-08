"use client";

import Link from "next/link";
import { Play, BookOpen, Trophy, ArrowRight } from "lucide-react";
import type { NextLesson } from "@/lib/data";

interface ResumeCardProps {
  nextLesson: NextLesson | null;
  isComplete: boolean;
  hasStarted: boolean;
}

export function ResumeCard({
  nextLesson,
  isComplete,
  hasStarted,
}: ResumeCardProps) {
  // Course complete state
  if (isComplete) {
    return (
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/30 p-6">
        <div className="absolute right-0 top-0 h-32 w-32 transform translate-x-8 -translate-y-8">
          <Trophy className="h-full w-full text-green-200 dark:text-green-900/30" />
        </div>
        <div className="relative">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
            Course Complete! 🎉
          </h3>
          <p className="mt-2 text-sm text-green-700 dark:text-green-300">
            Amazing work! You&apos;ve completed all modules. Feel free to revisit
            any lesson to refresh your knowledge.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
          >
            <BookOpen className="h-4 w-4" />
            Browse all modules
          </Link>
        </div>
      </div>
    );
  }

  // No lesson to resume (shouldn't happen if not complete)
  if (!nextLesson) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold">Start Learning</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Begin your journey by exploring the first module.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Play className="h-4 w-4" />
          Get Started
        </Link>
      </div>
    );
  }

  // Resume where you left off
  const lessonUrl = `/course/${nextLesson.moduleId}/${nextLesson.id}`;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/30 p-6">
      <div className="absolute right-0 top-0 h-24 w-24 transform translate-x-4 -translate-y-4 opacity-20">
        <Play className="h-full w-full text-blue-600 dark:text-blue-400" />
      </div>
      <div className="relative">
        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide mb-2">
          {hasStarted ? (
            <>
              <Play className="h-3 w-3" />
              Continue Learning
            </>
          ) : (
            <>
              <BookOpen className="h-3 w-3" />
              Start Here
            </>
          )}
        </div>
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          {nextLesson.title}
        </h3>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
          Module {nextLesson.moduleOrder}: {nextLesson.moduleTitle}
        </p>
        <Link
          href={lessonUrl}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 dark:bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          {hasStarted ? "Continue" : "Start Lesson"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
