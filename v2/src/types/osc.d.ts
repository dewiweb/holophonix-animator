declare module 'osc' {
  export class UDPPort {
    constructor(config: {
      localAddress?: string
      localPort?: number
      remoteAddress?: string
      remotePort?: number
      metadata?: boolean
    })
    send(message: { address: string; args: any[] }): void
    open(): void
    close(): void
    port: number
    on(event: string, listener: Function): void
  }

  export interface OSCMessage {
    address: string
    args: any[]
    timestamp?: number
  }

  export interface OSCBundle {
    timetag: number
    packets: (OSCMessage | OSCBundle)[]
  }

  export function readMessage(buffer: Buffer): OSCMessage | null

  export function writeMessage(message: { address: string; args: any[] }): Buffer

  export class OSCServer {
    constructor(port: number, host?: string)
    on(event: 'message', callback: (message: OSCMessage, remote: { address: string; port: number }) => void): void
    on(event: 'error', callback: (error: Error) => void): void
    close(): void
    port: number
  }
}
