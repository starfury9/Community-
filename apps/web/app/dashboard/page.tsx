import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { OnboardingBanner } from "@/components/onboarding";
import { ModuleCard } from "@/components/course";
import { CourseProgressCard } from "@/components/progress";
import {
  getCourseProgress,
  getNextIncompleteLesson,
  getModulesWithProgress,
} from "@/lib/data";

export default async function DashboardPage() {
  const session = await auth();

  // Redirect to signin if not authenticated
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const isAdmin = session.user.role === "ADMIN";
  
  // Fetch progress data - getModulesWithProgress includes all module data with progress
  const [courseProgress, nextLesson, modulesWithProgress] = await Promise.all([
    getCourseProgress(session.user.id),
    getNextIncompleteLesson(session.user.id),
    getModulesWithProgress(session.user.id),
  ]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Onboarding reminder banner */}
        {!session.user.onboardingComplete && <OnboardingBanner />}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Course</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {session.user.name || session.user.email}
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Admin Panel →
            </Link>
          )}
        </div>

        {/* Progress Card */}
        <div className="mb-8">
          <CourseProgressCard progress={courseProgress} nextLesson={nextLesson} />
        </div>

        {/* Course Modules */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Course Modules</h2>
            <span className="text-sm text-muted-foreground">
              {modulesWithProgress.length} module{modulesWithProgress.length !== 1 ? "s" : ""}
            </span>
          </div>

          {modulesWithProgress.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <svg
                  className="h-12 w-12 text-muted-foreground"
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
                <h3 className="mt-4 text-lg font-semibold">No content yet</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                  Course content is being prepared. Check back soon!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {modulesWithProgress.map((moduleData) => (
                <ModuleCard
                  key={moduleData.id}
                  module={moduleData}
                  progress={moduleData.percentage}
                  completedLessons={moduleData.completedCount}
                  totalLessons={moduleData.lessonCount}
                />
              ))}
            </div>
          )}
        </div>

        {/* User info card - collapsed */}
        <div className="mt-12 pt-8 border-t">
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground">
              Account Details
              <svg
                className="h-4 w-4 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="mt-4 rounded-lg border bg-card p-6">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd className="text-sm font-medium">{session.user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Role</dt>
                  <dd className="text-sm font-medium">
                    {isAdmin ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        Admin
                      </span>
                    ) : (
                      session.user.role
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Onboarding</dt>
                  <dd className="text-sm font-medium">
                    {session.user.onboardingComplete ? (
                      <span className="text-green-600">Complete</span>
                    ) : (
                      <span className="text-amber-600">Incomplete</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </details>
        </div>

        {/* Sign out button */}
        <form
          action={async () => {
            "use server";
            const { signOut } = await import("@/lib/auth");
            await signOut({ redirectTo: "/" });
          }}
          className="mt-6"
        >
          <button
            type="submit"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
