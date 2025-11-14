import React, { useMemo } from 'react'
import type { Track, Animation } from '@/types'
import type { Position } from '@/types'

/**
 * MultiTrackModeManager
 * 
 * Handles all multi-track mode logic including:
 * - Barycentric center calculation
 * - Track initial positions (stable reference)
 * - Animation parameter enhancement with barycentric offsets
 * 
 * This component doesn't render anything - it's a logic container
 * that provides enhanced animation parameters for the 3D editor.
 */

interface MultiTrackModeManagerProps {
  animation: Animation | null
  tracks: Track[]
  selectedTrackIds: string[]
  multiTrackMode: 'relative' | 'barycentric'
  barycentricVariant?: 'shared' | 'isobarycentric' | 'centered' | 'custom'
  customCenter?: Position
  children: (enhancedAnimation: Animation | null) => React.ReactNode
}

export const MultiTrackModeManager: React.FC<MultiTrackModeManagerProps> = ({
  animation,
  tracks,
  selectedTrackIds,
  multiTrackMode,
  barycentricVariant,
  customCenter,
  children
}) => {
  
  // Stable reference to track initial positions
  // Only updates when track IDs or track count changes, not when positions animate
  const trackInitialPositions = useMemo(() => {
    return selectedTrackIds.map(id => {
      const track = tracks.find(t => t.id === id)
      if (!track) return null
      return {
        id: track.id,
        x: track.initialPosition?.x ?? track.position.x,
        y: track.initialPosition?.y ?? track.position.y,
        z: track.initialPosition?.z ?? track.position.z
      }
    }).filter(Boolean) as Array<{ id: string; x: number; y: number; z: number }>
  }, [selectedTrackIds, tracks.length])
  
  // Enhanced animation with barycentric center for 3D visualization
  const enhancedAnimation = useMemo<Animation | null>(() => {
    if (!animation) return null
    
    // Clone parameters to avoid mutation
    let enhancedParams = animation.parameters ? { ...animation.parameters } : {}
    
    // Add barycentric center to parameters for control point visualization
    if (animation && multiTrackMode === 'barycentric') {
      if (barycentricVariant === 'isobarycentric' && trackInitialPositions.length > 0) {
        // Auto-calculate center from track initial positions
        const center = {
          x: trackInitialPositions.reduce((sum, t) => sum + t.x, 0) / trackInitialPositions.length,
          y: trackInitialPositions.reduce((sum, t) => sum + t.y, 0) / trackInitialPositions.length,
          z: trackInitialPositions.reduce((sum, t) => sum + t.z, 0) / trackInitialPositions.length,
        }
        enhancedParams._isobarycenter = center
      } else if (customCenter) {
        // User-defined center (shared, centered, custom variants)
        enhancedParams._customCenter = customCenter
      }
    }
    
    // Return enhanced animation
    return {
      ...animation,
      parameters: enhancedParams
    }
  }, [
    animation?.id,
    animation?.type,
    JSON.stringify(animation?.parameters),
    multiTrackMode,
    barycentricVariant,
    customCenter ? JSON.stringify(customCenter) : null,
    trackInitialPositions.length
  ])
  
  // Render children with enhanced animation
  return <>{children(enhancedAnimation)}</>
}
