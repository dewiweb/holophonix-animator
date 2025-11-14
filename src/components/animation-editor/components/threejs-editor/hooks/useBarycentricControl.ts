import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import type { Position } from '@/types'
import { appToThreePosition, threeToAppPosition } from '../utils/coordinateConversion'

interface UseBarycentricControlProps {
  scene: THREE.Scene | null
  camera: THREE.Camera | null
  canvasElement: HTMLCanvasElement | null
  multiTrackMode: 'relative' | 'barycentric'
  barycentricVariant?: 'shared' | 'isobarycentric' | 'centered' | 'custom'
  barycentricCenter?: Position
  animatedBarycentricPosition?: Position  // Position along animation path at current time
  tracks: any[]
  isEditMode: boolean
  isDragging?: boolean
  onCenterChange?: (center: Position) => void
}

/**
 * Hook to manage barycentric center visualization and interaction
 * Shows the center as a draggable marker for user-editable variants
 */
export const useBarycentricControl = ({
  scene,
  camera,
  canvasElement,
  multiTrackMode,
  barycentricVariant = 'isobarycentric',
  barycentricCenter,
  animatedBarycentricPosition,
  tracks,
  isEditMode,
  isDragging = false,
  onCenterChange,
}: UseBarycentricControlProps) => {
  const centerMarkerRef = useRef<THREE.Group | null>(null)
  const isDraggingRef = useRef(false)
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))

  // Determine if center is user-editable
  // All barycentric variants can have editable center (even shared - defines where identical motion happens)
  const isEditable = multiTrackMode === 'barycentric' && 
                     (barycentricVariant === 'shared' || barycentricVariant === 'centered' || barycentricVariant === 'custom')

  // Calculate center position based on variant
  const getCenterPosition = useCallback((): Position | null => {
    if (multiTrackMode !== 'barycentric' || tracks.length === 0) return null

    switch (barycentricVariant) {
      case 'isobarycentric':
        // Auto-calculate from track positions
        return {
          x: tracks.reduce((sum, t) => sum + (t.initialPosition?.x ?? t.position.x), 0) / tracks.length,
          y: tracks.reduce((sum, t) => sum + (t.initialPosition?.y ?? t.position.y), 0) / tracks.length,
          z: tracks.reduce((sum, t) => sum + (t.initialPosition?.z ?? t.position.z), 0) / tracks.length,
        }
      case 'shared':
      case 'centered':
      case 'custom':
        // Use user-defined center (or default to origin)
        return barycentricCenter || { x: 0, y: 0, z: 0 }
      default:
        return null
    }
  }, [multiTrackMode, barycentricVariant, barycentricCenter, tracks])

  // Create or update center marker
  useEffect(() => {
    if (!scene) return

    const center = getCenterPosition()
    
    // Remove existing marker if shouldn't be shown
    if (!center) {
      if (centerMarkerRef.current) {
        scene.remove(centerMarkerRef.current)
        centerMarkerRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose())
            } else {
              child.material.dispose()
            }
          }
        })
        centerMarkerRef.current = null
      }
      return
    }

    // Create marker if it doesn't exist
    if (!centerMarkerRef.current) {
      const group = new THREE.Group()
      group.name = 'BarycentricCenter'

      // Create a distinctive marker (sphere + cross)
      const sphereGeometry = new THREE.SphereGeometry(0.4, 16, 16)
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color: isEditable ? 0x00ff00 : 0xffaa00, // Green if editable, orange if auto
        emissive: isEditable ? 0x00ff00 : 0xffaa00,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8,
      })
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      group.add(sphere)

      // Add cross lines for visibility
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: isEditable ? 0x00ff00 : 0xffaa00,
        linewidth: 2,
      })

      // X-axis line
      const xPoints = [new THREE.Vector3(-0.8, 0, 0), new THREE.Vector3(0.8, 0, 0)]
      const xGeometry = new THREE.BufferGeometry().setFromPoints(xPoints)
      group.add(new THREE.Line(xGeometry, lineMaterial))

      // Y-axis line
      const yPoints = [new THREE.Vector3(0, -0.8, 0), new THREE.Vector3(0, 0.8, 0)]
      const yGeometry = new THREE.BufferGeometry().setFromPoints(yPoints)
      group.add(new THREE.Line(yGeometry, lineMaterial))

      // Z-axis line
      const zPoints = [new THREE.Vector3(0, 0, -0.8), new THREE.Vector3(0, 0, 0.8)]
      const zGeometry = new THREE.BufferGeometry().setFromPoints(zPoints)
      group.add(new THREE.Line(zGeometry, lineMaterial))

      // Make it interactive if editable
      if (isEditable) {
        sphere.userData.draggable = true
        sphere.userData.type = 'barycentricCenter'
      }

      scene.add(group)
      centerMarkerRef.current = group
      
      // Set initial position immediately after creation
      const positionToUse = animatedBarycentricPosition || center
      const threePos = appToThreePosition(positionToUse)
      centerMarkerRef.current.position.copy(threePos)
    }

    // Update position - ALWAYS update to ensure marker stays in correct position
    // Only skip if marker itself is being dragged by TransformControls
    const positionToUse = animatedBarycentricPosition || center
    const threePos = appToThreePosition(positionToUse)
    
    if (centerMarkerRef.current && !centerMarkerRef.current.userData.isBeingTransformed) {
      centerMarkerRef.current.position.copy(threePos)
    }

    // Update color based on editability
    centerMarkerRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
        const color = isEditable ? 0x00ff00 : 0xffaa00
        child.material.color.setHex(color)
        child.material.emissive.setHex(color)
      } else if (child instanceof THREE.Line && child.material instanceof THREE.LineBasicMaterial) {
        child.material.color.setHex(isEditable ? 0x00ff00 : 0xffaa00)
      }
    })

    return () => {
      if (centerMarkerRef.current) {
        scene.remove(centerMarkerRef.current)
        centerMarkerRef.current = null
      }
    }
  }, [scene, getCenterPosition, isEditable, barycentricVariant, isDragging, animatedBarycentricPosition])

  return {
    centerPosition: getCenterPosition(),
    isEditable,
    centerMarker: centerMarkerRef.current,
  }
}
