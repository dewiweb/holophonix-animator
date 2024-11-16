declare module 'osc' {
  export interface UDPPortOptions {
    localAddress: string;
    localPort: number;
    remoteAddress: string;
    remotePort: number;
    metadata?: boolean;
  }

  export class UDPPort {
    constructor(options: UDPPortOptions);
    on(event: string, listener: (...args: any[]) => void): void;
    open(): void;
    close(): void;
    send(message: { address: string; args: any[] }): void;
  }
}
