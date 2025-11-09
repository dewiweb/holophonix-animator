import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Move3D, Grid3X3, Maximize2, Plus } from 'lucide-react'
import * as THREE from 'three'

// Components
import { SingleViewRenderer } from './SingleViewRenderer'
import { ViewModeSelector, type ViewMode } from './ViewModeSelector'
import { EditModeSelector, type EditMode } from './EditModeSelector'

// Hooks
import { useCamera } from './hooks/useCamera'
import { useSingleViewportControl } from './hooks/useSingleViewportControl'
import { useControlPointScene } from './hooks/useControlPointScene'
import { useControlPointSelection } from './hooks/useControlPointSelection'
import { useTransformControls } from './hooks/useTransformControls'
import { useTrackVisualization } from './hooks/useTrackVisualization'
import { controlPointsToParameters } from './utils/extractControlPoints'

// Types
import type { Track, Animation } from '@/types'

// Multi-track mode type (from Animation interface)
export type MultiTrackMode = 
  | 'identical' 
  | 'phase-offset' 
  | 'position-relative' 
  | 'phase-offset-relative' 
  | 'isobarycenter' 
  | 'centered'

export interface UnifiedEditorSettings {
  viewMode: ViewMode
  editMode: EditMode
  showGrid: boolean
  snapSize: number
  showCurve: boolean
  curveResolution: number
  showDirectionIndicators: boolean
  highlightPrimaryTrack: boolean
}

export interface UnifiedThreeJsEditorProps {
  animation: Animation | null
  selectedTracks?: Track[]
  multiTrackMode?: MultiTrackMode
  onAnimationChange?: (animation: Animation) => void
  onControlPointsChange?: (points: THREE.Vector3[]) => void
  onSelectionChange?: (indices: number[]) => void
  initialSettings?: Partial<UnifiedEditorSettings>
  readOnly?: boolean
  className?: string
}

/**
 * Unified Three.js Editor Component
 * Single-view editor with view switching (Perspective/Top/Front/Side)
 * and mode switching (Preview/Edit)
 */
export const UnifiedThreeJsEditor: React.FC<UnifiedThreeJsEditorProps> = ({
  animation,
  selectedTracks = [],
  multiTrackMode = 'identical',
  onAnimationChange,
  onControlPointsChange,
  onSelectionChange,
  initialSettings,
  readOnly = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null) // Outer container (not used for sizing)
  const viewportRef = useRef<HTMLDivElement>(null) // Viewport area (used for sizing)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Editor settings
  const [settings, setSettings] = useState<UnifiedEditorSettings>({
    viewMode: 'perspective',
    editMode: 'preview',
    showGrid: true,
    snapSize: 0,
    showCurve: true,
    curveResolution: 200,
    showDirectionIndicators: true,
    highlightPrimaryTrack: true,
    ...initialSettings,
  })

  // Calculate aspect ratio
  const aspect = containerSize.width / (containerSize.height || 1)

  // Initialize camera based on view mode
  const { camera, resetCamera } = useCamera({
    viewMode: settings.viewMode,
    aspect,
  })

  // Initialize scene with control points (edit mode) or tracks/paths (preview mode)
  const sceneState = useControlPointScene(animation)
  const {
    scene,
    controlPoints,
    curve,
    updateControlPoint,
    addControlPoint,
    removeControlPoint,
    selectControlPoint,
    getSelectedPoint,
  } = sceneState

  // Track if gizmo is being dragged (must be before useSingleViewportControl)
  const [isGizmoDragging, setIsGizmoDragging] = useState(false)

  // Initialize viewport controls (disabled when gizmo is active)
  const { controls } = useSingleViewportControl({
    camera,
    domElement: canvasElement,
    viewMode: settings.viewMode,
    isGizmoDragging, // Disable camera controls while dragging gizmo
  })

  // Track visualization for both preview and edit modes
  useTrackVisualization({
    scene,
    tracks: selectedTracks,
    showTracks: true, // Always show tracks
  })

  // Throttle ref for real-time updates
  const lastUpdateTimeRef = useRef<number>(0)
  const updateThrottleMs = 100 // Update form every 100ms during drag

  // Initialize Transform Controls (only for edit mode)
  const transformState = useTransformControls({
    scene,
    camera,
    domElement: canvasElement,
    mode: 'translate', // Always translate (no rotation)
    snapSize: settings.snapSize,
    onTransformStart: () => {
      setIsGizmoDragging(true)
      lastUpdateTimeRef.current = 0 // Reset throttle
    },
    onTransform: (position) => {
      const selectedPoint = getSelectedPoint()
      if (selectedPoint) {
        // Always update visual position immediately
        updateControlPoint(selectedPoint.index, position)
        
        // Throttle form updates for performance
        const now = Date.now()
        if (now - lastUpdateTimeRef.current > updateThrottleMs) {
          lastUpdateTimeRef.current = now
          
          // Update form in real-time during drag
          if (animation && onAnimationChange) {
            const updatedPoints = controlPoints.map(cp => cp.position)
            const updatedParams = controlPointsToParameters(
              animation.type,
              updatedPoints,
              animation.parameters
            )
            
            onAnimationChange({
              ...animation,
              parameters: updatedParams
            })
          }
        }
      }
    },
    onTransformEnd: () => {
      setIsGizmoDragging(false)
      
      // Final sync when drag ends (always, no throttle)
      if (animation && onAnimationChange) {
        const updatedPoints = controlPoints.map(cp => cp.position)
        const updatedParams = controlPointsToParameters(
          animation.type,
          updatedPoints,
          animation.parameters
        )
        
        console.log('🔧 Gizmo drag ended:', {
          animationId: animation.id,
          animationType: animation.type,
          oldParams: animation.parameters,
          newParams: updatedParams
        })
        
        // Call callback with updated animation
        onAnimationChange({
          ...animation,
          parameters: updatedParams
        })
      }
    },
  })
  const { transformControls, attachToPoint: attachGizmo, detach: detachGizmo } = transformState

  // Reattach gizmo when view mode changes (fixes gizmo disappearing on view switch)
  useEffect(() => {
    if (settings.editMode === 'edit' && !readOnly) {
      const selectedPoint = getSelectedPoint()
      if (selectedPoint) {
        // Small delay to ensure camera is updated
        setTimeout(() => {
          attachGizmo(selectedPoint.mesh)
        }, 10)
      }
    } else {
      detachGizmo()
    }
  }, [settings.viewMode, settings.editMode, readOnly, getSelectedPoint, attachGizmo, detachGizmo])

  // Handle control point selection
  const { handleClick, handleMouseMove } = useControlPointSelection({
    scene,
    views: camera
      ? [
          {
            name: settings.viewMode,
            label: settings.viewMode,
            camera,
            viewport: { x: 0, y: 0, width: 1, height: 1 },
          },
        ]
      : [],
    controlPoints,
    onSelect: (index) => {
      console.log('Selection callback triggered:', index)
      
      // Always update selection
      selectControlPoint(index)

      // Attach gizmo to selected point (only in edit mode)
      if (index !== null && !readOnly && settings.editMode === 'edit') {
        const point = controlPoints[index]
        if (point) {
          console.log('Attaching gizmo to point', index)
          attachGizmo(point.mesh)
        }
      } else {
        console.log('Detaching gizmo')
        detachGizmo()
      }

      if (onSelectionChange) {
        onSelectionChange(index !== null ? [index] : [])
      }
    },
  })

  // Setup canvas event listeners (active in both modes)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !camera) return

    const clickHandler = (e: MouseEvent) => {
      console.log('Canvas click event detected')
      
      // Don't process clicks while dragging gizmo
      if (isGizmoDragging) {
        console.log('Ignoring click - gizmo is dragging')
        return
      }

      // In edit mode, check if clicked on gizmo
      if (settings.editMode === 'edit' && transformControls) {
        const selectedPoint = getSelectedPoint()
        if (selectedPoint) {
          const rect = canvas.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
          const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

          const raycaster = new THREE.Raycaster()
          raycaster.setFromCamera(new THREE.Vector2(x, y), camera as THREE.Camera)

          // Check intersection with gizmo (it has children)
          const gizmoIntersects = raycaster.intersectObjects(
            transformControls.children,
            true
          )
          if (gizmoIntersects.length > 0) {
            console.log('Clicked on gizmo, ignoring')
            return // Clicked on gizmo, don't handle as selection
          }
        }
      }

      // Handle selection/deselection (active in both modes)
      console.log('Passing click to selection handler')
      handleClick(e)
    }

    const mouseMoveHandler = (e: MouseEvent) => {
      if (!isGizmoDragging) {
        handleMouseMove(e)
      }
    }

    canvas.addEventListener('click', clickHandler)
    canvas.addEventListener('mousemove', mouseMoveHandler, { passive: true })

    return () => {
      canvas.removeEventListener('click', clickHandler)
      canvas.removeEventListener('mousemove', mouseMoveHandler)
    }
  }, [transformControls, camera, settings.editMode, isGizmoDragging, getSelectedPoint, handleClick, handleMouseMove])

  // Store canvas ref when available
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas
    setCanvasElement(canvas)
  }, [])

  // Handle viewport resize (measure the actual canvas area, not the whole container)
  useEffect(() => {
    if (!viewportRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        console.log('📐 Viewport resized:', { width, height })
        setContainerSize({ width, height })
      }
    })

    resizeObserver.observe(viewportRef.current)

    // Initial size
    const { clientWidth, clientHeight } = viewportRef.current
    console.log('📐 Initial viewport size:', { width: clientWidth, height: clientHeight })
    setContainerSize({ width: clientWidth, height: clientHeight })

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Notify parent when control points change
  const prevPositionsRef = useRef<string>('')
  useEffect(() => {
    if (onControlPointsChange) {
      const positions = controlPoints.map((p) => p.position)
      const positionsKey = positions.map((p) => `${p.x},${p.y},${p.z}`).join('|')
      if (positionsKey !== prevPositionsRef.current) {
        prevPositionsRef.current = positionsKey
        onControlPointsChange(positions)
      }
    }
  }, [controlPoints, onControlPointsChange])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return

      // Prevent shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // View mode shortcuts (Q/W/E/R to avoid conflicts with form number inputs)
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault()
        setSettings((prev) => ({ ...prev, viewMode: 'perspective' }))
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        setSettings((prev) => ({ ...prev, viewMode: 'top' }))
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        setSettings((prev) => ({ ...prev, viewMode: 'front' }))
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        setSettings((prev) => ({ ...prev, viewMode: 'side' }))
      }

      // Edit mode toggle (Tab)
      else if (e.key === 'Tab') {
        e.preventDefault()
        setSettings((prev) => ({
          ...prev,
          editMode: prev.editMode === 'preview' ? 'edit' : 'preview',
        }))
      }

      // Deselect (ESC)
      else if (e.key === 'Escape') {
        e.preventDefault()
        selectControlPoint(null)
        detachGizmo()
        if (onSelectionChange) {
          onSelectionChange([])
        }
      }

      // Only allow editing shortcuts in edit mode
      if (settings.editMode !== 'edit') return

      // View shortcuts
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        const selectedPoint = getSelectedPoint()
        if (selectedPoint) {
          // Frame selection - focus camera on selected point
          // TODO: Implement framing logic
        }
      } else if (e.key === 'Home') {
        e.preventDefault()
        resetCamera()
      }

      // CRUD shortcuts
      else if ((e.key === 'Delete' || e.key === 'Backspace') && !e.repeat) {
        e.preventDefault()
        const selectedPoint = getSelectedPoint()
        if (selectedPoint && controlPoints.length > 2) {
          removeControlPoint(selectedPoint.index)
          detachGizmo()
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !e.repeat) {
        e.preventDefault()
        const selectedPoint = getSelectedPoint()
        if (selectedPoint) {
          const offset = new THREE.Vector3(0.5, 0.5, 0.5)
          const newPos = selectedPoint.position.clone().add(offset)
          addControlPoint(newPos, selectedPoint.index + 1)
        }
      } else if (e.shiftKey && e.key === 'A' && !e.repeat) {
        e.preventDefault()
        const selectedPoint = getSelectedPoint()
        const insertIndex = selectedPoint ? selectedPoint.index + 1 : controlPoints.length
        const newPos = selectedPoint
          ? selectedPoint.position.clone().add(new THREE.Vector3(1, 0, 0))
          : new THREE.Vector3(0, 0, 0)
        addControlPoint(newPos, insertIndex)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    readOnly,
    settings.editMode,
    controlPoints,
    getSelectedPoint,
    removeControlPoint,
    addControlPoint,
    resetCamera,
    detachGizmo,
  ])

  // Hide gizmo when switching to preview mode
  useEffect(() => {
    if (settings.editMode === 'preview') {
      detachGizmo()
    }
  }, [settings.editMode, detachGizmo])

  return (
    <div ref={containerRef} className={`w-full h-full flex flex-col bg-gray-900 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        {/* Edit Mode Selector */}
        <EditModeSelector
          currentMode={settings.editMode}
          onChange={(mode) => setSettings((prev) => ({ ...prev, editMode: mode }))}
          disabled={readOnly}
        />

        {/* View Mode Selector */}
        <ViewModeSelector
          currentMode={settings.viewMode}
          onChange={(mode) => setSettings((prev) => ({ ...prev, viewMode: mode }))}
          disabled={false}
        />

        {/* Edit Mode Tools (only shown in edit mode) */}
        {settings.editMode === 'edit' && (
          <>
            {/* View Controls */}
            <div className="flex gap-1 border-r border-gray-700 pr-2">
              <button
                className="p-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                onClick={resetCamera}
                title="Reset Camera (Home)"
              >
                <Maximize2 size={18} />
              </button>
            </div>

            {/* Point Operations (DEMO ONLY - will be replaced by backend-generated control points) */}
            <div className="flex gap-1 border-r border-gray-700 pr-2">
              <button
                className="p-2 rounded bg-green-700 text-white hover:bg-green-600"
                onClick={() => {
                  const selectedPoint = getSelectedPoint()
                  const insertIndex = selectedPoint
                    ? selectedPoint.index + 1
                    : controlPoints.length
                  const newPos = selectedPoint
                    ? selectedPoint.position.clone().add(new THREE.Vector3(1, 0, 0))
                    : new THREE.Vector3(0, 0, 0)
                  addControlPoint(newPos, insertIndex)
                }}
                title="Add Point (Shift+A) - DEMO ONLY"
                disabled={readOnly}
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Settings */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={settings.showGrid}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, showGrid: e.target.checked }))
                  }
                  className="rounded"
                />
                <Grid3X3 size={16} />
                Grid
              </label>

              <label className="flex items-center gap-1 text-sm text-gray-300">
                Snap:
                <input
                  type="number"
                  value={settings.snapSize}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      snapSize: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
                />
              </label>
            </div>
          </>
        )}

        {/* Stats */}
        <div className="ml-auto text-xs text-gray-400">
          {settings.editMode === 'edit' ? (
            <>
              {controlPoints.length} points
              {getSelectedPoint() && ` | Selected: Point ${getSelectedPoint()!.index + 1}`}
            </>
          ) : (
            <>
              {selectedTracks.length} track(s) | Mode: {multiTrackMode}
            </>
          )}
        </div>
      </div>

      {/* Viewport */}
      <div ref={viewportRef} className="flex-1 relative">
        {scene && camera ? (
          <SingleViewRenderer
            scene={scene}
            camera={camera}
            width={containerSize.width}
            height={containerSize.height} // No subtraction needed - measuring viewport directly
            viewMode={settings.viewMode}
            editMode={settings.editMode}
            onCanvasReady={handleCanvasReady}
            onResetCamera={resetCamera}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading 3D editor...
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div>
          Mode:{' '}
          <span className={settings.editMode === 'edit' ? 'text-orange-400' : 'text-green-400'}>
            {settings.editMode === 'edit' ? 'Edit' : 'Preview'}
          </span>
        </div>
        <div>
          View: <span className="text-white">{settings.viewMode}</span>
        </div>
        <div>{readOnly && <span className="text-yellow-500">Read Only</span>}</div>
      </div>
    </div>
  )
}
