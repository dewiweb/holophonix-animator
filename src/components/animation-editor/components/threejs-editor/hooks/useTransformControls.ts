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

  // Initialize TransformControls
  useEffect(() => {
    if (!camera || !domElement || !scene) return

    const controls = new TransformControls(camera, domElement)
    controls.setMode(mode)
    controls.setSpace('world')
    controls.setSize(0.8)
    controls.setTranslationSnap(snapSize > 0 ? snapSize : null)
    controls.setRotationSnap(snapSize > 0 ? THREE.MathUtils.degToRad(15) : null)

    // Add to scene
    scene.add(controls)

    // Event listeners
    controls.addEventListener('dragging-changed', (event: any) => {
      // Notify that dragging state changed
      // This can be used to disable orbit controls
      if (event.value) {
        onTransformStart?.()
      } else {
        if (controls.object) {
          onTransformEnd?.(
            controls.object.position.clone(),
            controls.object.rotation.clone()
          )
        }
      }
    })

    controls.addEventListener('change', () => {
      // Notify on every change during drag
      if (controls.object) {
        onTransform?.(
          controls.object.position.clone(),
          controls.object.rotation.clone()
        )
      }
    })

    transformControlsRef.current = controls

    return () => {
      controls.dispose()
      scene.remove(controls)
      transformControlsRef.current = null
    }
  }, [scene, camera, domElement, mode, snapSize, onTransformStart, onTransform, onTransformEnd])

  // Update mode when it changes
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(mode)
    }
  }, [mode])

  // Update snap size when it changes
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setTranslationSnap(snapSize > 0 ? snapSize : null)
      transformControlsRef.current.setRotationSnap(snapSize > 0 ? THREE.MathUtils.degToRad(15) : null)
    }
  }, [snapSize])

  // Attach to object
  const attachToPoint = useCallback((object: THREE.Object3D | null) => {
    if (!transformControlsRef.current) return

    if (object) {
      transformControlsRef.current.attach(object)
      setAttachedObject(object)
    } else {
      transformControlsRef.current.detach()
      setAttachedObject(null)
    }
  }, [])

  // Detach
  const detach = useCallback(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.detach()
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
