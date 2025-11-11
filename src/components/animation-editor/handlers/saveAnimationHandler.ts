import { Animation, AnimationType, Track, AnimationParameters, Keyframe, Position } from '@/types'
import { buildTransform } from '@/utils/transformBuilder'

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
  
  // V3: Build transform from UI state
  const transform = buildTransform(
    multiTrackMode,
    barycentricVariant,
    selectedTracksToApply,
    customCenter,
    phaseOffsetSeconds
  )
  
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
    transform,  // V3 unified transform
    ...(lockTracks && selectedTrackIds.length > 0 && {
      trackIds: selectedTrackIds,
      trackSelectionLocked: true,
    })
  }

  console.log('💾 Saving animation (v3):', animation)

  if (currentAnimation) {
    updateAnimation(animation.id, animation)
    console.log('✅ Updated existing animation')
  } else {
    addAnimation(animation)
    console.log('✅ Added new animation')
  }
  
  // V3: Apply animation to tracks (simple - transform handles everything)
  selectedTracksToApply.forEach((track) => {
    updateTrack(track.id, {
      animationState: {
        animation,  // Same animation for all tracks, transform differentiates them
        isPlaying: false,
        startTime: 0
      }
    })
  })

  console.log(`✅ Applied animation to ${selectedTracksToApply.length} tracks (v3 transform)`)
}
