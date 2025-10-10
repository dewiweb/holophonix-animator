import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Track, Animation, Keyframe } from '@/types'
import { generateAnimationPath, generateDirectionIndicators } from '@/utils/pathGeneration'

interface AnimationPreview3DProps {
  tracks: Track[]  // Changed from single track to array of tracks
  animation: Animation | null
  currentTime?: number
  keyframes?: Keyframe[]
  onUpdateKeyframe?: (keyframeId: string, updates: Partial<Keyframe>) => void
  isKeyframePlacementMode?: boolean
  selectedKeyframeId?: string | null
  onSelectKeyframe?: (keyframeId: string | null) => void
}

export const AnimationPreview3D: React.FC<AnimationPreview3DProps> = ({
  tracks,
  animation,
  currentTime = 0,
  keyframes = [],
  onUpdateKeyframe,
  isKeyframePlacementMode = false,
  selectedKeyframeId = null,
  onSelectKeyframe,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const trackSpheresRef = useRef<THREE.Group | null>(null)  // Changed to Group to hold multiple track spheres
  const pathLinesRef = useRef<THREE.Group | null>(null)  // Changed to Group to hold multiple paths
  const animationFrameRef = useRef<number | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const keyframeMarkersRef = useRef<THREE.Group | null>(null)
  const boundingBoxRef = useRef<THREE.LineSegments | null>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; z: number } | null>(null)

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(15, 15, 15)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc)
    scene.add(gridHelper)

    // Axes helper
    const axesHelper = new THREE.AxesHelper(10)
    scene.add(axesHelper)

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    scene.add(directionalLight)

    // Track spheres group (representing sound sources)
    const trackSpheresGroup = new THREE.Group()
    trackSpheresGroup.name = 'track-spheres'
    scene.add(trackSpheresGroup)
    trackSpheresRef.current = trackSpheresGroup

    // Keyframe markers group
    const keyframeGroup = new THREE.Group()
    scene.add(keyframeGroup)
    keyframeMarkersRef.current = keyframeGroup

    // Invisible ground plane for raycasting
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000)
    planeGeometry.rotateX(-Math.PI / 2)
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false })
    const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial)
    scene.add(groundPlane)

    // OrbitControls for camera manipulation
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = false
    controls.minDistance = 5
    controls.maxDistance = 50
    controls.maxPolarAngle = Math.PI / 2
    controlsRef.current = controls

    // Click handler for keyframe selection and positioning
    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, camera)

      // If in placement mode and a keyframe is selected, reposition it
      if (isKeyframePlacementMode && selectedKeyframeId && onUpdateKeyframe) {
        const intersects = raycasterRef.current.intersectObjects(scene.children, true)
        if (intersects.length > 0) {
          const point = intersects[0].point
          // Convert from Three.js coordinates (Y-up) to our coordinate system
          onUpdateKeyframe(selectedKeyframeId, {
            position: { x: point.x, y: -point.z, z: point.y }
          })
        }
      } else if (onSelectKeyframe && keyframeMarkersRef.current) {
        // Check if clicked on a keyframe marker to select it
        const markers = keyframeMarkersRef.current.children
        const intersects = raycasterRef.current.intersectObjects(markers, false)
        
        if (intersects.length > 0) {
          // Find which keyframe was clicked by checking which marker sphere
          const clickedObject = intersects[0].object
          
          // Each keyframe has 2 objects: sphere (even indices) and ring (odd indices)
          const objectIndex = markers.indexOf(clickedObject)
          if (objectIndex >= 0) {
            const keyframeIndex = Math.floor(objectIndex / 2)
            if (keyframeIndex >= 0 && keyframeIndex < keyframes.length) {
              console.log('Keyframe clicked:', keyframes[keyframeIndex].id)
              onSelectKeyframe(keyframes[keyframeIndex].id)
            }
          }
        }
      }
    }

    // Mouse move handler for hover preview
    const handleMouseMove = (event: MouseEvent) => {
      if (!isKeyframePlacementMode) {
        setHoverPosition(null)
        return
      }

      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const intersects = raycasterRef.current.intersectObjects(scene.children, true)

      if (intersects.length > 0) {
        const point = intersects[0].point
        setHoverPosition({ x: point.x, y: -point.z, z: point.y })
      } else {
        setHoverPosition(null)
      }
    }

    renderer.domElement.addEventListener('click', handleClick)
    renderer.domElement.addEventListener('mousemove', handleMouseMove)

    // Change cursor style based on mode
    renderer.domElement.style.cursor = isKeyframePlacementMode ? 'crosshair' : 'grab'

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('click', handleClick)
      renderer.domElement.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (controlsRef.current) {
        controlsRef.current.dispose()
      }
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Re-attach event handlers when props change (fix closure issue)
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return

    const renderer = rendererRef.current
    const camera = cameraRef.current
    const scene = sceneRef.current

    const handleClick = (event: MouseEvent) => {
      console.log('Click detected', { isKeyframePlacementMode, selectedKeyframeId, hasSelectCallback: !!onSelectKeyframe })
      
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, camera)

      // First, check if clicking on a keyframe marker (for selection)
      if (onSelectKeyframe && keyframeMarkersRef.current) {
        const markers = keyframeMarkersRef.current.children
        const markerIntersects = raycasterRef.current.intersectObjects(markers, false)
        
        if (markerIntersects.length > 0) {
          const clickedObject = markerIntersects[0].object
          const objectIndex = markers.indexOf(clickedObject)
          if (objectIndex >= 0) {
            const keyframeIndex = Math.floor(objectIndex / 2)
            if (keyframeIndex >= 0 && keyframeIndex < keyframes.length) {
              const clickedKeyframeId = keyframes[keyframeIndex].id
              
              // Toggle selection if clicking the same keyframe
              if (clickedKeyframeId === selectedKeyframeId) {
                console.log('✓ Keyframe deselected')
                onSelectKeyframe(null)
              } else {
                console.log('✓ Keyframe selected:', clickedKeyframeId)
                onSelectKeyframe(clickedKeyframeId)
              }
              return // Exit after handling keyframe click
            }
          }
        }
      }

      // If in placement mode with selected keyframe, reposition it
      if (isKeyframePlacementMode && selectedKeyframeId && onUpdateKeyframe) {
        const intersects = raycasterRef.current.intersectObjects(scene.children, true)
        if (intersects.length > 0) {
          const point = intersects[0].point
          const newPosition = { x: point.x, y: -point.z, z: point.y }
          console.log('📍 Repositioning keyframe:', {
            selectedKeyframeId,
            keyframeIndex: keyframes.findIndex(k => k.id === selectedKeyframeId),
            oldPosition: keyframes.find(k => k.id === selectedKeyframeId)?.position,
            newPosition
          })
          onUpdateKeyframe(selectedKeyframeId, {
            position: newPosition
          })
        }
      } else if (selectedKeyframeId && onSelectKeyframe) {
        // Clicked empty space - deselect
        console.log('✓ Keyframe deselected (clicked empty space)')
        onSelectKeyframe(null)
      }
    }

    // Remove old listener and add new one with current closure
    const canvas = renderer.domElement
    canvas.removeEventListener('click', handleClick)
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('click', handleClick)
    }
  }, [isKeyframePlacementMode, selectedKeyframeId, onUpdateKeyframe, onSelectKeyframe, keyframes])

  // Update track spheres - create one sphere per track with matching colors
  useEffect(() => {
    if (!trackSpheresRef.current || !sceneRef.current) return
    
    const spheresGroup = trackSpheresRef.current
    
    // Clear existing spheres
    spheresGroup.clear()
    
    // Colors matching the path colors
    const colors = [0x10b981, 0x3b82f6, 0xf59e0b, 0xef4444, 0x8b5cf6, 0xec4899]
    
    // Create sphere for each track
    tracks.forEach((track, index) => {
      const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32)
      const color = colors[index % colors.length]
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.3,
        roughness: 0.4,
      })
      const trackSphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      
      // Position sphere at track's current position
      const position = track.position
      trackSphere.position.set(position.x, position.z, -position.y)
      trackSphere.name = `track-sphere-${track.id}`
      
      spheresGroup.add(trackSphere)
    })
  }, [tracks])

  // Update keyframe markers
  useEffect(() => {
    if (!keyframeMarkersRef.current || !sceneRef.current) return

    // Clear existing markers
    keyframeMarkersRef.current.clear()

    // Add markers for each keyframe
    keyframes.forEach((keyframe, index) => {
      const isSelected = keyframe.id === selectedKeyframeId
      
      const markerGeometry = new THREE.SphereGeometry(isSelected ? 0.35 : 0.3, 16, 16)
      const markerMaterial = new THREE.MeshStandardMaterial({
        color: isSelected ? 0x10b981 : 0xf59e0b, // Green if selected, orange otherwise
        metalness: 0.5,
        roughness: 0.3,
        emissive: isSelected ? 0x10b981 : 0x000000,
        emissiveIntensity: isSelected ? 0.3 : 0,
      })
      const marker = new THREE.Mesh(markerGeometry, markerMaterial)
      marker.position.set(keyframe.position.x, keyframe.position.z, -keyframe.position.y)
      keyframeMarkersRef.current?.add(marker)

      // Add ring
      const ringGeometry = new THREE.RingGeometry(0.35, 0.45, 32)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x34d399 : 0xfbbf24,
        side: THREE.DoubleSide,
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.position.copy(marker.position)
      ring.position.y += 0.01
      ring.rotation.x = -Math.PI / 2
      keyframeMarkersRef.current?.add(ring)
    })
  }, [keyframes, selectedKeyframeId])

  // Update hover preview
  useEffect(() => {
    if (!sceneRef.current) return

    // Remove existing hover sphere
    const existingHover = sceneRef.current.getObjectByName('hover-preview')
    if (existingHover) {
      sceneRef.current.remove(existingHover)
    }

    // Add new hover sphere if in placement mode and hovering
    if (isKeyframePlacementMode && hoverPosition) {
      const hoverGeometry = new THREE.SphereGeometry(0.25, 16, 16)
      const hoverMaterial = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        metalness: 0.3,
        roughness: 0.4,
        transparent: true,
        opacity: 0.6,
      })
      const hoverSphere = new THREE.Mesh(hoverGeometry, hoverMaterial)
      hoverSphere.name = 'hover-preview'
      hoverSphere.position.set(hoverPosition.x, hoverPosition.z, -hoverPosition.y)
      sceneRef.current.add(hoverSphere)
    }
  }, [isKeyframePlacementMode, hoverPosition])

  // Draw bounding box for random animations
  useEffect(() => {
    if (!sceneRef.current) return

    // Remove old bounding box
    if (boundingBoxRef.current) {
      sceneRef.current.remove(boundingBoxRef.current)
      boundingBoxRef.current.geometry.dispose()
      ;(boundingBoxRef.current.material as THREE.Material).dispose()
      boundingBoxRef.current = null
    }

    // Only draw for random animations
    if (animation?.type !== 'random') return

    const params = animation.parameters
    // Read center and bounds as nested objects
    const center = params?.center || { x: 0, y: 0, z: 0 }
    const bounds = params?.bounds || { x: 3, y: 3, z: 3 }
    
    const centerX = Number(center.x) || 0
    const centerY = Number(center.y) || 0
    const centerZ = Number(center.z) || 0
    const boundsX = Number(bounds.x) || 3
    const boundsY = Number(bounds.y) || 3
    const boundsZ = Number(bounds.z) || 3

    // Create box geometry representing the bounds
    const boxGeometry = new THREE.BoxGeometry(boundsX * 2, boundsZ * 2, boundsY * 2)
    const edges = new THREE.EdgesGeometry(boxGeometry)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xff6b6b,
      linewidth: 2,
      opacity: 0.5,
      transparent: true,
    })
    const boundingBox = new THREE.LineSegments(edges, lineMaterial)
    
    // Position at center (convert Y/Z for Three.js coordinates)
    boundingBox.position.set(centerX, centerZ, -centerY)
    
    sceneRef.current.add(boundingBox)
    boundingBoxRef.current = boundingBox
  }, [animation])

  // Draw animation paths for all tracks with direction indicators
  useEffect(() => {
    if (!animation || !sceneRef.current || tracks.length === 0) return

    const scene = sceneRef.current

    // Remove old paths group
    if (pathLinesRef.current) {
      scene.remove(pathLinesRef.current)
      pathLinesRef.current.traverse((child) => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose()
          ;(child.material as THREE.Material).dispose()
        }
      })
      pathLinesRef.current = null
    }

    // Remove old direction indicators
    const oldIndicators = scene.getObjectByName('direction-indicators')
    if (oldIndicators) {
      scene.remove(oldIndicators)
    }

    try {
      // Create group to hold all paths
      const pathsGroup = new THREE.Group()
      pathsGroup.name = 'animation-paths'
      
      // Colors for different tracks
      const colors = [0x10b981, 0x3b82f6, 0xf59e0b, 0xef4444, 0x8b5cf6, 0xec4899]
      
      // Generate path for each track and store first track's path points for indicators
      let firstTrackPathPoints = generateAnimationPath(animation, 200)
      
      tracks.forEach((track, trackIndex) => {
        // For position-relative mode or each track has its own animation
        const trackAnimation = track.animationState?.animation || animation
        const pathPoints = generateAnimationPath(trackAnimation, 200)
        
        // Store first track's path for direction indicators
        if (trackIndex === 0) {
          firstTrackPathPoints = pathPoints
        }
        
        if (pathPoints.length < 2) return

        // Create line from path points
        const points: THREE.Vector3[] = pathPoints.map(p => 
          new THREE.Vector3(p.position.x, p.position.z, -p.position.y)
        )

        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const color = colors[trackIndex % colors.length]
        const material = new THREE.LineBasicMaterial({
          color,
          linewidth: 2,
          opacity: tracks.length === 1 ? 0.7 : 0.6,
          transparent: true,
        })
        const line = new THREE.Line(geometry, material)
        pathsGroup.add(line)
      })
      
      scene.add(pathsGroup)
      pathLinesRef.current = pathsGroup

      // Add direction indicators for first track
      if (firstTrackPathPoints.length >= 2) {
        const indicators = generateDirectionIndicators(firstTrackPathPoints, 15)
        const indicatorGroup = new THREE.Group()
        indicatorGroup.name = 'direction-indicators'

        indicators.forEach((indicator, index) => {
          // Create small cone pointing in direction of movement
          const coneGeometry = new THREE.ConeGeometry(0.15, 0.4, 8)
          const coneMaterial = new THREE.MeshStandardMaterial({
            color: 0xfbbf24, // Amber color
            metalness: 0.3,
            roughness: 0.5,
          })
          const cone = new THREE.Mesh(coneGeometry, coneMaterial)
          
          // Position cone
          cone.position.set(
            indicator.position.x,
            indicator.position.z,
            -indicator.position.y
          )

          // Orient cone in direction of movement
          const direction = new THREE.Vector3(
            indicator.direction.x,
            indicator.direction.z,
            -indicator.direction.y
          )
          cone.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.normalize()
          )

          indicatorGroup.add(cone)
        })

        scene.add(indicatorGroup)
      }
    } catch (error) {
      console.warn('Failed to generate animation path preview:', error)
    }
  }, [animation, tracks])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Legend */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-2 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-700">Track Position</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span className="text-gray-700">Animation Path</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-gray-700">Keyframes</span>
        </div>
      </div>

      {/* Placement mode indicator */}
      {isKeyframePlacementMode && selectedKeyframeId && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse">
          📍 Click to reposition selected keyframe
        </div>
      )}
      {isKeyframePlacementMode && !selectedKeyframeId && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
          ⚠️ Select a keyframe first (click orange sphere)
        </div>
      )}

      {/* Camera Controls Info */}
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-2 text-xs text-gray-600">
        <div className="font-medium mb-1">Camera Controls:</div>
        <div>🖱️ Left: Rotate</div>
        <div>🖱️ Right: Pan</div>
        <div>🖱️ Wheel: Zoom</div>
      </div>

      {/* Coordinate info - show first track's position */}
      {tracks.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-2 text-xs font-mono">
          <div className="text-gray-500">{tracks.length === 1 ? 'Position:' : `Tracks: ${tracks.length}`}</div>
          {tracks.length === 1 ? (
            <div className="text-gray-900">
              X: {tracks[0].position.x.toFixed(2)} | 
              Y: {tracks[0].position.y.toFixed(2)} | 
              Z: {tracks[0].position.z.toFixed(2)}
            </div>
          ) : (
            <div className="text-gray-600 text-xs mt-1">
              {tracks.slice(0, 3).map(t => t.name).join(', ')}
              {tracks.length > 3 && ` +${tracks.length - 3} more`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to calculate position at specific time
function calculatePositionAtTime(animation: Animation, time: number): { x: number; y: number; z: number } {
  const progress = Math.min(time / animation.duration, 1)
  const params = animation.parameters as any

  switch (animation.type) {
    case 'linear': {
      const start = params.startPosition || { x: 0, y: 0, z: 0 }
      const end = params.endPosition || { x: 0, y: 0, z: 0 }
      return {
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
        z: start.z + (end.z - start.z) * progress,
      }
    }

    case 'circular': {
      const center = params.center || { x: 0, y: 0, z: 0 }
      const radius = params.radius || 3
      const startAngle = ((params.startAngle || 0) * Math.PI) / 180
      const endAngle = ((params.endAngle || 360) * Math.PI) / 180
      const angle = startAngle + (endAngle - startAngle) * progress
      const plane = params.plane || 'xy'

      let x = center.x, y = center.y, z = center.z
      if (plane === 'xy') {
        x += Math.cos(angle) * radius
        y += Math.sin(angle) * radius
      } else if (plane === 'xz') {
        x += Math.cos(angle) * radius
        z += Math.sin(angle) * radius
      } else if (plane === 'yz') {
        y += Math.cos(angle) * radius
        z += Math.sin(angle) * radius
      }
      return { x, y, z }
    }

    case 'elliptical': {
      const centerX = params.centerX || 0
      const centerY = params.centerY || 0
      const centerZ = params.centerZ || 0
      const radiusX = params.radiusX || 4
      const radiusY = params.radiusY || 2
      const radiusZ = params.radiusZ || 0
      const startAngle = ((params.startAngle || 0) * Math.PI) / 180
      const endAngle = ((params.endAngle || 360) * Math.PI) / 180
      const angle = startAngle + (endAngle - startAngle) * progress

      return {
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
        z: centerZ + Math.sin(angle) * radiusZ,
      }
    }

    case 'spiral': {
      const center = params.center || { x: 0, y: 0, z: 0 }
      const startRadius = params.startRadius || 1
      const endRadius = params.endRadius || 5
      const rotations = params.rotations || 3
      const direction = params.direction || 'clockwise'
      const plane = params.plane || 'xy'
      
      const radius = startRadius + (endRadius - startRadius) * progress
      const totalAngle = rotations * 2 * Math.PI
      const angle = (direction === 'clockwise' ? 1 : -1) * totalAngle * progress

      let x = center.x, y = center.y, z = center.z
      if (plane === 'xy') {
        x += Math.cos(angle) * radius
        y += Math.sin(angle) * radius
      } else if (plane === 'xz') {
        x += Math.cos(angle) * radius
        z += Math.sin(angle) * radius
      } else if (plane === 'yz') {
        y += Math.cos(angle) * radius
        z += Math.sin(angle) * radius
      }
      return { x, y, z }
    }

    default:
      return { x: 0, y: 0, z: 0 }
  }
}
