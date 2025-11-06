import { AnimationType } from '@/types'

export interface CompatibilityResult {
  compatible: boolean
  reason: string
}

export interface MultiTrackModeCompatibility {
  identical: CompatibilityResult
  'phase-offset': CompatibilityResult
  'position-relative': CompatibilityResult
  'phase-offset-relative': CompatibilityResult
  'isobarycenter': CompatibilityResult
  'centered': CompatibilityResult
}

/**
 * Get compatible multi-track modes for an animation type
 * Models handle most compatibility internally - this only covers UI/UX constraints
 */
export const getCompatibleModes = (animationType: AnimationType): MultiTrackModeCompatibility => {
  // Default: all modes compatible (models handle compatibility internally)
  const modes: MultiTrackModeCompatibility = {
    identical: { compatible: true, reason: '' },
    'phase-offset': { compatible: true, reason: '' },
    'position-relative': { compatible: true, reason: '' },
    'phase-offset-relative': { compatible: true, reason: '' },
    'isobarycenter': { compatible: true, reason: '' },
    'centered': { compatible: true, reason: '' }
  }
  
  // Only mark incompatibilities for UI/UX reasons
  // (Models handle technical compatibility themselves)
  
  // Path-based animations with explicit control points
  const pathBased = ['bezier', 'catmull-rom', 'zigzag', 'custom']
  if (pathBased.includes(animationType)) {
    modes['centered'] = { 
      compatible: false, 
      reason: 'Path defined by explicit points, not a center' 
    }
  }
  
  // Formation mode manages positions itself
  if (animationType === 'formation') {
    modes['phase-offset'] = { 
      compatible: false, 
      reason: 'Formation requires synchronized movement' 
    }
    modes['position-relative'] = { 
      compatible: false, 
      reason: 'Formation manages relative positions' 
    }
    modes['phase-offset-relative'] = { 
      compatible: false, 
      reason: 'Formation manages relative positions' 
    }
  }

  return modes
}
