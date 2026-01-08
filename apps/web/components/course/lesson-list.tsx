import Link from "next/link";
import { CheckCircleIcon, CircleIcon, PlayCircleIcon, LockIcon } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  order: number;
  isFree: boolean;
  videoDuration?: number | null;
}

interface LessonListProps {
  moduleId: string;
  lessons: Lesson[];
  currentLessonId?: string;
  completedLessonIds?: Set<string>;
}

export function LessonList({
  moduleId,
  lessons,
  currentLessonId,
  completedLessonIds = new Set(),
}: LessonListProps) {
  if (lessons.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <div className="text-muted-foreground">
          <svg
            className="mx-auto h-10 w-10 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <p className="font-medium">Content coming soon</p>
          <p className="text-sm mt-1">Lessons are being prepared for this module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lessons.map((lesson) => (
        <LessonItem
          key={lesson.id}
          lesson={lesson}
          moduleId={moduleId}
          isActive={lesson.id === currentLessonId}
          isCompleted={completedLessonIds.has(lesson.id)}
        />
      ))}
    </div>
  );
}

function LessonItem({
  lesson,
  moduleId,
  isActive,
  isCompleted,
}: {
  lesson: Lesson;
  moduleId: string;
  isActive: boolean;
  isCompleted: boolean;
}) {
  // For now, all lessons are accessible for testing
  // TODO: Integrate with module gating in Chunk 18
  const hasAccess = true;

  return (
    <Link
      href={`/course/${moduleId}/${lesson.id}`}
      className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${
        isActive
          ? "border-primary bg-primary/5"
          : isCompleted
          ? "border-green-200 hover:border-green-300 dark:border-green-900/50"
          : "hover:border-primary/50 hover:bg-muted/50"
      }`}
    >
      {/* Completion / lesson number indicator */}
      {isCompleted ? (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircleIcon className="h-5 w-5 text-green-600" />
        </span>
      ) : (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {lesson.order}
        </span>
      )}

      {/* Lesson info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium truncate ${
              isActive ? "text-primary" : isCompleted ? "text-green-700 dark:text-green-400" : ""
            }`}
          >
            {lesson.title}
          </span>
          {lesson.isFree && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Free
            </span>
          )}
        </div>
        {lesson.videoDuration && (
          <span className="text-xs text-muted-foreground">
            {formatDuration(lesson.videoDuration)}
          </span>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center">
        {!hasAccess ? (
          <LockIcon className="h-5 w-5 text-muted-foreground" />
        ) : isCompleted ? (
          <span className="text-xs font-medium text-green-600">Done</span>
        ) : isActive ? (
          <PlayCircleIcon className="h-5 w-5 text-primary" />
        ) : (
          <CircleIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    </Link>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
