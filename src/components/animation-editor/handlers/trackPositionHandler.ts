import { AnimationType, Track, Position } from '@/types'
import { modelRegistry } from '@/models/registry'

/**
 * Handle "Use Track Position" button click - updates animation parameters to use selected track's position
 * @param animationType - Current animation type
 * @param currentParameters - Current animation form parameters
 * @param updateParameters - Store action to update multiple parameters at once
 * @param selectedTrackIds - Array of selected track IDs
 * @param tracks - All tracks
 * @param multiTrackMode - Current multi-track mode
 */
export const handleUseTrackPosition = (
  animationType: AnimationType,
  currentParameters: any,
  updateParameters: (params: any) => void,
  selectedTrackIds: string[],
  tracks: Track[],
  multiTrackMode: 'relative' | 'barycentric'
) => {
  const selectedTracksToUse = selectedTrackIds.length > 0 
    ? selectedTrackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]
    : []
    
  if (selectedTracksToUse.length === 0) return
  
  const updatedParams = { ...currentParameters }
  
  // Behavior depends on multi-track mode
  if (selectedTracksToUse.length === 1 || multiTrackMode === 'barycentric') {
    // Single track OR Barycentric mode: use FIRST track's position as center
    const trackPosition = selectedTracksToUse[0].initialPosition || selectedTracksToUse[0].position
    
    // Update parameters based on animation type
    updateParametersForPosition(animationType, updatedParams, trackPosition)
    
    // Update via store action
    updateParameters(updatedParams)
    
  } else if (multiTrackMode === 'relative') {
    // Relative mode: Animation will be centered on EACH track's own position
    // This is handled automatically in handleSaveAnimation
    return
  }
}

const updateParametersForPosition = (type: AnimationType, params: any, trackPosition: Position) => {
  // Use model metadata instead of switch-case
  const model = modelRegistry.getModel(type)
  const positionParam = model?.visualization?.positionParameter
  
  if (positionParam) {
    // Handle special case: catmullRom uses array
    if (positionParam === 'controlPoints' && Array.isArray(params[positionParam])) {
      // Don't override array of control points, this is handled differently
      return
    }
    
    // Standard case: set the position parameter
    params[positionParam] = { ...trackPosition }
  } else {
    // Fallback for models without visualization metadata (shouldn't happen)
    console.warn(`No positionParameter defined for ${type}, cannot update position`)
  }
}
