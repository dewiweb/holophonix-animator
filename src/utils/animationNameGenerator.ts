/**
 * Animation Name Generator
 * 
 * Generates default animation names based on type and existing animations
 */

import type { AnimationType } from '@/types'

// Map animation types to user-friendly names
const typeDisplayNames: Record<AnimationType, string> = {
  // Existing animations
  linear: 'Linear',
  circular: 'Circular',
  elliptical: 'Elliptical',
  spiral: 'Spiral',
  random: 'Random',
  // Physics-based
  pendulum: 'Pendulum',
  bounce: 'Bounce',
  spring: 'Spring',
  // Wave-based
  'oscillator-stationary': 'Oscillator (Stationary)',
  'oscillator-path': 'Oscillator (Path)',
  lissajous: 'Lissajous',
  helix: 'Helix',
  // Curve & path-based
  bezier: 'Bezier',
  'catmull-rom': 'Catmull-Rom',
  // Advanced procedural
  'perlin-noise': 'Perlin Noise',
  'rose-curve': 'Rose Curve',
  epicycloid: 'Epicycloid',
  // Specialized spatial audio
  doppler: 'Doppler',
  'circular-scan': 'Circular Scan',
  zoom: 'Zoom'
}

/**
 * Generate a default animation name based on type
 * 
 * @param type - Animation type
 * @param existingNames - Array of existing animation names (optional, for uniqueness)
 * @returns Generated name like "Circular Animation" or "Linear Animation 2"
 */
export function generateDefaultAnimationName(
  type: AnimationType,
  existingNames: string[] = []
): string {
  const baseName = typeDisplayNames[type] || 'Animation'
  const baseTemplate = `${baseName} Animation`
  
  // If no existing names, use base name
  if (existingNames.length === 0) {
    return baseTemplate
  }
  
  // Check if base name is taken
  if (!existingNames.includes(baseTemplate)) {
    return baseTemplate
  }
  
  // Find first available numbered name
  let counter = 2
  let candidateName = `${baseTemplate} ${counter}`
  
  while (existingNames.includes(candidateName)) {
    counter++
    candidateName = `${baseTemplate} ${counter}`
  }
  
  return candidateName
}

/**
 * Generate a timestamp-based unique name (fallback)
 */
export function generateTimestampName(type: AnimationType): string {
  const baseName = typeDisplayNames[type] || 'Animation'
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/:/g, '')
  
  return `${baseName} ${timestamp}`
}

/**
 * Check if a name is a default generated name
 */
export function isDefaultName(name: string): boolean {
  // Check if it matches pattern: "TypeName Animation" or "TypeName Animation N"
  const defaultPattern = /^[A-Z][a-z0-9\s]+ Animation( \d+)?$/
  return defaultPattern.test(name)
}
