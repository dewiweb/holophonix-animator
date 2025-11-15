/**
 * Create Initial Positions Preset
 * 
 * Automatically creates a position preset from discovered tracks'
 * initial positions for easy "return to start" functionality.
 */

import { debugLog } from '@/config/debug'
import type { Position } from '@/types'

/**
 * Create or update "Initial Positions" preset from current track data
 * 
 * This runs after track discovery to capture the starting positions
 * of all tracks, providing an automatic "home" preset.
 */
export async function createInitialPositionsPreset(): Promise<void> {
  try {
    // Dynamically import stores to avoid circular dependencies
    const { useProjectStore } = await import('@/stores/projectStore')
    const { usePositionPresetStore } = await import('@/stores/positionPresetStore')
    
    const projectStore = useProjectStore.getState()
    const presetStore = usePositionPresetStore.getState()
    
    const tracks = projectStore.tracks
    
    if (tracks.length === 0) {
      debugLog('⏭️ No tracks to create initial preset from')
      return
    }
    
    // Check if "Initial Positions" preset already exists
    const existingPreset = presetStore.presets.find(
      p => p.name === 'Initial Positions' && p.category === 'safety'
    )
    
    // Collect positions from tracks
    const positions: Record<string, Position> = {}
    const trackIds: string[] = []
    
    tracks.forEach(track => {
      // Use initialPosition if available, otherwise current position
      const position = track.initialPosition || track.position
      
      positions[track.id] = { ...position }
      trackIds.push(track.id)
    })
    
    if (existingPreset) {
      // Update existing preset with new tracks
      debugLog(`🔄 Updating "Initial Positions" preset with ${trackIds.length} tracks`)
      
      presetStore.updatePreset(existingPreset.id, {
        positions,
        trackIds,
        description: `Initial positions of all ${trackIds.length} tracks (auto-generated)`
      })
    } else {
      // Create new preset
      debugLog(`✨ Creating "Initial Positions" preset with ${trackIds.length} tracks`)
      
      presetStore.createPreset({
        name: 'Initial Positions',
        description: `Initial positions of all ${trackIds.length} tracks (auto-generated)`,
        positions,
        trackIds,
        category: 'safety',
        scope: 'project',
        tags: ['auto-generated', 'initial', 'home', 'safe']
      })
    }
    
    debugLog('✅ Initial Positions preset ready')
  } catch (error) {
    console.error('❌ Failed to create initial positions preset:', error)
  }
}

/**
 * Update "Initial Positions" preset when tracks are added/removed
 * 
 * Call this whenever the track list changes significantly.
 */
export async function updateInitialPositionsPreset(): Promise<void> {
  try {
    const { usePositionPresetStore } = await import('@/stores/positionPresetStore')
    const presetStore = usePositionPresetStore.getState()
    
    const existingPreset = presetStore.presets.find(
      p => p.name === 'Initial Positions' && p.category === 'safety'
    )
    
    if (existingPreset) {
      // Re-create to update with current tracks
      await createInitialPositionsPreset()
      debugLog('🔄 Updated Initial Positions preset')
    }
  } catch (error) {
    console.error('❌ Failed to update initial positions preset:', error)
  }
}

/**
 * Check if Initial Positions preset exists
 */
export async function hasInitialPositionsPreset(): Promise<boolean> {
  try {
    const { usePositionPresetStore } = await import('@/stores/positionPresetStore')
    const presetStore = usePositionPresetStore.getState()
    
    return presetStore.presets.some(
      p => p.name === 'Initial Positions' && p.category === 'safety'
    )
  } catch (error) {
    return false
  }
}
