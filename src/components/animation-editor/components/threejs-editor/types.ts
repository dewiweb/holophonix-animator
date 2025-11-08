import * as THREE from 'three'
import type { TransformControls } from 'three-stdlib'

/**
 * Control point representation in 3D space
 */
export interface ControlPoint3D {
  /** Unique identifier */
  id: string
  /** Index in animation sequence */
  index: number
  /** 3D position */
  position: THREE.Vector3
  /** Visual mesh */
  mesh: THREE.Mesh
  /** Whether this point is currently selected */
  isSelected: boolean
  /** Metadata from animation */
  metadata?: {
    time?: number
    velocity?: number
  }
}

/**
 * Viewport configuration for multi-view rendering
 */
export interface ViewConfig {
  /** View identifier */
  name: 'top' | 'front' | 'side' | 'perspective'
  /** Camera for this view */
  camera: THREE.Camera
  /** Viewport dimensions (normalized 0-1) */
  viewport: {
    x: number
    y: number
    width: number
    height: number
  }
  /** Label for UI */
  label: string
  /** Background color override */
  backgroundColor?: THREE.Color
}

/**
 * Transform mode for gizmo controls
 */
export type TransformMode = 'translate' | 'rotate' | 'scale'

/**
 * Editor settings
 */
export interface EditorSettings {
  /** Current transform mode */
  transformMode: TransformMode
  /** Whether to show grid */
  showGrid: boolean
  /** Grid snap size (0 = disabled) */
  snapSize: number
  /** Whether to show curve */
  showCurve: boolean
  /** Curve resolution (segments) */
  curveResolution: number
  /** Whether to show direction indicators */
  showDirectionIndicators: boolean
}

/**
 * Props for ThreeJsControlPointEditor
 */
export interface ThreeJsControlPointEditorProps {
  /** Current animation being edited */
  animation: any | null
  /** Callback when control points are updated */
  onControlPointsChange?: (points: THREE.Vector3[]) => void
  /** Callback when selection changes */
  onSelectionChange?: (indices: number[]) => void
  /** Initial editor settings */
  initialSettings?: Partial<EditorSettings>
  /** Whether editor is in read-only mode */
  readOnly?: boolean
}

/**
 * Hook return type for useControlPointScene
 */
export interface ControlPointSceneState {
  scene: THREE.Scene | null
  controlPoints: ControlPoint3D[]
  curve: THREE.Line | null
  updateControlPoint: (index: number, position: THREE.Vector3) => void
  addControlPoint: (position: THREE.Vector3, insertIndex?: number) => void
  removeControlPoint: (index: number) => void
  selectControlPoint: (index: number | null) => void
  getSelectedPoint: () => ControlPoint3D | null
}

/**
 * Hook return type for useMultiViewCameras
 */
export interface MultiViewCamerasState {
  views: ViewConfig[]
  activeViewIndex: number
  setActiveView: (index: number) => void
  frameSelection: () => void
  frameAll: () => void
  updateViewports: (width: number, height: number) => void
}

/**
 * Hook return type for useTransformControls
 */
export interface TransformControlsState {
  transformControls: TransformControls | null
  mode: TransformMode
  setMode: (mode: TransformMode) => void
  attachToPoint: (point: THREE.Object3D | null) => void
  detach: () => void
}
