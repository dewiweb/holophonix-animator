import * as THREE from 'three'
import type { ViewMode } from '../ViewModeSelector'

export interface CameraConfig {
  type: 'perspective' | 'orthographic'
  position: THREE.Vector3
  lookAt: THREE.Vector3
  up: THREE.Vector3
  // For perspective camera
  fov?: number
  // For orthographic camera
  zoom?: number
}

/**
 * Camera configuration presets for each view mode
 */
export const CAMERA_CONFIGS: Record<ViewMode, CameraConfig> = {
  perspective: {
    type: 'perspective',
    position: new THREE.Vector3(10, 10, 10),
    lookAt: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
    fov: 50,
  },
  top: {
    type: 'orthographic',
    position: new THREE.Vector3(0, 20, 0),
    lookAt: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 0, -1), // Important: Y-up -> Z-forward for top view
    zoom: 1.5, // Adjusted for consistent scale with perspective
  },
  front: {
    type: 'orthographic',
    position: new THREE.Vector3(0, 0, 20),
    lookAt: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 1, 0), // Y-up
    zoom: 1.5, // Adjusted for consistent scale with perspective
  },
  side: {
    type: 'orthographic',
    position: new THREE.Vector3(20, 0, 0),
    lookAt: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 1, 0), // Y-up
    zoom: 1.5, // Adjusted for consistent scale with perspective
  },
}

/**
 * Create a camera based on view mode
 */
export const createCamera = (
  viewMode: ViewMode,
  aspect: number = 1
): THREE.Camera => {
  const config = CAMERA_CONFIGS[viewMode]

  let camera: THREE.Camera

  if (config.type === 'perspective') {
    camera = new THREE.PerspectiveCamera(
      config.fov || 50,
      aspect,
      0.1,
      1000
    )
  } else {
    // Orthographic camera
    const frustumSize = 20
    const halfWidth = (frustumSize * aspect) / 2
    const halfHeight = frustumSize / 2

    camera = new THREE.OrthographicCamera(
      -halfWidth,
      halfWidth,
      halfHeight,
      -halfHeight,
      0.1,
      1000
    )

    if (config.zoom) {
      ;(camera as THREE.OrthographicCamera).zoom = config.zoom
      ;(camera as THREE.OrthographicCamera).updateProjectionMatrix()
    }
  }

  camera.position.copy(config.position)
  camera.up.copy(config.up)
  camera.lookAt(config.lookAt)
  
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.updateProjectionMatrix()
  } else if (camera instanceof THREE.OrthographicCamera) {
    camera.updateProjectionMatrix()
  }

  return camera
}

/**
 * Update camera aspect ratio (for window resize)
 */
export const updateCameraAspect = (
  camera: THREE.Camera,
  viewMode: ViewMode,
  aspect: number
): void => {
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = aspect
    camera.updateProjectionMatrix()
  } else if (camera instanceof THREE.OrthographicCamera) {
    const frustumSize = 20
    const halfWidth = (frustumSize * aspect) / 2
    const halfHeight = frustumSize / 2

    camera.left = -halfWidth
    camera.right = halfWidth
    camera.top = halfHeight
    camera.bottom = -halfHeight
    camera.updateProjectionMatrix()
  }
}

/**
 * Reset camera to default position for view mode
 */
export const resetCameraToDefault = (
  camera: THREE.Camera,
  viewMode: ViewMode
): void => {
  const config = CAMERA_CONFIGS[viewMode]

  camera.position.copy(config.position)
  camera.up.copy(config.up)
  camera.lookAt(config.lookAt)

  if (camera instanceof THREE.OrthographicCamera && config.zoom) {
    camera.zoom = config.zoom
    camera.updateProjectionMatrix()
  } else if (camera instanceof THREE.PerspectiveCamera) {
    camera.updateProjectionMatrix()
  }
}
