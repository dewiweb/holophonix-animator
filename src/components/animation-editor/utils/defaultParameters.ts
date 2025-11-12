import { AnimationType, AnimationParameters, Track, Position } from '@/types'
import { modelRegistry } from '@/models/registry'

export const getDefaultAnimationParameters = (type: AnimationType, track: Track | null): AnimationParameters => {
  const trackPosition = track?.initialPosition || track?.position || { x: 0, y: 0, z: 0 }
  
  // Get parameters from the model system
  const model = modelRegistry.getModel(type)
  if (model && model.getDefaultParameters && typeof model.getDefaultParameters === 'function') {
    try {
      return model.getDefaultParameters(trackPosition) as AnimationParameters
    } catch (error) {
      console.error(`Failed to get default parameters from model ${type}:`, error)
      return {}
    }
  }
  
  // Fallback for unknown types
  console.warn(`No model found for animation type: ${type}`)
  return {}
}

export const getDefaultParametersForPosition = (animationType: AnimationType, trackPosition: Position): AnimationParameters => {
  // Use model's getDefaultParameters method instead of switch-case
  const model = modelRegistry.getModel(animationType)
  if (model && model.getDefaultParameters && typeof model.getDefaultParameters === 'function') {
    try {
      return model.getDefaultParameters(trackPosition) as AnimationParameters
    } catch (error) {
      console.warn(`Failed to get default parameters from model ${animationType}:`, error)
    }
  }
  
  // Fallback: return empty defaults (shouldn't happen with all models having getDefaultParameters)
  console.warn(`No getDefaultParameters for ${animationType}, returning empty defaults`)
  return {}
}
