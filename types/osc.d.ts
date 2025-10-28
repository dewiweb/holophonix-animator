declare module 'osc' {
  export interface OSCMessage {
    address: string
    args: any[]
  }

  export interface UDPPortOptions {
    localAddress?: string
    localPort?: number
    remoteAddress?: string
    remotePort?: number
    broadcast?: boolean
    multicastTTL?: number
    multicastMembership?: string[]
    metadata?: boolean
  }

  export class UDPPort {
    constructor(options: UDPPortOptions)
    open(): void
    close(): void
    send(message: OSCMessage): void
    on(event: string, callback: (...args: any[]) => void): void
    socket: any
  }

  export function readMessage(buffer: Buffer): OSCMessage | null
  export function writeMessage(message: OSCMessage): Buffer
}
