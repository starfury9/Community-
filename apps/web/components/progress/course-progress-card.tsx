"use client";

import Link from "next/link";
import { Trophy, BookOpen, Target, CheckCircle, Play, ArrowRight } from "lucide-react";
import type { CourseProgress, NextLesson } from "@/lib/data";

interface CourseProgressCardProps {
  progress: CourseProgress;
  nextLesson?: NextLesson | null;
}

export function CourseProgressCard({ progress, nextLesson }: CourseProgressCardProps) {
  const {
    completedModules,
    totalModules,
    completedLessons,
    totalLessons,
    percentage,
    isComplete,
  } = progress;
  
  const hasStarted = completedLessons > 0;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-6">
      {/* Header with overall progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your Progress</h3>
          <p className="text-sm text-muted-foreground">
            {isComplete
              ? "Course complete! 🎉"
              : `${percentage}% complete`}
          </p>
        </div>
        <div
          className={`flex items-center justify-center h-16 w-16 rounded-full ${
            isComplete
              ? "bg-green-100 dark:bg-green-900/30"
              : "bg-primary/10"
          }`}
        >
          {isComplete ? (
            <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
          ) : (
            <span className="text-2xl font-bold text-primary">
              {percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ease-out rounded-full ${
              isComplete ? "bg-green-500" : "bg-primary"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {completedLessons}
              <span className="text-sm font-normal text-muted-foreground">
                /{totalLessons}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">Lessons</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30">
            <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {completedModules}
              <span className="text-sm font-normal text-muted-foreground">
                /{totalModules}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">Modules</p>
          </div>
        </div>
      </div>

      {/* Completion message or Resume button */}
      {isComplete ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Congratulations! You&apos;ve completed the entire course.
          </p>
        </div>
      ) : nextLesson ? (
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {hasStarted ? "Continue learning" : "Start here"}
              </p>
              <p className="font-medium text-sm">{nextLesson.title}</p>
              <p className="text-xs text-muted-foreground">
                Module {nextLesson.moduleOrder}: {nextLesson.moduleTitle}
              </p>
            </div>
          </div>
          <Link
            href={`/course/${nextLesson.moduleId}/${nextLesson.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {hasStarted ? "Continue" : "Start"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
