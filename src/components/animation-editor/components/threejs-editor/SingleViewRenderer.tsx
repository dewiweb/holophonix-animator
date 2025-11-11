import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { ViewMode } from './ViewModeSelector'
import type { EditMode } from './EditModeSelector'

interface SingleViewRendererProps {
  scene: THREE.Scene | null
  camera: THREE.Camera | null
  width: number
  height: number
  viewMode: ViewMode
  editMode: EditMode
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
  onResetCamera?: () => void
  backgroundColor?: number
}

/**
 * Simple single-view renderer
 * Renders one view at a time (no viewport calculations needed)
 */
export const SingleViewRenderer: React.FC<SingleViewRendererProps> = ({
  scene,
  camera,
  width,
  height,
  viewMode,
  editMode,
  onCanvasReady,
  onResetCamera,
  backgroundColor = 0x1a1a1a,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Don't initialize if size is invalid
    if (width <= 0 || height <= 0) {
      console.warn('⚠️ Invalid renderer size:', { width, height })
      return
    }

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    })

    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Cap at 2x for performance
    renderer.setClearColor(backgroundColor, 1)

    rendererRef.current = renderer

    // Notify parent that canvas is ready
    if (onCanvasReady) {
      onCanvasReady(canvasRef.current)
    }

    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
  }, [width, height, backgroundColor, onCanvasReady])

  // Render loop
  useEffect(() => {
    if (!scene || !camera || !rendererRef.current) return

    const renderer = rendererRef.current

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)

      // Simple single-view render
      renderer.render(scene, camera)
    }

    animate()

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [scene, camera])

  // Update renderer size
  useEffect(() => {
    if (rendererRef.current && width > 0 && height > 0) {
      rendererRef.current.setSize(width, height)
    }
  }, [width, height])

  // Get view label for display
  const getViewLabel = (mode: ViewMode): string => {
    switch (mode) {
      case 'perspective':
        return '3D Perspective'
      case 'top':
        return 'Top View (XZ)'
      case 'front':
        return 'Front View (XY)'
      case 'side':
        return 'Side View (YZ)'
    }
  }

  // Get control hint based on view mode and edit mode
  const getControlHint = (mode: ViewMode, edit: EditMode): string => {
    if (edit === 'preview') {
      // Preview mode: only camera controls
      if (mode === 'perspective') {
        return 'Right-click Rotate | Middle Pan | Wheel Zoom'
      }
      return 'Right-click Pan | Wheel Zoom'
    } else {
      // Edit mode: add selection/gizmo hints
      if (mode === 'perspective') {
        return 'Left-click Select/Drag | Right-click Rotate | Wheel Zoom'
      }
      return 'Left-click Select/Drag | Right-click Pan | Wheel Zoom'
    }
  }

  return (
    <div className="relative w-full h-full bg-gray-900">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ display: 'block' }}
      />

      {/* View label and controls overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-left: View label */}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <div className="bg-black/70 text-white text-sm px-3 py-1.5 rounded backdrop-blur-sm font-medium">
            {getViewLabel(viewMode)}
          </div>
          {onResetCamera && (
            <button
              onClick={onResetCamera}
              className="pointer-events-auto bg-gray-700/90 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded backdrop-blur-sm transition-colors"
              title="Reset camera to default position"
            >
              🔄 Reset View
            </button>
          )}
        </div>

        {/* Bottom-right: Control hint */}
        <div className="absolute bottom-2 right-2 bg-blue-900/70 text-blue-200 text-xs px-3 py-1.5 rounded backdrop-blur-sm">
          {getControlHint(viewMode, editMode)}
        </div>
      </div>
    </div>
  )
}
