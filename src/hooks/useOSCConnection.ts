import { useCallback } from 'react'
import { useOSCStore } from '@/stores/oscStore'
import { logger } from '@/utils/logger'

/**
 * Custom hook for OSC connection management
 * Provides simplified API for OSC operations
 */
export const useOSCConnection = () => {
  const {
    connections,
    activeConnectionId,
    isDiscoveringTracks,
    connect,
    disconnect,
    sendMessage,
    discoverTracks,
    getActiveConnection,
  } = useOSCStore()

  const activeConnection = getActiveConnection()

  const connectToDevice = useCallback(
    async (host: string, port: number) => {
      try {
        logger.osc('Connecting to device', { host, port })
        await connect(host, port)
        logger.osc('Connected successfully', { host, port })
      } catch (error) {
        logger.error('Failed to connect to device', error, 'OSC')
        throw error
      }
    },
    [connect]
  )

  const disconnectDevice = useCallback(
    async (deviceId?: string) => {
      try {
        const targetId = deviceId || activeConnectionId
        if (!targetId) {
          logger.warn('No device to disconnect', undefined, 'OSC')
          return
        }
        logger.osc('Disconnecting device', { deviceId: targetId })
        await disconnect(targetId)
        logger.osc('Disconnected successfully', { deviceId: targetId })
      } catch (error) {
        logger.error('Failed to disconnect device', error, 'OSC')
        throw error
      }
    },
    [disconnect, activeConnectionId]
  )

  const send = useCallback(
    async (address: string, args: any[]) => {
      if (!activeConnection?.isConnected) {
        logger.warn('Cannot send message: no active connection', { address }, 'OSC')
        throw new Error('No active OSC connection')
      }

      try {
        await sendMessage(address, args)
        logger.debug('OSC message sent', { address, args }, 'OSC')
      } catch (error) {
        logger.error('Failed to send OSC message', error, 'OSC')
        throw error
      }
    },
    [sendMessage, activeConnection]
  )

  const importTracks = useCallback(
    async (maxTracks = 64, includePositions = true) => {
      if (!activeConnection?.isConnected) {
        logger.warn('Cannot import tracks: no active connection', undefined, 'OSC')
        throw new Error('No active OSC connection')
      }

      try {
        logger.osc('Starting track import', { maxTracks, includePositions })
        await discoverTracks(maxTracks, includePositions)
        logger.osc('Track import completed')
      } catch (error) {
        logger.error('Failed to import tracks', error, 'OSC')
        throw error
      }
    },
    [discoverTracks, activeConnection]
  )

  return {
    // State
    connections,
    activeConnection,
    isConnected: activeConnection?.isConnected || false,
    isDiscovering: isDiscoveringTracks,

    // Actions
    connect: connectToDevice,
    disconnect: disconnectDevice,
    send,
    importTracks,
  }
}
