import { useRef, useEffect } from 'react'
import { OrbitControls } from 'three-stdlib'
import * as THREE from 'three'
import type { ViewMode } from '../ViewModeSelector'

interface UseSingleViewportControlProps {
  camera: THREE.Camera | null
  domElement: HTMLElement | null
  viewMode: ViewMode
  enabled?: boolean
  isGizmoDragging?: boolean // Disable controls when gizmo is active
}

interface UseSingleViewportControlReturn {
  controls: OrbitControls | null
}

/**
 * Simplified viewport control hook for single-view management
 * Configures OrbitControls based on view mode (perspective vs orthographic planes)
 */
export const useSingleViewportControl = ({
  camera,
  domElement,
  viewMode,
  enabled = true,
  isGizmoDragging = false,
}: UseSingleViewportControlProps): UseSingleViewportControlReturn => {
  const controlsRef = useRef<OrbitControls | null>(null)

  useEffect(() => {
    if (!camera || !domElement || !enabled) {
      // Cleanup if exists
      if (controlsRef.current) {
        controlsRef.current.dispose()
        controlsRef.current = null
      }
      return
    }

    // Create OrbitControls (cast camera to correct type)
    const controls = new OrbitControls(
      camera as THREE.PerspectiveCamera | THREE.OrthographicCamera,
      domElement
    )

    // Configure based on view mode
    if (viewMode === 'perspective') {
      // Perspective view: Full 3D control
      controls.enableRotate = true
      controls.enablePan = true
      controls.enableZoom = true
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.screenSpacePanning = false // Standard behavior

      // Mouse buttons configuration
      // RIGHT mouse for rotation (to avoid conflicts with gizmo/selection on LEFT)
      controls.mouseButtons = {
        // LEFT button reserved for gizmo and selection
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE, // Right-click to rotate in perspective
      }

      // Keys for pan
      controls.keys = {
        LEFT: 'ArrowLeft',
        UP: 'ArrowUp',
        RIGHT: 'ArrowRight',
        BOTTOM: 'ArrowDown',
      }

      // Pan with middle mouse button
      controls.keyPanSpeed = 15.0
    } else {
      // Orthographic planes: Pan and zoom only, NO rotation
      controls.enableRotate = false // Critical: Lock rotation to keep plane view
      controls.enablePan = true
      controls.enableZoom = true
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.screenSpacePanning = true

      // Mouse buttons - only pan and zoom
      controls.mouseButtons = {
        // LEFT button not set (undefined) - reserved for gizmo and selection
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN, // Right-click to pan
      }
    }

    // Store controls
    controlsRef.current = controls

    // Cleanup on unmount or when dependencies change
    return () => {
      controls.dispose()
      controlsRef.current = null
    }
  }, [camera, domElement, viewMode, enabled])

  // Disable controls when gizmo is being dragged
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = enabled && !isGizmoDragging
    }
  }, [isGizmoDragging, enabled])

  // Update controls on every frame (for damping)
  useEffect(() => {
    if (!controlsRef.current) return

    const controls = controlsRef.current

    const animate = () => {
      if (controls && enabled) {
        controls.update()
      }
    }

    // Use requestAnimationFrame for smooth updates
    let animationId: number
    const loop = () => {
      animate()
      animationId = requestAnimationFrame(loop)
    }
    animationId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [enabled])

  return {
    controls: controlsRef.current,
  }
}
