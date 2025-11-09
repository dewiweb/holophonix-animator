import { AnimationType, AnimationParameters, Position } from '@/types'
import { getDefaultParametersForPosition } from './defaultParameters'
import { modelRegistry } from '@/models/registry'

export const checkUserModifiedParameters = (
  animationType: AnimationType, 
  currentParams: AnimationParameters,
  originalParams: AnimationParameters | null,
  trackPosition: Position
): Record<string, boolean> => {
  const modified: Record<string, boolean> = {}
  const defaults = originalParams || getDefaultParametersForPosition(animationType, trackPosition)

  // Use model metadata instead of switch-case
  const model = modelRegistry.getModel(animationType)
  const positionParam = model?.visualization?.positionParameter
  
  if (positionParam) {
    const currentValue = (currentParams as any)[positionParam]
    const defaultValue = (defaults as any)[positionParam]
    
    // Check if position parameter was modified
    modified[positionParam] = JSON.stringify(currentValue) !== JSON.stringify(defaultValue)
  } else {
    // Fallback for models without visualization metadata
    console.warn(`No positionParameter defined for ${animationType}`)
  }

  return modified
}
