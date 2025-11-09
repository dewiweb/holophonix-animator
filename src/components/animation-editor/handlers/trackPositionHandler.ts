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
  multiTrackMode: 'shared' | 'relative' | 'formation'
) => {
  const selectedTracksToUse = selectedTrackIds.length > 0 
    ? selectedTrackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]
    : []
    
  if (selectedTracksToUse.length === 0) return
  
  const updatedParams = { ...currentParameters }
  
  // Behavior depends on multi-track mode
  if (selectedTracksToUse.length === 1 || multiTrackMode === 'shared') {
    // Single track OR Identical/Phase-Offset/Centered mode: use FIRST track's position
    const trackPosition = selectedTracksToUse[0].initialPosition || selectedTracksToUse[0].position
    
    console.log(`📍 Using ${selectedTracksToUse[0].name} position as center:`, trackPosition)
    
    // Update parameters based on animation type
    updateParametersForPosition(animationType, updatedParams, trackPosition)
    
    // Update via store action
    updateParameters(updatedParams)
    console.log(`✅ Updated center/start to ${selectedTracksToUse[0].name}'s position`)
    
  } else if (multiTrackMode === 'relative') {
    // Position-Relative modes: Animation will be centered on EACH track's own position
    // This is handled automatically in handleSaveAnimation, so just inform user
    console.log(`📍 Position-Relative mode: Each track will use its own position as center (applied on save)`)
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
