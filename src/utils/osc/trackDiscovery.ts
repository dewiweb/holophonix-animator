import { OSCMessage } from '@/types'
import { debugLog, errorLog } from '@/config/debug'

/**
 * Track Discovery Utilities for OSC Store
 * Handles probing and discovering tracks on Holophonix device
 */

export interface TrackDiscoveryCache {
  lastKnownTrackNames: Map<number, string>
  failedTrackIndices: Set<number>
  maxValidTrackIndex: number | null
  discoveredTracks: Array<{
    index: number
    name: string
    position?: { x: number; y: number; z: number }
    color?: { r: number; g: number; b: number; a: number }
  }>
  isDiscoveringTracks: boolean
}

export interface TrackDiscoveryActions {
  sendMessage: (address: string, args: (number | string | boolean)[]) => Promise<void>
  getState: () => TrackDiscoveryCache & { activeConnection?: { isConnected: boolean } | null }
  setState: (updates: Partial<TrackDiscoveryCache>) => void
}

/**
 * Probe the device for an index that matches a given name
 * @returns Track index or null if not found
 */
export async function getTrackIndexByName(
  name: string,
  actions: TrackDiscoveryActions,
  maxProbe: number = 128,
  attempts: number = 6
): Promise<number | null> {
  const state = actions.getState()
  const active = state.activeConnection
  if (!active?.isConnected) return null

  for (let attempt = 0; attempt < attempts; attempt++) {
    // First, check cache quickly
    for (const [idx, n] of state.lastKnownTrackNames.entries()) {
      if (n === name) return idx
    }
    
    // Probe all indices once this attempt
    for (let i = 1; i <= maxProbe; i++) {
      await actions.sendMessage('/get', [`/track/${i}/name`])
      await new Promise(r => setTimeout(r, 15))
    }
    
    // Wait a bit for responses to be processed
    await new Promise(r => setTimeout(r, 150))
    
    const currentState = actions.getState()
    for (const [idx, n] of currentState.lastKnownTrackNames.entries()) {
      if (n === name) return idx
    }
  }
  
  return null
}

/**
 * Probe device for next available track index by querying names until first missing
 * @returns Next available track index
 */
export async function getNextAvailableTrackIndex(
  actions: TrackDiscoveryActions,
  maxProbe: number = 128,
  getProjectTracks: () => Array<{ holophonixIndex?: number }>
): Promise<number> {
  const state = actions.getState()
  const active = state.activeConnection
  
  if (!active?.isConnected) {
    // Fallback to local inference: use max local holophonixIndex + 1
    const tracks = getProjectTracks()
    const used = tracks.map(t => t.holophonixIndex).filter((v): v is number => typeof v === 'number')
    const next = used.length ? Math.max(...used) + 1 : 1
    return next
  }

  // Reset failure tracking for this probe
  actions.setState({ failedTrackIndices: new Set(), maxValidTrackIndex: null })
  
  for (let i = 1; i <= maxProbe; i++) {
    await actions.sendMessage('/get', [`/track/${i}/name`])
    await new Promise(r => setTimeout(r, 40))
    
    const currentState = actions.getState()
    if (currentState.failedTrackIndices.has(i)) {
      return i // first missing index
    }
  }
  
  // If none missing in range, append after max
  return maxProbe + 1
}

/**
 * Discover all tracks on the device
 */
export async function discoverTracks(
  actions: TrackDiscoveryActions,
  maxTracks: number = 64,
  includePositions: boolean = true
): Promise<void> {
  const state = actions.getState()
  const active = state.activeConnection
  
  if (!active?.isConnected) {
    errorLog('❌ No active OSC connection for track discovery')
    return
  }

  actions.setState({ 
    isDiscoveringTracks: true, 
    discoveredTracks: [], 
    failedTrackIndices: new Set(), 
    maxValidTrackIndex: null 
  })

  // Query each track index for name, position, and color
  for (let i = 1; i <= maxTracks; i++) {
    const currentState = actions.getState()
    
    // Check if we've already found this track doesn't exist
    if (currentState.failedTrackIndices.has(i)) {
      debugLog(`⏭️ Skipping track ${i} (known to not exist)`)
      break // Stop discovery completely
    }

    try {
      // Query track name
      await actions.sendMessage('/get', [`/track/${i}/name`])
      await new Promise(resolve => setTimeout(resolve, 50))

      // Check if track failed after name query
      const afterNameState = actions.getState()
      if (afterNameState.failedTrackIndices.has(i)) {
        debugLog(`🛑 Track ${i} doesn't exist, stopping discovery`)
        break
      }

      // Query track position (xyz format)
      if (includePositions) {
        await actions.sendMessage('/get', [`/track/${i}/xyz`])
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Query track color (RGBA format)
      await actions.sendMessage('/get', [`/track/${i}/color`])
      await new Promise(resolve => setTimeout(resolve, 50))
    } catch (error) {
      errorLog(`Error querying track ${i}:`, error)
    }
  }

  // Wait for all responses to arrive
  await new Promise(resolve => setTimeout(resolve, 2000))

  debugLog('✅ Track discovery completed')
  actions.setState({ isDiscoveringTracks: false })
  
  // Auto-create "Initial Positions" preset from discovered tracks
  try {
    const { createInitialPositionsPreset } = await import('./createInitialPreset')
    // Delay slightly to ensure all tracks are added to project store
    setTimeout(() => {
      createInitialPositionsPreset()
    }, 500)
  } catch (error) {
    debugLog('⚠️ Failed to create initial positions preset:', error)
  }
}

/**
 * Refresh position for a specific track
 */
export async function refreshTrackPosition(
  trackId: string,
  actions: TrackDiscoveryActions,
  getTrackById: (id: string) => { id: string; name: string; holophonixIndex?: number } | undefined,
  getCoordinateSystem: () => 'xyz' | 'aed'
): Promise<void> {
  const state = actions.getState()
  const active = state.activeConnection
  
  if (!active?.isConnected) {
    errorLog('❌ No active OSC connection for position refresh')
    return
  }

  const track = getTrackById(trackId)

  if (!track || !track.holophonixIndex) {
    errorLog('❌ Track not found or missing holophonixIndex')
    return
  }

  debugLog(`🔄 Refreshing position for track ${track.holophonixIndex}: ${track.name}`)

  // Query current position from Holophonix
  const coordinateSystem = getCoordinateSystem()
  await actions.sendMessage('/get', [`/track/${track.holophonixIndex}/${coordinateSystem}`])
}
