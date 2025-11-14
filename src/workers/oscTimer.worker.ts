/**
 * OSC Timer Web Worker
 * 
 * Runs in a separate thread to provide consistent timing
 * even when the main window is minimized or throttled.
 * 
 * Web Workers are NOT throttled by browser visibility changes,
 * ensuring OSC messages are sent at a consistent rate.
 */

let intervalId: number | null = null
let isRunning = false

// Listen for messages from main thread
self.onmessage = (e: MessageEvent) => {
  const { type, interval } = e.data

  switch (type) {
    case 'start':
      if (!isRunning) {
        isRunning = true
        console.log(`⏱️ [OSC Worker] Starting timer with ${interval}ms interval`)
        
        // Use setInterval in worker context (not throttled!)
        intervalId = self.setInterval(() => {
          // Post tick message back to main thread
          self.postMessage({ type: 'tick', timestamp: Date.now() })
        }, interval) as unknown as number
      }
      break

    case 'stop':
      if (isRunning && intervalId !== null) {
        console.log('⏸️ [OSC Worker] Stopping timer')
        self.clearInterval(intervalId)
        intervalId = null
        isRunning = false
      }
      break

    case 'ping':
      // Health check
      self.postMessage({ type: 'pong', timestamp: Date.now() })
      break
  }
}

// Export empty object for TypeScript
export {}
