import { useCallback } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useOSCStore } from '@/stores/oscStore'
import { Track, Position } from '@/types'
import { logger } from '@/utils/logger'

/**
 * Custom hook for track operations
 * Provides simplified API for track management and position updates
 */
export const useTrack = (trackId?: string) => {
  const { tracks, addTrack, updateTrack, removeTrack, selectedTracks, selectTrack } = useProjectStore()
  const { sendMessage } = useOSCStore()

  const track = trackId ? tracks.find(t => t.id === trackId) : null

  const create = useCallback(
    (trackData: Omit<Track, 'id'>) => {
      logger.track('Creating track', { name: trackData.name })
      addTrack(trackData)
    },
    [addTrack]
  )

  const update = useCallback(
    (updates: Partial<Track>) => {
      if (!trackId) {
        logger.warn('Cannot update track: no track ID', undefined, 'Track')
        return
      }
      logger.track('Updating track', { trackId, updates })
      updateTrack(trackId, updates)
    },
    [trackId, updateTrack]
  )

  const remove = useCallback(() => {
    if (!trackId) {
      logger.warn('Cannot remove track: no track ID', undefined, 'Track')
      return
    }
    logger.track('Removing track', { trackId })
    removeTrack(trackId)
  }, [trackId, removeTrack])

  const updatePosition = useCallback(
    async (position: Position, sendOSC = true) => {
      if (!trackId || !track) {
        logger.warn('Cannot update position: no track', undefined, 'Track')
        return
      }

      updateTrack(trackId, { position })

      if (sendOSC && track.holophonixIndex) {
        try {
          const coordType = 'xyz' // Could be dynamic based on settings
          await sendMessage(`/track/${track.holophonixIndex}/${coordType}`, [
            position.x,
            position.y,
            position.z,
          ])
          logger.debug('Position sent via OSC', { trackId, position }, 'Track')
        } catch (error) {
          logger.error('Failed to send position via OSC', error, 'Track')
        }
      }
    },
    [trackId, track, updateTrack, sendMessage]
  )

  const select = useCallback(
    (multiSelect = false) => {
      if (!trackId) return
      selectTrack(trackId, multiSelect)
    },
    [trackId, selectTrack]
  )

  return {
    // State
    track,
    tracks,
    selectedTracks,
    isSelected: selectedTracks.includes(trackId || ''),

    // Actions
    create,
    update,
    remove,
    updatePosition,
    select,
  }
}
