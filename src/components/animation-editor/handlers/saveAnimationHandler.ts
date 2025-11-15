import { Animation, AnimationType, Track, AnimationParameters, Keyframe, Position, SubanimationConfig } from '@/types'
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
  // Subanimation settings
  fadeInEnabled?: boolean
  fadeInDuration?: number
  fadeInEasing?: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
  fadeOutEnabled?: boolean
  fadeOutDuration?: number
  fadeOutEasing?: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
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
  lockTracks = false,
  // Subanimation settings
  fadeInEnabled = true,
  fadeInDuration = 0.5,
  fadeInEasing = 'ease-out',
  fadeOutEnabled = true, // Enabled by default so tracks return to initial positions
  fadeOutDuration = 0.5,
  fadeOutEasing = 'ease-in'
}: SaveAnimationParams) => {
  const selectedTracksToApply = selectedTrackIds.length > 0 
    ? selectedTrackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]
    : []
  
  if (!animationForm.name || selectedTracksToApply.length === 0) {
    console.warn('⚠️ Cannot save: missing name or no tracks selected')
    alert('Please enter an animation name and select at least one track')
    return
  }

  // CRITICAL: If name changed, this is a NEW animation - generate new ID immediately
  // Don't reuse currentAnimation.id when name is different
  const nameChanged = currentAnimation && currentAnimation.name && animationForm.name !== currentAnimation.name
  const animationId = (nameChanged || !currentAnimation) 
    ? `anim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    : currentAnimation.id
  
  // V3: Build transform from UI state
  const transform = buildTransform(
    multiTrackMode,
    barycentricVariant,
    selectedTracksToApply,
    animationForm.type,              // Pass animation type
    animationForm.parameters,        // Pass animation parameters
    customCenter,
    phaseOffsetSeconds
  )
  
  // Build fade-in subanimation config if enabled
  const fadeIn: SubanimationConfig | undefined = fadeInEnabled ? {
    id: `fade-in-${animationId}`,
    type: 'fade-in',
    duration: fadeInDuration,
    easing: fadeInEasing,
    autoTrigger: true,
    enabled: true
  } : undefined
  
  // Build fade-out subanimation config if enabled
  const fadeOut: SubanimationConfig | undefined = fadeOutEnabled ? {
    id: `fade-out-${animationId}`,
    type: 'fade-out',
    duration: fadeOutDuration,
    easing: fadeOutEasing,
    autoTrigger: true,
    enabled: true
  } : undefined
  
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
    fadeIn,     // Fade-in subanimation
    fadeOut,    // Fade-out subanimation
    // Always save trackIds so we can restore selection when loading
    trackIds: selectedTrackIds.length > 0 ? selectedTrackIds : undefined,
    // Lock prevents cues from reassigning tracks
    trackSelectionLocked: lockTracks || false,
  }

  // Determine whether to create new or update existing
  if (nameChanged || !currentAnimation) {
    // Name changed OR no current animation - create new
    console.log(`📝 Creating new animation: "${animation.name}" (ID: ${animation.id})`)
    addAnimation(animation)
  } else {
    // Same name and updating existing - update it
    console.log(`✏️ Updating existing animation: "${animation.name}" (ID: ${animation.id})`)
    updateAnimation(animation.id, animation)
  }
  
  selectedTracksToApply.forEach((track) => {
    let trackAnimation = animation
    
    // In relative mode with per-track parameters, create unique animation for each track
    if (multiTrackMode === 'relative' && multiTrackParameters && multiTrackParameters[track.id]) {
      const perTrackParams = multiTrackParameters[track.id]
      trackAnimation = {
        ...animation,
        parameters: perTrackParams,  // Use per-track parameters (different control points, etc.)
        id: `${animation.id}-track-${track.id}`,  // Unique ID per track
      }
    }
    
    const animationStateUpdate = {
      animation: trackAnimation,  // Per-track animation in relative mode, shared in barycentric
      isPlaying: false,
      startTime: 0,
      currentTime: 0
    }
    
    updateTrack(track.id, {
      animationState: animationStateUpdate
    })
  })
}
