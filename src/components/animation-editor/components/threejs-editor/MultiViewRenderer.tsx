import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { ViewConfig } from './types'

interface MultiViewRendererProps {
  scene: THREE.Scene | null
  views: ViewConfig[]
  width: number
  height: number
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
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
      
      {/* Viewport labels */}
      <div className="absolute inset-0 pointer-events-none">
        {views.map((view, index) => {
          const left = `${view.viewport.x * 100}%`
          const top = `${view.viewport.y * 100}%`
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
              {/* Label */}
              <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {view.label}
              </div>
              
              {/* Border */}
              <div className="absolute inset-0 border border-gray-700" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
