import { OSCMessage } from '@/types'

/**
 * Development OSC Server for browser testing
 * Simulates OSC communication without needing Electron's native UDP
 */
export class DevOSCServer {
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

  getPort(): number {
    return this.port
  }

  getIsListening(): boolean {
    return this.isListening
  }
}
