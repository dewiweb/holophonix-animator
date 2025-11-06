import { Track, Animation, AnimationParameters, Position } from '@/types'
import { generateAnimationPath } from './pathGeneration'
import { calculateBarycenter } from '@/components/animation-editor/utils/barycentricCalculations'

export interface MultiTrackPath {
  trackId: string
  path: { position: Position; time: number; normalizedTime: number }[]
  color?: number
}

/**
 * Generate animation paths for multiple tracks based on multi-track mode
 * This ensures consistent behavior between 3D preview and actual animation playback
 */
export function generateMultiTrackPaths(
  tracks: Track[],
  animation: Animation,
  multiTrackMode: string | undefined,
  resolution: number = 100
): MultiTrackPath[] {
  if (tracks.length === 0 || !animation) return []

  const mode = multiTrackMode || 'identical'
  const paths: MultiTrackPath[] = []

  switch (mode) {
    case 'identical': {
      // All tracks follow exactly the same path
      const path = generateAnimationPath(animation, resolution)
      tracks.forEach(track => {
        paths.push({
          trackId: track.id,
          path,
          color: track.color ? 
            (track.color.r * 0xFF) << 16 | (track.color.g * 0xFF) << 8 | (track.color.b * 0xFF) : 
            undefined
        })
      })
      break
    }

    case 'phase-offset': {
      // Same path but with time delays
      const phaseOffset = animation.phaseOffsetSeconds || 1
      tracks.forEach((track, index) => {
        // Create animation with adjusted time
        const offsetAnimation = {
          ...animation,
          parameters: {
            ...animation.parameters,
            _phaseOffset: index * phaseOffset
          }
        }
        const path = generateAnimationPath(offsetAnimation, resolution)
        paths.push({
          trackId: track.id,
          path,
          color: track.color ? 
            (track.color.r * 0xFF) << 16 | (track.color.g * 0xFF) << 8 | (track.color.b * 0xFF) : 
            undefined
        })
      })
      break
    }

    case 'position-relative': {
      // Each track animates from its own position
      tracks.forEach(track => {
        // Create animation with track-specific offset
        // NOTE: Models already handle _trackOffset in their calculate functions
        // So we DON'T need to apply offset again here (was causing double offset!)
        const offsetAnimation = {
          ...animation,
          parameters: {
            ...animation.parameters,
            _trackOffset: track.position,
            _multiTrackMode: 'position-relative' as const
          }
        }
        const path = generateAnimationPath(offsetAnimation, resolution)
        
        // DON'T apply offset again - model already handled it via context.trackOffset
        // The path returned from generateAnimationPath is already in world coordinates
        
        paths.push({
          trackId: track.id,
          path, // Use path as-is, no additional offset
          color: track.color ? 
            (track.color.r * 0xFF) << 16 | (track.color.g * 0xFF) << 8 | (track.color.b * 0xFF) : 
            undefined
        })
      })
      break
    }

    case 'phase-offset-relative': {
      // Combination of position-relative and phase-offset
      const phaseOffset = animation.phaseOffsetSeconds || 1
      tracks.forEach((track, index) => {
        // NOTE: Models already handle _trackOffset in their calculate functions
        // So we DON'T need to apply offset again here (was causing double offset!)
        const offsetAnimation = {
          ...animation,
          parameters: {
            ...animation.parameters,
            _trackOffset: track.position,
            _phaseOffset: index * phaseOffset,
            _multiTrackMode: 'phase-offset-relative' as const
          }
        }
        const path = generateAnimationPath(offsetAnimation, resolution)
        
        // DON'T apply offset again - model already handled it via context.trackOffset
        // The path returned from generateAnimationPath is already in world coordinates
        
        paths.push({
          trackId: track.id,
          path, // Use path as-is, no additional offset
          color: track.color ? 
            (track.color.r * 0xFF) << 16 | (track.color.g * 0xFF) << 8 | (track.color.b * 0xFF) : 
            undefined
        })
      })
      break
    }

    case 'isobarycenter': {
      // Formation mode - all tracks move as rigid formation
      // Animation is applied to barycenter, tracks maintain relative positions
      const barycenter = calculateBarycenter(tracks)
      
      // Generate single path for barycenter
      const barycenterAnimation = {
        ...animation,
        parameters: {
          ...animation.parameters,
          _multiTrackMode: 'isobarycenter' as const,
          _isobarycenter: barycenter
        }
      }
      const barycenterPath = generateAnimationPath(barycenterAnimation, resolution)
      
      // Apply the same movement to each track while maintaining relative positions
      tracks.forEach(track => {
        const relativeOffset = {
          x: track.position.x - barycenter.x,
          y: track.position.y - barycenter.y,
          z: track.position.z - barycenter.z
        }
        
        const path = barycenterPath.map(point => ({
          position: {
            x: point.position.x + relativeOffset.x,
            y: point.position.y + relativeOffset.y,
            z: point.position.z + relativeOffset.z
          },
          time: point.time,
          normalizedTime: point.normalizedTime
        }))
        
        paths.push({
          trackId: track.id,
          path,
          color: track.color ? 
            (track.color.r * 0xFF) << 16 | (track.color.g * 0xFF) << 8 | (track.color.b * 0xFF) : 
            undefined
        })
      })
      break
    }

    case 'centered': {
      // All tracks animate around user-defined center point
      const centerPoint = animation.centerPoint || { x: 0, y: 0, z: 0 }
      
      // Each track gets the same animation but centered at the specified point
      const centeredAnimation = {
        ...animation,
        parameters: {
          ...animation.parameters,
          _multiTrackMode: 'centered' as const,
          _centeredPoint: centerPoint
        }
      }
      const path = generateAnimationPath(centeredAnimation, resolution)
      
      tracks.forEach(track => {
        paths.push({
          trackId: track.id,
          path,
          color: track.color ? 
            (track.color.r * 0xFF) << 16 | (track.color.g * 0xFF) << 8 | (track.color.b * 0xFF) : 
            undefined
        })
      })
      break
    }

    default: {
      // Fallback to identical mode
      const path = generateAnimationPath(animation, resolution)
      tracks.forEach(track => {
        paths.push({
          trackId: track.id,
          path,
          color: track.color ? 
            (track.color.r * 0xFF) << 16 | (track.color.g * 0xFF) << 8 | (track.color.b * 0xFF) : 
            undefined
        })
      })
    }
  }

  return paths
}
