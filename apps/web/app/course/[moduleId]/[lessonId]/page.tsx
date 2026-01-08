import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlaybackToken } from "@/lib/mux";
import { checkLessonAccess } from "@/lib/access";
import { getLessonProgress, getCompletedLessonIds } from "@/lib/data";
import { trackEventOnce, EVENTS } from "@/lib/tracking";
import { 
  TipTapRenderer, 
  LessonList, 
  AssetList,
  VideoPlayer,
  VideoLocked,
  VideoPlaceholder,
  LockedModulePage,
} from "@/components/course";
import { SoftLockBanner } from "@/components/billing";
import { MarkCompleteButton } from "@/components/progress";
import type { JSONContent } from "@tiptap/react";

interface LessonPageProps {
  params: Promise<{ moduleId: string; lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { moduleId, lessonId } = await params;

  // Fetch lesson with module info and assets
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      moduleId: moduleId,
      published: true,
      module: {
        published: true,
      },
    },
    include: {
      module: {
        include: {
          lessons: {
            where: { published: true },
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              isFree: true,
              videoDuration: true,
            },
          },
        },
      },
      assets: {
        select: {
          id: true,
          filename: true,
          url: true,
          size: true,
          mimeType: true,
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  // Check access using proper access control logic (includes module gating)
  const access = await checkLessonAccess(session.user.id, lessonId);
  const hasAccess = access.hasAccess;

  // Track lesson_started event (deduplicated)
  trackEventOnce({
    userId: session.user.id,
    event: lesson.isFree ? EVENTS.VIDEO_1_STARTED : EVENTS.LESSON_STARTED,
    properties: {
      lessonId,
      moduleId,
      lessonTitle: lesson.title,
      moduleTitle: lesson.module.title,
      isFree: lesson.isFree,
    },
    windowMinutes: 5,
  });

  // If module is locked, show the locked page
  if (!access.moduleUnlocked && access.lockedByModule) {
    return (
      <LockedModulePage
        moduleTitle={lesson.module.title}
        moduleOrder={lesson.module.order}
        lockedBy={access.lockedByModule}
      />
    );
  }

  // Get completion status and next module info
  const [progress, completedLessonIds, nextModule] = await Promise.all([
    getLessonProgress(session.user.id, lessonId),
    getCompletedLessonIds(session.user.id),
    prisma.module.findFirst({
      where: {
        published: true,
        order: { gt: lesson.module.order },
      },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        order: true,
      },
    }),
  ]);
  const isCompleted = progress?.completed ?? false;

  // Find next/prev lessons
  const currentIndex = lesson.module.lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? lesson.module.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lesson.module.lessons.length - 1 ? lesson.module.lessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen">
      <div className="flex">
        {/* Sidebar with lesson list */}
        <aside className="hidden lg:block w-80 border-r bg-muted/30 p-6 min-h-screen">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Course
          </Link>

          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-1">Module {lesson.module.order}</div>
            <h2 className="font-semibold">{lesson.module.title}</h2>
          </div>

          <LessonList
            moduleId={moduleId}
            lessons={lesson.module.lessons}
            currentLessonId={lessonId}
            completedLessonIds={new Set(completedLessonIds)}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            {/* Mobile back link */}
            <Link
              href={`/course/${moduleId}`}
              className="lg:hidden inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to {lesson.module.title}
            </Link>

            {/* Lesson header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>Module {lesson.module.order}</span>
                <span>•</span>
                <span>Lesson {lesson.order}</span>
                {lesson.isFree && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Free
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
            </div>

            {/* Soft lock banner for past due or grace period */}
            {hasAccess && (access.reason === "past_due" || access.reason === "grace_period") && (
              <SoftLockBanner 
                reason={access.reason as "past_due" | "grace_period"} 
                periodEnd={access.subscription?.currentPeriodEnd} 
              />
            )}

            {hasAccess ? (
              <>
                {/* Video player */}
                <div className="mb-8">
                  {lesson.muxPlaybackId ? (
                    (() => {
                      const playbackToken = getPlaybackToken(lesson.muxPlaybackId);
                      return playbackToken ? (
                        <VideoPlayer
                          playbackId={lesson.muxPlaybackId}
                          playbackToken={playbackToken}
                          title={lesson.title}
                        />
                      ) : (
                        <VideoPlaceholder />
                      );
                    })()
                  ) : (
                    <VideoPlaceholder />
                  )}
                </div>

                {/* Lesson content */}
                <div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
                  <TipTapRenderer content={lesson.content as JSONContent | null} />
                </div>

                {/* Lesson assets/resources */}
                {lesson.assets.length > 0 && (
                  <div className="mt-8">
                    <AssetList assets={lesson.assets} />
                  </div>
                )}

                {/* Mark as complete button */}
                <div className="mt-8 pt-6 border-t">
                  <MarkCompleteButton
                    lessonId={lessonId}
                    isComplete={isCompleted}
                    moduleTitle={lesson.module.title}
                    moduleOrder={lesson.module.order}
                    nextModuleId={nextModule?.id}
                    nextModuleTitle={nextModule?.title}
                  />
                </div>
              </>
            ) : (
              /* Paywall */
              <div className="space-y-6">
                <VideoLocked />
                <div className="rounded-lg border bg-card p-6 text-center">
                  <h2 className="text-xl font-semibold mb-2">Premium Content</h2>
                  <p className="text-muted-foreground mb-6">
                    Subscribe to access this lesson and all course content.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    View Plans
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="mt-8 pt-6 border-t flex items-center justify-between">
              {prevLesson ? (
                <Link
                  href={`/course/${moduleId}/${prevLesson.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Previous:</span> {prevLesson.title}
                </Link>
              ) : (
                <div />
              )}
              {nextLesson ? (
                <Link
                  href={`/course/${moduleId}/${nextLesson.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary"
                >
                  <span className="hidden sm:inline">Next:</span> {nextLesson.title}
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          </div>
        </main>
      </div>
    </div>
  );
}
