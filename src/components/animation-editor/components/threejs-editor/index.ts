// New unified editor (single-view with mode switching)
export { UnifiedThreeJsEditor } from './UnifiedThreeJsEditor'
export { UnifiedEditorDemo } from './UnifiedEditorDemo'
export { ViewModeSelector } from './ViewModeSelector'
export { EditModeSelector } from './EditModeSelector'
export { SingleViewRenderer } from './SingleViewRenderer'

// Export types
export type {
  UnifiedEditorSettings,
  UnifiedThreeJsEditorProps,
  MultiTrackMode,
} from './UnifiedThreeJsEditor'
export type { ViewMode } from './ViewModeSelector'
export type { EditMode } from './EditModeSelector'

// Legacy types (still needed by some components)
export type {
  ControlPoint3D,
  ViewConfig,
  TransformMode,
  EditorSettings,
  ThreeJsControlPointEditorProps,
  ControlPointSceneState,
  MultiViewCamerasState,
  TransformControlsState,
} from './types'

// DEPRECATED: Old quad-view components (kept for reference)
// These will be removed in a future release
// export { ThreeJsControlPointEditor } from './ThreeJsControlPointEditor'
// export { MultiViewRenderer } from './MultiViewRenderer'
