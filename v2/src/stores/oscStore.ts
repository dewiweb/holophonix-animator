import { create } from 'zustand'
import { OSCConnection, OSCMessage, OSCConfiguration } from '@/types'
import { generateId } from '@/utils'
import { useProjectStore } from './projectStore'

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
    console.log(`Dev OSC Send: ${address} to ${host}:${port}`, args)

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

        console.log('Dev OSC Receive (simulated):', responseMessage)
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

  // Track discovery
  isDiscoveringTracks: boolean
  discoveredTracks: Array<{ index: number; name: string; position?: { x: number; y: number; z: number } }>

  // Connection control
  connect: (host: string, port: number) => Promise<void>
  disconnect: (connectionId: string) => void
  removeConnection: (connectionId: string) => void
  sendMessage: (address: string, args: (number | string | boolean)[]) => void

  // Track discovery
  discoverTracks: (maxTracks?: number, includePositions?: boolean) => Promise<void>
  refreshTrackPosition: (trackId: string) => Promise<void>

  // Message processing
  processIncomingMessage: (message: OSCMessage) => void

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

export const useOSCStore = create<OSCState>((set, get) => ({
  // Initial state
  connections: [],
  activeConnectionId: null,
  config: defaultConfig,
  outgoingMessages: [],
  incomingMessages: [],
  messageHistory: [],
  isDiscoveringTracks: false,
  discoveredTracks: [],

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
          console.log('📨 Development mode - Processing incoming OSC message:', message)
          set(state => ({
            incomingMessages: [...state.incomingMessages, message],
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

    // Add outgoing message to state immediately
    set(state => ({
      outgoingMessages: [...state.outgoingMessages, message],
      messageHistory: [...state.messageHistory.slice(-99), message], // Keep last 100 messages
    }))

    console.log('OSC Message sent:', message)

    try {
      // Check if we're in Electron (has electronAPI) or development mode
      const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
      const isDevMode = typeof window !== 'undefined' && !hasElectronAPI

      console.log('📤 SendMessage mode detection:', {
        hasElectronAPI: !!hasElectronAPI,
        isDevMode,
        windowType: typeof window,
        electronAPIType: typeof (window as any).electronAPI
      })

      if (isDevMode && devOSCServer) {
        // Use development OSC server
        console.log('🔧 Using development OSC server')
        const responseMessage = devOSCServer.sendMessage(activeConnection.host, activeConnection.port, address, args)

        // If the dev server returns a message, process it immediately
        if (responseMessage) {
          console.log('📨 Processing development response message:', responseMessage)
          set(state => ({
            incomingMessages: [...state.incomingMessages, responseMessage],
            messageHistory: [...state.messageHistory.slice(-99), responseMessage],
          }))
        }
      } else {
        // Use electronAPI for real OSC communication
        console.log('🔗 Using electronAPI for OSC send to device')
        if (typeof window !== 'undefined' && (window as any).electronAPI && (window as any).electronAPI.oscSendToDevice) {
          console.log('📤 Calling electronAPI.oscSendToDevice:', activeConnection.id, address, args)
          const result = await (window as any).electronAPI.oscSendToDevice(activeConnection.id, address, args)
          console.log('📤 OSC send result:', result)
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

  discoverTracks: async (maxTracks: number = 64, includePositions: boolean = true) => {
    const activeConnection = get().getActiveConnection()
    if (!activeConnection?.isConnected) {
      console.error('❌ No active OSC connection for track discovery')
      return
    }

    console.log('🔍 Starting track discovery from Holophonix...')
    console.log('📤 Querying track names and positions...')
    set({ isDiscoveringTracks: true, discoveredTracks: [] })

    // Query each track index for name, position, and color
    for (let i = 1; i <= maxTracks; i++) {
      try {
        // Query track name
        await get().sendMessage('/get', [`/track/${i}/name`])
        await new Promise(resolve => setTimeout(resolve, 50))

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

    console.log(`📤 Sent position query for track ${track.holophonixIndex}`)
  },

  processIncomingMessage: (message: OSCMessage) => {
    set(state => ({
      incomingMessages: [...state.incomingMessages, message],
      messageHistory: [...state.messageHistory.slice(-99), message],
    }))

    console.log('📨 Processing incoming OSC message:', message.address, message.args)

    // Process track name messages - ALWAYS, not just during discovery
    if (message.address.match(/^\/track\/\d+\/name$/)) {
      const parts = message.address.split('/')
      const trackIndex = parseInt(parts[2])
      
      // Handle both array and string args (OSC library inconsistency)
      const trackName = Array.isArray(message.args) ? message.args[0] as string : message.args as string

      if (trackName) {
        console.log(`🎵 Received track ${trackIndex} name: ${trackName}`)
        
        // If in discovery mode, add to discovered tracks
        if (get().isDiscoveringTracks) {
          set(state => ({
            discoveredTracks: [...state.discoveredTracks, { index: trackIndex, name: trackName }]
          }))
        }
        
        // Always update or create track in project store
        const projectStore = useProjectStore.getState()
        const existingTrack = projectStore.tracks.find(t => t.holophonixIndex === trackIndex)
        
        if (existingTrack) {
          // Update existing track name
          console.log(`✏️ Updating track ${trackIndex} name to: ${trackName}`)
          projectStore.updateTrack(existingTrack.id, { name: trackName })
        } else {
          // Create new track with position from discoveredTracks if available
          const discoveredTrack = get().discoveredTracks.find(t => t.index === trackIndex)
          const position = discoveredTrack?.position || { x: 0, y: 0, z: 0 }
          
          console.log(`➕ Creating new track ${trackIndex}: ${trackName}`, position)
          projectStore.addTrack({
            name: trackName,
            type: 'sound-source',
            holophonixIndex: trackIndex,
            position,
            animationState: null,
            isMuted: false,
            isSolo: false,
            isSelected: false,
            volume: 1.0,
          })
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

        // Update discovered track color if in discovery mode
        if (get().isDiscoveringTracks) {
          set(state => ({
            discoveredTracks: state.discoveredTracks.map(track =>
              track.index === trackIndex ? { ...track, color: { r, g, b, a } } : track
            )
          }))
        }

        // Always update track color in project store
        const projectStore = useProjectStore.getState()
        const existingTrack = projectStore.tracks.find(t => t.holophonixIndex === trackIndex)

        if (existingTrack) {
          console.log(`✅ Updating track ${trackIndex} color`)
          projectStore.updateTrack(existingTrack.id, {
            color: { r, g, b, a }
          })
        } else if (get().isDiscoveringTracks) {
          // During discovery, track might not exist yet - color will be used when track is created
          console.log(`🎨 Stored color for track ${trackIndex} (will apply when track is created)`)
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
}))
