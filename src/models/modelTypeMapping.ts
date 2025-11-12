/**
 * Animation Type Mapping
 * Maps legacy animation type names to model type names
 * Ensures backward compatibility
 */

import { AnimationType } from '@/types'

/**
 * Map legacy animation type to model type
 * Most are 1:1, but this allows for future divergence
 */
export const legacyToModelType: Record<AnimationType, string> = {
  // Basic animations
  'linear': 'linear',
  'circular': 'circular',
  'elliptical': 'elliptical',
  'spiral': 'spiral',
  'random': 'random',
  
  // Physics-based
  'pendulum': 'pendulum',
  'bounce': 'bounce',
  'spring': 'spring',
  
  // Wave-based
  'oscillator-stationary': 'oscillator-stationary',
  'oscillator-path': 'oscillator-path',
  'lissajous': 'lissajous',
  'helix': 'helix',
  
  // Curve & path-based
  'bezier': 'bezier',
  'catmull-rom': 'catmull-rom',
  
  // Procedural
  'perlin-noise': 'perlin-noise',
  'rose-curve': 'rose-curve',
  'epicycloid': 'epicycloid',
  
  // Spatial audio
  'doppler': 'doppler',
  'circular-scan': 'circular-scan',
  'zoom': 'zoom',
}

/**
 * Map model type to legacy animation type
 */
export const modelToLegacyType: Record<string, AnimationType> = Object.entries(legacyToModelType)
  .reduce((acc, [legacy, model]) => {
    acc[model] = legacy as AnimationType
    return acc
  }, {} as Record<string, AnimationType>)

/**
 * Get model type from animation type
 */
export function getModelType(animationType: AnimationType): string {
  return legacyToModelType[animationType] || animationType
}

/**
 * Get legacy animation type from model type
 */
export function getLegacyType(modelType: string): AnimationType | undefined {
  return modelToLegacyType[modelType]
}

/**
 * Check if an animation type has a corresponding model
 * All animation types now have models (custom was removed)
 */
export function hasModel(animationType: AnimationType): boolean {
  return true
}

/**
 * All animation types that should have models
 */
export const EXPECTED_MODEL_TYPES = Object.values(legacyToModelType)

/**
 * Verify all expected models are present
 */
export function verifyAllModelsPresent(registeredTypes: string[]): {
  missing: string[]
  extra: string[]
  valid: boolean
} {
  const registeredSet = new Set(registeredTypes)
  const expectedSet = new Set(EXPECTED_MODEL_TYPES)
  
  const missing = EXPECTED_MODEL_TYPES.filter(type => !registeredSet.has(type))
  const extra = registeredTypes.filter(type => !expectedSet.has(type))
  
  return {
    missing,
    extra,
    valid: missing.length === 0
  }
}
