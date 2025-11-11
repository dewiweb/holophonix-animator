import { Track, Animation, Position } from '@/types'
import { generateAnimationPath } from './pathGeneration'
import { getMultiTrackStrategy, migrateMultiTrackMode } from '@/animations/strategies/MultiTrackStrategy'

export interface MultiTrackPath {
  trackId: string
  path: { position: Position; time: number; normalizedTime: number }[]
  color?: number
}

/**
 * Generate animation paths for multiple tracks using strategy pattern
 * NEW: Uses 3 strategies instead of 6 conditional branches
 */
export function generateMultiTrackPaths(
  tracks: Track[],
  animation: Animation,
  multiTrackMode: string | undefined,
  resolution: number = 100
): MultiTrackPath[] {
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
}
