import { useRef, useEffect, useCallback, useState } from 'react'
import * as THREE from 'three'
import { TransformControls } from 'three-stdlib'
import type { TransformMode, TransformControlsState } from '../types'

interface UseTransformControlsProps {
  scene: THREE.Scene | null
  camera: THREE.Camera | null
  domElement: HTMLElement | null
  mode: TransformMode
  snapSize: number
  onTransformStart?: () => void
  onTransform?: (position: THREE.Vector3, rotation: THREE.Euler) => void
  onTransformEnd?: (position: THREE.Vector3, rotation: THREE.Euler) => void
}

/**
 * Hook to manage Three.js TransformControls for dragging control points
 */
export const useTransformControls = ({
  scene,
  camera,
  domElement,
  mode,
  snapSize,
  onTransformStart,
  onTransform,
  onTransformEnd,
}: UseTransformControlsProps): TransformControlsState => {
  const transformControlsRef = useRef<TransformControls | null>(null)
  const [attachedObject, setAttachedObject] = useState<THREE.Object3D | null>(null)
  
  // Store callbacks in refs to avoid recreating TransformControls
  const onTransformStartRef = useRef(onTransformStart)
  const onTransformRef = useRef(onTransform)
  const onTransformEndRef = useRef(onTransformEnd)
  
  // Update refs when callbacks change
  useEffect(() => {
    onTransformStartRef.current = onTransformStart
    onTransformRef.current = onTransform
    onTransformEndRef.current = onTransformEnd
  }, [onTransformStart, onTransform, onTransformEnd])

  // Initialize TransformControls ONCE
  useEffect(() => {
    if (!camera || !domElement || !scene) return
    if (transformControlsRef.current) return // Already initialized

    const controls = new TransformControls(camera, domElement)
    controls.setMode(mode)
    controls.setSpace('world') // Always use world space for consistent orientation
    controls.setSize(1.0) // Standard size
    
    // Hide gizmo initially - only show when attached to an object
    controls.visible = false
    
    // Set snapping
    if (snapSize > 0) {
      controls.setTranslationSnap(snapSize)
      controls.setRotationSnap(THREE.MathUtils.degToRad(15))
    } else {
      controls.setTranslationSnap(null as any) // Disable snapping
      controls.setRotationSnap(null as any)
    }

    // Add to scene
    scene.add(controls)
    
    // Ensure controls are enabled for interaction
    ;(controls as any).enabled = true

    // Event listeners using refs
    controls.addEventListener('dragging-changed', (event: any) => {
      if (event.value) {
        onTransformStartRef.current?.()
      } else {
        const obj = (controls as any).object
        if (obj) {
          onTransformEndRef.current?.(
            obj.position.clone(),
            obj.rotation.clone()
          )
        }
      }
    })

    controls.addEventListener('change', () => {
      const obj = (controls as any).object
      if (obj) {
        onTransformRef.current?.(
          obj.position.clone(),
          obj.rotation.clone()
        )
      }
    })

    transformControlsRef.current = controls

    return () => {
      controls.dispose()
      scene.remove(controls)
      transformControlsRef.current = null
    }
  }, [scene, camera, domElement]) // Only reinitialize if these core dependencies change

  // Update mode when it changes
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(mode)
    }
  }, [mode])

  // Update snap size when it changes
  useEffect(() => {
    if (transformControlsRef.current) {
      if (snapSize > 0) {
        transformControlsRef.current.setTranslationSnap(snapSize)
        transformControlsRef.current.setRotationSnap(THREE.MathUtils.degToRad(15))
      } else {
        transformControlsRef.current.setTranslationSnap(null as any)
        transformControlsRef.current.setRotationSnap(null as any)
      }
    }
  }, [snapSize])

  // Attach to object
  const attachToPoint = useCallback((object: THREE.Object3D | null) => {
    if (!transformControlsRef.current) return

    if (object) {
      transformControlsRef.current.attach(object)
      transformControlsRef.current.visible = true // Show gizmo
      ;(transformControlsRef.current as any).enabled = true // Ensure enabled
      setAttachedObject(object)
      
      // Force update to sync gizmo position
      transformControlsRef.current.updateMatrixWorld()
      object.updateMatrixWorld()
    } else {
      transformControlsRef.current.detach()
      transformControlsRef.current.visible = false // Hide gizmo
      setAttachedObject(null)
    }
  }, [])

  // Detach
  const detach = useCallback(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.detach()
      transformControlsRef.current.visible = false // Hide gizmo
      setAttachedObject(null)
    }
  }, [])

  // Set mode
  const setMode = useCallback((newMode: TransformMode) => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(newMode)
    }
  }, [])

  return {
    transformControls: transformControlsRef.current,
    mode,
    setMode,
    attachToPoint,
    detach,
  }
}
