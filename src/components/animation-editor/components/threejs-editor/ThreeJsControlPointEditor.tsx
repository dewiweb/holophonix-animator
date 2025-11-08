import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Play, Pause, Move3D, RotateCw, Grid3X3, Home, Maximize2 } from 'lucide-react'
import { MultiViewRenderer } from './MultiViewRenderer'
import { useControlPointScene } from './hooks/useControlPointScene'
import { useMultiViewCameras } from './hooks/useMultiViewCameras'
import { useControlPointSelection } from './hooks/useControlPointSelection'
import type { ThreeJsControlPointEditorProps, TransformMode, EditorSettings } from './types'

/**
 * Main Three.js Control Point Editor Component
 * Provides multi-view 3D editing of animation control points
 */
export const ThreeJsControlPointEditor: React.FC<ThreeJsControlPointEditorProps> = ({
  animation,
  onControlPointsChange,
  onSelectionChange,
  initialSettings,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  // Editor settings
  const [settings, setSettings] = useState<EditorSettings>({
    transformMode: 'translate',
    showGrid: true,
    snapSize: 0,
    showCurve: true,
    curveResolution: 200,
    showDirectionIndicators: true,
    ...initialSettings,
  })

  // Initialize scene with control points
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

  // Initialize multi-view cameras
  const camerasState = useMultiViewCameras(containerRef, controlPoints)
  const { views, activeViewIndex, setActiveView, frameSelection, frameAll, updateViewports } =
    camerasState

  // Handle control point selection
  const { handleClick, handleMouseMove } = useControlPointSelection({
    scene,
    views,
    controlPoints,
    onSelect: (index) => {
      selectControlPoint(index)
      if (onSelectionChange) {
        onSelectionChange(index !== null ? [index] : [])
      }
    },
  })

  // Handle canvas events
  const setupCanvasEvents = useCallback(
    (canvas: HTMLCanvasElement) => {
      canvasRef.current = canvas

      // Click for selection
      const clickHandler = (e: MouseEvent) => handleClick(e)
      canvas.addEventListener('click', clickHandler)

      // Hover effects
      const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e)
      canvas.addEventListener('mousemove', mouseMoveHandler)

      return () => {
        canvas.removeEventListener('click', clickHandler)
        canvas.removeEventListener('mousemove', mouseMoveHandler)
      }
    },
    [handleClick, handleMouseMove]
  )

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setContainerSize({ width, height })
        updateViewports(width, height)
      }
    })

    resizeObserver.observe(containerRef.current)

    // Initial size
    const { clientWidth, clientHeight } = containerRef.current
    setContainerSize({ width: clientWidth, height: clientHeight })

    return () => {
      resizeObserver.disconnect()
    }
  }, [updateViewports])

  // Notify parent when control points change
  useEffect(() => {
    if (onControlPointsChange) {
      const positions = controlPoints.map((p) => p.position)
      onControlPointsChange(positions)
    }
  }, [controlPoints, onControlPointsChange])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return

      // Mode shortcuts
      if (e.key === 'g' || e.key === 'G') {
        setSettings((prev) => ({ ...prev, transformMode: 'translate' }))
      } else if (e.key === 'r' || e.key === 'R') {
        setSettings((prev) => ({ ...prev, transformMode: 'rotate' }))
      }

      // View shortcuts
      else if (e.key === 'f' || e.key === 'F') {
        const selectedPoint = getSelectedPoint()
        if (selectedPoint) {
          frameSelection()
        } else {
          frameAll()
        }
      } else if (e.key === 'Home') {
        frameAll()
      }

      // Delete shortcut
      else if ((e.key === 'Delete' || e.key === 'Backspace') && !e.repeat) {
        const selectedPoint = getSelectedPoint()
        if (selectedPoint && controlPoints.length > 2) {
          // Keep at least 2 points
          removeControlPoint(selectedPoint.index)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    readOnly,
    controlPoints.length,
    getSelectedPoint,
    removeControlPoint,
    frameSelection,
    frameAll,
  ])

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        {/* Transform Mode */}
        <div className="flex gap-1 border-r border-gray-700 pr-2">
          <button
            className={`p-2 rounded ${
              settings.transformMode === 'translate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setSettings((prev) => ({ ...prev, transformMode: 'translate' }))}
            title="Translate (G)"
            disabled={readOnly}
          >
            <Move3D size={18} />
          </button>
          <button
            className={`p-2 rounded ${
              settings.transformMode === 'rotate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setSettings((prev) => ({ ...prev, transformMode: 'rotate' }))}
            title="Rotate (R)"
            disabled={readOnly}
          >
            <RotateCw size={18} />
          </button>
        </div>

        {/* View Controls */}
        <div className="flex gap-1 border-r border-gray-700 pr-2">
          <button
            className="p-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            onClick={frameAll}
            title="Frame All (Home)"
          >
            <Maximize2 size={18} />
          </button>
          <button
            className="p-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            onClick={frameSelection}
            title="Frame Selection (F)"
            disabled={!getSelectedPoint()}
          >
            <Home size={18} />
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
                setSettings((prev) => ({ ...prev, snapSize: parseFloat(e.target.value) || 0 }))
              }
              min={0}
              max={1}
              step={0.1}
              className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs"
            />
          </label>
        </div>

        {/* Stats */}
        <div className="ml-auto text-xs text-gray-400">
          {controlPoints.length} points
          {getSelectedPoint() && ` | Selected: Point ${getSelectedPoint()!.index + 1}`}
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative">
        {scene && views.length > 0 ? (
          <MultiViewRenderer
            scene={scene}
            views={views}
            width={containerSize.width}
            height={containerSize.height - 48} // Subtract toolbar height
            onCanvasReady={setupCanvasEvents}
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
          Mode: <span className="text-white">{settings.transformMode}</span>
        </div>
        <div>
          {activeViewIndex >= 0 && views[activeViewIndex] && (
            <span>Active View: {views[activeViewIndex].label}</span>
          )}
        </div>
        <div>
          {readOnly && <span className="text-yellow-500">Read Only</span>}
        </div>
      </div>
    </div>
  )
}
