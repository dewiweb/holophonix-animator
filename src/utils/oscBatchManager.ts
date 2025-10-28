/**
 * OSC Batch Manager
 * 
 * Optimizes OSC message sending by batching multiple track updates
 * into single IPC calls and OSC bundles, dramatically reducing overhead
 * in multi-track scenarios.
 */

import { Position } from '@/types'

export interface OSCMessage {
  trackIndex: number
  position: Position
  coordSystem: 'xyz' | 'aed'
}

export interface OSCBatch {
  messages: OSCMessage[]
  timestamp: number
}

export interface OSCBatchStats {
  totalBatchesSent: number
  totalMessagesSent: number
  averageBatchSize: number
  lastSendTime: number
  queueLength: number
  lastSendDuration: number
  adaptiveThrottleRate: number
  skippedSends: number
}

/**
 * Manages batching of OSC messages for efficient multi-track animation
 */
export class OSCBatchManager {
  private pendingBatch: OSCBatch = { messages: [], timestamp: 0 }
  private stats: OSCBatchStats = {
    totalBatchesSent: 0,
    totalMessagesSent: 0,
    averageBatchSize: 0,
    lastSendTime: 0,
    queueLength: 0,
    lastSendDuration: 0,
    adaptiveThrottleRate: 50, // Start at 50ms, will adapt
    skippedSends: 0
  }
  
  private sendCallback: ((batch: OSCBatch) => Promise<void>) | null = null
  private maxBatchSize: number = 8 // Balanced batch size (8 tracks per send)
  private isSending: boolean = false // Track if send is in progress
  private abortSend: boolean = false // Flag to abort ongoing send
  private minThrottleRate: number = 33 // 30 FPS - reduces network congestion
  private maxThrottleRate: number = 33 // Fixed rate prevents drift
  
  constructor(sendCallback?: (batch: OSCBatch) => Promise<void>) {
    this.sendCallback = sendCallback || null
  }
  
  /**
   * Set the callback function for sending batches
   */
  setSendCallback(callback: (batch: OSCBatch) => Promise<void>) {
    this.sendCallback = callback
  }
  
  /**
   * Add a track position update to the current batch
   * REAL-TIME PRIORITY: Always replaces old message for same track (latest position wins)
   */
  addMessage(trackIndex: number, position: Position, coordSystem: 'xyz' | 'aed' = 'xyz') {
    // Check if we already have a message for this track in the current batch
    const existingIndex = this.pendingBatch.messages.findIndex(
      msg => msg.trackIndex === trackIndex
    )
    
    if (existingIndex !== -1) {
      // CRITICAL: Update existing message (latest position wins)
      // This prevents sending stale positions from 1-2 seconds ago
      this.pendingBatch.messages[existingIndex] = { trackIndex, position, coordSystem }
    } else {
      // Add new message only if batch has room
      if (this.pendingBatch.messages.length < this.maxBatchSize) {
        this.pendingBatch.messages.push({ trackIndex, position, coordSystem })
      } else {
        // Batch full: force immediate flush to prevent queue buildup
        this.flushBatch()
        // Then add the new message
        this.pendingBatch.messages.push({ trackIndex, position, coordSystem })
      }
    }
    
    // Update timestamp
    this.pendingBatch.timestamp = Date.now()
    
    this.stats.queueLength = this.pendingBatch.messages.length
  }
  
  /**
   * Send the current batch of messages
   * Returns immediately if previous send is still in progress to prevent queue buildup
   */
  async flushBatch(): Promise<boolean> {
    if (this.pendingBatch.messages.length === 0) {
      return false
    }
    
    // CRITICAL: Skip if previous send is still in progress
    // This prevents async queue buildup when sends take longer than throttle interval
    if (this.isSending) {
      this.stats.skippedSends++
      // If we're skipping sends, increase throttle rate to reduce pressure
      this.adjustThrottleRate(true)
      return false
    }
    
    if (!this.sendCallback) {
      console.error('❌ OSC batch manager: No send callback configured')
      return false
    }
    
    const batchToSend = { ...this.pendingBatch }
    const messageCount = batchToSend.messages.length
    
    // Clear the pending batch immediately
    this.pendingBatch = { messages: [], timestamp: Date.now() }
    this.stats.queueLength = 0
    
    // Mark as sending and reset abort flag
    this.isSending = true
    this.abortSend = false
    const sendStartTime = Date.now()
    
    try {
      // Send the batch (this is async and may take time)
      await this.sendCallback(batchToSend)
      
      // Check if we should abort (clearBatch called during send)
      if (this.abortSend) {
        return false
      }
      
      // Measure actual send duration
      const sendDuration = Date.now() - sendStartTime
      this.stats.lastSendDuration = sendDuration
      
      // Update statistics
      this.stats.totalBatchesSent++
      this.stats.totalMessagesSent += messageCount
      this.stats.averageBatchSize = this.stats.totalMessagesSent / this.stats.totalBatchesSent
      this.stats.lastSendTime = Date.now()
      
      // Adjust throttle rate based on actual send time
      this.adjustThrottleRate(false)
      
      return true
    } catch (error) {
      console.error('❌ Failed to send OSC batch:', error)
      return false
    } finally {
      // Always clear sending flag
      this.isSending = false
    }
  }
  
  /**
   * Adjust throttle rate based on performance
   * Much more conservative adjustments to prevent oscillation
   */
  private adjustThrottleRate(forcedSkip: boolean) {
    const currentRate = this.stats.adaptiveThrottleRate
    
    if (forcedSkip) {
      // Skip detected - increase throttle by small amount (10% instead of 20%)
      const newRate = Math.min(currentRate * 1.1, this.maxThrottleRate)
      this.stats.adaptiveThrottleRate = Math.round(newRate)
    } else {
      // Successful send - adjust very gradually based on send duration
      const sendDuration = this.stats.lastSendDuration
      
      if (sendDuration > currentRate * 0.9) {
        // Send took >90% of interval - increase by 10ms only
        const newRate = Math.min(currentRate + 10, this.maxThrottleRate)
        this.stats.adaptiveThrottleRate = newRate
      } else if (sendDuration < currentRate * 0.5 && currentRate > this.minThrottleRate) {
        // Send was fast (<50% of interval) - can decrease by 5ms
        const newRate = Math.max(currentRate - 5, this.minThrottleRate)
        this.stats.adaptiveThrottleRate = newRate
      }
      // If send duration is 50-90% of interval, keep rate stable (goldilocks zone)
    }
  }
  
  /**
   * Get the current adaptive throttle rate
   */
  getAdaptiveThrottleRate(): number {
    return this.stats.adaptiveThrottleRate
  }
  
  /**
   * Clear any pending messages without sending
   */
  clearBatch() {
    const hadMessages = this.pendingBatch.messages.length > 0
    this.pendingBatch = { messages: [], timestamp: Date.now() }
    this.stats.queueLength = 0
    this.abortSend = true // Signal to abort any ongoing send
    this.isSending = false // Also reset sending flag
    
    if (hadMessages) {
      console.log('🛑 OSC batch cleared, aborting any ongoing sends')
    }
  }
  
  /**
   * Get current statistics
   */
  getStats(): OSCBatchStats {
    return { ...this.stats }
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalBatchesSent: 0,
      totalMessagesSent: 0,
      averageBatchSize: 0,
      lastSendTime: 0,
      queueLength: this.pendingBatch.messages.length,
      lastSendDuration: 0,
      adaptiveThrottleRate: 50,
      skippedSends: 0
    }
  }
  
  /**
   * Get number of pending messages
   */
  getPendingCount(): number {
    return this.pendingBatch.messages.length
  }
  
  /**
   * Check if batch has pending messages
   */
  hasPendingMessages(): boolean {
    return this.pendingBatch.messages.length > 0
  }
}

/**
 * Global singleton instance for the application
 */
export const oscBatchManager = new OSCBatchManager()
