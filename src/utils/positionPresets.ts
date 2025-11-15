/**
 * Position Preset Utilities
 * 
 * Convenience functions for working with position presets
 */

import { Position } from '@/types'
import { PositionPreset, PresetCategory } from '@/types/positionPreset'

// ========================================
// PRESET GENERATORS
// ========================================

/**
 * Generate circular formation preset
 */
export function generateCirclePreset(
  trackIds: string[],
  radius: number,
  height: number = 1.5,
  name: string = 'Circle Formation',
  options?: {
    startAngle?: number
    category?: PresetCategory
    description?: string
  }
): Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> {
  const positions: Record<string, Position> = {}
  const angleStep = (2 * Math.PI) / trackIds.length
  const startAngle = options?.startAngle || 0

  trackIds.forEach((id, index) => {
    const angle = startAngle + index * angleStep
    positions[id] = {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      z: height
    }
  })

  return {
    name,
    description: options?.description || `Circular formation: r=${radius}m, z=${height}m`,
    positions,
    trackIds,
    category: options?.category || 'formation',
    scope: 'project',
    tags: ['generated', 'circle']
  }
}

/**
 * Generate line formation preset
 */
export function generateLinePreset(
  trackIds: string[],
  start: Position,
  end: Position,
  name: string = 'Line Formation',
  options?: {
    category?: PresetCategory
    description?: string
  }
): Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> {
  const positions: Record<string, Position> = {}
  const count = trackIds.length

  trackIds.forEach((id, index) => {
    const t = count > 1 ? index / (count - 1) : 0.5
    positions[id] = {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
      z: start.z + (end.z - start.z) * t
    }
  })

  return {
    name,
    description: options?.description || `Line formation from (${start.x}, ${start.y}, ${start.z}) to (${end.x}, ${end.y}, ${end.z})`,
    positions,
    trackIds,
    category: options?.category || 'formation',
    scope: 'project',
    tags: ['generated', 'line']
  }
}

/**
 * Generate grid formation preset
 */
export function generateGridPreset(
  trackIds: string[],
  rows: number,
  columns: number,
  spacing: number = 2.0,
  height: number = 1.5,
  name: string = 'Grid Formation',
  options?: {
    category?: PresetCategory
    description?: string
  }
): Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> {
  const positions: Record<string, Position> = {}
  
  // Center the grid
  const offsetX = -(columns - 1) * spacing / 2
  const offsetY = -(rows - 1) * spacing / 2

  trackIds.forEach((id, index) => {
    const row = Math.floor(index / columns)
    const col = index % columns
    
    positions[id] = {
      x: offsetX + col * spacing,
      y: offsetY + row * spacing,
      z: height
    }
  })

  return {
    name,
    description: options?.description || `Grid formation: ${rows}×${columns}, spacing=${spacing}m`,
    positions,
    trackIds,
    category: options?.category || 'formation',
    scope: 'project',
    tags: ['generated', 'grid']
  }
}

/**
 * Generate arc formation preset
 */
export function generateArcPreset(
  trackIds: string[],
  radius: number,
  startAngle: number,
  endAngle: number,
  height: number = 1.5,
  name: string = 'Arc Formation',
  options?: {
    category?: PresetCategory
    description?: string
  }
): Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> {
  const positions: Record<string, Position> = {}
  const count = trackIds.length
  const angleSpan = endAngle - startAngle

  trackIds.forEach((id, index) => {
    const t = count > 1 ? index / (count - 1) : 0.5
    const angle = startAngle + angleSpan * t
    
    positions[id] = {
      x: radius * Math.cos(angle * Math.PI / 180),
      y: radius * Math.sin(angle * Math.PI / 180),
      z: height
    }
  })

  return {
    name,
    description: options?.description || `Arc formation: r=${radius}m, ${startAngle}° to ${endAngle}°`,
    positions,
    trackIds,
    category: options?.category || 'formation',
    scope: 'project',
    tags: ['generated', 'arc']
  }
}

/**
 * Generate sphere surface distribution preset
 */
export function generateSpherePreset(
  trackIds: string[],
  radius: number,
  name: string = 'Sphere Distribution',
  options?: {
    category?: PresetCategory
    description?: string
  }
): Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> {
  const positions: Record<string, Position> = {}
  const count = trackIds.length
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // ≈137.5°

  trackIds.forEach((id, index) => {
    // Golden spiral algorithm for uniform sphere distribution
    const y = 1 - (index / (count - 1)) * 2  // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y)
    const theta = goldenAngle * index

    positions[id] = {
      x: radius * Math.cos(theta) * radiusAtY,
      y: radius * Math.sin(theta) * radiusAtY,
      z: radius * y
    }
  })

  return {
    name,
    description: options?.description || `Sphere surface distribution: r=${radius}m`,
    positions,
    trackIds,
    category: options?.category || 'formation',
    scope: 'project',
    tags: ['generated', 'sphere', '3d']
  }
}

// ========================================
// PRESET OPERATIONS
// ========================================

/**
 * Interpolate between two presets
 */
export function interpolatePresets(
  preset1: PositionPreset,
  preset2: PositionPreset,
  t: number,
  name?: string
): Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> {
  const positions: Record<string, Position> = {}
  const allTrackIds = [...new Set([...preset1.trackIds, ...preset2.trackIds])]

  allTrackIds.forEach(id => {
    const pos1 = preset1.positions[id] || { x: 0, y: 0, z: 0 }
    const pos2 = preset2.positions[id] || { x: 0, y: 0, z: 0 }

    positions[id] = {
      x: pos1.x + (pos2.x - pos1.x) * t,
      y: pos1.y + (pos2.y - pos1.y) * t,
      z: pos1.z + (pos2.z - pos1.z) * t
    }
  })

  return {
    name: name || `${preset1.name} → ${preset2.name} (${(t * 100).toFixed(0)}%)`,
    description: `Interpolation between ${preset1.name} and ${preset2.name}`,
    positions,
    trackIds: allTrackIds,
    category: preset1.category || 'custom',
    scope: 'project',
    tags: ['interpolated']
  }
}

/**
 * Scale preset positions
 */
export function scalePreset(
  preset: PositionPreset,
  scale: number,
  name?: string
): Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> {
  const positions: Record<string, Position> = {}

  preset.trackIds.forEach(id => {
    const pos = preset.positions[id]
    positions[id] = {
      x: pos.x * scale,
      y: pos.y * scale,
      z: pos.z * scale
    }
  })

  return {
    name: name || `${preset.name} (scaled ${scale}x)`,
    description: `Scaled version of ${preset.name}`,
    positions,
    trackIds: preset.trackIds,
    category: preset.category,
    scope: preset.scope,
    tags: [...(preset.tags || []), 'scaled']
  }
}

/**
 * Rotate preset positions around Z axis
 */
export function rotatePreset(
  preset: PositionPreset,
  angleDegrees: number,
  name?: string
): Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> {
  const positions: Record<string, Position> = {}
  const angleRad = angleDegrees * Math.PI / 180

  preset.trackIds.forEach(id => {
    const pos = preset.positions[id]
    const cos = Math.cos(angleRad)
    const sin = Math.sin(angleRad)

    positions[id] = {
      x: pos.x * cos - pos.y * sin,
      y: pos.x * sin + pos.y * cos,
      z: pos.z
    }
  })

  return {
    name: name || `${preset.name} (rotated ${angleDegrees}°)`,
    description: `Rotated version of ${preset.name}`,
    positions,
    trackIds: preset.trackIds,
    category: preset.category,
    scope: preset.scope,
    tags: [...(preset.tags || []), 'rotated']
  }
}

/**
 * Translate preset positions
 */
export function translatePreset(
  preset: PositionPreset,
  offset: Position,
  name?: string
): Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> {
  const positions: Record<string, Position> = {}

  preset.trackIds.forEach(id => {
    const pos = preset.positions[id]
    positions[id] = {
      x: pos.x + offset.x,
      y: pos.y + offset.y,
      z: pos.z + offset.z
    }
  })

  return {
    name: name || `${preset.name} (translated)`,
    description: `Translated version of ${preset.name}`,
    positions,
    trackIds: preset.trackIds,
    category: preset.category,
    scope: preset.scope,
    tags: [...(preset.tags || []), 'translated']
  }
}

/**
 * Mirror preset positions
 */
export function mirrorPreset(
  preset: PositionPreset,
  axis: 'x' | 'y' | 'z',
  name?: string
): Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> {
  const positions: Record<string, Position> = {}

  preset.trackIds.forEach(id => {
    const pos = preset.positions[id]
    positions[id] = {
      x: axis === 'x' ? -pos.x : pos.x,
      y: axis === 'y' ? -pos.y : pos.y,
      z: axis === 'z' ? -pos.z : pos.z
    }
  })

  return {
    name: name || `${preset.name} (mirrored ${axis})`,
    description: `Mirrored version of ${preset.name} along ${axis} axis`,
    positions,
    trackIds: preset.trackIds,
    category: preset.category,
    scope: preset.scope,
    tags: [...(preset.tags || []), 'mirrored']
  }
}

// ========================================
// PRESET VALIDATION
// ========================================

/**
 * Check if all track positions are within bounds
 */
export function validatePresetBounds(
  preset: PositionPreset,
  bounds: { min: Position; max: Position }
): { valid: boolean; outOfBounds: string[] } {
  const outOfBounds: string[] = []

  preset.trackIds.forEach(id => {
    const pos = preset.positions[id]
    
    if (
      pos.x < bounds.min.x || pos.x > bounds.max.x ||
      pos.y < bounds.min.y || pos.y > bounds.max.y ||
      pos.z < bounds.min.z || pos.z > bounds.max.z
    ) {
      outOfBounds.push(id)
    }
  })

  return {
    valid: outOfBounds.length === 0,
    outOfBounds
  }
}

/**
 * Check for colliding tracks (within minimum distance)
 */
export function detectCollisions(
  preset: PositionPreset,
  minDistance: number = 0.1
): Array<{ track1: string; track2: string; distance: number }> {
  const collisions: Array<{ track1: string; track2: string; distance: number }> = []

  for (let i = 0; i < preset.trackIds.length; i++) {
    for (let j = i + 1; j < preset.trackIds.length; j++) {
      const id1 = preset.trackIds[i]
      const id2 = preset.trackIds[j]
      const pos1 = preset.positions[id1]
      const pos2 = preset.positions[id2]

      const dx = pos2.x - pos1.x
      const dy = pos2.y - pos1.y
      const dz = pos2.z - pos1.z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (distance < minDistance) {
        collisions.push({ track1: id1, track2: id2, distance })
      }
    }
  }

  return collisions
}

// ========================================
// COMMON PRESETS
// ========================================

/**
 * Create origin/park preset (all tracks at 0,0,0)
 */
export function createParkPreset(
  trackIds: string[]
): Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> {
  const positions: Record<string, Position> = {}
  
  trackIds.forEach(id => {
    positions[id] = { x: 0, y: 0, z: 0 }
  })

  return {
    name: 'Park (Origin)',
    description: 'All tracks at origin for safety',
    positions,
    trackIds,
    category: 'safety',
    scope: 'global',
    tags: ['park', 'safe', 'origin']
  }
}

/**
 * Create frontal semicircle preset (dialogue staging)
 */
export function createFrontalStagePreset(
  trackIds: string[],
  radius: number = 3.0,
  height: number = 1.2
): Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> {
  return generateArcPreset(
    trackIds,
    radius,
    30,  // Start at 30°
    150, // End at 150°
    height,
    'Frontal Stage',
    {
      category: 'scene',
      description: 'Classic frontal semicircle for dialogue'
    }
  )
}
