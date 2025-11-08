import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { ViewConfig } from './types'

interface MultiViewRendererProps {
  scene: THREE.Scene | null
  views: ViewConfig[]
  width: number
  height: number
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
  onResetView?: (viewName: string) => void
  activeViewportName?: string | null
}

/**
 * Component that renders multiple viewports in a single canvas
 */
export const MultiViewRenderer: React.FC<MultiViewRendererProps> = ({
  scene,
  views,
  width,
  height,
  onCanvasReady,
  onResetView,
  activeViewportName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    })

    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.autoClear = false // We'll clear manually for each viewport

    rendererRef.current = renderer

    // Notify parent that canvas is ready
    if (onCanvasReady) {
      onCanvasReady(canvasRef.current)
    }

    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
  }, [width, height, onCanvasReady])

  // Render loop
  useEffect(() => {
    if (!scene || !rendererRef.current || views.length === 0) return

    const renderer = rendererRef.current

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)

      // Clear the entire canvas
      renderer.clear()

      // Render each viewport
      views.forEach((view) => {
        const { camera, viewport, backgroundColor } = view

        // Calculate pixel viewport
        const left = Math.floor(viewport.x * width)
        const bottom = Math.floor(viewport.y * height)
        const vpWidth = Math.floor(viewport.width * width)
        const vpHeight = Math.floor(viewport.height * height)

        // Set viewport and scissor
        renderer.setViewport(left, bottom, vpWidth, vpHeight)
        renderer.setScissor(left, bottom, vpWidth, vpHeight)
        renderer.setScissorTest(true)

        // Clear with viewport background color
        if (backgroundColor) {
          renderer.setClearColor(backgroundColor, 1)
          renderer.clear()
        }

        // Render scene with this camera
        renderer.render(scene, camera)
      })
    }

    animate()

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [scene, views, width, height])

  // Update renderer size
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setSize(width, height)
    }
  }, [width, height])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* Viewport labels and borders */}
      <div className="absolute inset-0 pointer-events-none">
        {views.map((view, index) => {
          // Convert from Three.js coordinates (y=0 at bottom) to CSS (y=0 at top)
          const left = `${view.viewport.x * 100}%`
          const top = `${(1 - view.viewport.y - view.viewport.height) * 100}%`
          const viewWidth = `${view.viewport.width * 100}%`
          const viewHeight = `${view.viewport.height * 100}%`

          return (
            <div
              key={view.name}
              className="absolute"
              style={{
                left,
                top,
                width: viewWidth,
                height: viewHeight,
              }}
            >
              {/* Label and Reset Button */}
              <div className="absolute top-1 left-1 flex items-center gap-1">
                <div className="bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {view.label}
                </div>
                {onResetView && (
                  <button
                    onClick={() => onResetView(view.name)}
                    className="pointer-events-auto bg-gray-700/90 hover:bg-gray-600 text-white text-xs px-1.5 py-0.5 rounded backdrop-blur-sm transition-colors"
                    title="Reset view"
                  >
                    🔄
                  </button>
                )}
              </div>
              
              {/* Border - highlight active viewport */}
              <div 
                className={`absolute inset-0 transition-colors duration-200 ${
                  view.name === activeViewportName
                    ? 'border-2 border-blue-500/70 shadow-lg shadow-blue-500/20' 
                    : 'border border-gray-700'
                }`} 
              />
              
              {/* Control hint for perspective */}
              {view.name === 'perspective' && (
                <div className="absolute bottom-1 right-1 bg-blue-900/70 text-blue-200 text-xs px-2 py-1 rounded backdrop-blur-sm">
                  Alt+🖱️ Rotate | Ctrl+🖱️ Pan
                </div>
              )}
              
              {/* Control hint for orthographic views */}
              {view.name !== 'perspective' && (
                <div className="absolute bottom-1 right-1 bg-gray-900/70 text-gray-300 text-xs px-2 py-1 rounded backdrop-blur-sm">
                  Right-click 🖱️ Pan
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
