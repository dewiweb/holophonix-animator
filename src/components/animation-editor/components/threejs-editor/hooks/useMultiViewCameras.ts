import { useState, useEffect, useCallback, RefObject } from 'react'
import * as THREE from 'three'
import type { ViewConfig, MultiViewCamerasState } from '../types'

/**
 * Hook to manage multiple camera views for the editor
 */
export const useMultiViewCameras = (
  containerRef: RefObject<HTMLDivElement>,
  controlPoints: any[]
): MultiViewCamerasState => {
  const [views, setViews] = useState<ViewConfig[]>([])
  const [activeViewIndex, setActiveViewIndex] = useState(3) // Default to perspective

  // Initialize cameras
  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // Create orthographic cameras for 2D views
    const orthoSize = 10
    const orthoAspect = 1 // Will be adjusted per viewport

    // Top view (looking down at XZ plane)
    const topCamera = new THREE.OrthographicCamera(
      -orthoSize,
      orthoSize,
      orthoSize,
      -orthoSize,
      0.1,
      1000
    )
    topCamera.position.set(0, 10, 0)
    topCamera.lookAt(0, 0, 0)
    topCamera.up.set(0, 0, -1) // Z-axis points down in top view

    // Front view (looking at XY plane)
    const frontCamera = new THREE.OrthographicCamera(
      -orthoSize,
      orthoSize,
      orthoSize,
      -orthoSize,
      0.1,
      1000
    )
    frontCamera.position.set(0, 0, 10)
    frontCamera.lookAt(0, 0, 0)
    frontCamera.up.set(0, 1, 0)

    // Side view (looking at YZ plane)
    const sideCamera = new THREE.OrthographicCamera(
      -orthoSize,
      orthoSize,
      orthoSize,
      -orthoSize,
      0.1,
      1000
    )
    sideCamera.position.set(10, 0, 0)
    sideCamera.lookAt(0, 0, 0)
    sideCamera.up.set(0, 1, 0)

    // Perspective view (3D)
    const perspectiveCamera = new THREE.PerspectiveCamera(
      50, // FOV
      1, // Aspect (will be updated)
      0.1,
      1000
    )
    perspectiveCamera.position.set(8, 6, 8)
    perspectiveCamera.lookAt(0, 0, 0)

    // Define viewport layout (2x2 grid)
    const halfWidth = 0.5
    const halfHeight = 0.5

    const newViews: ViewConfig[] = [
      {
        name: 'perspective',
        camera: perspectiveCamera,
        viewport: {
          x: 0,
          y: halfHeight,
          width: halfWidth,
          height: halfHeight,
        },
        label: 'Perspective',
        backgroundColor: new THREE.Color(0x16213e),
      },
      {
        name: 'front',
        camera: frontCamera,
        viewport: {
          x: halfWidth,
          y: halfHeight,
          width: halfWidth,
          height: halfHeight,
        },
        label: 'Front (XY)',
        backgroundColor: new THREE.Color(0x1a1a2e),
      },
      {
        name: 'top',
        camera: topCamera,
        viewport: {
          x: 0,
          y: 0,
          width: halfWidth,
          height: halfHeight,
        },
        label: 'Top (XZ)',
        backgroundColor: new THREE.Color(0x1a1a2e),
      },
      {
        name: 'side',
        camera: sideCamera,
        viewport: {
          x: halfWidth,
          y: 0,
          width: halfWidth,
          height: halfHeight,
        },
        label: 'Side (YZ)',
        backgroundColor: new THREE.Color(0x1a1a2e),
      },
    ]

    setViews(newViews)

    return () => {
      // Cleanup cameras if needed
    }
  }, [containerRef])

  // Update viewports when container resizes
  const updateViewports = useCallback(
    (width: number, height: number) => {
      setViews((prevViews) => {
        return prevViews.map((view) => {
          const camera = view.camera

          // Update camera aspect ratios
          if (camera instanceof THREE.PerspectiveCamera) {
            const vpWidth = width * view.viewport.width
            const vpHeight = height * view.viewport.height
            camera.aspect = vpWidth / vpHeight
            camera.updateProjectionMatrix()
          } else if (camera instanceof THREE.OrthographicCamera) {
            const vpWidth = width * view.viewport.width
            const vpHeight = height * view.viewport.height
            const aspect = vpWidth / vpHeight
            const size = 10

            camera.left = -size * aspect
            camera.right = size * aspect
            camera.top = size
            camera.bottom = -size
            camera.updateProjectionMatrix()
          }

          return view
        })
      })
    },
    []
  )

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        updateViewports(width, height)
      }
    })

    resizeObserver.observe(containerRef.current)

    // Initial update
    const { clientWidth, clientHeight } = containerRef.current
    updateViewports(clientWidth, clientHeight)

    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef, updateViewports])

  // Frame selected control points in all views
  const frameSelection = useCallback(() => {
    if (controlPoints.length === 0) return

    // Calculate bounding box of selected points
    const box = new THREE.Box3()
    controlPoints.forEach((point) => {
      if (point.isSelected) {
        box.expandByPoint(point.position)
      }
    })

    if (box.isEmpty()) return

    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const fitOffset = maxDim * 1.5

    views.forEach((view) => {
      if (view.camera instanceof THREE.OrthographicCamera) {
        // For orthographic cameras, adjust zoom
        const camera = view.camera
        const size = maxDim * 0.6
        const aspect = (camera.right - camera.left) / (camera.top - camera.bottom)

        camera.left = -size * aspect
        camera.right = size * aspect
        camera.top = size
        camera.bottom = -size

        // Move camera to center on selection
        const direction = new THREE.Vector3()
        direction.subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize()
        camera.position.copy(center).add(direction.multiplyScalar(10))
        camera.lookAt(center)
        camera.updateProjectionMatrix()
      } else if (view.camera instanceof THREE.PerspectiveCamera) {
        // For perspective camera, move back to fit
        const camera = view.camera
        const direction = new THREE.Vector3()
        direction.subVectors(camera.position, center).normalize()
        camera.position.copy(center).add(direction.multiplyScalar(fitOffset))
        camera.lookAt(center)
        camera.updateProjectionMatrix()
      }
    })
  }, [controlPoints, views])

  // Frame all control points in all views
  const frameAll = useCallback(() => {
    if (controlPoints.length === 0) return

    // Calculate bounding box of all points
    const box = new THREE.Box3()
    controlPoints.forEach((point) => {
      box.expandByPoint(point.position)
    })

    if (box.isEmpty()) {
      // Reset to default views
      views.forEach((view) => {
        if (view.camera instanceof THREE.OrthographicCamera) {
          view.camera.left = -10
          view.camera.right = 10
          view.camera.top = 10
          view.camera.bottom = -10
          view.camera.updateProjectionMatrix()
        }
      })
      return
    }

    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const fitOffset = maxDim * 2

    views.forEach((view) => {
      if (view.camera instanceof THREE.OrthographicCamera) {
        const camera = view.camera
        const size = maxDim * 0.7
        const aspect = (camera.right - camera.left) / (camera.top - camera.bottom)

        camera.left = -size * aspect
        camera.right = size * aspect
        camera.top = size
        camera.bottom = -size

        // Move camera to center on all points
        const direction = new THREE.Vector3()
        direction.subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize()
        camera.position.copy(center).add(direction.multiplyScalar(10))
        camera.lookAt(center)
        camera.updateProjectionMatrix()
      } else if (view.camera instanceof THREE.PerspectiveCamera) {
        const camera = view.camera
        const direction = new THREE.Vector3()
        direction.subVectors(camera.position, center).normalize()
        camera.position.copy(center).add(direction.multiplyScalar(fitOffset))
        camera.lookAt(center)
        camera.updateProjectionMatrix()
      }
    })
  }, [controlPoints, views])

  // Set active view
  const setActiveView = useCallback((index: number) => {
    if (index >= 0 && index < views.length) {
      setActiveViewIndex(index)
    }
  }, [views.length])

  return {
    views,
    activeViewIndex,
    setActiveView,
    frameSelection,
    frameAll,
    updateViewports,
  }
}
