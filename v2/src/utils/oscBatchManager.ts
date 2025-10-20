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
    queueLength: 0
  }
  
  private sendCallback: ((batch: OSCBatch) => Promise<void>) | null = null
  private maxBatchSize: number = 100
  
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
   */
  addMessage(trackIndex: number, position: Position, coordSystem: 'xyz' | 'aed' = 'xyz') {
    // Check if we already have a message for this track in the current batch
    const existingIndex = this.pendingBatch.messages.findIndex(
      msg => msg.trackIndex === trackIndex
    )
    
    if (existingIndex !== -1) {
      // Update existing message (latest position wins)
      this.pendingBatch.messages[existingIndex] = { trackIndex, position, coordSystem }
    } else {
      // Add new message
      this.pendingBatch.messages.push({ trackIndex, position, coordSystem })
    }
    
    // Update timestamp
    this.pendingBatch.timestamp = Date.now()
    
    // Auto-flush if batch is getting too large
    if (this.pendingBatch.messages.length >= this.maxBatchSize) {
      console.warn('⚠️ OSC batch size limit reached, auto-flushing')
      this.flushBatch()
    }
    
    this.stats.queueLength = this.pendingBatch.messages.length
  }
  
  /**
   * Send the current batch of messages
   */
  async flushBatch(): Promise<boolean> {
    if (this.pendingBatch.messages.length === 0) {
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
    
    try {
      // Send the batch
      await this.sendCallback(batchToSend)
      
      // Update statistics
      this.stats.totalBatchesSent++
      this.stats.totalMessagesSent += messageCount
      this.stats.averageBatchSize = this.stats.totalMessagesSent / this.stats.totalBatchesSent
      this.stats.lastSendTime = Date.now()
      
      return true
    } catch (error) {
      console.error('❌ Failed to send OSC batch:', error)
      return false
    }
  }
  
  /**
   * Clear any pending messages without sending
   */
  clearBatch() {
    const hadMessages = this.pendingBatch.messages.length > 0
    this.pendingBatch = { messages: [], timestamp: Date.now() }
    this.stats.queueLength = 0
    
    if (hadMessages) {
      console.log('🧹 Cleared pending OSC batch')
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
      queueLength: this.pendingBatch.messages.length
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
