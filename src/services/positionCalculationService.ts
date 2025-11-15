/**
 * Position Calculation Service
 * Handles position calculation requests from the main process
 * Uses the full model runtime to calculate accurate positions
 */

import { modelRuntime } from '@/models/runtime'
import { applyTransform, getTrackTime } from '@/utils/transformApplication'
import { useProjectStore } from '@/stores/projectStore'
import type { Position } from '@/types'

export interface PositionCalculationRequest {
  animationId: string
  time: number // Animation time in seconds
  trackIds: string[]
}

export interface PositionCalculationResponse {
  animationId: string
  positions: Array<{
    trackId: string
    holophonixIndex: number
    position: Position
  }>
}

/**
 * Calculate positions for an animation at a specific time
 * This runs in the renderer and uses the full model runtime
 */
export function calculatePositions(request: PositionCalculationRequest): PositionCalculationResponse {
  const { animationId, time, trackIds } = request
  const projectStore = useProjectStore.getState()
  
  // Get the animation
  const animation = projectStore.animations.find(a => a.id === animationId)
  if (!animation) {
    console.error(`❌ Animation ${animationId} not found for position calculation`)
    return { animationId, positions: [] }
  }
  
  const positions: PositionCalculationResponse['positions'] = []
  
  // Calculate position for each track
  trackIds.forEach(trackId => {
    const track = projectStore.tracks.find(t => t.id === trackId)
    if (!track) {
      console.warn(`⚠️ Track ${trackId} not found`)
      return
    }
    
    try {
      // Calculate track-specific time (with phase offset if applicable)
      const trackTime = getTrackTime(trackId, time, animation)
      
      // Calculate base position using model runtime
      const basePosition = modelRuntime.calculatePosition(animation, trackTime)
      
      // Apply transforms (formation, relative offsets, etc.)
      const finalPosition = applyTransform(
        basePosition,
        trackId,
        animation,
        trackTime,
        trackIds
      )
      
      positions.push({
        trackId,
        holophonixIndex: track.holophonixIndex || 0,
        position: finalPosition
      })
    } catch (error) {
      console.error(`❌ Error calculating position for track ${trackId}:`, error)
    }
  })
  
  return {
    animationId,
    positions
  }
}

/**
 * Initialize the position calculation service
 * Sets up IPC listener for calculation requests from main process
 */
export function initPositionCalculationService() {
  if (typeof window === 'undefined' || !(window as any).electronAPI) {
    console.warn('⚠️ Position calculation service: Electron API not available')
    return
  }
  
  const electronAPI = (window as any).electronAPI
  
  // Register handler for position calculation requests
  if (electronAPI.onPositionCalculationRequest) {
    console.log('🧮 Position calculation service initialized')
    
    const cleanup = electronAPI.onPositionCalculationRequest((request: PositionCalculationRequest) => {
      // Calculate positions and return response
      const response = calculatePositions(request)
      return response
    })
    
    // Return cleanup function
    return cleanup
  } else {
    console.warn('⚠️ Position calculation service: onPositionCalculationRequest not available')
  }
}
