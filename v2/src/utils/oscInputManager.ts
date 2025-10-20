/**
 * OSC Input Manager
 * 
 * Handles incoming OSC messages from Holophonix with throttling and
 * smart filtering to prevent feedback loops and state update storms
 */

import { OSCMessage } from '@/types'

export interface OSCInputStats {
  totalReceived: number
  totalProcessed: number
  totalIgnored: number
  lastReceiveTime: number
  messagesPerSecond: number
}

/**
 * Manages incoming OSC message processing with throttling and filtering
 */
export class OSCInputManager {
  private stats: OSCInputStats = {
    totalReceived: 0,
    totalProcessed: 0,
    totalIgnored: 0,
    lastReceiveTime: 0,
    messagesPerSecond: 0
  }
  
  private pendingMessages: Map<string, OSCMessage> = new Map()
  private processCallback: ((message: OSCMessage) => void) | null = null
  private throttleInterval: number = 100 // 100ms = 10 Hz for incoming
  private lastProcessTime: number = 0
  
  // Tracks that are currently being animated (ignore their incoming positions)
  private animatingTracks: Set<number> = new Set()
  
  // Message rate tracking for statistics
  private messageTimestamps: number[] = []
  private rateWindowMs: number = 1000 // 1 second window
  
  constructor(processCallback?: (message: OSCMessage) => void, throttleMs: number = 100) {
    this.processCallback = processCallback || null
    this.throttleInterval = throttleMs
    
    // Start processing loop
    this.startProcessingLoop()
  }
  
  /**
   * Set callback for processing messages
   */
  setProcessCallback(callback: (message: OSCMessage) => void) {
    this.processCallback = callback
  }
  
  /**
   * Set throttle interval for processing incoming messages
   */
  setThrottleInterval(ms: number) {
    this.throttleInterval = ms
  }
  
  /**
   * Mark tracks as currently animating (ignore their incoming positions)
   */
  setAnimatingTracks(trackIndices: number[]) {
    this.animatingTracks = new Set(trackIndices)
    console.log(`🎬 Animating tracks updated: ${trackIndices.length} tracks`, trackIndices)
  }
  
  /**
   * Clear animating tracks (we care about incoming positions again)
   */
  clearAnimatingTracks() {
    this.animatingTracks.clear()
    console.log('🎬 All tracks stopped animating, listening to incoming positions')
  }
  
  /**
   * Receive an incoming OSC message
   */
  receiveMessage(message: OSCMessage) {
    this.stats.totalReceived++
    this.stats.lastReceiveTime = Date.now()
    
    // Update message rate statistics
    this.updateMessageRate()
    
    // Check if this is a position message for an animating track
    if (this.shouldIgnoreMessage(message)) {
      this.stats.totalIgnored++
      console.log(`🚫 Ignoring incoming message for animating track: ${message.address}`)
      return
    }
    
    // Store message (deduplicate by address - latest wins)
    this.pendingMessages.set(message.address, message)
  }
  
  /**
   * Check if we should ignore this message (e.g., position updates during animation)
   */
  private shouldIgnoreMessage(message: OSCMessage): boolean {
    // Check if it's a position message
    const positionMatch = message.address.match(/^\/track\/(\d+)\/(xyz|aed)$/)
    if (!positionMatch) {
      return false // Not a position message, don't ignore
    }
    
    const trackIndex = parseInt(positionMatch[1])
    
    // Ignore if track is currently being animated by us
    if (this.animatingTracks.has(trackIndex)) {
      return true
    }
    
    return false
  }
  
  /**
   * Process pending messages (called by internal loop)
   */
  private async processPendingMessages() {
    if (this.pendingMessages.size === 0) {
      return
    }
    
    if (!this.processCallback) {
      console.warn('⚠️ No process callback set for OSC input manager')
      return
    }
    
    const now = Date.now()
    if (now - this.lastProcessTime < this.throttleInterval) {
      return // Throttle not elapsed yet
    }
    
    // Process all pending messages
    const messages = Array.from(this.pendingMessages.values())
    this.pendingMessages.clear()
    
    console.log(`📥 Processing ${messages.length} incoming OSC messages`)
    
    for (const message of messages) {
      try {
        this.processCallback(message)
        this.stats.totalProcessed++
      } catch (error) {
        console.error('❌ Error processing incoming OSC message:', error)
      }
    }
    
    this.lastProcessTime = now
  }
  
  /**
   * Start the processing loop
   */
  private startProcessingLoop() {
    const loop = () => {
      this.processPendingMessages()
      setTimeout(loop, 50) // Check every 50ms
    }
    loop()
  }
  
  /**
   * Update message rate statistics
   */
  private updateMessageRate() {
    const now = Date.now()
    
    // Add current timestamp
    this.messageTimestamps.push(now)
    
    // Remove timestamps outside the window
    this.messageTimestamps = this.messageTimestamps.filter(
      ts => now - ts < this.rateWindowMs
    )
    
    // Calculate messages per second
    this.stats.messagesPerSecond = this.messageTimestamps.length
  }
  
  /**
   * Get current statistics
   */
  getStats(): OSCInputStats {
    return { ...this.stats }
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalReceived: 0,
      totalProcessed: 0,
      totalIgnored: 0,
      lastReceiveTime: 0,
      messagesPerSecond: 0
    }
    this.messageTimestamps = []
  }
  
  /**
   * Get number of pending messages
   */
  getPendingCount(): number {
    return this.pendingMessages.size
  }
  
  /**
   * Clear all pending messages
   */
  clearPending() {
    this.pendingMessages.clear()
  }
}

/**
 * Global singleton instance
 */
export const oscInputManager = new OSCInputManager()
