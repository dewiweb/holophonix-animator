import { Track, Animation, Position } from '@/types'
import { generateAnimationPath } from './pathGeneration'
// TODO: Update path generation to use v3 transforms
// For now, generate paths from base animation without transforms

export interface MultiTrackPath {
  trackId: string
  path: { position: Position; time: number; normalizedTime: number }[]
  color?: number
}

/**
 * Generate animation paths for multiple tracks using v3 transforms
 * TODO: Implement v3 version using applyTransform
 */
export function generateMultiTrackPaths(
  tracks: Track[],
  animation: Animation,
  multiTrackMode: string | undefined,
  barycentricVariant?: string
): MultiTrackPath[] {
  // V3 TODO: Reimplement using animation.transform
  // For now, return empty array (non-critical for core functionality)
  console.warn('generateMultiTrackPaths needs v3 implementation')
  return []

  /* OLD V2 CODE - NEEDS V3 REFACTOR
  if (tracks.length === 0 || !animation) return []

  // Migrate old mode names to new ones
  const mode = migrateMultiTrackMode(multiTrackMode)
  const strategy = getMultiTrackStrategy(mode.mode)
  
  const paths: MultiTrackPath[] = []
  
  // Strategy handles all the logic
  tracks.forEach((track, index) => {
    // Get track-specific parameters from strategy
    const trackParameters = strategy.getTrackParameters(animation, track, index, tracks)
    const phaseOffset = strategy.getPhaseOffset(index, animation.phaseOffsetSeconds)
    
    // Build animation for this track
    const trackAnimation = {
      ...animation,
      parameters: {
        ...trackParameters,
        ...(phaseOffset > 0 && { _phaseOffset: phaseOffset })
      }
    }
    
    // Generate path using model calculations
    const path = generateAnimationPath(trackAnimation, resolution)
    
    paths.push({
      trackId: track.id,
      path,
      color: track.color ? 
        (track.color.r * 0xFF) << 16 | (track.color.g * 0xFF) << 8 | (track.color.b * 0xFF) : 
        undefined
    })
  })

  return paths
  */
}
