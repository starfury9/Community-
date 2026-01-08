import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getCourseProgress,
  getModulesWithProgress,
  getNextIncompleteLesson,
  getFirstLesson,
} from "@/lib/data";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all progress data in parallel
    const [courseProgress, modulesWithProgress, nextLesson, firstLesson] =
      await Promise.all([
        getCourseProgress(userId),
        getModulesWithProgress(userId),
        getNextIncompleteLesson(userId),
        getFirstLesson(),
      ]);

    // Determine resume lesson
    const resumeLesson = nextLesson || firstLesson;

    return NextResponse.json({
      course: courseProgress,
      modules: modulesWithProgress,
      resumeLesson,
      isComplete: courseProgress.isComplete,
      hasStarted: courseProgress.completedLessons > 0,
    });
  } catch (error) {
    console.error("Error getting progress:", error);
    return NextResponse.json(
      { error: "Failed to get progress" },
      { status: 500 }
    );
  }
}
