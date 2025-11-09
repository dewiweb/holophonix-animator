import { AnimationType } from '@/types'

export interface CompatibilityResult {
  compatible: boolean
  reason: string
}

export interface MultiTrackModeCompatibility {
  shared: CompatibilityResult
  relative: CompatibilityResult
  formation: CompatibilityResult
}

/**
 * Get compatible multi-track modes for an animation type
 * Models handle most compatibility internally - this only covers UI/UX constraints
 */
export const getCompatibleModes = (animationType: AnimationType): MultiTrackModeCompatibility => {
  // Default: all 3 modes compatible
  return {
    shared: { compatible: true, reason: '' },
    relative: { compatible: true, reason: '' },
    formation: { compatible: true, reason: '' }
  }
  // All modes work with all animation types now!
  // Phase offset is a parameter, not a mode restriction
}
