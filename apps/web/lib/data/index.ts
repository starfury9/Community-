// ===========================================
// DATA LAYER - CENTRAL EXPORTS
// ===========================================

// Module operations
export {
  createModule,
  getModule,
  getModuleWithLessons,
  getAllModules,
  getAllModulesWithLessons,
  getPublishedModules,
  getPublishedModuleWithLessons,
  updateModule,
  toggleModulePublished,
  deleteModule,
  reorderModules,
  getModuleCount,
  getPublishedModuleCount,
} from "./modules";

// Lesson operations
export {
  createLesson,
  getLesson,
  getLessonWithAssets,
  getPublishedLesson,
  getLessonsByModule,
  getPublishedLessonsByModule,
  getFirstFreeLesson,
  updateLesson,
  toggleLessonPublished,
  toggleLessonFree,
  deleteLesson,
  reorderLessons,
  moveLessonToModule,
  getLessonCount,
  getTotalLessonCount,
  getPublishedLessonCount,
  getAdjacentLessons,
} from "./lessons";

// Asset operations
export {
  createAsset,
  getAsset,
  getAssetsByLesson,
  deleteAsset,
  deleteAssetsByLesson,
  getTotalAssetSize,
  getAssetCount,
  getAssetCountByType,
} from "./assets";

// Reorder utility
export { reorderItems } from "./reorder";

// Progress tracking operations
export {
  markLessonComplete,
  markLessonIncomplete,
  getLessonProgress,
  getAllUserProgress,
  getCompletedLessonIds,
  getModuleProgress,
  getAllModulesProgress,
  isModuleComplete,
  getCourseProgress,
  getNextIncompleteLesson,
  getFirstLesson,
  getModulesWithProgress,
  wouldCompleteLessonCompleteModule,
  wouldCompleteModuleCompleteCourse,
  isPreviousModuleComplete,
  getUnlockedModuleIds,
  // Module gating
  isModuleUnlocked,
  getUnlockedModules,
  getModulesWithUnlockStatus,
  isLessonAccessible,
} from "./progress";

export type {
  ModuleProgress,
  CourseProgress,
  NextLesson,
  ModuleWithUnlockStatus,
  ModuleWithProgress,
} from "./progress";

// Analytics operations
export {
  getDashboardMetrics,
  getConversionFunnel,
  getRecentActivity,
  getSubscriptionBreakdown,
  getContentStats,
  getEmailStats,
} from "./analytics";

export type {
  DashboardMetrics,
  ConversionFunnel,
  TimePeriod,
} from "./analytics";

// User management operations
export {
  getUserList,
  getUserDetail,
  toggleAccessOverride,
  updateUserRole,
  deleteUser,
  searchUsers,
} from "./users";

export type {
  UserListItem,
  UserDetail,
  UserFilterStatus,
  UserListParams,
  UserListResult,
} from "./users";
