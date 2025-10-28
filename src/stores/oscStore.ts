import { create } from 'zustand'
import { OSCConnection, OSCMessage, OSCConfiguration } from '@/types'
import { generateId } from '@/utils'
import { useProjectStore } from './projectStore'
import { oscBatchManager, OSCBatch } from '@/utils/oscBatchManager'
import { oscInputManager } from '@/utils/oscInputManager'

// Development OSC implementation using osc-js for browser testing
class DevOSCServer {
  private port: number
  private isListening: boolean = false
  private messageCallback?: (message: OSCMessage) => void

  constructor(port: number = 8000) {
    this.port = port
  }

  start(callback: (message: OSCMessage) => void) {
    this.messageCallback = callback
    this.isListening = true
    console.log(`Dev OSC Server started on port ${this.port}`)
  }

  stop() {
    this.isListening = false
    this.messageCallback = undefined
    console.log('Dev OSC Server stopped')
  }

  sendMessage(host: string, port: number, address: string, args: any[]) {
    // Immediately log the outgoing message
    const outgoingMessage: OSCMessage = {
      address,
      args,
      timestamp: Date.now(),
    }

    // Simulate receiving the message back for testing (echo response)
    if (this.messageCallback && this.isListening) {
      // Simulate network delay for more realistic testing
      setTimeout(() => {
        const responseMessage: OSCMessage = {
          address,
          args,
          timestamp: Date.now(),
        }

        this.messageCallback?.(responseMessage)
      }, Math.random() * 50 + 10) // 10-60ms delay
    }

    return outgoingMessage
  }
}

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
  sendMessage: (address: string, args: (number | string | boolean)[]) => void
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
  _processMessageInternal: (message: OSCMessage) => void

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

      console.log('🔍 OSC Mode detection:', {
        hasElectronAPI: !!hasElectronAPI,
        isDevMode,
        windowType: typeof window,
        electronAPIType: typeof (window as any).electronAPI
      })

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
        console.log('🔗 Using electronAPI for OSC device connection')
        if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.oscConnectDevice) {
          const deviceResult = await (window as any).electronAPI.oscConnectDevice(connectionId, host, port)
          console.log('🔗 OSC Device connection result:', deviceResult)
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

  // Probe the device for an index that matches a given name; returns null if not found
  getTrackIndexByName: async (name: string, maxProbe: number = 128, attempts: number = 6) => {
    const active = get().getActiveConnection()
    if (!active?.isConnected) return null
    for (let attempt = 0; attempt < attempts; attempt++) {
      // First, check cache quickly
      for (const [idx, n] of get().lastKnownTrackNames.entries()) {
        if (n === name) return idx
      }
      // Probe all indices once this attempt
      for (let i = 1; i <= maxProbe; i++) {
        await get().sendMessage('/get', [`/track/${i}/name`])
        await new Promise(r => setTimeout(r, 15))
      }
      // Wait a bit for responses to be processed
      await new Promise(r => setTimeout(r, 150))
      for (const [idx, n] of get().lastKnownTrackNames.entries()) {
        if (n === name) return idx
      }
    }
    return null
  },

  // Probe device for next available track index by querying names until first missing
  getNextAvailableTrackIndex: async (maxProbe: number = 128) => {
    const active = get().getActiveConnection()
    if (!active?.isConnected) {
      // Fallback to local inference: use max local holophonixIndex + 1
      const projectStore = useProjectStore.getState()
      const used = projectStore.tracks.map(t => t.holophonixIndex).filter((v): v is number => typeof v === 'number')
      const next = used.length ? Math.max(...used) + 1 : 1
      return next
    }

    // Reset failure tracking for this probe
    set({ failedTrackIndices: new Set(), maxValidTrackIndex: null })
    for (let i = 1; i <= maxProbe; i++) {
      await get().sendMessage('/get', [`/track/${i}/name`])
      await new Promise(r => setTimeout(r, 40))
      if (get().failedTrackIndices.has(i)) {
        return i // first missing index
      }
    }
    // If none missing in range, append after max
    return maxProbe + 1
  },

  // Availability: send a lightweight ping command supported by specs
  checkDeviceAvailability: async () => {
    try {
      // Prepare strict probe
      const expected = new Set<string>([
        '/track/1/name'
      ])
      set({ _probePending: true, _probeExpected: expected, _probeDeadline: Date.now() + 900, _probeMatched: false })

      // Send /get query to check device availability
      await get().sendMessage('/get', ['/track/1/name'])

      // Wait until deadline or match
      const waitUntil = async (deadline: number) => {
        while (Date.now() < deadline) {
          if (get()._probeMatched) return true
          await new Promise(r => setTimeout(r, 50))
        }
        return get()._probeMatched
      }
      const ok = await waitUntil((get()._probeDeadline as number) || (Date.now() + 900))
      set({ deviceAvailable: !!ok, lastAvailabilityCheck: Date.now(), lastAvailabilityError: ok ? null : 'No response to availability probe', _probePending: false, _probeExpected: null, _probeDeadline: null })
    } catch (e) {
      set({ deviceAvailable: false, lastAvailabilityCheck: Date.now(), lastAvailabilityError: (e as Error).message })
    }
  },

  startAvailabilityPolling: (intervalMs: number = 5000) => {
    const state = get()
    if (state._availabilityIntervalId) return
    // Immediately check
    get().checkDeviceAvailability()
    const id = window.setInterval(() => {
      const active = get().getActiveConnection()
      if (!active?.isConnected) {
        get().stopAvailabilityPolling()
        return
      }
      get().checkDeviceAvailability()
    }, intervalMs)
    set({ _availabilityIntervalId: id as unknown as number })
  },

  stopAvailabilityPolling: () => {
    const id = get()._availabilityIntervalId
    if (id) {
      window.clearInterval(id as unknown as number)
      set({ _availabilityIntervalId: null })
    }
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
    const activeConnection = get().getActiveConnection()
    if (!activeConnection?.isConnected) {
      console.error('❌ No active OSC connection for track discovery')
      return
    }

    set({ isDiscoveringTracks: true, discoveredTracks: [], failedTrackIndices: new Set(), maxValidTrackIndex: null })

    // Query each track index for name, position, and color
    for (let i = 1; i <= maxTracks; i++) {
      // Check if we've already found this track doesn't exist
      if (get().failedTrackIndices.has(i)) {
        console.log(`⏭️ Skipping track ${i} (known to not exist)`)
        break // Stop discovery completely
      }

      try {
        // Query track name
        await get().sendMessage('/get', [`/track/${i}/name`])
        await new Promise(resolve => setTimeout(resolve, 50))

        // Check if track failed after name query
        if (get().failedTrackIndices.has(i)) {
          console.log(`🛑 Track ${i} doesn't exist, stopping discovery`)
          break
        }

        // Query track position (xyz format)
        if (includePositions) {
          await get().sendMessage('/get', [`/track/${i}/xyz`])
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        // Query track color (RGBA format)
        await get().sendMessage('/get', [`/track/${i}/color`])
        await new Promise(resolve => setTimeout(resolve, 50))
      } catch (error) {
        console.error(`Error querying track ${i}:`, error)
      }
    }

    // Wait for all responses to arrive
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('✅ Track discovery completed')
    set({ isDiscoveringTracks: false })
  },

  refreshTrackPosition: async (trackId: string) => {
    const activeConnection = get().getActiveConnection()
    if (!activeConnection?.isConnected) {
      console.error('❌ No active OSC connection for position refresh')
      return
    }

    const projectStore = useProjectStore.getState()
    const track = projectStore.tracks.find(t => t.id === trackId)

    if (!track || !track.holophonixIndex) {
      console.error('❌ Track not found or missing holophonixIndex')
      return
    }

    console.log(`🔄 Refreshing position for track ${track.holophonixIndex}: ${track.name}`)

    // Query current position from Holophonix - send OSC address directly
    const settingsStore = await import('./settingsStore').then(m => m.useSettingsStore.getState())
    const coordinateSystem = settingsStore.application.defaultCoordinateSystem

    await get().sendMessage('/get', [`/track/${track.holophonixIndex}/${coordinateSystem}`])
  },

  processIncomingMessage: (message: OSCMessage) => {
    // Route through input manager for throttling and filtering
    oscInputManager.receiveMessage(message)
  },
  
  // Internal: Actually process the message (called by inputManager after throttling)
  _processMessageInternal: (message: OSCMessage) => {
    set(state => ({
      incomingMessages: [...state.incomingMessages.slice(-99), message], // Keep last 100 only
      messageHistory: [...state.messageHistory.slice(-99), message],
      lastIncomingAt: Date.now(),
    }))

    // Do not set availability here; rely on strict probe matching only

    // Strict availability probe matching: if an expected response arrives, mark matched
    const st = get()
    if (st._probePending && st._probeExpected && st._probeExpected.has(message.address)) {
      set({ _probeMatched: true, deviceAvailable: true, lastAvailabilityCheck: Date.now(), lastAvailabilityError: null })
    }

    // Handle error messages from Holophonix
    if (message.address === '/error') {
      const errorMsg = Array.isArray(message.args) ? message.args[0] as string : message.args as string
      
      // Check for "Cannot get track" errors
      if (errorMsg && errorMsg.includes('Cannot get track')) {
        // Extract track number from error message like "from Core: Cannot get track,36,name"
        const match = errorMsg.match(/Cannot get track,(\d+)/)
        if (match) {
          const trackIndex = parseInt(match[1])
          console.log(`❌ Track ${trackIndex} does not exist on device`)
          
          // Mark this track as failed
          set(state => {
            const newFailedIndices = new Set(state.failedTrackIndices)
            newFailedIndices.add(trackIndex)
            return {
              failedTrackIndices: newFailedIndices,
              maxValidTrackIndex: trackIndex > 1 ? trackIndex - 1 : null
            }
          })
        }
      }
      return // Don't process error messages further
    }

    // Playback control listener: /anim/play, /anim/pause, /anim/stop, /anim/seek, /anim/gotoStart
    if (message.address.startsWith('/anim/')) {
      const args = Array.isArray(message.args) ? message.args : [message.args]
      const action = message.address.split('/')[2]
      ;(async () => {
        const animationStore = await import('./animationStore').then(m => m.useAnimationStore.getState())
        const projectStore = await import('./projectStore').then(m => m.useProjectStore.getState())
        try {
          if (action === 'play') {
            // Args: [animationIdOrName? (string), ...trackIds?]
            const identifier = typeof args[0] === 'string' ? args[0] : null
            console.log('OSC /anim/play received with args:', args, 'identifier:', identifier)
            let animationId: string | null = null
            let trackIds: string[] = args.slice(1).filter(a => typeof a === 'string') as string[]
            
            if (identifier) {
              // First try to find by ID
              const animationById = projectStore.animations.find(a => a.id === identifier)
              
              // If not found by ID, try to find by name (case-insensitive)
              const animation = animationById || 
                projectStore.animations.find(
                  a => a.name.toLowerCase() === identifier.toLowerCase()
                )
              
              console.log('Found animation:', animation, 'by identifier:', identifier)
              if (animation) {
                animationId = animation.id
              }
            }

            if (!animationId) {
              // Fallback: use the first selected track's animation id if available
              const firstSelected = projectStore.selectedTracks[0]
              const track = projectStore.tracks.find(t => t.id === firstSelected)
              const anim = track?.animationState?.animation
              if (anim) animationId = anim.id
              // Use all selected tracks if no specific tracks provided
              if (trackIds.length === 0) {
                trackIds = [...projectStore.selectedTracks]
              }
            }

            if (animationId) {
              // If no specific tracks provided, find all tracks that have this animation
              if (trackIds.length === 0) {
                trackIds = projectStore.tracks
                  .filter(t => t.animationState?.animation?.id === animationId)
                  .map(t => t.id)
                
                // If no tracks have this animation, use selected tracks as fallback
                if (trackIds.length === 0 && projectStore.selectedTracks.length > 0) {
                  trackIds = [...projectStore.selectedTracks]
                }
              }
              
              console.log('Calling animationStore.playAnimation with ID:', animationId, 'tracks:', trackIds)
              animationStore.playAnimation(animationId, trackIds)
            } else {
              console.warn('OSC /anim/play: No valid animation ID or name provided and no selected track with animation')
            }
          } else if (action === 'pause') {
            // Optional: [animationId]
            const targetAnim = typeof args[0] === 'string' ? (args[0] as string) : null
            if (!targetAnim || targetAnim === animationStore.currentAnimationId) {
              animationStore.pauseAnimation()
            }
          } else if (action === 'stop') {
            // Args: [animationIdOrName? (string)]
            const targetIdentifier = typeof args[0] === 'string' ? args[0] : null
            let shouldStop = false
            
            console.log('OSC /anim/stop received with identifier:', targetIdentifier, 'currentAnimationId:', animationStore.currentAnimationId)
            
            if (targetIdentifier) {
              // First try to find by ID
              const animationById = projectStore.animations.find(a => a.id === targetIdentifier)
              
              // If not found by ID, try to find by name (case-insensitive)
              const animation = animationById || 
                projectStore.animations.find(
                  a => a.name.toLowerCase() === targetIdentifier.toLowerCase()
                )
              
              console.log('OSC /anim/stop found animation:', animation, 'by identifier:', targetIdentifier)
              
              // Stop if this animation is currently playing
              if (animation && animationStore.currentAnimationId === animation.id) {
                shouldStop = true
                console.log('OSC /anim/stop: Animation is currently playing, will stop')
              } else {
                console.log('OSC /anim/stop: Animation found but not currently playing')
              }
            } else {
              // No specific animation: stop any currently playing animation
              shouldStop = true
              console.log('OSC /anim/stop: No specific animation, will stop any playing animation')
            }
            
            if (shouldStop) {
              console.log('Calling animationStore.stopAnimation')
              animationStore.stopAnimation()
            } else {
              console.log('OSC /anim/stop: Will not stop animation')
            }
          } else if (action === 'seek') {
            // Args: [timeSeconds, animationId?]
            const t = typeof args[0] === 'number' ? (args[0] as number) : Number(args[0])
            const targetAnim = typeof args[1] === 'string' ? (args[1] as string) : null
            if (!isNaN(t) && (!targetAnim || targetAnim === animationStore.currentAnimationId)) {
              animationStore.seekTo(t)
            }
          } else if (action === 'gotoStart') {
            // Args: [durationMs?, animationId?]
            const durationMs = typeof args[0] === 'number' ? (args[0] as number) : Number(args[0])
            const hasDuration = !isNaN(durationMs)
            const targetAnim = typeof args[hasDuration ? 1 : 0] === 'string' ? (args[hasDuration ? 1 : 0] as string) : null
            if (!targetAnim || targetAnim === animationStore.currentAnimationId) {
              animationStore.goToStart(hasDuration ? durationMs : undefined)
            }
          }
        } catch (e) {
          console.warn('OSC /anim control error:', e)
        }
      })()
      return
    }

    // Process track name messages - ALWAYS, not just during discovery
    if (message.address.match(/^\/track\/\d+\/name$/)) {
      const parts = message.address.split('/')
      const trackIndex = parseInt(parts[2])
      
      // Handle both array and string args (OSC library inconsistency)
      const trackName = Array.isArray(message.args) ? message.args[0] as string : message.args as string

      if (trackName) {
        console.log(`🎵 Received track ${trackIndex} name: ${trackName}`)
        // Cache last known name
        set(state => {
          const map = new Map(state.lastKnownTrackNames)
          map.set(trackIndex, trackName)
          return { lastKnownTrackNames: map }
        })
        
        // Always check if track already exists
        const projectStore = useProjectStore.getState()
        const existingTrack = projectStore.tracks.find(t => t.holophonixIndex === trackIndex)
        
        if (get().isDiscoveringTracks) {
          // Add to discovered tracks list
          set(state => ({
            discoveredTracks: [...state.discoveredTracks, { index: trackIndex, name: trackName }]
          }))
          console.log(`📋 Added track ${trackIndex} to discovery list`)
          
          // Create track immediately if it doesn't exist (so it appears right away)
          if (!existingTrack) {
            // Check if we already have color/position data for this track
            const discoveredTrack = get().discoveredTracks.find(t => t.index === trackIndex)
            const trackColor = discoveredTrack?.color || { r: 0.5, g: 0.5, b: 0.5, a: 1 } // Default gray
            const trackPosition = discoveredTrack?.position || { x: 0, y: 0, z: 0 }
            
            console.log(`➕ Creating track ${trackIndex} immediately: ${trackName}`, { color: trackColor, position: trackPosition })
            projectStore.addTrack({
              name: trackName,
              type: 'sound-source',
              holophonixIndex: trackIndex,
              position: trackPosition,
              color: trackColor,
              animationState: null,
              isMuted: false,
              isSolo: false,
              isSelected: false,
              volume: 1.0,
            })
          } else {
            // Track exists, just update name
            console.log(`✏️ Updating existing track ${trackIndex} name to: ${trackName}`)
            projectStore.updateTrack(existingTrack.id, { name: trackName })
          }
        } else {
          // NOT in discovery mode: only update existing tracks, do not auto-create to avoid duplicates during creation flow
          const projectStore = useProjectStore.getState()
          const existingTrack = projectStore.tracks.find(t => t.holophonixIndex === trackIndex)
          if (existingTrack) {
            console.log(`✏️ Updating track ${trackIndex} name to: ${trackName}`)
            projectStore.updateTrack(existingTrack.id, { name: trackName })
          } else {
            console.log(`ℹ️ Ignoring incoming name for unknown track ${trackIndex} (not in discovery mode)`) 
          }
        }
      }
    }

    // Process track position updates (xyz or aed)
    if (message.address.match(/^\/track\/\d+\/(xyz|aed)$/)) {
      const parts = message.address.split('/')
      const trackIndex = parseInt(parts[2])
      const coordType = parts[3] // 'xyz' or 'aed'

      // Handle both array and string args
      const args = Array.isArray(message.args) ? message.args : [message.args]
      
      if (args.length >= 3) {
        const [x, y, z] = args as number[]
        console.log(`📍 Track ${trackIndex} position (${coordType}):`, { x, y, z })
        
        // Update discovered track position if in discovery mode
        if (get().isDiscoveringTracks) {
          set(state => ({
            discoveredTracks: state.discoveredTracks.map(track =>
              track.index === trackIndex ? { ...track, position: { x, y, z } } : track
            )
          }))
        }
        
        // Always update track position in project store
        const projectStore = useProjectStore.getState()
        const existingTrack = projectStore.tracks.find(t => t.holophonixIndex === trackIndex)
        
        if (existingTrack) {
          console.log(`✅ Updating track ${trackIndex} position`)
          
          // If track is not currently animating, also update initialPosition
          // This allows user to refresh the base position from Holophonix
          const isAnimating = existingTrack.animationState?.isPlaying
          
          if (isAnimating) {
            // Only update current position (animation is controlling the track)
            projectStore.updateTrack(existingTrack.id, { position: { x, y, z } })
          } else {
            // Update both position and initialPosition (base position changed in Holophonix)
            projectStore.updateTrack(existingTrack.id, { 
              position: { x, y, z },
              initialPosition: { x, y, z }
            })
            console.log(`🔄 Also updated initialPosition (track not animating)`)
          }
        } else if (get().isDiscoveringTracks) {
          // During discovery, track might not exist yet - position will be used when track is created
          console.log(`📍 Stored position for track ${trackIndex} (will apply when track is created)`)
        }
      }
    }

    // Process track color updates (RGBA format)
    if (message.address.match(/^\/track\/\d+\/color$/)) {
      const parts = message.address.split('/')
      const trackIndex = parseInt(parts[2])

      // Handle both array and individual args
      const args = Array.isArray(message.args) ? message.args : [message.args]

      if (args.length >= 4) {
        const [r, g, b, a] = args as number[]
        console.log(`🎨 Track ${trackIndex} color (RGBA):`, { r, g, b, a })

        // If in discovery mode, store color in discoveredTracks
        if (get().isDiscoveringTracks) {
          set(state => {
            const existingDiscovered = state.discoveredTracks.find(t => t.index === trackIndex)
            if (existingDiscovered) {
              // Update existing discovered track
              return {
                discoveredTracks: state.discoveredTracks.map(track =>
                  track.index === trackIndex ? { ...track, color: { r, g, b, a } } : track
                )
              }
            } else {
              // Add new discovered track with just color (name might come later)
              return {
                discoveredTracks: [...state.discoveredTracks, { index: trackIndex, name: '', color: { r, g, b, a } }]
              }
            }
          })
        }

        // Always try to update track color in project store if track exists
        const projectStore = useProjectStore.getState()
        const existingTrack = projectStore.tracks.find(t => t.holophonixIndex === trackIndex)

        if (existingTrack) {
          console.log(`🎨 Updating track ${trackIndex} color to RGBA(${r.toFixed(2)}, ${g.toFixed(2)}, ${b.toFixed(2)}, ${a.toFixed(2)})`)
          projectStore.updateTrack(existingTrack.id, {
            color: { r, g, b, a }
          })
        } else {
          console.log(`🎨 Stored color for track ${trackIndex} (track will use it when created)`)
        }
      }
    }
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
