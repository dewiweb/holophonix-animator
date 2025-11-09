import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import type { ViewMode } from '../ViewModeSelector'
import { createCamera, updateCameraAspect, resetCameraToDefault, CAMERA_CONFIGS } from '../utils/CameraConfigs'

interface UseCameraProps {
  viewMode: ViewMode
  aspect: number
}

interface UseCameraReturn {
  camera: THREE.Camera | null
  resetCamera: () => void
}

interface CameraState {
  position: THREE.Vector3
  zoom: number
  target: THREE.Vector3
}

/**
 * Hook for managing a single camera that switches based on view mode
 * Replaces the old useMultiViewCameras which managed 4 cameras simultaneously
 */
export const useCamera = ({ viewMode, aspect }: UseCameraProps): UseCameraReturn => {
  const cameraRef = useRef<THREE.Camera | null>(null)
  const previousViewModeRef = useRef<ViewMode>(viewMode)
  const [, forceUpdate] = useState({})
  
  // Store camera state for each view mode
  const cameraStatesRef = useRef<Record<ViewMode, CameraState | null>>({
    perspective: null,
    top: null,
    front: null,
    side: null,
  })

  // Save current camera state
  const saveCameraState = (mode: ViewMode, camera: THREE.Camera) => {
    const zoom = camera instanceof THREE.OrthographicCamera ? camera.zoom : 1
    
    // Calculate look-at target from camera direction
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    const distance = 10 // Default distance
    const target = camera.position.clone().add(direction.multiplyScalar(distance))
    
    cameraStatesRef.current[mode] = {
      position: camera.position.clone(),
      zoom,
      target,
    }
  }

  // Restore camera state when switching to a view
  const restoreCameraState = (mode: ViewMode, camera: THREE.Camera) => {
    const state = cameraStatesRef.current[mode]
    if (state) {
      if (camera instanceof THREE.OrthographicCamera) {
        // For orthographic views, only restore zoom and pan (target)
        // Do NOT restore position - it must stay on the correct axis
        // This prevents the view from becoming perspective-like
        
        // Only update the distance along the view axis, not the position itself
        const config = CAMERA_CONFIGS[mode]
        const defaultPosition = config.position.clone()
        
        // Keep camera on correct axis, but allow distance changes
        const distanceRatio = state.position.length() / defaultPosition.length()
        camera.position.copy(defaultPosition.multiplyScalar(distanceRatio))
        
        // Restore pan by updating lookAt target (but keep it on the plane)
        camera.lookAt(state.target)
        
        // Restore zoom
        camera.zoom = state.zoom
        camera.updateProjectionMatrix()
      } else {
        // For perspective, restore full state
        camera.position.copy(state.position)
        camera.lookAt(state.target)
      }
    }
  }

  // Create/recreate camera when view mode changes
  useEffect(() => {
    // Save current camera state BEFORE switching (using previous mode)
    if (cameraRef.current && previousViewModeRef.current) {
      saveCameraState(previousViewModeRef.current, cameraRef.current)
    }

    // Create new camera for view mode
    const camera = createCamera(viewMode, aspect)
    
    // Try to restore previous state for this view
    restoreCameraState(viewMode, camera)
    
    cameraRef.current = camera
    previousViewModeRef.current = viewMode

    // Force re-render to update consumers
    forceUpdate({})
  }, [viewMode, aspect])

  // Update aspect ratio when it changes (without recreating camera)
  useEffect(() => {
    if (cameraRef.current) {
      updateCameraAspect(cameraRef.current, viewMode, aspect)
    }
  }, [aspect, viewMode])

  // Reset camera to default position
  const resetCamera = () => {
    if (cameraRef.current) {
      resetCameraToDefault(cameraRef.current, viewMode)
    }
  }

  return {
    camera: cameraRef.current,
    resetCamera,
  }
}
