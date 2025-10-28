import { Position, Track } from '@/types'

export const handleParameterChange = (
  key: string,
  value: any,
  animationForm: any,
  setAnimationForm: (form: any) => void,
  multiTrackMode: string,
  selectedTrackIds: string[],
  tracks: Track[],
  updateTrack: (trackId: string, updates: any) => void
) => {
  // For Position objects, ensure we merge with existing values
  const isPositionKey = ['startPosition', 'endPosition', 'center', 'bounds', 'anchorPoint', 'restPosition', 'targetPosition'].includes(key)

  if (isPositionKey && typeof value === 'object') {
    // Merge with existing position to preserve all x, y, z values
    const existingValue = (animationForm.parameters as any)?.[key] || { x: 0, y: 0, z: 0 }
    const newValue = { ...existingValue, ...value }

    // If we're in relative modes and this is a position parameter, apply relative changes to other tracks
    if (selectedTrackIds.length > 1 && (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative' || multiTrackMode === 'isobarycenter')) {
      applyRelativeControlPointChange(key, newValue, existingValue, selectedTrackIds, tracks, updateTrack)
    }

    setAnimationForm({
      ...animationForm,
      parameters: {
        ...animationForm.parameters,
        [key]: newValue
      }
    })
    return
  }

  // If we're in relative modes and this is a position parameter, apply relative changes to other tracks
  if (selectedTrackIds.length > 1 && (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative' || multiTrackMode === 'isobarycenter') && isPositionKey) {
    applyRelativeControlPointChange(key, value, (animationForm.parameters as any)?.[key], selectedTrackIds, tracks, updateTrack)
  }

  setAnimationForm({
    ...animationForm,
    parameters: { ...animationForm.parameters, [key]: value }
  })
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
