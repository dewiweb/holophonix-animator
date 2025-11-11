import { useEffect, useRef, useCallback, useState } from 'react'
import { OrbitControls } from 'three-stdlib'
import * as THREE from 'three'
import type { ViewConfig } from '../types'

/**
 * Hook to manage camera controls for each viewport
 * - Perspective view: Full OrbitControls (pan, zoom, rotate)
 * - Orthographic views: Limited controls (pan and zoom only, no rotation)
 * 
 * IMPORTANT: Each control only responds to events within its own viewport
 */
export const useViewportControls = (
  canvasElement: HTMLCanvasElement | null,
  views: ViewConfig[],
  width: number,
  height: number
) => {
  const controlsRef = useRef<Map<string, OrbitControls>>(new Map())
  const activeViewRef = useRef<ViewConfig | null>(null)
  const isInitializedRef = useRef(false)
  const viewsRef = useRef<ViewConfig[]>([])
  
  // Track active viewport name for UI highlighting
  const [activeViewportName, setActiveViewportName] = useState<string | null>(null)
  
  // Always update the views ref to avoid stale closures
  viewsRef.current = views

  useEffect(() => {
    if (!canvasElement || views.length === 0) return
    
    // Only initialize once - prevent re-initialization on views array changes
    if (isInitializedRef.current && controlsRef.current.size > 0) {
      return
    }
    
    isInitializedRef.current = true

    // Clear any existing controls
    controlsRef.current.forEach((controls) => controls.dispose())
    controlsRef.current.clear()

    // Helper to check if mouse is in viewport
    const isInViewport = (event: MouseEvent, view: ViewConfig): boolean => {
      const rect = canvasElement.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height // DOM coordinates (0 at top)
      
      const vp = view.viewport
      // Convert viewport from Three.js coords (y=0 at bottom) to DOM coords (y=0 at top)
      const domY = 1 - vp.y - vp.height
      
      return (
        x >= vp.x &&
        x <= vp.x + vp.width &&
        y >= domY &&
        y <= domY + vp.height
      )
    }

    // Create controls for each view
    const allControls: OrbitControls[] = []
    
    views.forEach((view) => {
      const camera = view.camera as THREE.PerspectiveCamera | THREE.OrthographicCamera
      const controls = new OrbitControls(camera, canvasElement)

      // Initially disable all controls - we'll enable only the active one
      controls.enabled = false

      // Disable damping to avoid needing continuous updates
      // This prevents animation loop conflicts
      controls.enableDamping = false

      if (view.name === 'perspective') {
        // Full controls for perspective view
        // Rotation: Alt + Left mouse
        // Pan: Ctrl + Left mouse
        // Zoom: Mouse wheel
        // No modifier: Point selection (gizmo interaction)
        controls.enableRotate = true
        controls.enablePan = true
        controls.enableZoom = true
        controls.screenSpacePanning = true // Enable screen-space panning
        controls.minDistance = 5
        controls.maxDistance = 50
        controls.maxPolarAngle = Math.PI / 2
        
        // Mouse buttons configuration - initially disabled
        // We'll enable based on modifier keys
        controls.mouseButtons = {
          LEFT: undefined,           // No action without modifier
          MIDDLE: THREE.MOUSE.DOLLY, // Middle: zoom
          RIGHT: undefined,          // No action
        }
        
        controls.keys = {
          LEFT: 'ArrowLeft',
          UP: 'ArrowUp',
          RIGHT: 'ArrowRight',
          BOTTOM: 'ArrowDown'
        }
      } else {
        // Limited controls for orthographic views (pan and zoom only)
        // Left-click reserved for gizmo/point transformation
        // Right-click for camera panning
        controls.enableRotate = false // DISABLE rotation
        controls.enablePan = true
        controls.enableZoom = true
        controls.screenSpacePanning = true // Better for 2D panning
        controls.minZoom = 0.1
        controls.maxZoom = 10
        controls.mouseButtons = {
          LEFT: undefined,              // Reserved for gizmo/point transformation
          MIDDLE: THREE.MOUSE.DOLLY,    // Middle for zoom
          RIGHT: THREE.MOUSE.PAN,       // Right-click to pan view
        }
      }

      controlsRef.current.set(view.name, controls)
      allControls.push(controls)
    })

    // Track modifier key states for camera control modes in perspective view
    let currentModifier: 'none' | 'alt' | 'ctrl' = 'none'
    
    const updatePerspectiveControls = (modifier: 'none' | 'alt' | 'ctrl') => {
      const perspectiveControls = controlsRef.current.get('perspective')
      if (!perspectiveControls) return
      
      if (modifier === 'alt') {
        // Alt + Left = Rotate
        perspectiveControls.enabled = true
        perspectiveControls.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }
      } else if (modifier === 'ctrl') {
        // Ctrl + Left = Pan
        perspectiveControls.enabled = true
        perspectiveControls.mouseButtons = {
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }
      } else {
        // No modifier = Disable camera control completely (for point selection and gizmo)
        perspectiveControls.enabled = false
        perspectiveControls.mouseButtons = {
          LEFT: undefined,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: undefined,
        }
      }
    }
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const newModifier = event.altKey ? 'alt' : event.ctrlKey ? 'ctrl' : 'none'
      if (newModifier !== currentModifier) {
        currentModifier = newModifier
        updatePerspectiveControls(currentModifier)
      }
    }
    
    const handleKeyUp = (event: KeyboardEvent) => {
      const newModifier = event.altKey ? 'alt' : event.ctrlKey ? 'ctrl' : 'none'
      if (newModifier !== currentModifier) {
        currentModifier = newModifier
        updatePerspectiveControls(currentModifier)
      }
    }

    // Mouse event handlers to enable only the active viewport's controls  
    const handleMouseDown = (event: MouseEvent) => {
      // Check modifier keys
      const newModifier = event.altKey ? 'alt' : event.ctrlKey ? 'ctrl' : 'none'
      currentModifier = newModifier
      updatePerspectiveControls(currentModifier)
      
      // Find which viewport was clicked (use current views from ref)
      let viewClicked: ViewConfig | null = null
      for (const view of viewsRef.current) {
        if (isInViewport(event, view)) {
          viewClicked = view
          activeViewRef.current = view
          setActiveViewportName(view.name) // Update active viewport for UI
          break
        }
      }
      
      if (!viewClicked) return
      
      // Check if camera controls should activate for this viewport
      let shouldEnableControls = false
      
      if (viewClicked.name === 'perspective') {
        // Perspective: only with modifier (Alt or Ctrl)
        shouldEnableControls = newModifier !== 'none'
      } else {
        // Orthographic views: only right-click for panning
        // Left-click (button 0) reserved for gizmo/point transformation
        shouldEnableControls = event.button === 2 // Right-click only
      }
      
      if (!shouldEnableControls) {
        // Disable all controls to allow point selection/gizmo
        controlsRef.current.forEach(controls => {
          controls.enabled = false
        })
        return // Don't interfere with point selection
      }
      
      // Enable camera controls for this viewport only
      controlsRef.current.forEach((controls, viewName) => {
        controls.enabled = (viewName === viewClicked.name)
      })
    }

    const handleMouseUp = () => {
      // Controls stay as they are for damping
      // They'll be reset on next mousedown
    }

    // Wheel event handler (needs viewport detection)
    const handleWheel = (event: WheelEvent) => {
      // Disable all controls
      allControls.forEach(c => c.enabled = false)
      
      // Find which viewport the mouse is in (use current views from ref)
      for (const view of viewsRef.current) {
        if (isInViewport(event as unknown as MouseEvent, view)) {
          const controls = controlsRef.current.get(view.name)
          if (controls) {
            // Wheel zoom always works in all viewports (doesn't need modifier)
            controls.enabled = true
            setActiveViewportName(view.name) // Update active viewport for UI
          }
          break
        }
      }
    }

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvasElement.addEventListener('mousedown', handleMouseDown)
    canvasElement.addEventListener('mouseup', handleMouseUp)
    canvasElement.addEventListener('wheel', handleWheel, { passive: false })

    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvasElement.removeEventListener('mousedown', handleMouseDown)
      canvasElement.removeEventListener('mouseup', handleMouseUp)
      canvasElement.removeEventListener('wheel', handleWheel)
      controlsRef.current.forEach((controls) => controls.dispose())
      controlsRef.current.clear()
      isInitializedRef.current = false // Reset for next mount
    }
  }, [canvasElement, views, width, height])

  // Reset view to default position
  const resetView = useCallback((viewName: string) => {
    const view = viewsRef.current.find(v => v.name === viewName)
    const controls = controlsRef.current.get(viewName)
    if (!view || !controls) return

    // Reset camera position based on view type
    if (viewName === 'perspective') {
      view.camera.position.set(10, 10, 10)
      view.camera.lookAt(0, 0, 0)
    } else if (viewName === 'top') {
      view.camera.position.set(0, 10, 0)
      view.camera.lookAt(0, 0, 0)
    } else if (viewName === 'front') {
      view.camera.position.set(0, 0, 10)
      view.camera.lookAt(0, 0, 0)
    } else if (viewName === 'side') {
      view.camera.position.set(10, 0, 0)
      view.camera.lookAt(0, 0, 0)
    }

    // Reset OrbitControls target
    controls.target.set(0, 0, 0)
    controls.update()
  }, [])

  return {
    controls: controlsRef.current,
    activeView: activeViewRef.current,
    activeViewportName,
    resetView,
  }
}
