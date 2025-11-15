/**
 * Position Three.js View
 * 
 * 3D visualization and editing of track positions using Three.js
 * Similar to Unified Three.js Editor from AnimationEditor
 */

import React, { useRef, useState, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three-stdlib'
import type { Track, Position } from '@/types'

export type ViewMode = 'perspective' | 'top' | 'front' | 'side'

interface PositionThreeJsViewProps {
  tracks: Track[]
  selectedTrackIds: string[]
  onTrackSelect: (trackId: string, addToSelection: boolean) => void
  onPositionChange: (trackId: string, position: Position) => void
  viewMode: ViewMode
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
}

export const PositionThreeJsView: React.FC<PositionThreeJsViewProps> = ({
  tracks,
  selectedTrackIds,
  onTrackSelect,
  onPositionChange,
  viewMode,
  showGrid,
  snapToGrid,
  gridSize
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.Camera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const transformControlsRef = useRef<TransformControls | null>(null)
  const trackMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const centerMarkerRef = useRef<THREE.Object3D | null>(null) // Isobarycenter marker for multi-selection
  const initialOffsetsRef = useRef<Map<string, THREE.Vector3>>(new Map()) // Track offsets from center
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const [isTransforming, setIsTransforming] = useState(false)

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a1a)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(10, 10, 10)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controlsRef.current = controls

    // Transform Controls (Gizmo)
    const transformControls = new TransformControls(camera, renderer.domElement)
    transformControls.setMode('translate')
    transformControls.setSpace('world')
    transformControls.setSize(1.0)
    transformControls.visible = false
    scene.add(transformControls)
    transformControlsRef.current = transformControls

    // Disable OrbitControls when using TransformControls
    transformControls.addEventListener('dragging-changed', (event: any) => {
      controls.enabled = !event.value
      setIsTransforming(event.value)
      
      // Clear transform flags when dragging ends
      if (!event.value) {
        const obj = (transformControls as any).object
        if (obj && obj.userData) {
          if (obj.userData.isIsobarycenter) {
            // Clear flags for all tracks in multi-selection
            initialOffsetsRef.current.forEach((_, trackId) => {
              const mesh = trackMeshesRef.current.get(trackId)
              if (mesh && mesh.userData) {
                mesh.userData.isBeingTransformed = false
              }
            })
          } else {
            // Single track
            obj.userData.isBeingTransformed = false
          }
        }
      }
    })

    // Update position when gizmo is dragged
    transformControls.addEventListener('objectChange', () => {
      const obj = (transformControls as any).object
      if (!obj) return
      
      if (obj.userData.trackId) {
        // Single track
        obj.userData.isBeingTransformed = true
        const position = {
          x: obj.position.x,
          y: -obj.position.z,
          z: obj.position.y
        }
        onPositionChange(obj.userData.trackId, position)
      } else if (obj.userData.isIsobarycenter) {
        // Multi-track: update all tracks relative to center
        const centerPos = obj.position
        initialOffsetsRef.current.forEach((offset, trackId) => {
          const newPos = centerPos.clone().add(offset)
          const mesh = trackMeshesRef.current.get(trackId)
          if (mesh) {
            mesh.userData.isBeingTransformed = true
            mesh.position.copy(newPos)
            // Update app state
            const position = {
              x: newPos.x,
              y: -newPos.z,
              z: newPos.y
            }
            onPositionChange(trackId, position)
          }
        })
      }
    })

    // Set snap to grid
    if (snapToGrid && gridSize > 0) {
      transformControls.setTranslationSnap(gridSize)
    }

    // Lights - brighter for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7)
    scene.add(directionalLight)
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3)
    directionalLight2.position.set(-5, 5, -5)
    scene.add(directionalLight2)

    // Grid
    const gridHelper = new THREE.GridHelper(20, 40, 0x444444, 0x222222)
    gridHelper.name = 'gridHelper'
    scene.add(gridHelper)

    // Axes
    const axesHelper = new THREE.AxesHelper(5)
    axesHelper.name = 'axesHelper'
    scene.add(axesHelper)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight
      
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      
      // Clear mesh references
      trackMeshesRef.current.clear()
      initialOffsetsRef.current.clear()
      
      // Remove center marker if exists
      if (centerMarkerRef.current) {
        scene.remove(centerMarkerRef.current)
        centerMarkerRef.current = null
      }
      
      if (transformControls) {
        transformControls.dispose()
        scene.remove(transformControls)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Update camera based on view mode
  useEffect(() => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    switch (viewMode) {
      case 'top':
        camera.position.set(0, 15, 0)
        camera.lookAt(0, 0, 0)
        break
      case 'front':
        camera.position.set(0, 0, 15)
        camera.lookAt(0, 0, 0)
        break
      case 'side':
        camera.position.set(15, 0, 0)
        camera.lookAt(0, 0, 0)
        break
      case 'perspective':
      default:
        camera.position.set(10, 10, 10)
        camera.lookAt(0, 0, 0)
    }
    
    controls.update()
  }, [viewMode])

  // Toggle grid visibility
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const grid = scene.getObjectByName('gridHelper')
    if (grid) grid.visible = showGrid
  }, [showGrid])

  // Update track meshes
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Get existing track IDs
    const existingTrackIds = new Set(trackMeshesRef.current.keys())
    const currentTrackIds = new Set(tracks.map(t => t.id))

    // Remove meshes for tracks that no longer exist
    existingTrackIds.forEach(trackId => {
      if (!currentTrackIds.has(trackId)) {
        const mesh = trackMeshesRef.current.get(trackId)
        if (mesh) {
          scene.remove(mesh)
          trackMeshesRef.current.delete(trackId)
        }
      }
    })

    // Create new track meshes (updates handled by separate effects)
    tracks.forEach(track => {
      const existingMesh = trackMeshesRef.current.get(track.id)
      
      if (!existingMesh) {
        // Create new mesh with default colors (selection handled by separate effect)
        const geometry = new THREE.SphereGeometry(0.15, 32, 32) // Smaller sphere
        
        // Determine initial color
        let color: THREE.Color
        if (track.color && typeof track.color === 'object') {
          // Color is {r, g, b} with values 0-1
          color = new THREE.Color().setRGB(track.color.r, track.color.g, track.color.b)
        } else {
          color = new THREE.Color(0x10B981)
        }
        
        const material = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.2, // Slight glow
          metalness: 0.2,
          roughness: 0.6
        })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(track.position.x, track.position.z, -track.position.y)
        mesh.userData = { trackId: track.id, isBeingTransformed: false }
        
        scene.add(mesh)
        trackMeshesRef.current.set(track.id, mesh)
      }
    })
  }, [tracks])

  // Update selection highlighting separately (doesn't recreate meshes)
  useEffect(() => {
    tracks.forEach(track => {
      const mesh = trackMeshesRef.current.get(track.id)
      if (!mesh) return

      const isSelected = selectedTrackIds.includes(track.id)
      const material = mesh.material as THREE.MeshStandardMaterial
      
      if (isSelected) {
        material.color.set(0x3B82F6)
        material.emissive.set(0x1E40AF)
        material.emissiveIntensity = 0.5
      } else {
        let color: THREE.Color
        if (track.color && typeof track.color === 'object') {
          color = new THREE.Color().setRGB(track.color.r, track.color.g, track.color.b)
        } else {
          color = new THREE.Color(0x10B981)
        }
        material.color.set(color)
        material.emissive.set(color)
        material.emissiveIntensity = 0.2
      }
    })
  }, [selectedTrackIds, tracks])

  // Update mesh positions separately (without recreating geometry)
  useEffect(() => {
    tracks.forEach(track => {
      const mesh = trackMeshesRef.current.get(track.id)
      if (!mesh) return
      
      // Don't update if being transformed
      if (mesh.userData.isBeingTransformed || isTransforming) return
      
      mesh.position.set(track.position.x, track.position.z, -track.position.y)
    })
  }, [tracks, isTransforming])

  // Attach transform controls to selected track(s) - single or isobarycenter for multi
  useEffect(() => {
    const transformControls = transformControlsRef.current
    const scene = sceneRef.current
    if (!transformControls || !scene) return

    // Always detach first
    try {
      transformControls.detach()
      transformControls.visible = false
    } catch (e) {
      // Ignore
    }

    // Remove old center marker if it exists
    if (centerMarkerRef.current) {
      scene.remove(centerMarkerRef.current)
      centerMarkerRef.current = null
    }
    initialOffsetsRef.current.clear()

    if (selectedTrackIds.length === 1) {
      // Single track - attach directly to track mesh
      const selectedTrackId = selectedTrackIds[0]
      const trackMesh = trackMeshesRef.current.get(selectedTrackId)
      
      if (trackMesh && trackMesh.parent === scene) {
        try {
          transformControls.attach(trackMesh)
          transformControls.visible = true
        } catch (error) {
          console.error('[PositionThreeJsView] Failed to attach gizmo:', error)
        }
      }
    } else if (selectedTrackIds.length > 1) {
      // Multi-track - create isobarycenter marker
      const selectedMeshes = selectedTrackIds
        .map(id => trackMeshesRef.current.get(id))
        .filter((m): m is THREE.Mesh => !!m)
      
      if (selectedMeshes.length > 0) {
        // Calculate isobarycenter (geometric center)
        const center = new THREE.Vector3()
        selectedMeshes.forEach(mesh => {
          center.add(mesh.position)
        })
        center.divideScalar(selectedMeshes.length)
        
        // Create invisible marker at center
        const centerMarker = new THREE.Object3D()
        centerMarker.position.copy(center)
        centerMarker.userData.isIsobarycenter = true
        scene.add(centerMarker)
        centerMarkerRef.current = centerMarker
        
        // Store offsets from center for each track
        selectedTrackIds.forEach(trackId => {
          const mesh = trackMeshesRef.current.get(trackId)
          if (mesh) {
            const offset = mesh.position.clone().sub(center)
            initialOffsetsRef.current.set(trackId, offset)
          }
        })
        
        // Attach gizmo to center marker
        try {
          transformControls.attach(centerMarker)
          transformControls.visible = true
        } catch (error) {
          console.error('[PositionThreeJsView] Failed to attach gizmo to center:', error)
        }
      }
    }
  }, [selectedTrackIds])

  // Update snap to grid
  useEffect(() => {
    const transformControls = transformControlsRef.current
    if (!transformControls) return

    if (snapToGrid && gridSize > 0) {
      transformControls.setTranslationSnap(gridSize)
    } else {
      transformControls.setTranslationSnap(null as any)
    }
  }, [snapToGrid, gridSize])

  // Click handler for selection only (no dragging - use gizmo instead)
  const handleClick = useCallback((event: React.MouseEvent) => {
    // Ignore if gizmo is being used
    if (isTransforming) return
    
    const renderer = rendererRef.current
    const camera = cameraRef.current
    const scene = sceneRef.current
    if (!renderer || !camera || !scene) return

    const rect = renderer.domElement.getBoundingClientRect()
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycasterRef.current.setFromCamera(mouseRef.current, camera)
    
    const trackMeshes = Array.from(trackMeshesRef.current.values())
    const intersects = raycasterRef.current.intersectObjects(trackMeshes)

    if (intersects.length > 0) {
      const trackId = intersects[0].object.userData.trackId
      onTrackSelect(trackId, event.shiftKey)
    }
  }, [onTrackSelect, isTransforming])

  return (
    <div 
      ref={mountRef} 
      className="w-full h-full"
      onClick={handleClick}
    />
  )
}
