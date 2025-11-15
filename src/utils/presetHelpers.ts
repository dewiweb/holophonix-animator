/**
 * Position Preset Helpers
 * 
 * Convenience functions for creating common position presets
 */

import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { useProjectStore } from '@/stores/projectStore'
import type { Position } from '@/types'

/**
 * Create a "Park" preset that moves all tracks to origin (0,0,0)
 * Useful as a safe/neutral position
 */
export function createParkPreset(): string | null {
  const projectStore = useProjectStore.getState()
  const presetStore = usePositionPresetStore.getState()
  
  const tracks = projectStore.tracks
  if (tracks.length === 0) {
    console.warn('No tracks available to create park preset')
    return null
  }
  
  // Check if park preset already exists
  const existing = presetStore.presets.find(
    p => p.name === 'Park (Origin)' && p.category === 'safety'
  )
  
  if (existing) {
    console.log('Park preset already exists')
    return existing.id
  }
  
  // Create positions at origin
  const positions: Record<string, Position> = {}
  tracks.forEach(track => {
    positions[track.id] = { x: 0, y: 0, z: 0 }
  })
  
  // Create preset
  const presetId = presetStore.createPreset({
    name: 'Park (Origin)',
    description: 'All tracks at origin (0,0,0) for safety',
    positions,
    trackIds: tracks.map(t => t.id),
    category: 'safety',
    scope: 'global',
    tags: ['park', 'safe', 'origin', 'auto-generated']
  })
  
  console.log('✅ Created Park preset:', presetId)
  return presetId
}

/**
 * Create a "Current Positions" snapshot
 * Quick capture without opening dialog
 */
export function captureCurrentSnapshot(name?: string): string {
  const projectStore = useProjectStore.getState()
  const presetStore = usePositionPresetStore.getState()
  
  const tracks = projectStore.tracks
  const timestamp = new Date().toLocaleTimeString()
  const presetName = name || `Snapshot ${timestamp}`
  
  const presetId = presetStore.captureCurrentPositions(
    tracks.map(t => t.id),
    presetName,
    {
      category: 'custom',
      tags: ['snapshot', 'quick-capture']
    }
  )
  
  console.log(`📸 Captured snapshot: ${presetName}`)
  return presetId
}

/**
 * Apply the "Initial Positions" preset (auto-created on track discovery)
 * Returns to starting positions
 */
export async function returnToInitialPositions(duration: number = 2.0): Promise<void> {
  const presetStore = usePositionPresetStore.getState()
  
  // Find the auto-created initial positions preset
  const initialPreset = presetStore.presets.find(
    p => p.name === 'Initial Positions' && p.category === 'safety'
  )
  
  if (!initialPreset) {
    console.warn('Initial Positions preset not found. Was track discovery run?')
    return
  }
  
  await presetStore.applyPreset(initialPreset.id, {
    transition: {
      duration,
      easing: 'ease-in-out',
      mode: 'cartesian'
    },
    interruptAnimations: true
  })
  
  console.log('✅ Returned to initial positions')
}

/**
 * Apply the "Park" preset if it exists, create it if not
 */
export async function parkAllTracks(duration: number = 1.5): Promise<void> {
  const presetStore = usePositionPresetStore.getState()
  
  // Find or create park preset
  let parkPreset = presetStore.presets.find(
    p => p.name === 'Park (Origin)' && p.category === 'safety'
  )
  
  if (!parkPreset) {
    const presetId = createParkPreset()
    if (!presetId) return
    parkPreset = presetStore.getPreset(presetId) || undefined
  }
  
  if (!parkPreset) return
  
  await presetStore.applyPreset(parkPreset.id, {
    transition: {
      duration,
      easing: 'ease-out',
      mode: 'cartesian'
    },
    interruptAnimations: true
  })
  
  console.log('✅ Parked all tracks at origin')
}

/**
 * Create a circular formation preset
 * Quick way to arrange tracks in a circle
 */
export function createCircleFormation(
  radius: number = 3.0,
  height: number = 1.5,
  name?: string
): string {
  const projectStore = useProjectStore.getState()
  const presetStore = usePositionPresetStore.getState()
  
  const tracks = projectStore.tracks
  const positions: Record<string, Position> = {}
  const angleStep = (2 * Math.PI) / tracks.length
  
  tracks.forEach((track, index) => {
    const angle = index * angleStep
    positions[track.id] = {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      z: height
    }
  })
  
  const presetName = name || `Circle r=${radius}m`
  const presetId = presetStore.createPreset({
    name: presetName,
    description: `Circular formation: radius=${radius}m, height=${height}m`,
    positions,
    trackIds: tracks.map(t => t.id),
    category: 'formation',
    scope: 'project',
    tags: ['circle', 'formation', 'auto-generated']
  })
  
  console.log(`✅ Created circle formation: ${presetName}`)
  return presetId
}

/**
 * Create a frontal semicircle preset (common for dialogue)
 */
export function createFrontalSemicircle(
  radius: number = 3.0,
  height: number = 1.2,
  name?: string
): string {
  const projectStore = useProjectStore.getState()
  const presetStore = usePositionPresetStore.getState()
  
  const tracks = projectStore.tracks
  const positions: Record<string, Position> = {}
  
  // Distribute tracks in frontal 180° arc (from 30° to 150°)
  const startAngle = 30 * (Math.PI / 180)
  const endAngle = 150 * (Math.PI / 180)
  const angleSpan = endAngle - startAngle
  
  tracks.forEach((track, index) => {
    const t = tracks.length > 1 ? index / (tracks.length - 1) : 0.5
    const angle = startAngle + angleSpan * t
    
    positions[track.id] = {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      z: height
    }
  })
  
  const presetName = name || 'Frontal Stage'
  const presetId = presetStore.createPreset({
    name: presetName,
    description: `Frontal semicircle for dialogue: radius=${radius}m`,
    positions,
    trackIds: tracks.map(t => t.id),
    category: 'scene',
    scope: 'project',
    tags: ['frontal', 'stage', 'dialogue', 'auto-generated']
  })
  
  console.log(`✅ Created frontal stage: ${presetName}`)
  return presetId
}

/**
 * Create a line formation preset
 */
export function createLineFormation(
  length: number = 6.0,
  height: number = 1.5,
  axis: 'x' | 'y' = 'x',
  name?: string
): string {
  const projectStore = useProjectStore.getState()
  const presetStore = usePositionPresetStore.getState()
  
  const tracks = projectStore.tracks
  const positions: Record<string, Position> = {}
  const offset = -length / 2
  
  tracks.forEach((track, index) => {
    const t = tracks.length > 1 ? index / (tracks.length - 1) : 0.5
    const position = offset + length * t
    
    if (axis === 'x') {
      positions[track.id] = { x: position, y: 0, z: height }
    } else {
      positions[track.id] = { x: 0, y: position, z: height }
    }
  })
  
  const presetName = name || `Line ${axis.toUpperCase()} ${length}m`
  const presetId = presetStore.createPreset({
    name: presetName,
    description: `Line formation along ${axis} axis: ${length}m`,
    positions,
    trackIds: tracks.map(t => t.id),
    category: 'formation',
    scope: 'project',
    tags: ['line', 'formation', 'auto-generated']
  })
  
  console.log(`✅ Created line formation: ${presetName}`)
  return presetId
}

/**
 * Export helper functions for easy access
 */
export const presetHelpers = {
  createParkPreset,
  captureCurrentSnapshot,
  returnToInitialPositions,
  parkAllTracks,
  createCircleFormation,
  createFrontalSemicircle,
  createLineFormation
}

// Make helpers available globally for console/dev use
if (typeof window !== 'undefined') {
  (window as any).presetHelpers = presetHelpers
}
