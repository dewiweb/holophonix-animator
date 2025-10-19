import { Animation, AnimationType, Track, AnimationParameters, Keyframe } from '@/types'
import { generateRandomWaypoints } from '@/utils/animations/basicAnimations'
import { checkUserModifiedParameters } from '../utils/parameterModification'
import { calculateBarycenter, calculateOffsets } from '../utils/barycentricCalculations'

interface SaveAnimationParams {
  animationForm: Partial<Animation>
  keyframes: Keyframe[]
  selectedTrackIds: string[]
  tracks: Track[]
  multiTrackMode: 'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative' | 'isobarycenter'
  phaseOffsetSeconds: number
  currentAnimation: Animation | null
  originalAnimationParams: AnimationParameters | null
  addAnimation: (animation: Animation) => void
  updateAnimation: (id: string, animation: Animation) => void
  updateTrack: (trackId: string, updates: any) => void
  multiTrackParameters?: Record<string, AnimationParameters>
}

export const handleSaveAnimation = ({
  animationForm,
  keyframes,
  selectedTrackIds,
  tracks,
  multiTrackMode,
  phaseOffsetSeconds,
  currentAnimation,
  originalAnimationParams,
  addAnimation,
  updateAnimation,
  updateTrack,
  multiTrackParameters
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
  
  // For random animations, generate and store waypoints once
  if (animationForm.type === 'random') {
    const center = parameters.center || { x: 0, y: 0, z: 0 }
    const bounds = parameters.bounds || { x: 5, y: 5, z: 5 }
    const updateFrequency = Number(parameters.updateFrequency) || 2
    const randomWaypoints = generateRandomWaypoints(center, bounds, animationForm.duration || 10, updateFrequency)
    parameters = { ...parameters, randomWaypoints }
    console.log(`🎲 Generated ${randomWaypoints.length} random waypoints`)
  }

  const animation: Animation = {
    id: currentAnimation?.id || `animation-${Date.now()}`,
    name: animationForm.name,
    type: animationForm.type || 'linear',
    duration: animationForm.duration || 10,
    loop: animationForm.loop || false,
    pingPong: animationForm.pingPong || false,
    parameters,
    keyframes: keyframes.length > 0 ? keyframes : undefined,
    coordinateSystem: animationForm.coordinateSystem || { type: 'xyz' }
  }

  console.log('💾 Saving animation:', animation)

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
          console.log(`🔄 Track ${track.name}: phase offset ${initialTime}s`)
          break

        case 'phase-offset-relative':
          // Combine both: phase offset timing + position-relative paths
          initialTime = index * phaseOffsetSeconds
          console.log(`🔄📍 Track ${track.name}: phase offset ${initialTime}s + relative position`)
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
              parameters: updatedParams
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
                _trackOffset: barycentricData.offsets[track.id]
              }
            }
            console.log(`🎯 Track ${track.name}: formation mode with offset (${barycentricData.offsets[track.id].x.toFixed(2)}, ${barycentricData.offsets[track.id].y.toFixed(2)}, ${barycentricData.offsets[track.id].z.toFixed(2)})`)
          }
          break

        case 'identical':
        default:
          // All tracks get identical animation
          console.log(`🔁 Track ${track.name}: identical animation`)
          break
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
    case 'bezier':
    case 'catmull-rom':
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
      if (!userModifiedParams.axisStart) {
        updatedParams.axisStart = { ...trackPos }
        // Keep axisEnd offset from start
        if (updatedParams.axisEnd) {
          const originalStart = originalParams?.axisStart || { x: 0, y: 0, z: 0 }
          const originalEnd = originalParams?.axisEnd || { x: 0, y: 10, z: 0 }
          const offset = {
            x: originalEnd.x - originalStart.x,
            y: originalEnd.y - originalStart.y,
            z: originalEnd.z - originalStart.z
          }
          updatedParams.axisEnd = {
            x: trackPos.x + offset.x,
            y: trackPos.y + offset.y,
            z: trackPos.z + offset.z
          }
        }
      }
      break

    case 'random':
      // For random animation, regenerate waypoints centered at each track's position
      if (!userModifiedParams.center) {
        updatedParams.center = { ...trackPos }
        const bounds = updatedParams.bounds || { x: 5, y: 5, z: 5 }
        const updateFrequency = Number(updatedParams.updateFrequency) || 2
        updatedParams.randomWaypoints = generateRandomWaypoints(trackPos, bounds, duration, updateFrequency)
        console.log(`🎲 Track: generated ${updatedParams.randomWaypoints.length} waypoints at (${trackPos.x.toFixed(1)}, ${trackPos.y.toFixed(1)}, ${trackPos.z.toFixed(1)})`)
      }
      break
  }
}
