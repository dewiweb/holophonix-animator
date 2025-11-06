import { Animation, AnimationType, Track, AnimationParameters, Keyframe } from '@/types'
import { checkUserModifiedParameters } from '../utils/parameterModification'
import { calculateBarycenter, calculateOffsets } from '../utils/barycentricCalculations'

interface SaveAnimationParams {
  animationForm: Partial<Animation>
  keyframes: Keyframe[]
  selectedTrackIds: string[]
  tracks: Track[]
  multiTrackMode: 'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative' | 'isobarycenter' | 'centered'
  phaseOffsetSeconds: number
  centerPoint?: { x: number; y: number; z: number }
  currentAnimation: Animation | null
  originalAnimationParams: AnimationParameters | null
  addAnimation: (animation: Animation) => void
  updateAnimation: (id: string, animation: Animation) => void
  updateTrack: (trackId: string, updates: any) => void
  multiTrackParameters?: Record<string, AnimationParameters>
  lockTracks?: boolean  // NEW: If true, save trackIds with animation
}

export const handleSaveAnimation = ({
  animationForm,
  keyframes,
  selectedTrackIds,
  tracks,
  multiTrackMode,
  phaseOffsetSeconds,
  centerPoint = { x: 0, y: 0, z: 0 },
  currentAnimation,
  originalAnimationParams,
  addAnimation,
  updateAnimation,
  updateTrack,
  multiTrackParameters,
  lockTracks = false  // NEW: Default to unlocked
}: SaveAnimationParams) => {
  // Preserve selection order for phase-offset mode
  const selectedTracksToApply = selectedTrackIds.length > 0 
    ? selectedTrackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]
    : []
  
  console.log('💾 Save Animation clicked', { 
    hasName: !!animationForm.name, 
    selectedCount: selectedTracksToApply.length,
    form: animationForm 
  })
  
  if (!animationForm.name || selectedTracksToApply.length === 0) {
    console.warn('⚠️ Cannot save: missing name or no tracks selected')
    alert('Please enter an animation name and select at least one track')
    return
  }

  // Prepare parameters based on animation type
  let parameters = animationForm.parameters || {}
  
  // For custom animations, store keyframes
  if (animationForm.type === 'custom' && keyframes.length > 0) {
    parameters = { ...parameters, keyframes }
  }
  
  // Random animation waypoints are now handled internally by the random model

  // Generate a new ID only if we're creating a new animation
  const animationId = currentAnimation?.id || `anim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  
  // Clean up old multi-track parameters before setting new ones
  const cleanedParameters = { ...animationForm.parameters }
  delete cleanedParameters._multiTrackMode
  delete cleanedParameters._isobarycenter
  delete cleanedParameters._trackOffset
  delete cleanedParameters._centeredPoint
  
  const animation: Animation = {
    id: animationId,
    name: animationForm.name || 'Unnamed Animation',
    type: animationForm.type || 'linear',
    duration: animationForm.duration || 10,
    loop: animationForm.loop ?? false,
    pingPong: animationForm.pingPong ?? false,
    parameters: {
      ...cleanedParameters,
      // Store multi-track mode for OSC optimization
      _multiTrackMode: multiTrackMode
    },
    keyframes: keyframes.length > 0 ? keyframes : undefined,
    coordinateSystem: animationForm.coordinateSystem || { type: 'xyz' },
    // Track locking (NEW)
    ...(lockTracks && selectedTrackIds.length > 0 && {
      trackIds: selectedTrackIds,
      trackSelectionLocked: true,
      multiTrackMode,
      multiTrackParameters
    })
  }

  console.log(' Saving animation:', animation)

  if (currentAnimation) {
    updateAnimation(animation.id, animation)
    console.log('✏️ Updated existing animation')
  } else {
    addAnimation(animation)
    console.log('➕ Added new animation')
  }

  // For isobarycenter mode, calculate and store barycenter data
  let barycentricData: { barycenter: any; offsets: Record<string, any> } | undefined
  if (multiTrackMode === 'isobarycenter' && selectedTracksToApply.length > 1) {
    const barycenter = calculateBarycenter(selectedTracksToApply)
    const offsets = calculateOffsets(selectedTracksToApply, barycenter)
    barycentricData = { barycenter, offsets }
    console.log(`🎯 Isobarycenter mode: barycenter at (${barycenter.x.toFixed(2)}, ${barycenter.y.toFixed(2)}, ${barycenter.z.toFixed(2)})`)
    console.log(`🎯 Calculated offsets for ${Object.keys(offsets).length} tracks`)
  }

  // For centered mode, calculate offsets from user-defined center point
  let centeredData: { centerPoint: any; offsets: Record<string, any> } | undefined
  if (multiTrackMode === 'centered' && selectedTracksToApply.length > 1 && centerPoint) {
    const offsets = calculateOffsets(selectedTracksToApply, centerPoint)
    centeredData = { centerPoint, offsets }
    console.log(`⭕ Centered mode: center at (${centerPoint.x.toFixed(2)}, ${centerPoint.y.toFixed(2)}, ${centerPoint.z.toFixed(2)})`)
    console.log(`⭕ Calculated offsets for ${Object.keys(offsets).length} tracks`)
  }

  // Apply animation to ALL selected tracks based on multi-track mode
  selectedTracksToApply.forEach((track, index) => {
    let trackAnimation = { ...animation }
    let initialTime = 0

    // Apply different strategies based on multi-track mode
    if (selectedTracksToApply.length > 1) {
      switch (multiTrackMode) {
        case 'phase-offset':
          // Stagger start times by phase offset
          initialTime = index * phaseOffsetSeconds
          console.log(`🔄 Track ${track.name} (index ${index}): phase offset = ${phaseOffsetSeconds}s x ${index} = ${initialTime}s`)
          // Ensure multiTrackMode is set in parameters
          trackAnimation = {
            ...trackAnimation,
            parameters: {
              ...trackAnimation.parameters,
              _multiTrackMode: multiTrackMode
            }
          }
          break

        case 'phase-offset-relative':
          // Combine both: phase offset timing + position-relative paths
          initialTime = index * phaseOffsetSeconds
          console.log(`🔄📍 Track ${track.name} (index ${index}): phase offset = ${phaseOffsetSeconds}s x ${index} = ${initialTime}s + relative position`)
          // Fall through to position-relative logic

        case 'position-relative':
          // Use per-track parameters if available, otherwise adjust to track's position
          if (trackAnimation.parameters) {
            const trackPos = track.position
            let updatedParams: any

            // Use per-track parameters if they exist
            if (multiTrackParameters && multiTrackParameters[track.id]) {
              updatedParams = { ...multiTrackParameters[track.id] }
              console.log(`📍 Track ${track.name}: using custom parameters`)
            } else {
              // Fallback: auto-adjust to track position
              updatedParams = { ...trackAnimation.parameters }
              const userModifiedParams = checkUserModifiedParameters(
                animation.type,
                updatedParams,
                originalAnimationParams,
                track.initialPosition || track.position
              )
              applyPositionRelativeParameters(
                animation.type,
                updatedParams,
                trackPos,
                userModifiedParams,
                animation.parameters,
                animation.duration
              )
              console.log(`📍 Track ${track.name}: auto-centered at (${trackPos.x.toFixed(2)}, ${trackPos.y.toFixed(2)}, ${trackPos.z.toFixed(2)})`)
            }

            trackAnimation = {
              ...trackAnimation,
              id: `${animation.id}-${track.id}`, // Unique ID per track
              parameters: {
                ...updatedParams,
                // CRITICAL: Preserve _multiTrackMode so OSC optimizer knows this is position-relative
                _multiTrackMode: multiTrackMode
              }
            }
          }
          break

        case 'isobarycenter':
          // Store barycentric data in the animation for the animation engine to use
          if (barycentricData) {
            trackAnimation = {
              ...trackAnimation,
              id: `${animation.id}-${track.id}`,
              parameters: {
                ...trackAnimation.parameters,
                // Store barycenter and offset for this specific track
                _isobarycenter: barycentricData.barycenter,
                _trackOffset: barycentricData.offsets[track.id],
                _multiTrackMode: multiTrackMode  // Explicitly preserve mode
              }
            }
            console.log(`🎯 Track ${track.name}: formation mode with offset (${barycentricData.offsets[track.id].x.toFixed(2)}, ${barycentricData.offsets[track.id].y.toFixed(2)}, ${barycentricData.offsets[track.id].z.toFixed(2)})`)
          }
          break

        case 'centered':
          // All tracks animate around a user-defined center point with offsets
          if (centeredData) {
            trackAnimation = {
              ...trackAnimation,
              id: `${animation.id}-${track.id}`,
              parameters: {
                ...trackAnimation.parameters,
                // Store center point and offset for this specific track
                _centeredPoint: centeredData.centerPoint,
                _trackOffset: centeredData.offsets[track.id],
                _multiTrackMode: multiTrackMode  // Explicitly preserve mode
              }
            }
            console.log(`⭕ Track ${track.name}: centered mode with offset (${centeredData.offsets[track.id].x.toFixed(2)}, ${centeredData.offsets[track.id].y.toFixed(2)}, ${centeredData.offsets[track.id].z.toFixed(2)})`)
          }
          break

        case 'identical':
        default:
          // All tracks get identical animation
          console.log(`🔁 Track ${track.name}: identical animation`)
          // Ensure multiTrackMode is set in parameters
          trackAnimation = {
            ...trackAnimation,
            parameters: {
              ...trackAnimation.parameters,
              _multiTrackMode: multiTrackMode
            }
          }
          break
      }
    } else {
      // Single track case - ensure multiTrackMode is still set for consistency
      trackAnimation = {
        ...trackAnimation,
        parameters: {
          ...trackAnimation.parameters,
          _multiTrackMode: multiTrackMode
        }
      }
    }

    updateTrack(track.id, {
      animationState: {
        animation: trackAnimation,
        isPlaying: false,
        currentTime: initialTime,
        playbackSpeed: 1,
        loop: animation.loop
      }
    })
    console.log(`✅ Animation applied to track: ${track.name} (${track.id})`)
  })
  
  console.log(`🎉 Animation "${animation.name}" applied to ${selectedTracksToApply.length} track(s)`)
}

/**
 * Apply user-defined center point to animation parameters based on animation type
 */
const applyCenterPointToParameters = (
  type: AnimationType,
  params: any,
  centerPoint: { x: number; y: number; z: number }
) => {
  switch (type) {
    case 'circular':
    case 'spiral':
    case 'random':
    case 'wave':
    case 'lissajous':
    case 'orbit':
    case 'rose-curve':
    case 'epicycloid':
    case 'circular-scan':
    case 'helix':
      params.center = { ...centerPoint }
      break
      
    case 'elliptical':
      params.centerX = centerPoint.x
      params.centerY = centerPoint.y
      params.centerZ = centerPoint.z
      break
      
    case 'zoom':
      params.zoomCenter = { ...centerPoint }
      break
      
    case 'attract-repel':
      params.targetPosition = { ...centerPoint }
      break
  }
}

const applyPositionRelativeParameters = (
  animationType: AnimationType,
  updatedParams: any,
  trackPos: any,
  userModifiedParams: Record<string, boolean>,
  originalParams: any,
  duration: number
) => {
  switch (animationType) {
    case 'linear':
    case 'zigzag':
    case 'doppler':
      if (!userModifiedParams.startPosition) {
        updatedParams.startPosition = { ...trackPos }
      }
      // For end position, check if it was modified relative to the original start position
      if (!userModifiedParams.endPosition && updatedParams.startPosition) {
        const originalStart = originalParams?.startPosition || trackPos
        const originalEnd = originalParams?.endPosition
        if (originalEnd) {
          const offset = {
            x: originalEnd.x - originalStart.x,
            y: originalEnd.y - originalStart.y,
            z: originalEnd.z - originalStart.z
          }
          updatedParams.endPosition = {
            x: trackPos.x + offset.x,
            y: trackPos.y + offset.y,
            z: trackPos.z + offset.z
          }
        }
      }
      break

    case 'circular':
    case 'spiral':
    case 'wave':
    case 'lissajous':
    case 'orbit':
    case 'rose-curve':
    case 'epicycloid':
    case 'circular-scan':
    case 'perlin-noise':
      if (!userModifiedParams.center) {
        updatedParams.center = { ...trackPos }
      }
      break

    case 'elliptical':
      if (!userModifiedParams.centerX && !userModifiedParams.centerY && !userModifiedParams.centerZ) {
        updatedParams.centerX = trackPos.x
        updatedParams.centerY = trackPos.y
        updatedParams.centerZ = trackPos.z
      }
      break

    case 'pendulum':
      if (!userModifiedParams.anchorPoint) {
        updatedParams.anchorPoint = { ...trackPos }
      }
      break

    case 'spring':
      if (!userModifiedParams.restPosition) {
        updatedParams.restPosition = { ...trackPos }
      }
      break

    case 'bounce':
      if (!userModifiedParams.groundLevel) {
        updatedParams.groundLevel = trackPos.y
      }
      break

    case 'attract-repel':
      if (!userModifiedParams.targetPosition) {
        updatedParams.targetPosition = { ...trackPos }
      }
      break

    case 'zoom':
      if (!userModifiedParams.zoomCenter) {
        updatedParams.zoomCenter = { ...trackPos }
      }
      break

    case 'helix':
      // Helix uses axisStart and axisEnd - center the axis at track position
      if (!userModifiedParams.axisStart && !userModifiedParams.axisEnd) {
        const originalAxisStart = originalParams?.axisStart || { x: 0, y: -5, z: 0 }
        const originalAxisEnd = originalParams?.axisEnd || { x: 0, y: 5, z: 0 }
        
        // Calculate original axis center
        const originalCenter = {
          x: (originalAxisStart.x + originalAxisEnd.x) / 2,
          y: (originalAxisStart.y + originalAxisEnd.y) / 2,
          z: (originalAxisStart.z + originalAxisEnd.z) / 2
        }
        
        // Calculate offset from original center to track position
        const offset = {
          x: trackPos.x - originalCenter.x,
          y: trackPos.y - originalCenter.y,
          z: trackPos.z - originalCenter.z
        }
        
        // Apply offset to both axis points
        updatedParams.axisStart = {
          x: originalAxisStart.x + offset.x,
          y: originalAxisStart.y + offset.y,
          z: originalAxisStart.z + offset.z
        }
        updatedParams.axisEnd = {
          x: originalAxisEnd.x + offset.x,
          y: originalAxisEnd.y + offset.y,
          z: originalAxisEnd.z + offset.z
        }
        console.log(`🌀 Track helix: axis centered at (${trackPos.x.toFixed(2)}, ${trackPos.y.toFixed(2)}, ${trackPos.z.toFixed(2)})`)
      }
      break

    case 'random':
      // Random waypoints generated internally by model
      if (!userModifiedParams.center) {
        updatedParams.center = { ...trackPos }
      }
      break

    case 'catmull-rom':
    case 'bezier':
      // Translate control points to be relative to track position
      if (!userModifiedParams.controlPoints) {
        const originalPoints = originalParams?.controlPoints || []
        if (originalPoints.length > 0) {
          // Calculate centroid of original control points
          const centroid = {
            x: originalPoints.reduce((sum: number, p: any) => sum + (p?.x || 0), 0) / originalPoints.length,
            y: originalPoints.reduce((sum: number, p: any) => sum + (p?.y || 0), 0) / originalPoints.length,
            z: originalPoints.reduce((sum: number, p: any) => sum + (p?.z || 0), 0) / originalPoints.length
          }
          
          // Translate all points to center on track position
          const offset = {
            x: trackPos.x - centroid.x,
            y: trackPos.y - centroid.y,
            z: trackPos.z - centroid.z
          }
          
          updatedParams.controlPoints = originalPoints.map((p: any) => ({
            x: (p?.x || 0) + offset.x,
            y: (p?.y || 0) + offset.y,
            z: (p?.z || 0) + offset.z
          }))
          console.log(`🎢 Track ${animationType}: control points centered at (${trackPos.x.toFixed(2)}, ${trackPos.y.toFixed(2)}, ${trackPos.z.toFixed(2)})`)
        }
      }
      break
  }
}
