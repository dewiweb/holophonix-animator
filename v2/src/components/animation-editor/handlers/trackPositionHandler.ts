import { AnimationType, Track, Position } from '@/types'

export const handleUseTrackPosition = (
  animationForm: any,
  setAnimationForm: (form: any) => void,
  selectedTrackIds: string[],
  tracks: Track[],
  multiTrackMode: 'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative' | 'isobarycenter' | 'centered'
) => {
  const selectedTracksToUse = selectedTrackIds.length > 0 
    ? selectedTrackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]
    : []
    
  if (selectedTracksToUse.length === 0) return
  
  const type = animationForm.type
  const updatedParams = { ...animationForm.parameters }
  
  // Behavior depends on multi-track mode
  if (selectedTracksToUse.length === 1 || multiTrackMode === 'identical' || multiTrackMode === 'phase-offset' || multiTrackMode === 'centered') {
    // Single track OR Identical/Phase-Offset/Centered mode: use FIRST track's position
    const trackPosition = selectedTracksToUse[0].initialPosition || selectedTracksToUse[0].position
    
    console.log(`📍 Using ${selectedTracksToUse[0].name} position as center:`, trackPosition)
    
    // Update parameters based on animation type
    updateParametersForPosition(type, updatedParams, trackPosition)
    
    setAnimationForm({ ...animationForm, parameters: updatedParams })
    console.log(`✅ Updated center/start to ${selectedTracksToUse[0].name}'s position`)
    
  } else if (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') {
    // Position-Relative modes: Animation will be centered on EACH track's own position
    // This is handled automatically in handleSaveAnimation, so just inform user
    console.log(`📍 Position-Relative mode: Each track will use its own position as center (applied on save)`)
    return
  }
}

const updateParametersForPosition = (type: AnimationType, params: any, trackPosition: Position) => {
  switch (type) {
    case 'linear':
    case 'bezier':
    case 'catmull-rom':
    case 'zigzag':
      params.startPosition = { ...trackPosition }
      break
      
    case 'circular':
    case 'spiral':
    case 'random':
    case 'wave':
    case 'lissajous':
    case 'orbit':
    case 'rose-curve':
    case 'epicycloid':
    case 'circular-scan':
      params.center = { ...trackPosition }
      break
      
    case 'elliptical':
      params.centerX = trackPosition.x
      params.centerY = trackPosition.y
      params.centerZ = trackPosition.z
      break
      
    case 'pendulum':
      params.anchorPoint = { ...trackPosition }
      break
      
    case 'spring':
      params.restPosition = { ...trackPosition }
      break
      
    case 'bounce':
      params.groundLevel = trackPosition.y
      break
      
    case 'attract-repel':
      params.targetPosition = { ...trackPosition }
      break
      
    case 'zoom':
      params.zoomCenter = { ...trackPosition }
      break
      
    case 'helix':
      params.axisStart = { ...trackPosition }
      break
  }
}
