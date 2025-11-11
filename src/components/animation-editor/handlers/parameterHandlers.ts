import { Position, Track } from '@/types'

/**
 * Handle parameter changes with relative updates for multi-track modes
 * @param key - Parameter key to update
 * @param value - New value for the parameter
 * @param currentParameters - Current animation form parameters
 * @param updateParameter - Store action to update a single parameter
 * @param multiTrackMode - Current multi-track mode
 * @param selectedTrackIds - Array of selected track IDs
 * @param tracks - All tracks
 * @param updateTrack - Function to update a track
 */
export const handleParameterChange = (
  key: string,
  value: any,
  currentParameters: any,
  updateParameter: (key: string, value: any) => void,
  multiTrackMode: string,
  selectedTrackIds: string[],
  tracks: Track[],
  updateTrack: (trackId: string, updates: any) => void
) => {
  // For Position objects, ensure we merge with existing values
  const isPositionKey = ['startPosition', 'endPosition', 'center', 'bounds', 'anchorPoint', 'restPosition', 'targetPosition'].includes(key)

  if (isPositionKey && typeof value === 'object') {
    // Merge with existing position to preserve all x, y, z values
    const existingValue = (currentParameters as any)?.[key] || { x: 0, y: 0, z: 0 }
    const newValue = { ...existingValue, ...value }

    // If we're in relative modes and this is a position parameter, apply relative changes to other tracks
    if (selectedTrackIds.length > 1 && (multiTrackMode === 'relative')) {
      applyRelativeControlPointChange(key, newValue, existingValue, selectedTrackIds, tracks, updateTrack)
    }

    // Update via store action
    updateParameter(key, newValue)
    return
  }

  // If we're in relative modes and this is a position parameter, apply relative changes to other tracks
  if (selectedTrackIds.length > 1 && (multiTrackMode === 'relative') && isPositionKey) {
    applyRelativeControlPointChange(key, value, (currentParameters as any)?.[key], selectedTrackIds, tracks, updateTrack)
  }

  // Update via store action
  updateParameter(key, value)
}

const applyRelativeControlPointChange = (
  key: string,
  newValue: any,
  oldValue: any,
  selectedTrackIds: string[],
  tracks: Track[],
  updateTrack: (trackId: string, updates: any) => void
) => {
  if (!oldValue || !newValue) return

  // Calculate the relative offset
  const offset = {
    x: newValue.x - oldValue.x,
    y: newValue.y - oldValue.y,
    z: newValue.z - oldValue.z
  }

  // Apply this offset to other selected tracks (skip the first track as it was already updated)
  selectedTrackIds.slice(1).forEach(trackId => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    // Get the current parameter value for this track
    const currentValue = getCurrentTrackParameter(trackId, key, tracks)

    if (currentValue) {
      // Apply the same relative offset
      const updatedValue = {
        x: currentValue.x + offset.x,
        y: currentValue.y + offset.y,
        z: currentValue.z + offset.z
      }

      // Update this track's parameter
      updateTrackParameter(trackId, key, updatedValue, tracks, updateTrack)
    }
  })
}

const getCurrentTrackParameter = (trackId: string, key: string, tracks: Track[]): Position | null => {
  const track = tracks.find(t => t.id === trackId)
  if (!track || !track.animationState?.animation?.parameters) return null

  const params = track.animationState.animation.parameters as any
  return params[key] || null
}

const updateTrackParameter = (
  trackId: string,
  key: string,
  value: any,
  tracks: Track[],
  updateTrack: (trackId: string, updates: any) => void
) => {
  const track = tracks.find(t => t.id === trackId)
  if (!track || !track.animationState?.animation) return

  const updatedAnimation = {
    ...track.animationState.animation,
    parameters: {
      ...(track.animationState.animation.parameters as any),
      [key]: value
    }
  }

  updateTrack(trackId, {
    animationState: {
      ...track.animationState,
      animation: updatedAnimation
    }
  })
}
