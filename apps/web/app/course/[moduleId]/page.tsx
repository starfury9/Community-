import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { 
  getPublishedModuleWithLessons, 
  isModuleUnlocked,
  getModuleProgress,
  getCompletedLessonIds,
} from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { LessonList, LockedModulePage } from "@/components/course";
import { ModuleProgressBar } from "@/components/progress";

interface ModulePageProps {
  params: Promise<{ moduleId: string }>;
}

export default async function ModulePage({ params }: ModulePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { moduleId } = await params;
  const courseModule = await getPublishedModuleWithLessons(moduleId);

  if (!courseModule) {
    notFound();
  }

  // Check if module is unlocked
  const unlocked = await isModuleUnlocked(session.user.id, moduleId);

  // If module is locked, find the previous module
  if (!unlocked && courseModule.order > 1) {
    const previousModule = await prisma.module.findFirst({
      where: {
        published: true,
        order: { lt: courseModule.order },
      },
      orderBy: { order: "desc" },
      select: {
        id: true,
        title: true,
        order: true,
      },
    });

    if (previousModule) {
      return (
        <LockedModulePage
          moduleTitle={courseModule.title}
          moduleOrder={courseModule.order}
          lockedBy={{
            moduleId: previousModule.id,
            moduleTitle: previousModule.title,
            moduleOrder: previousModule.order,
          }}
        />
      );
    }
  }

  // Get progress data
  const [progress, completedLessonIds] = await Promise.all([
    getModuleProgress(session.user.id, moduleId),
    getCompletedLessonIds(session.user.id),
  ]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/dashboard" className="hover:text-foreground">
            Course
          </Link>
          <span>/</span>
          <span className="text-foreground">{courseModule.title}</span>
        </nav>

        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {courseModule.order}
            </span>
            <span className="text-sm text-muted-foreground">
              Module {courseModule.order}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{courseModule.title}</h1>
          {courseModule.description && (
            <p className="text-muted-foreground mt-2 text-lg">
              {courseModule.description}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-8 rounded-lg border bg-card p-4">
          <ModuleProgressBar
            completed={progress.completed}
            total={progress.total}
            size="md"
          />
        </div>

        {/* Lessons */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Lessons ({courseModule.lessons.length})
          </h2>
          <LessonList 
            moduleId={courseModule.id} 
            lessons={courseModule.lessons}
            completedLessonIds={new Set(completedLessonIds)}
          />
        </div>

        {/* Back to course */}
        <div className="mt-8 pt-6 border-t">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Course Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
