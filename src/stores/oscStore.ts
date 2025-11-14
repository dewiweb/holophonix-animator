import { create } from 'zustand'
import { OSCConnection, OSCMessage, OSCConfiguration } from '@/types'
import { generateId } from '@/utils'
import { useProjectStore } from './projectStore'
import { useAnimationStore } from './animationStore'
import { oscBatchManager, OSCBatch } from '@/utils/osc/batchManager'
import { oscInputManager } from '@/utils/osc/inputManager'
import { oscMessageOptimizer, type TrackPositionUpdate } from '@/utils/osc/messageOptimizer'
import { applyTransform, getTrackTime } from '@/utils/transformApplication'
import { 
  calculateAnimationTime,
  createTimingState,
  pauseTimingState,
  resumeTimingState,
  resetTimingState,
  type AnimationTimingState
} from '@/utils/animationTiming'
import { 
  DevOSCServer,
  getTrackIndexByName as getTrackIndexByNameUtil,
  getNextAvailableTrackIndex as getNextAvailableTrackIndexUtil,
  discoverTracks as discoverTracksUtil,
  refreshTrackPosition as refreshTrackPositionUtil,
  checkDeviceAvailability as checkDeviceAvailabilityUtil,
  startAvailabilityPolling as startAvailabilityPollingUtil,
  stopAvailabilityPolling as stopAvailabilityPollingUtil,
  handleProbeResponse,
  processMessage as processMessageUtil
} from '@/utils/osc'

let devOSCServer: DevOSCServer | null = null

interface OSCState {
  // Connection management
  connections: OSCConnection[]
  activeConnectionId: string | null

  // Configuration
  config: OSCConfiguration

  // Message handling
  outgoingMessages: OSCMessage[]
  incomingMessages: OSCMessage[]
  messageHistory: OSCMessage[]

  // Device availability
  deviceAvailable: boolean
  lastAvailabilityCheck: number | null
  lastAvailabilityError: string | null
  _availabilityIntervalId?: number | null
  lastIncomingAt: number | null
  lastNonGetIncomingAt: number | null
  // Strict probe state
  _probePending: boolean
  _probeExpected: Set<string> | null
  _probeDeadline: number | null
  _probeMatched: boolean

  // Cached device state
  lastKnownTrackNames: Map<number, string>

  // Track discovery
  isDiscoveringTracks: boolean
  discoveredTracks: Array<{ 
    index: number; 
    name: string; 
    position?: { x: number; y: number; z: number };
    color?: { r: number; g: number; b: number; a: number };
  }>
  failedTrackIndices: Set<number>
  maxValidTrackIndex: number | null

  // Connection control
  connect: (host: string, port: number) => Promise<void>
  disconnect: (connectionId: string) => void
  removeConnection: (connectionId: string) => void
  sendMessage: (address: string, args: (number | string | boolean)[]) => Promise<void>
  sendMessageAsync: (address: string, args: (number | string | boolean)[]) => void
  sendBatch: (batch: OSCBatch) => Promise<void>
  sendBatchAsync: (batch: OSCBatch) => void

  // Availability
  checkDeviceAvailability: () => Promise<void>
  startAvailabilityPolling: (intervalMs?: number) => void
  stopAvailabilityPolling: () => void

  // Utilities for track management
  getNextAvailableTrackIndex: (maxProbe?: number) => Promise<number>
  getTrackIndexByName: (name: string, maxProbe?: number, attempts?: number) => Promise<number | null>

  // Track discovery
  discoverTracks: (maxTracks?: number, includePositions?: boolean) => Promise<void>
  refreshTrackPosition: (trackId: string) => Promise<void>

  // Message processing
  processIncomingMessage: (message: OSCMessage) => void
  _processMessageInternal: (message: OSCMessage) => Promise<void>

  // Utility functions
  getConnectionById: (id: string) => OSCConnection | undefined
  getActiveConnection: () => OSCConnection | null
  clearMessageHistory: () => void
}

const defaultConfig: OSCConfiguration = {
  defaultPort: 8000,
  retryAttempts: 3,
  messageTimeout: 1000,
  bufferSize: 1024,
  maxRetries: 5,
}

export const useOSCStore = create<OSCState>((set, get) => {
  // Initialize input manager with callback
  oscInputManager.setProcessCallback((message) => {
    get()._processMessageInternal(message)
  })
  
  return {
    // Initial state
    connections: [],
    activeConnectionId: null,
  config: defaultConfig,
  outgoingMessages: [],
    // Availability
    deviceAvailable: false,
    lastAvailabilityCheck: null,
    lastAvailabilityError: null,
    _availabilityIntervalId: null,
    lastIncomingAt: null,
    lastNonGetIncomingAt: null,
    _probePending: false,
    _probeExpected: null,
    _probeDeadline: null,
    _probeMatched: false,
    failedTrackIndices: new Set<number>(),
    maxValidTrackIndex: null,
  incomingMessages: [],
  messageHistory: [],
  isDiscoveringTracks: false,
  discoveredTracks: [],
  lastKnownTrackNames: new Map<number, string>(),

  connect: async (host: string, port: number) => {
    const connectionId = generateId()
    const connection: OSCConnection = {
      id: connectionId,
      host,
      port,
      isConnected: false,
      messageCount: 0,
      errorCount: 0,
    }

    set(state => ({
      connections: [...state.connections, connection],
    }))

    try {
      // Check if we're in Electron (has electronAPI) or development mode
      const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
      const isDevMode = typeof window !== 'undefined' && !hasElectronAPI

      if (isDevMode) {
        // Use development OSC server for testing
        if (!devOSCServer) {
          devOSCServer = new DevOSCServer(port)
        }
        devOSCServer.start((message: OSCMessage) => {
          // Process incoming message in development mode
          set(state => ({
            incomingMessages: [...state.incomingMessages.slice(-99), message], // Keep last 100 only
            messageHistory: [...state.messageHistory.slice(-99), message],
          }))
        })
      } else {
        // Use electronAPI for real OSC communication - DEVICE CONNECTION (outgoing)
        if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.oscConnectDevice) {
          const deviceResult = await (window as any).electronAPI.oscConnectDevice(connectionId, host, port)
          if (!deviceResult.success) {
            throw new Error(deviceResult.error)
          }
        } else {
          console.warn('❌ electronAPI.oscConnectDevice not available')
        }
      }

      set(state => ({
        connections: state.connections.map(conn =>
          conn.id === connectionId
            ? { ...conn, isConnected: true }
            : conn
        ),
        activeConnectionId: connectionId,
      }))

      // Start availability polling upon successful connection
      get().startAvailabilityPolling()
    } catch (error) {
      set(state => ({
        connections: state.connections.map(conn =>
          conn.id === connectionId
            ? { ...conn, errorCount: conn.errorCount + 1 }
            : conn
        ),
      }))
      throw error
    }
  },

  // Probe the device for an index that matches a given name
  getTrackIndexByName: async (name: string, maxProbe: number = 128, attempts: number = 6) => {
    return getTrackIndexByNameUtil(name, {
      sendMessage: get().sendMessage,
      getState: () => ({ ...get(), activeConnection: get().getActiveConnection() }),
      setState: (updates) => set(updates)
    }, maxProbe, attempts)
  },

  // Probe device for next available track index
  getNextAvailableTrackIndex: async (maxProbe: number = 128) => {
    return getNextAvailableTrackIndexUtil(
      {
        sendMessage: get().sendMessage,
        getState: () => ({ ...get(), activeConnection: get().getActiveConnection() }),
        setState: (updates) => set(updates)
      },
      maxProbe,
      () => useProjectStore.getState().tracks
    )
  },

  // Check device availability
  checkDeviceAvailability: async () => {
    return checkDeviceAvailabilityUtil({
      sendMessage: get().sendMessage,
      getState: () => ({ ...get(), activeConnection: get().getActiveConnection() }),
      setState: (updates) => set(updates)
    })
  },

  startAvailabilityPolling: (intervalMs: number = 5000) => {
    startAvailabilityPollingUtil(
      {
        sendMessage: get().sendMessage,
        getState: () => ({ ...get(), activeConnection: get().getActiveConnection() }),
        setState: (updates) => set(updates)
      },
      intervalMs
    )
  },

  stopAvailabilityPolling: () => {
    stopAvailabilityPollingUtil({
      sendMessage: get().sendMessage,
      getState: () => ({ ...get(), activeConnection: get().getActiveConnection() }),
      setState: (updates) => set(updates)
    })
  },

  disconnect: (connectionId: string) => {
    set(state => ({
      connections: state.connections.map(conn =>
        conn.id === connectionId
          ? { ...conn, isConnected: false }
          : conn
      ),
      activeConnectionId: state.activeConnectionId === connectionId
        ? null
        : state.activeConnectionId,
    }))

    // Stop availability polling
    get().stopAvailabilityPolling()

    // Stop development OSC server
    if (devOSCServer) {
      devOSCServer.stop()
      devOSCServer = null
    }

    // Stop electronAPI OSC device connection
    if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.oscDisconnectDevice) {
      (window as any).electronAPI.oscDisconnectDevice(connectionId)
    }
  },

  removeConnection: (connectionId: string) => {
    set(state => ({
      connections: state.connections.filter(conn => conn.id !== connectionId),
      activeConnectionId: state.activeConnectionId === connectionId
        ? null
        : state.activeConnectionId,
    }))

    // Stop availability polling if active
    get().stopAvailabilityPolling()

    // If this was the active connection, stop the OSC server
    const { connections, activeConnectionId } = get()
    if (activeConnectionId === connectionId) {
      // Stop development OSC server
      if (devOSCServer) {
        devOSCServer.stop()
        devOSCServer = null
      }

      // Stop electronAPI OSC device connection
      if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.oscDisconnectDevice) {
        (window as any).electronAPI.oscDisconnectDevice(activeConnectionId)
      }
    }
  },

  sendMessage: async (address: string, args: (number | string | boolean)[]) => {
    const activeConnection = get().getActiveConnection()
    if (!activeConnection?.isConnected) {
      console.error('No active OSC connection')
      return
    }

    const message: OSCMessage = {
      address,
      args,
      timestamp: Date.now(),
    }

    // Add outgoing message to state immediately (keep last 100 only to prevent memory leak)
    set(state => ({
      outgoingMessages: [...state.outgoingMessages.slice(-99), message],
      messageHistory: [...state.messageHistory.slice(-99), message],
    }))

    try {
      // Check if we're in Electron (has electronAPI) or development mode
      const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
      const isDevMode = typeof window !== 'undefined' && !hasElectronAPI

      if (isDevMode && devOSCServer) {
        // Use development OSC server
        const responseMessage = devOSCServer.sendMessage(activeConnection.host, activeConnection.port, address, args)

        // If the dev server returns a message, process it immediately
        if (responseMessage) {
          set(state => ({
            incomingMessages: [...state.incomingMessages.slice(-99), responseMessage],
            messageHistory: [...state.messageHistory.slice(-99), responseMessage],
          }))
        }
      } else {
        // Use electronAPI for real OSC communication
        if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.oscSendToDevice) {
          await (window as any).electronAPI.oscSendToDevice(activeConnection.id, address, args)
        } else {
          console.warn('❌ electronAPI.oscSendToDevice not available')
        }
      }

      // Update connection stats
      set(state => ({
        connections: state.connections.map(conn =>
          conn.id === activeConnection.id
            ? { ...conn, messageCount: conn.messageCount + 1 }
            : conn
        ),
      }))
    } catch (error) {
      console.error('Failed to send OSC message:', error)

      // Update error count
      set(state => ({
        connections: state.connections.map(conn =>
          conn.id === activeConnection.id
            ? { ...conn, errorCount: conn.errorCount + 1 }
            : conn
        ),
      }))
    }
  },

  sendMessageAsync: (address: string, args: (number | string | boolean)[]) => {
    const activeConnection = get().getActiveConnection()
    if (!activeConnection?.isConnected) {
      // Silently skip if not connected (performance critical path)
      return
    }

    const message: OSCMessage = {
      address,
      args,
      timestamp: Date.now(),
    }

    // Add outgoing message to state (keep last 100 only)
    set(state => ({
      outgoingMessages: [...state.outgoingMessages.slice(-99), message],
      messageHistory: [...state.messageHistory.slice(-99), message],
    }))

    // Fire-and-forget: don't await the response
    const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
    const isDevMode = typeof window !== 'undefined' && !hasElectronAPI

    if (isDevMode && devOSCServer) {
      devOSCServer.sendMessage(activeConnection.host, activeConnection.port, address, args)
    } else {
      if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.oscSendToDevice) {
        // Fire-and-forget: call but don't await
        ;(window as any).electronAPI.oscSendToDevice(activeConnection.id, address, args).catch(() => {
          // Silently handle errors in animation loop to prevent console spam
        })
      }
    }

    // Update connection stats optimistically
    set(state => ({
      connections: state.connections.map(conn =>
        conn.id === activeConnection.id
          ? { ...conn, messageCount: conn.messageCount + 1 }
          : conn
      ),
    }))
  },

  sendBatch: async (batch: OSCBatch) => {
    const activeConnection = get().getActiveConnection()
    if (!activeConnection?.isConnected) {
      console.error('No active OSC connection for batch send')
      return
    }

    if (batch.messages.length === 0) {
      return
    }

    try {
      const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
      const isDevMode = typeof window !== 'undefined' && !hasElectronAPI

      // Don't log every batch - creates massive console spam at 20+ FPS

      if (isDevMode) {
        // Development mode: send each message individually through dev server
        if (devOSCServer) {
          batch.messages.forEach(msg => {
            const address = `/track/${msg.trackIndex}/${msg.coordSystem}`
            const args = [msg.position.x, msg.position.y, msg.position.z]
            devOSCServer!.sendMessage(activeConnection.host, activeConnection.port, address, args)
          })
        } else {
          console.error('   ❌ devOSCServer not available!')
        }
      } else {
        // Production: use batched IPC call
        if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.oscSendBatch) {
          const result = await (window as any).electronAPI.oscSendBatch(activeConnection.id, batch)
          if (!result.success) {
            console.error('❌ OSC batch send failed:', result.error)
          }
        } else {
          console.warn('❌ electronAPI.oscSendBatch not available, falling back to individual sends')
          // Fallback to individual sends
          for (const msg of batch.messages) {
            const address = `/track/${msg.trackIndex}/${msg.coordSystem}`
            const args = [msg.position.x, msg.position.y, msg.position.z]
            await get().sendMessage(address, args)
          }
        }
      }

      // Update connection stats
      set(state => ({
        connections: state.connections.map(conn =>
          conn.id === activeConnection.id
            ? { ...conn, messageCount: conn.messageCount + batch.messages.length }
            : conn
        ),
      }))
    } catch (error) {
      console.error('Failed to send OSC batch:', error)

      // Update error count
      set(state => ({
        connections: state.connections.map(conn =>
          conn.id === activeConnection.id
            ? { ...conn, errorCount: conn.errorCount + 1 }
            : conn
        ),
      }))
    }
  },

  sendBatchAsync: (batch: OSCBatch) => {
    const activeConnection = get().getActiveConnection()
    if (!activeConnection?.isConnected || batch.messages.length === 0) {
      return
    }

    // Fire-and-forget batch send for animation loop
    const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
    const isDevMode = typeof window !== 'undefined' && !hasElectronAPI

    if (isDevMode) {
      if (devOSCServer) {
        batch.messages.forEach(msg => {
          const address = `/track/${msg.trackIndex}/${msg.coordSystem}`
          const args = [msg.position.x, msg.position.y, msg.position.z]
          devOSCServer!.sendMessage(activeConnection.host, activeConnection.port, address, args)
        })
      }
    } else {
      if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.oscSendBatch) {
        // Fire-and-forget: don't await
        ;(window as any).electronAPI.oscSendBatch(activeConnection.id, batch).catch(() => {
          // Silently handle errors to prevent console spam
        })
      }
    }

    // Update connection stats optimistically
    set(state => ({
      connections: state.connections.map(conn =>
        conn.id === activeConnection.id
          ? { ...conn, messageCount: conn.messageCount + batch.messages.length }
          : conn
      ),
    }))
  },

  discoverTracks: async (maxTracks: number = 64, includePositions: boolean = true) => {
    return discoverTracksUtil(
      {
        sendMessage: get().sendMessage,
        getState: () => ({ ...get(), activeConnection: get().getActiveConnection() }),
        setState: (updates) => set(updates)
      },
      maxTracks,
      includePositions
    )
  },

  refreshTrackPosition: async (trackId: string) => {
    const settingsStore = await import('./settingsStore').then(m => m.useSettingsStore.getState())
    return refreshTrackPositionUtil(
      trackId,
      {
        sendMessage: get().sendMessage,
        getState: () => ({ ...get(), activeConnection: get().getActiveConnection() }),
        setState: (updates) => set(updates)
      },
      (id) => useProjectStore.getState().tracks.find(t => t.id === id),
      () => settingsStore.application.defaultCoordinateSystem
    )
  },

  processIncomingMessage: (message: OSCMessage) => {
    // Route through input manager for throttling and filtering
    oscInputManager.receiveMessage(message)
  },
  
  // Internal: Actually process the message (called by inputManager after throttling)
  _processMessageInternal: async (message: OSCMessage) => {
    await processMessageUtil(
      message,
      {
        getState: () => get(),
        setState: (updates) => set(updates),
        handleProbeResponse: (address) => handleProbeResponse(address, {
          sendMessage: get().sendMessage,
          getState: () => ({ ...get(), activeConnection: get().getActiveConnection() }),
          setState: (updates) => set(updates)
        })
      },
      {
        getCueStore: async () => {
          const cueStore = await import('../cues/storeV2').then(m => m.useCueStoreV2.getState())
          return cueStore
        },
        getAnimationStore: async () => {
          const animationStore = await import('./animationStore').then(m => m.useAnimationStore.getState())
          return animationStore
        },
        getProjectStore: async () => {
          const projectStore = await import('./projectStore').then(m => m.useProjectStore.getState())
          return projectStore
        }
      }
    )
  },

  getConnectionById: (id: string) => {
    return get().connections.find(conn => conn.id === id)
  },

  getActiveConnection: () => {
    const { connections, activeConnectionId } = get()
    return activeConnectionId
      ? connections.find(conn => conn.id === activeConnectionId) || null
      : null
  },

  clearMessageHistory: () => {
    set({
      outgoingMessages: [],
      incomingMessages: [],
      messageHistory: [],
    })
  },
  }
})
