// ===========================================
// SERVER ACTIONS - CENTRAL EXPORTS
// ===========================================

// Module actions
export {
  createModuleAction,
  updateModuleAction,
  deleteModuleAction,
  reorderModulesAction,
  toggleModulePublishedAction,
} from "./modules";

// Lesson actions
export {
  createLessonAction,
  updateLessonAction,
  deleteLessonAction,
  reorderLessonsAction,
  toggleLessonPublishedAction,
  toggleLessonFreeAction,
  moveLessonAction,
} from "./lessons";

// Asset actions
export {
  createAssetAction,
  deleteAssetAction,
  deleteAllLessonAssetsAction,
} from "./assets";

// Progress actions
export {
  markLessonCompleteAction,
  markLessonIncompleteAction,
  getUserProgressAction,
} from "./progress";
