import { useRef, useCallback } from 'react'
import * as THREE from 'three'
import type { ControlPoint3D, ViewConfig } from '../types'

interface UseControlPointSelectionProps {
  scene: THREE.Scene | null
  views: ViewConfig[]
  controlPoints: ControlPoint3D[]
  onSelect: (index: number | null) => void
}

/**
 * Hook to handle control point selection via raycasting
 */
export const useControlPointSelection = ({
  scene,
  views,
  controlPoints,
  onSelect,
}: UseControlPointSelectionProps) => {
  const raycaster = useRef(new THREE.Raycaster())
  
  // Use refs to prevent callback recreation on every render
  const viewsRef = useRef(views)
  const controlPointsRef = useRef(controlPoints)
  
  // Update refs when props change
  viewsRef.current = views
  controlPointsRef.current = controlPoints

  // Increase threshold for easier clicking
  raycaster.current.params.Points = { threshold: 0.3 }

  /**
   * Get the view and camera for a given mouse event
   */
  const getViewFromMouseEvent = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement): ViewConfig | null => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Normalize to 0-1 (DOM coordinates where 0,0 is top-left)
      const nx = x / rect.width
      const ny = y / rect.height

      // Find which viewport contains this point
      // Convert viewport from Three.js coords (y=0 at bottom) to DOM coords (y=0 at top)
      for (const view of viewsRef.current) {
        const vp = view.viewport
        const domY = 1 - vp.y - vp.height
        
        if (
          nx >= vp.x &&
          nx <= vp.x + vp.width &&
          ny >= domY &&
          ny <= domY + vp.height
        ) {
          return view
        }
      }

      return null
    },
    []
  )

  /**
   * Convert mouse coordinates to normalized device coordinates for a specific viewport
   */
  const getNormalizedMouseCoords = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement, viewport: ViewConfig['viewport']) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Convert viewport from Three.js coords (y=0 at bottom) to DOM coords (y=0 at top)
      const domY = (1 - viewport.y - viewport.height) * rect.height
      
      // Convert to viewport-relative coordinates
      const vpX = x - viewport.x * rect.width
      const vpY = y - domY

      // Normalize to -1 to 1 for raycasting
      const mouse = new THREE.Vector2(
        (vpX / (viewport.width * rect.width)) * 2 - 1,
        -(vpY / (viewport.height * rect.height)) * 2 + 1
      )

      return mouse
    },
    []
  )

  /**
   * Handle click event for control point selection
   */
  const handleClick = useCallback(
    (event: MouseEvent) => {
      console.log('🖱️ Click detected in selection handler')
      
      if (!scene) {
        console.log('❌ No scene')
        return
      }

      const canvas = event.target as HTMLCanvasElement
      if (!canvas) {
        console.log('❌ No canvas')
        return
      }

      // Find which viewport was clicked
      const view = getViewFromMouseEvent(event, canvas)
      if (!view) {
        console.log('❌ No view found')
        return
      }

      // Get normalized mouse coordinates for this viewport
      const mouse = getNormalizedMouseCoords(event, canvas, view.viewport)
      console.log('📍 Mouse coords:', mouse)

      // Update raycaster
      raycaster.current.setFromCamera(mouse, view.camera)

      // Check for intersections with control point meshes
      const meshes = controlPointsRef.current.map((p) => p.mesh)
      console.log('🎯 Testing', meshes.length, 'control point meshes')
      
      const intersects = raycaster.current.intersectObjects(meshes, false)
      console.log('🎯 Intersections found:', intersects.length)

      if (intersects.length > 0) {
        // Select the clicked point
        const index = intersects[0].object.userData.index as number
        console.log('✅ Selected control point:', index)
        onSelect(index)
      } else {
        // Clicked empty space - deselect
        console.log('⭕ Clicked empty space - deselect')
        onSelect(null)
      }
    },
    [scene, onSelect, getViewFromMouseEvent, getNormalizedMouseCoords]
  )

  /**
   * Handle mousemove for hover effects
   */
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!scene) return

      const canvas = event.target as HTMLCanvasElement
      if (!canvas) return

      // Find which viewport mouse is over
      const view = getViewFromMouseEvent(event, canvas)
      if (!view) return

      // Get normalized mouse coordinates
      const mouse = getNormalizedMouseCoords(event, canvas, view.viewport)

      // Update raycaster
      raycaster.current.setFromCamera(mouse, view.camera)

      // Check for intersections
      const meshes = controlPointsRef.current.map((p) => p.mesh)
      const intersects = raycaster.current.intersectObjects(meshes, false)

      // Update cursor style
      if (intersects.length > 0) {
        canvas.style.cursor = 'pointer'
      } else {
        canvas.style.cursor = 'default'
      }

      // TODO: Add hover highlight effect
      // Could scale up mesh slightly or change outline opacity
    },
    [scene, getViewFromMouseEvent, getNormalizedMouseCoords]
  )

  /**
   * Get control point at mouse position (for context menu, etc.)
   */
  const getControlPointAtMouse = useCallback(
    (event: MouseEvent): ControlPoint3D | null => {
      if (!scene) return null

      const canvas = event.target as HTMLCanvasElement
      if (!canvas) return null

      const view = getViewFromMouseEvent(event, canvas)
      if (!view) return null

      const mouse = getNormalizedMouseCoords(event, canvas, view.viewport)
      raycaster.current.setFromCamera(mouse, view.camera)

      const meshes = controlPointsRef.current.map((p) => p.mesh)
      const intersects = raycaster.current.intersectObjects(meshes, false)

      if (intersects.length > 0) {
        const index = intersects[0].object.userData.index as number
        return controlPointsRef.current[index] || null
      }

      return null
    },
    [scene, getViewFromMouseEvent, getNormalizedMouseCoords]
  )

  return {
    handleClick,
    handleMouseMove,
    getControlPointAtMouse,
  }
}
