import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Track, Animation, Keyframe, AnimationType, AnimationParameters } from '@/types'
import { generateAnimationPath, generateDirectionIndicators } from '@/utils/pathGeneration'
import { themeColors } from '@/theme'
import { useSettingsStore } from '@/stores/settingsStore'
import { useProjectStore } from '@/stores/projectStore'
import { useAnimationStore } from '@/stores/animationStore'
import { calculateBarycenter } from '@/components/animation-editor/utils/barycentricCalculations'

interface AnimationPreview3DProps {
  tracks: Track[]  // Changed from single track to array of tracks
  animation: Animation | null
  animationType?: AnimationType      // New: for real-time updates
  animationParameters?: AnimationParameters  // New: for real-time updates
  currentTime?: number
  keyframes?: Keyframe[]
  onUpdateKeyframe?: (keyframeId: string, updates: Partial<Keyframe>) => void
  isKeyframePlacementMode?: boolean
  selectedKeyframeId?: string | null
  onSelectKeyframe?: (keyframeId: string | null) => void
  isFormPanelOpen?: boolean
  multiTrackMode?: 'identical' | 'position-relative' | 'phase-offset' | 'phase-offset-relative' | 'isobarycenter' | 'centered'
}

// Theme colors for Three.js scene - integrated with centralized theming system
const getThemeColors = () => {
  // Convert theme color classes to hex values for Three.js
  const convertThemeColorToHex = (colorClass: string): number => {
    // Map common Tailwind colors to hex values
    const colorMap: { [key: string]: string } = {
      'gray-50': '#f9fafb',
      'gray-100': '#f3f4f6',
      'gray-200': '#e5e7eb',
      'gray-300': '#d1d5db',
      'gray-400': '#9ca3af',
      'gray-500': '#6b7280',
      'gray-600': '#4b5563',
      'gray-700': '#374151',
      'gray-800': '#1f2937',
      'gray-900': '#111827',
      'blue-500': '#3b82f6',
      'blue-400': '#60a5fa',
      'green-500': '#10b981',
      'green-400': '#34d399',
      'amber-500': '#f59e0b',
      'amber-400': '#fbbf24',
      'red-500': '#ef4444',
      'red-400': '#f87171',
      'purple-500': '#8b5cf6',
      'purple-400': '#a78bfa',
      'indigo-500': '#6366f1',
      'indigo-400': '#8b5cf6',
      'pink-500': '#ec4899',
      'pink-400': '#f472b6',
      'yellow-500': '#eab308',
      'yellow-400': '#facc15',
    }

    // Extract color name from Tailwind class (e.g., 'bg-blue-500' -> 'blue-500')
    const colorMatch = colorClass.match(/(?:bg-|text-|border-)?([a-z]+-\d+)/)
    if (colorMatch && colorMap[colorMatch[1]]) {
      return parseInt(colorMap[colorMatch[1]].slice(1), 16)
    }

    // Fallback to gray
    return 0x888888
  }

  // Convert theme color to hex using the mapping
  const getHexFromTheme = (themeColor: string): number => {
    // Handle dark mode variants (e.g., 'bg-gray-50 dark:bg-gray-800')
    const isDarkMode = document.documentElement.classList.contains('dark')
    if (isDarkMode && themeColor.includes(' dark:')) {
      const darkVariant = themeColor.split(' dark:')[1].trim()
      return convertThemeColorToHex(darkVariant)
    }
    const primaryColor = themeColor.split(' dark:')[0].trim()
    return convertThemeColorToHex(primaryColor)
  }

  return {
    background: getHexFromTheme(themeColors.background.primary),
    grid: getHexFromTheme(themeColors.text.secondary),
    gridSecondary: getHexFromTheme(themeColors.text.muted),
    accent: getHexFromTheme(themeColors.accent.primary),
    trackColors: [
      getHexFromTheme(themeColors.status.success),    // Green
      getHexFromTheme(themeColors.accent.primary),    // Blue
      getHexFromTheme(themeColors.status.warning),    // Amber
      getHexFromTheme(themeColors.status.error),      // Red
      getHexFromTheme(themeColors.accent.secondary), // Purple
      getHexFromTheme(themeColors.status.info),       // Pink
    ],
    keyframeSelected: getHexFromTheme(themeColors.status.success),
    keyframeUnselected: getHexFromTheme(themeColors.status.warning),
    boundingBox: getHexFromTheme(themeColors.status.error),
    directionIndicator: getHexFromTheme(themeColors.status.warning),
  }
}

export const AnimationPreview3D: React.FC<AnimationPreview3DProps> = ({
  tracks,
  animation,
  animationType,
  animationParameters,
  currentTime = 0,
  keyframes = [],
  onUpdateKeyframe,
  isKeyframePlacementMode = false,
  selectedKeyframeId = null,
  onSelectKeyframe,
  isFormPanelOpen,
  multiTrackMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const trackSpheresRef = useRef<THREE.Group | null>(null)
  const pathLinesRef = useRef<THREE.Group | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const keyframeMarkersRef = useRef<THREE.Group | null>(null)
  const boundingBoxRef = useRef<THREE.LineSegments | null>(null)
  const barycenterSphereRef = useRef<THREE.Mesh | null>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const [themeVersion, setThemeVersion] = useState(0)
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number; z: number } | null>(null)
  const [hoverTrackLabel, setHoverTrackLabel] = useState<{ name: string; x: number; y: number; color: string } | null>(null)

  // Track current theme value
  const currentTheme = useSettingsStore((state) => state.application.theme)

  // Watch for theme changes using useEffect
  useEffect(() => {
    console.log('🎨 Current theme:', currentTheme)
    setThemeVersion(prev => prev + 1)
  }, [currentTheme])

  // Re-initialize scene when theme changes
  useEffect(() => {
    if (!containerRef.current || !sceneRef.current) return

    console.log('🔄 Theme update effect triggered, version:', themeVersion)

    // Use original themeColors object for string-based theme values
    const themeConfig = themeColors

    // Update scene background
    if (sceneRef.current) {
      const themeColorsHex = getThemeColors()
      console.log('🎨 Updating background to:', themeColorsHex.background)
      sceneRef.current.background = new THREE.Color(themeColorsHex.background)
    }

    // Update grid colors
    const gridHelper = sceneRef.current.getObjectByName('grid')
    if (gridHelper instanceof THREE.GridHelper) {
      console.log('🎨 Updating grid colors')
      // Remove old grid and dispose materials
      sceneRef.current.remove(gridHelper)

      // Handle both single material and material array cases
      const materials = gridHelper.material
      if (materials) {
        if (Array.isArray(materials)) {
          materials.forEach(material => material.dispose())
        } else {
          materials.dispose()
        }
      }

      // Create new grid with updated colors
      const themeColorsHex = getThemeColors()
      const newGridHelper = new THREE.GridHelper(20, 20, themeColorsHex.grid, themeColorsHex.gridSecondary)
      newGridHelper.name = 'grid'
      sceneRef.current.add(newGridHelper)
    }

    // Update floor plane color
    const floorPlane = sceneRef.current.getObjectByName('floor')
    if (floorPlane instanceof THREE.Mesh && floorPlane.material instanceof THREE.MeshLambertMaterial) {
      const floorColorHex = themeConfig?.background?.secondary ?
        themeConfig.background.secondary.replace('bg-', '#').replace('dark:bg-', '#').replace('/', '') : '#f9fafb'
      console.log('🎨 Updating floor color to:', floorColorHex)
      floorPlane.material.color.set(floorColorHex)
      floorPlane.material.needsUpdate = true
    }

    // Update lights with theme-based colors
    const ambientLight = sceneRef.current.getObjectByName('ambient-light') as THREE.AmbientLight
    if (ambientLight && themeConfig?.background?.primary) {
      const lightColorHex = themeConfig.background.primary.replace('bg-', '#').replace('dark:bg-', '#').replace('/', '')
      console.log('🎨 Updating ambient light to:', lightColorHex)
      ambientLight.color.set(lightColorHex)
    }

    const directionalLight = sceneRef.current.getObjectByName('directional-light') as THREE.DirectionalLight
    if (directionalLight && themeConfig?.background?.primary) {
      const lightColorHex = themeConfig.background.primary.replace('bg-', '#').replace('dark:bg-', '#').replace('/', '')
      console.log('🎨 Updating directional light to:', lightColorHex)
      directionalLight.color.set(lightColorHex)
    }
  }, [themeVersion])
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    const themeColorsHex = getThemeColors()  // Get hex colors for Three.js
    scene.background = new THREE.Color(themeColorsHex.background)
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

    // Grid with theme colors
    const gridHelper = new THREE.GridHelper(20, 20, themeColorsHex.grid, themeColorsHex.gridSecondary)
    gridHelper.name = 'grid'
    scene.add(gridHelper)

    // Axes helper
    const axesHelper = new THREE.AxesHelper(10)
    scene.add(axesHelper)

    // Ambient light - use theme-based color temperature
    const ambientColor = themeColors?.background?.primary ?
      themeColors.background.primary.replace('bg-', '#').replace('dark:bg-', '#').replace('/', '') : '#f5f5f5'
    console.log('💡 Initial ambient light color:', ambientColor)
    const ambientLight = new THREE.AmbientLight(ambientColor, 0.6)
    ambientLight.name = 'ambient-light'
    scene.add(ambientLight)

    // Directional light - use theme-based color temperature
    const directionalColor = themeColors?.background?.primary ?
      themeColors.background.primary.replace('bg-', '#').replace('dark:bg-', '#').replace('/', '') : '#f5f5f5'
    console.log('💡 Initial directional light color:', directionalColor)
    const directionalLight = new THREE.DirectionalLight(directionalColor, 0.8)
    directionalLight.name = 'directional-light'
    directionalLight.position.set(10, 10, 5)
    scene.add(directionalLight)

    // Track spheres group
    const trackSpheresGroup = new THREE.Group()
    trackSpheresGroup.name = 'track-spheres'
    scene.add(trackSpheresGroup)
    trackSpheresRef.current = trackSpheresGroup

    // Keyframe markers group
    const keyframeGroup = new THREE.Group()
    scene.add(keyframeGroup)
    keyframeMarkersRef.current = keyframeGroup

    // Floor plane with theme-based styling
    const floorGeometry = new THREE.PlaneGeometry(50, 50)
    floorGeometry.rotateX(-Math.PI / 2)
    const floorColorHex = themeColors?.background?.secondary ?
      themeColors.background.secondary.replace('bg-', '#').replace('dark:bg-', '#').replace('/', '') : '#f9fafb'
    const floorMaterial = new THREE.MeshLambertMaterial({
      color: floorColorHex,
      transparent: true,
      opacity: 0.3
    })
    const floorPlane = new THREE.Mesh(floorGeometry, floorMaterial)
    floorPlane.position.y = -0.01 // Slightly below grid to avoid z-fighting
    floorPlane.name = 'floor'
    scene.add(floorPlane)

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

    // Mouse move handler: show track name tooltip and keyframe placement hover
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Raycast for track hover (independent of placement mode)
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      if (trackSpheresRef.current) {
        const intersectsTracks = raycasterRef.current.intersectObjects(trackSpheresRef.current.children, false)
        if (intersectsTracks.length > 0) {
          const obj = intersectsTracks[0].object as THREE.Object3D & { userData?: any }
          const trackId = obj.userData?.trackId as string | undefined
          if (trackId) {
            const track = useProjectStore.getState().tracks.find(t => t.id === trackId)
            // Compute CSS color from track color or material color
            let cssColor = '#ffffff'
            if (track?.color) {
              const r = Math.round(track.color.r * 255).toString(16).padStart(2, '0')
              const g = Math.round(track.color.g * 255).toString(16).padStart(2, '0')
              const b = Math.round(track.color.b * 255).toString(16).padStart(2, '0')
              cssColor = `#${r}${g}${b}`
            } else if ((intersectsTracks[0].object as any).material?.color) {
              const c = (intersectsTracks[0].object as any).material.color as THREE.Color
              cssColor = `#${c.getHexString()}`
            }
            setHoverTrackLabel({ name: track?.name || '', x: event.clientX - rect.left + 8, y: event.clientY - rect.top + 8, color: cssColor })
            renderer.domElement.title = '' // use custom tooltip instead of native
          }
        } else {
          renderer.domElement.title = ''
          setHoverTrackLabel(null)
        }
      }

      // Keyframe placement hover preview
      if (!isKeyframePlacementMode) {
        setHoverPosition(null)
        return
      }

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

    // Cleanup
    return () => {
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

  useEffect(() => {
    if (!isFormPanelOpen && isFormPanelOpen !== false) return

    const container = containerRef.current
    const renderer = rendererRef.current
    const camera = cameraRef.current

    if (!container || !renderer || !camera) return

    const width = container.clientWidth
    const height = container.clientHeight || 1

    if (width === 0 || height === 0) return

    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }, [isFormPanelOpen])

  useEffect(() => {
    const container = containerRef.current
    const renderer = rendererRef.current
    const camera = cameraRef.current

    if (!container || !renderer || !camera) return

    const resizeRenderer = () => {
      const width = container.clientWidth
      const height = container.clientHeight || 1

      if (width === 0 || height === 0) return

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    resizeRenderer()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => resizeRenderer())
      observer.observe(container)

      return () => observer.disconnect()
    }

    window.addEventListener('resize', resizeRenderer)
    return () => window.removeEventListener('resize', resizeRenderer)
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
    
    // Colors matching the path colors - fallback for tracks without device colors
    const fallbackColors = [0x10b981, 0x3b82f6, 0xf59e0b, 0xef4444, 0x8b5cf6, 0xec4899]
    
    // Create sphere for each track
    tracks.forEach((track, index) => {
      const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32)
      
      // Use track color if available, otherwise use fallback color
      const color = track.color 
        ? (track.color.r * 0xFF) << 16 | (track.color.g * 0xFF) << 8 | (track.color.b * 0xFF)
        : fallbackColors[index % fallbackColors.length]
        
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
      trackSphere.userData.trackId = track.id // Store track ID for animation loop
      
      spheresGroup.add(trackSphere)
    })
  }, [tracks])

  // Animation loop for smooth 60 FPS track position updates
  useEffect(() => {
    if (!trackSpheresRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return

    let animationFrameId: number
    
    const animate = () => {
      // Update track sphere positions from live store data (bypassing React re-renders)
      const currentTracks = useProjectStore.getState().tracks
      const isPlaying = useAnimationStore.getState().isPlaying
      
      // Only update if animation is playing
      if (isPlaying && trackSpheresRef.current) {
        trackSpheresRef.current.children.forEach((sphere) => {
          if (sphere instanceof THREE.Mesh && sphere.userData.trackId) {
            const track = currentTracks.find(t => t.id === sphere.userData.trackId)
            if (track) {
              // Smoothly update position
              sphere.position.set(track.position.x, track.position.z, -track.position.y)
            }
          }
        })
      }
      
      // DON'T render here - the main animation loop (lines 364-368) already renders
      // Rendering twice per frame was causing 76ms frame times
      
      animationFrameId = requestAnimationFrame(animate)
    }
    
    animationFrameId = requestAnimationFrame(animate)
    
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [tracks.length]) // Only re-create loop when track count changes

  // Display barycenter in isobarycenter mode
  useEffect(() => {
    if (!sceneRef.current) return

    // Remove existing barycenter sphere
    if (barycenterSphereRef.current) {
      sceneRef.current.remove(barycenterSphereRef.current)
      barycenterSphereRef.current.geometry.dispose()
      if (Array.isArray(barycenterSphereRef.current.material)) {
        barycenterSphereRef.current.material.forEach(m => m.dispose())
      } else {
        barycenterSphereRef.current.material.dispose()
      }
      barycenterSphereRef.current = null
    }

    // Only show barycenter in isobarycenter mode with multiple tracks
    if (multiTrackMode === 'isobarycenter' && tracks.length > 1) {
      const barycenter = calculateBarycenter(tracks)
      
      // Create distinctive barycenter sphere (larger, special color)
      const geometry = new THREE.SphereGeometry(0.7, 32, 32)
      const material = new THREE.MeshStandardMaterial({
        color: 0xffaa00, // Orange/gold color for barycenter
        metalness: 0.5,
        roughness: 0.3,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3,
      })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(barycenter.x, barycenter.z, -barycenter.y)
      sphere.name = 'barycenter'
      
      // Add glowing ring around barycenter
      const ringGeometry = new THREE.RingGeometry(0.8, 1.0, 32)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = -Math.PI / 2
      sphere.add(ring)
      
      sceneRef.current.add(sphere)
      barycenterSphereRef.current = sphere
    }
  }, [multiTrackMode, tracks])

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

  // Build a preview animation object from live type/parameters for path generation
  const previewAnimation = React.useMemo(() => {
    if (animationType && animationParameters) {
      return {
        id: 'preview-animation',
        name: 'Preview Animation',
        type: animationType,
        duration: animation?.duration ?? 10,
        loop: animation?.loop ?? true,
        pingPong: animation?.pingPong ?? false,
        parameters: animationParameters,
        coordinateSystem: animation?.coordinateSystem ?? { type: 'xyz' }
      } as Animation
    }

    return animation
  }, [animation, animationType, animationParameters])

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
    if (!previewAnimation || previewAnimation.type !== 'random') return

    const params = previewAnimation.parameters
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
  }, [previewAnimation])

  // Generate animation path for current animation using shared utilities - reactive to parameter changes
  // Reduced resolution for better multi-track performance (100 points is sufficient for preview)
  const animationPath = React.useMemo(() => {
    if (!previewAnimation) return []
    return generateAnimationPath(previewAnimation, 100)
  }, [previewAnimation])

  // Draw animation paths for all tracks with direction indicators
  useEffect(() => {
    if (!previewAnimation || !sceneRef.current || tracks.length === 0) return

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
      
      // Colors for different tracks - fallback for tracks without device colors
      const fallbackColors = [0x10b981, 0x3b82f6, 0xf59e0b, 0xef4444, 0x8b5cf6, 0xec4899]
      
      // Generate path for each track and store first track's path points for indicators
      let firstTrackPathPoints = animationPath
      
      tracks.forEach((track, trackIndex) => {
        let trackAnimation = track.animationState?.animation

        const shouldForcePreview = trackIndex === 0 || !trackAnimation

        if (trackAnimation && shouldForcePreview) {
          trackAnimation = {
            ...trackAnimation,
            type: previewAnimation.type,
            duration: previewAnimation.duration,
            loop: previewAnimation.loop,
            pingPong: previewAnimation.pingPong,
            parameters: previewAnimation.parameters,
            coordinateSystem: previewAnimation.coordinateSystem ?? trackAnimation.coordinateSystem
          }
        }

        if (!trackAnimation) {
          trackAnimation = previewAnimation
        }

        // Reduced resolution for better multi-track performance
        const pathPoints = generateAnimationPath(trackAnimation, 100)
        
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
        
        // Use track color if available, otherwise use fallback color
        const color = track.color 
          ? (track.color.r * 0xFF) << 16 | (track.color.g * 0xFF) << 8 | (track.color.b * 0xFF)
          : fallbackColors[trackIndex % fallbackColors.length]
          
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
  }, [animation, tracks, animationPath])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {hoverTrackLabel && (
        <div
          className="absolute text-xs select-none"
          style={{ left: hoverTrackLabel.x, top: hoverTrackLabel.y, color: hoverTrackLabel.color, pointerEvents: 'none', background: 'transparent', border: 'none' }}
        >
          {hoverTrackLabel.name}
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute top-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm p-2 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400"></div>
          <span className="text-gray-700 dark:text-gray-300">Track Position</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-0.5 bg-green-500 dark:bg-green-400"></div>
          <span className="text-gray-700 dark:text-gray-300">Animation Path</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 dark:bg-amber-400"></div>
          <span className="text-gray-700 dark:text-gray-300">Keyframes</span>
        </div>
      </div>

      {/* Placement mode indicator */}
      {isKeyframePlacementMode && selectedKeyframeId && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-green-500 dark:bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse">
          📍 Click to reposition selected keyframe
        </div>
      )}
      {isKeyframePlacementMode && !selectedKeyframeId && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-500 dark:bg-amber-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
          ⚠️ Select a keyframe first (click orange sphere)
        </div>
      )}

      {/* Camera Controls Info */}
      <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm p-2 text-xs text-gray-600 dark:text-gray-400">
        <div className="font-medium mb-1">Camera Controls:</div>
        <div>🖱️ Left: Rotate</div>
        <div>🖱️ Right: Pan</div>
        <div>🖱️ Wheel: Zoom</div>
      </div>

      {/* Coordinate info - show first track's position */}
      {tracks.length > 0 && (
        <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm p-2 text-xs font-mono">
          <div className="text-gray-500 dark:text-gray-400">{tracks.length === 1 ? 'Position:' : `Tracks: ${tracks.length}`}</div>
          {tracks.length === 1 ? (
            <div className="text-gray-900 dark:text-gray-100">
              X: {tracks[0].position.x.toFixed(2)} | 
              Y: {tracks[0].position.y.toFixed(2)} | 
              Z: {tracks[0].position.z.toFixed(2)}
            </div>
          ) : (
            <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
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
