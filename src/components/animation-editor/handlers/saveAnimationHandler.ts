import { Animation, AnimationType, Track, AnimationParameters, Keyframe, Position } from '@/types'
import { checkUserModifiedParameters } from '../utils/parameterModification'
import { calculateBarycenter, calculateOffsets } from '../utils/barycentricCalculations'
import { getMultiTrackStrategy } from '@/animations/strategies/MultiTrackStrategy'

interface SaveAnimationParams {
  animationForm: Partial<Animation>
  keyframes: Keyframe[]
  selectedTrackIds: string[]
  tracks: Track[]
  multiTrackMode: 'relative' | 'barycentric'
  barycentricVariant?: 'shared' | 'isobarycentric' | 'centered' | 'custom'
  customCenter?: Position
  preserveOffsets?: boolean
  phaseOffsetSeconds: number
  currentAnimation: Animation | null
  originalAnimationParams: AnimationParameters | null
  addAnimation: (animation: Animation) => void
  updateAnimation: (id: string, animation: Animation) => void
  updateTrack: (trackId: string, updates: any) => void
  multiTrackParameters?: Record<string, AnimationParameters>
  lockTracks?: boolean
}

export const handleSaveAnimation = ({
  animationForm,
  keyframes,
  selectedTrackIds,
  tracks,
  multiTrackMode,
  barycentricVariant = 'isobarycentric',
  customCenter,
  preserveOffsets,
  phaseOffsetSeconds,
  currentAnimation,
  originalAnimationParams,
  addAnimation,
  updateAnimation,
  updateTrack,
  multiTrackParameters,
  lockTracks = false
}: SaveAnimationParams) => {
  const selectedTracksToApply = selectedTrackIds.length > 0 
    ? selectedTrackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]
    : []
  
  console.log('💾 Save Animation clicked', { 
    hasName: !!animationForm.name, 
    selectedCount: selectedTracksToApply.length,
    multiTrackMode 
  })
  
  if (!animationForm.name || selectedTracksToApply.length === 0) {
    console.warn('⚠️ Cannot save: missing name or no tracks selected')
    alert('Please enter an animation name and select at least one track')
    return
  }

  const animationId = currentAnimation?.id || `anim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  
  const animation: Animation = {
    id: animationId,
    name: animationForm.name || 'Unnamed Animation',
    type: animationForm.type || 'linear',
    duration: animationForm.duration || 10,
    loop: animationForm.loop ?? false,
    pingPong: animationForm.pingPong ?? false,
    parameters: animationForm.parameters || {},
    keyframes: keyframes.length > 0 ? keyframes : undefined,
    coordinateSystem: animationForm.coordinateSystem || { type: 'xyz' },
    multiTrackMode,
    barycentricVariant: multiTrackMode === 'barycentric' ? barycentricVariant : undefined,
    // Save customCenter for all user-defined variants (shared, centered, custom)
    customCenter: multiTrackMode === 'barycentric' && barycentricVariant !== 'isobarycentric' ? customCenter : undefined,
    preserveOffsets: multiTrackMode === 'barycentric' ? preserveOffsets : undefined,
    phaseOffsetSeconds: phaseOffsetSeconds > 0 ? phaseOffsetSeconds : undefined,
    ...(lockTracks && selectedTrackIds.length > 0 && {
      trackIds: selectedTrackIds,
      trackSelectionLocked: true,
      multiTrackParameters
    })
  }

  console.log('💾 Saving animation:', animation)

  if (currentAnimation) {
    updateAnimation(animation.id, animation)
    console.log('✅ Updated existing animation')
  } else {
    addAnimation(animation)
    console.log('✅ Added new animation')
  }

  // Use MultiTrackStrategy to calculate parameters for each track
  const strategy = getMultiTrackStrategy(multiTrackMode)
  
  // Apply animation to tracks using strategy pattern
  selectedTracksToApply.forEach((track, index) => {
    let trackAnimation = { ...animation }
    let initialTime = 0

    if (selectedTracksToApply.length > 1) {
      // Get track parameters using strategy
      const trackParams = strategy.getTrackParameters(
        animation,
        track,
        index,
        selectedTracksToApply,
        barycentricVariant
      )
      
      // Get phase offset using strategy
      initialTime = strategy.getPhaseOffset(index, phaseOffsetSeconds > 0 ? phaseOffsetSeconds : undefined)
      
      // RELATIVE MODE: Each track uses own parameters
      if (multiTrackMode === 'relative') {
        const customParams = multiTrackParameters?.[track.id]
        if (customParams) {
          trackAnimation = {
            ...trackAnimation,
            id: `${animation.id}-${track.id}`,
            parameters: {
              ...customParams,
              ...trackParams
            }
          }
          console.log(`📍 Relative: Track ${track.name} uses custom params`)
        } else {
          trackAnimation = {
            ...trackAnimation,
            id: `${animation.id}-${track.id}`,
            parameters: trackParams
          }
        }
        
        if (phaseOffsetSeconds > 0) {
          console.log(`🔄📍 Relative + Phase: Track ${track.name} at ${initialTime.toFixed(2)}s`)
        }
      }
      
      // BARYCENTRIC MODE: Formation movement
      else if (multiTrackMode === 'barycentric') {
        trackAnimation = {
          ...trackAnimation,
          id: `${animation.id}-${track.id}`,
          parameters: trackParams
        }
        
        if (phaseOffsetSeconds > 0) {
          console.log(`🔄🎯 Barycentric (${barycentricVariant}) + Phase: Track ${track.name} at ${initialTime.toFixed(2)}s`)
        } else {
          console.log(`🎯 Barycentric (${barycentricVariant}): Track ${track.name}`)
        }
      }
    }

    updateTrack(track.id, {
      animationState: {
        animation: trackAnimation,
        isPlaying: false,
        startTime: initialTime
      }
    })
  })

  console.log(`🎯 Applied animation to ${selectedTracksToApply.length} tracks`)
  console.log(`🎉 Animation "${animation.name}" applied to ${selectedTracksToApply.length} track(s)`)
}
