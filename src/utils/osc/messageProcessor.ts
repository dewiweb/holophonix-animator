import { OSCMessage } from '@/types'
import { debugLog, errorLog, warnLog } from '@/config/debug'

/**
 * OSC Message Processor
 * Handles incoming OSC messages and routes them to appropriate handlers
 */

export interface MessageProcessorState {
  incomingMessages: OSCMessage[]
  messageHistory: OSCMessage[]
  lastIncomingAt: number | null
  lastNonGetIncomingAt: number | null
  isDiscoveringTracks: boolean
  discoveredTracks: Array<{
    index: number
    name: string
    position?: { x: number; y: number; z: number }
    color?: { r: number; g: number; b: number; a: number }
  }>
  failedTrackIndices: Set<number>
  maxValidTrackIndex: number | null
  lastKnownTrackNames: Map<number, string>
}

export interface MessageProcessorActions {
  getState: () => MessageProcessorState
  setState: (updates: Partial<MessageProcessorState>) => void
  handleProbeResponse: (address: string) => void
}

export interface MessageProcessorDependencies {
  getCueStore: () => Promise<{ handleOscTrigger: (address: string, args: any[]) => void }>
  getAnimationStore: () => Promise<{
    currentAnimationId: string | null
    playingAnimations: Map<string, any>
    playAnimation: (animationId: string, trackIds?: string[]) => void
    pauseAnimation: (animationId?: string) => void
    stopAnimation: (animationId?: string) => void
    seekTo: (time: number) => void
    goToStart: (durationMs?: number) => void
  }>
  getProjectStore: () => Promise<{
    tracks: any[]
    animations: any[]
    selectedTracks: string[]
    addTrack: (track: any) => void
    updateTrack: (trackId: string, updates: any) => void
  }>
}

/**
 * Process incoming OSC message
 */
export async function processMessage(
  message: OSCMessage,
  actions: MessageProcessorActions,
  deps: MessageProcessorDependencies
): Promise<void> {
  const state = actions.getState()
  
  // Update message tracking
  actions.setState({
    incomingMessages: [...state.incomingMessages.slice(-99), message],
    messageHistory: [...state.messageHistory.slice(-99), message],
    lastIncomingAt: Date.now()
  })

  // Handle cue triggers
  if (message.address.startsWith('/cue/')) {
    const cueStore = await deps.getCueStore()
    cueStore.handleOscTrigger(message.address, message.args as any[])
  }

  // Handle availability probe responses
  actions.handleProbeResponse(message.address)

  // Handle error messages from Holophonix
  if (message.address === '/error') {
    handleErrorMessage(message, actions)
    return
  }

  // Handle animation control messages
  if (message.address.startsWith('/anim/')) {
    await handleAnimationControl(message, deps)
    return
  }

  // Handle track name messages
  if (message.address.match(/^\/track\/\d+\/name$/)) {
    await handleTrackName(message, actions, deps)
  }

  // Handle track position updates
  if (message.address.match(/^\/track\/\d+\/(xyz|aed)$/)) {
    await handleTrackPosition(message, actions, deps)
  }

  // Handle track color updates
  if (message.address.match(/^\/track\/\d+\/color$/)) {
    await handleTrackColor(message, actions, deps)
  }
}

/**
 * Handle error messages from device
 */
function handleErrorMessage(message: OSCMessage, actions: MessageProcessorActions): void {
  const errorMsg = Array.isArray(message.args) ? message.args[0] as string : message.args as string
  
  // Check for "Cannot get track" errors
  if (errorMsg && errorMsg.includes('Cannot get track')) {
    // Extract track number from error message like "from Core: Cannot get track,36,name"
    const match = errorMsg.match(/Cannot get track,(\d+)/)
    if (match) {
      const trackIndex = parseInt(match[1])
      debugLog(`❌ Track ${trackIndex} does not exist on device`)
      
      // Mark this track as failed
      const state = actions.getState()
      const newFailedIndices = new Set(state.failedTrackIndices)
      newFailedIndices.add(trackIndex)
      
      actions.setState({
        failedTrackIndices: newFailedIndices,
        maxValidTrackIndex: trackIndex > 1 ? trackIndex - 1 : null
      })
    }
  }
}

/**
 * Handle animation control messages (/anim/play, /anim/pause, etc.)
 */
async function handleAnimationControl(
  message: OSCMessage,
  deps: MessageProcessorDependencies
): Promise<void> {
  const args = Array.isArray(message.args) ? message.args : [message.args]
  const action = message.address.split('/')[2]
  
  const animationStore = await deps.getAnimationStore()
  const projectStore = await deps.getProjectStore()

  try {
    switch (action) {
      case 'play':
        await handlePlayCommand(args, animationStore, projectStore)
        break
      case 'pause':
        handlePauseCommand(args, animationStore)
        break
      case 'stop':
        await handleStopCommand(args, animationStore, projectStore)
        break
      case 'seek':
        handleSeekCommand(args, animationStore)
        break
      case 'gotoStart':
        handleGotoStartCommand(args, animationStore)
        break
    }
  } catch (e) {
    warnLog('OSC /anim control error:', e)
  }
}

/**
 * Handle /anim/play command
 */
async function handlePlayCommand(
  args: any[],
  animationStore: any,
  projectStore: any
): Promise<void> {
  const identifier = typeof args[0] === 'string' ? args[0] : null
  debugLog('OSC /anim/play received with args:', args, 'identifier:', identifier)
  
  let animationId: string | null = null
  let trackIds: string[] = args.slice(1).filter(a => typeof a === 'string') as string[]
  
  if (identifier) {
    // Find animation by ID or name
    const animationById = projectStore.animations.find((a: any) => a.id === identifier)
    const animation = animationById || 
      projectStore.animations.find((a: any) => 
        a.name.toLowerCase() === identifier.toLowerCase()
      )
    
    debugLog('Found animation:', animation, 'by identifier:', identifier)
    if (animation) {
      animationId = animation.id
    }
  }

  if (!animationId) {
    // Fallback: use the first selected track's animation
    const firstSelected = projectStore.selectedTracks[0]
    const track = projectStore.tracks.find((t: any) => t.id === firstSelected)
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
        .filter((t: any) => t.animationState?.animation?.id === animationId)
        .map((t: any) => t.id)
      
      // Fallback to selected tracks
      if (trackIds.length === 0 && projectStore.selectedTracks.length > 0) {
        trackIds = [...projectStore.selectedTracks]
      }
    }
    
    debugLog('Calling animationStore.playAnimation with ID:', animationId, 'tracks:', trackIds)
    animationStore.playAnimation(animationId, trackIds)
  } else {
    warnLog('OSC /anim/play: No valid animation ID or name provided')
  }
}

/**
 * Handle /anim/pause command
 */
function handlePauseCommand(args: any[], animationStore: any): void {
  const targetAnim = typeof args[0] === 'string' ? args[0] as string : null
  if (!targetAnim || targetAnim === animationStore.currentAnimationId) {
    animationStore.pauseAnimation()
  }
}

/**
 * Handle /anim/stop command
 */
async function handleStopCommand(
  args: any[],
  animationStore: any,
  projectStore: any
): Promise<void> {
  const targetIdentifier = typeof args[0] === 'string' ? args[0] : null
  let shouldStop = false
  
  debugLog('OSC /anim/stop received with identifier:', targetIdentifier, 'currentAnimationId:', animationStore.currentAnimationId)
  
  if (targetIdentifier) {
    // Find animation by ID or name
    const animationById = projectStore.animations.find((a: any) => a.id === targetIdentifier)
    const animation = animationById || 
      projectStore.animations.find((a: any) => 
        a.name.toLowerCase() === targetIdentifier.toLowerCase()
      )
    
    debugLog('OSC /anim/stop found animation:', animation, 'by identifier:', targetIdentifier)
    
    // Stop if this animation is currently playing
    if (animation && animationStore.currentAnimationId === animation.id) {
      shouldStop = true
      debugLog('OSC /anim/stop: Animation is currently playing, will stop')
    } else {
      debugLog('OSC /anim/stop: Animation found but not currently playing')
    }
  } else {
    // No specific animation: stop any currently playing animation
    shouldStop = true
    debugLog('OSC /anim/stop: No specific animation, will stop any playing animation')
  }
  
  if (shouldStop) {
    debugLog('Calling animationStore.stopAnimation')
    animationStore.stopAnimation()
  } else {
    debugLog('OSC /anim/stop: Will not stop animation')
  }
}

/**
 * Handle /anim/seek command
 */
function handleSeekCommand(args: any[], animationStore: any): void {
  const t = typeof args[0] === 'number' ? args[0] as number : Number(args[0])
  const targetAnim = typeof args[1] === 'string' ? args[1] as string : null
  
  if (!isNaN(t) && (!targetAnim || targetAnim === animationStore.currentAnimationId)) {
    animationStore.seekTo(t)
  }
}

/**
 * Handle /anim/gotoStart command
 */
function handleGotoStartCommand(args: any[], animationStore: any): void {
  const durationMs = typeof args[0] === 'number' ? args[0] as number : Number(args[0])
  const hasDuration = !isNaN(durationMs)
  const targetAnim = typeof args[hasDuration ? 1 : 0] === 'string' ? args[hasDuration ? 1 : 0] as string : null
  
  if (!targetAnim || targetAnim === animationStore.currentAnimationId) {
    animationStore.goToStart(hasDuration ? durationMs : undefined)
  }
}

/**
 * Handle track name messages
 */
async function handleTrackName(
  message: OSCMessage,
  actions: MessageProcessorActions,
  deps: MessageProcessorDependencies
): Promise<void> {
  const parts = message.address.split('/')
  const trackIndex = parseInt(parts[2])
  const trackName = Array.isArray(message.args) ? message.args[0] as string : message.args as string

  if (!trackName) return

  debugLog(`🎵 Received track ${trackIndex} name: ${trackName}`)
  
  // Cache last known name
  const state = actions.getState()
  const map = new Map(state.lastKnownTrackNames)
  map.set(trackIndex, trackName)
  actions.setState({ lastKnownTrackNames: map })
  
  const projectStore = await deps.getProjectStore()
  const existingTrack = projectStore.tracks.find((t: any) => t.holophonixIndex === trackIndex)
  
  if (state.isDiscoveringTracks) {
    // Add to discovered tracks list
    actions.setState({
      discoveredTracks: [...state.discoveredTracks, { index: trackIndex, name: trackName }]
    })
    debugLog(`📋 Added track ${trackIndex} to discovery list`)
    
    // Create track immediately if it doesn't exist
    if (!existingTrack) {
      const discoveredTrack = state.discoveredTracks.find(t => t.index === trackIndex)
      const trackColor = discoveredTrack?.color || { r: 0.5, g: 0.5, b: 0.5, a: 1 }
      const trackPosition = discoveredTrack?.position || { x: 0, y: 0, z: 0 }
      
      debugLog(`➕ Creating track ${trackIndex} immediately: ${trackName}`, { color: trackColor, position: trackPosition })
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
      debugLog(`✏️ Updating existing track ${trackIndex} name to: ${trackName}`)
      projectStore.updateTrack(existingTrack.id, { name: trackName })
    }
  } else {
    // Not in discovery mode: only update existing tracks
    if (existingTrack) {
      debugLog(`✏️ Updating track ${trackIndex} name to: ${trackName}`)
      projectStore.updateTrack(existingTrack.id, { name: trackName })
    } else {
      debugLog(`ℹ️ Ignoring incoming name for unknown track ${trackIndex} (not in discovery mode)`)
    }
  }
}

/**
 * Handle track position messages
 */
async function handleTrackPosition(
  message: OSCMessage,
  actions: MessageProcessorActions,
  deps: MessageProcessorDependencies
): Promise<void> {
  const parts = message.address.split('/')
  const trackIndex = parseInt(parts[2])
  const coordType = parts[3] // 'xyz' or 'aed'

  const args = Array.isArray(message.args) ? message.args : [message.args]
  
  if (args.length < 3) return

  const [x, y, z] = args as number[]
  debugLog(`📍 Track ${trackIndex} position (${coordType}):`, { x, y, z })
  
  const state = actions.getState()
  
  // Update discovered track position if in discovery mode
  if (state.isDiscoveringTracks) {
    actions.setState({
      discoveredTracks: state.discoveredTracks.map(track =>
        track.index === trackIndex ? { ...track, position: { x, y, z } } : track
      )
    })
  }
  
  // Always update track position in project store
  const projectStore = await deps.getProjectStore()
  const existingTrack = projectStore.tracks.find((t: any) => t.holophonixIndex === trackIndex)
  
  if (existingTrack) {
    debugLog(`✅ Updating track ${trackIndex} position`)
    
    // Check if track is animating
    const animationStore = await deps.getAnimationStore()
    let isAnimating = false
    let foundInAnimationId = null
    
    // Check all playing animations (including paused ones)
    animationStore.playingAnimations.forEach((animation: any, animId: string) => {
      if (animation.trackIds.includes(existingTrack.id)) {
        isAnimating = true
        foundInAnimationId = animId
      }
    })
    
    debugLog(`🔍 Track ${existingTrack.name} (${existingTrack.id}): playing=${animationStore.playingAnimations.size}, found=${isAnimating}, animId=${foundInAnimationId}`)
    
    if (isAnimating) {
      // Animation is controlling the track - don't update position
      debugLog(`🔒 Animation active (or paused) - ignoring OSC position update`)
    } else {
      // Update both position and initialPosition
      projectStore.updateTrack(existingTrack.id, { 
        position: { x, y, z },
        initialPosition: { x, y, z }
      })
      debugLog(`🔄 Also updated initialPosition (track not animating)`)
    }
  } else if (state.isDiscoveringTracks) {
    debugLog(`📍 Stored position for track ${trackIndex} (will apply when track is created)`)
  }
}

/**
 * Handle track color messages
 */
async function handleTrackColor(
  message: OSCMessage,
  actions: MessageProcessorActions,
  deps: MessageProcessorDependencies
): Promise<void> {
  const parts = message.address.split('/')
  const trackIndex = parseInt(parts[2])

  const args = Array.isArray(message.args) ? message.args : [message.args]

  if (args.length < 4) return

  const [r, g, b, a] = args as number[]
  debugLog(`🎨 Track ${trackIndex} color (RGBA):`, { r, g, b, a })

  const state = actions.getState()
  
  // If in discovery mode, store color in discoveredTracks
  if (state.isDiscoveringTracks) {
    const existingDiscovered = state.discoveredTracks.find(t => t.index === trackIndex)
    if (existingDiscovered) {
      actions.setState({
        discoveredTracks: state.discoveredTracks.map(track =>
          track.index === trackIndex ? { ...track, color: { r, g, b, a } } : track
        )
      })
    } else {
      actions.setState({
        discoveredTracks: [...state.discoveredTracks, { index: trackIndex, name: '', color: { r, g, b, a } }]
      })
    }
  }

  // Always try to update track color in project store
  const projectStore = await deps.getProjectStore()
  const existingTrack = projectStore.tracks.find((t: any) => t.holophonixIndex === trackIndex)

  if (existingTrack) {
    debugLog(`🎨 Updating track ${trackIndex} color to RGBA(${r.toFixed(2)}, ${g.toFixed(2)}, ${b.toFixed(2)}, ${a.toFixed(2)})`)
    projectStore.updateTrack(existingTrack.id, {
      color: { r, g, b, a }
    })
  } else {
    debugLog(`🎨 Stored color for track ${trackIndex} (track will use it when created)`)
  }
}
