import { Animation, AnimationType, Track, AnimationParameters, Keyframe } from '@/types'
import { checkUserModifiedParameters } from '../utils/parameterModification'
import { calculateBarycenter, calculateOffsets } from '../utils/barycentricCalculations'

interface SaveAnimationParams {
  animationForm: Partial<Animation>
  keyframes: Keyframe[]
  selectedTrackIds: string[]
  tracks: Track[]
  multiTrackMode: 'shared' | 'relative' | 'formation'
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

  // For formation mode, calculate barycenter
  let barycentricData: { barycenter: any; offsets: Record<string, any> } | undefined
  if (multiTrackMode === 'formation' && selectedTracksToApply.length > 1) {
    const barycenter = calculateBarycenter(selectedTracksToApply)
    const offsets = calculateOffsets(selectedTracksToApply, barycenter)
    barycentricData = { barycenter, offsets }
    console.log(`🎯 Formation mode: barycenter at (${barycenter.x.toFixed(2)}, ${barycenter.y.toFixed(2)}, ${barycenter.z.toFixed(2)})`)
  }

  // Apply animation to tracks based on new 3-mode system
  selectedTracksToApply.forEach((track, index) => {
    let trackAnimation = { ...animation }
    let initialTime = 0

    if (selectedTracksToApply.length > 1) {
      // SHARED MODE: All tracks use same parameters
      if (multiTrackMode === 'shared') {
        // Apply phase offset if set
        if (phaseOffsetSeconds > 0) {
          initialTime = index * phaseOffsetSeconds
          console.log(`🔄 Shared + Phase: Track ${track.name} starts at ${initialTime.toFixed(2)}s`)
        } else {
          console.log(`🔁 Shared: Track ${track.name} - identical animation`)
        }
      }
      
      // RELATIVE MODE: Each track uses own parameters
      else if (multiTrackMode === 'relative') {
        const trackParams = multiTrackParameters?.[track.id]
        if (trackParams) {
          trackAnimation = {
            ...trackAnimation,
            id: `${animation.id}-${track.id}`,
            parameters: {
              ...trackParams,
              _trackOffset: track.position
            }
          }
          console.log(`📍 Relative: Track ${track.name} uses custom params`)
        }
        
        // Apply phase offset if set
        if (phaseOffsetSeconds > 0) {
          initialTime = index * phaseOffsetSeconds
          console.log(`🔄📍 Relative + Phase: Track ${track.name} at ${initialTime.toFixed(2)}s`)
        }
      }
      
      // FORMATION MODE: Rigid group movement
      else if (multiTrackMode === 'formation' && barycentricData) {
        trackAnimation = {
          ...trackAnimation,
          id: `${animation.id}-${track.id}`,
          parameters: {
            ...trackAnimation.parameters,
            _isobarycenter: barycentricData.barycenter,
            _trackOffset: barycentricData.offsets[track.id]
          }
        }
        console.log(`🎯 Formation: Track ${track.name} with offset (${barycentricData.offsets[track.id].x.toFixed(2)}, ${barycentricData.offsets[track.id].y.toFixed(2)}, ${barycentricData.offsets[track.id].z.toFixed(2)})`)
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
    console.log(`✅ Animation applied to track: ${track.name}`)
  })
  
  console.log(`🎉 Animation "${animation.name}" applied to ${selectedTracksToApply.length} track(s)`)
}
