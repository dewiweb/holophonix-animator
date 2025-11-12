import { Animation, AnimationType } from '@/types'
import { useAnimationStore } from '@/stores/animationStore'
import { usePresetStore } from '@/stores/presetStore'

/**
 * Event handlers for AnimationEditor component
 * Extracted to improve maintainability and testability
 */

export interface PresetHandlerOptions {
  updateAnimationForm: (updates: any) => void
  setMultiTrackMode: (mode: 'relative' | 'barycentric') => void
  setBarycentricVariant: (variant: 'shared' | 'isobarycentric' | 'centered' | 'custom') => void
  setCustomCenter: (center: any) => void
  setPreserveOffsets: (preserve: boolean) => void
  setPhaseOffsetSeconds: (seconds: number) => void
}

export function createPresetLoadHandler(options: PresetHandlerOptions) {
  return (preset: any) => {
    options.updateAnimationForm({
      name: preset.animation.name,
      type: preset.animation.type,
      parameters: preset.animation.parameters,
      duration: preset.animation.duration,
      loop: preset.animation.loop,
      pingPong: preset.animation.pingPong,
    })
  }
}

export interface SavePresetHandlerOptions {
  animationForm: any
  addPreset: (preset: any) => void
}

export function createPresetSaveHandler(options: SavePresetHandlerOptions) {
  return (presetName: string, description: string) => {
    const { animationForm, addPreset } = options
    
    const preset = {
      id: `preset-${Date.now()}`,
      name: presetName,
      description,
      animation: {
        name: animationForm.name,
        type: animationForm.type,
        parameters: animationForm.parameters,
        duration: animationForm.duration,
        loop: animationForm.loop,
        pingPong: animationForm.pingPong,
      },
      metadata: {
        createdAt: new Date().toISOString(),
        tags: [],
      },
    }

    addPreset(preset)
    console.log('Preset saved:', preset)
  }
}

export interface AnimationLoadHandlerOptions {
  loadAnimation: (animation: Animation) => void
}

export function createAnimationLoadHandler(options: AnimationLoadHandlerOptions) {
  return (animation: Animation) => {
    // V3: Store's loadAnimation extracts UI state from transform
    options.loadAnimation(animation)
  }
}

export interface PlaybackHandlerOptions {
  isAnimationPlaying: boolean
  playAnimation: (animationId: string, trackIds?: string[]) => void
  pauseAnimation: (animationId?: string) => void
  stopAnimation: (animationId?: string) => void
  selectedTrackIds: string[]
  previewAnimation: Animation | null
}

export function createPlaybackHandlers(options: PlaybackHandlerOptions) {
  const handlePlayPreview = () => {
    if (options.isAnimationPlaying) {
      options.pauseAnimation()
    } else {
      if (!options.previewAnimation) {
        console.warn('Cannot play: No animation configured')
        return
      }
      
      const previewId = options.previewAnimation.id
      
      if (options.selectedTrackIds.length === 0) {
        console.warn('Cannot play animation: No tracks selected')
        return
      }

      console.log('Playing preview animation:', previewId, 'for tracks:', options.selectedTrackIds)
      
      // Play the animation on selected tracks
      options.playAnimation(previewId, options.selectedTrackIds)
    }
  }

  const handleStopAnimation = () => {
    options.stopAnimation()
  }

  return {
    handlePlayPreview,
    handleStopAnimation
  }
}

/**
 * Validates animation form before saving
 */
export function validateAnimationForm(animationForm: any): { valid: boolean; error?: string } {
  if (!animationForm.name) {
    return { valid: false, error: 'Animation name is required' }
  }
  
  if (!animationForm.type) {
    return { valid: false, error: 'Animation type is required' }
  }
  
  return { valid: true }
}
