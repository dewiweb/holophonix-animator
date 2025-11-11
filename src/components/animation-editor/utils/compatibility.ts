import { AnimationType } from '@/types'

export interface CompatibilityResult {
  compatible: boolean
  reason: string
}

export interface MultiTrackModeCompatibility {
  relative: CompatibilityResult
  barycentric: CompatibilityResult
}

/**
 * Get compatible multi-track modes for an animation type
 * Models handle most compatibility internally - this only covers UI/UX constraints
 */
export const getCompatibleModes = (animationType: AnimationType): MultiTrackModeCompatibility => {
  // Default: all modes compatible with all animation types
  return {
    relative: { compatible: true, reason: '' },
    barycentric: { compatible: true, reason: '' }
  }
  // All modes work with all animation types!
  // Barycentric variants and phase offset are orthogonal parameters
}
