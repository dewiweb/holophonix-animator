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

export const getCompatibleModes = (animationType: AnimationType): MultiTrackModeCompatibility => {
  const modes: MultiTrackModeCompatibility = {
    identical: { compatible: true, reason: '' },
    'phase-offset': { compatible: true, reason: '' },
    'position-relative': { compatible: true, reason: '' },
    'phase-offset-relative': { compatible: true, reason: '' },
    'isobarycenter': { compatible: true, reason: '' },
    'centered': { compatible: true, reason: '' }
  }

  switch (animationType) {
    // Always incompatible with position-relative
    case 'linear':
      modes['position-relative'] = { 
        compatible: false, 
        reason: 'Linear needs explicit start/end points, not center position' 
      }
      modes['centered'] = { 
        compatible: false, 
        reason: 'Linear uses start/end points, not a center' 
      }
      break

    case 'random':
      // All modes work
      break

    case 'custom':
      modes['position-relative'] = { 
        compatible: false, 
        reason: 'Custom keyframes define explicit positions' 
      }
      modes['phase-offset-relative'] = { 
        compatible: false, 
        reason: 'Custom keyframes define explicit positions' 
      }
      modes['centered'] = { 
        compatible: false, 
        reason: 'Custom keyframes define explicit positions' 
      }
      break

    case 'doppler':
    case 'zoom':
      modes['position-relative'] = { 
        compatible: false, 
        reason: 'This animation has a specific directional path' 
      }
      modes['phase-offset-relative'] = { 
        compatible: false, 
        reason: 'This animation has a specific directional path' 
      }
      break

    case 'bezier':
    case 'catmull-rom':
    case 'zigzag':
      // These can now support position-relative by translating control points
      // Centered mode still incompatible (no center parameter)
      modes['centered'] = { 
        compatible: false, 
        reason: 'Path is defined by explicit control points, not a center' 
      }
      break

    case 'formation':
      modes['phase-offset'] = { 
        compatible: false, 
        reason: 'Formation requires tracks to move together' 
      }
      modes['position-relative'] = { 
        compatible: false, 
        reason: 'Formation manages relative positions itself' 
      }
      modes['phase-offset-relative'] = { 
        compatible: false, 
        reason: 'Formation manages relative positions itself' 
      }
      break

    case 'attract-repel':
      modes['position-relative'] = { 
        compatible: false, 
        reason: 'Animation uses specific target position' 
      }
      modes['phase-offset-relative'] = { 
        compatible: false, 
        reason: 'Animation uses specific target position' 
      }
      break

    default:
      break
  }

  return modes
}
