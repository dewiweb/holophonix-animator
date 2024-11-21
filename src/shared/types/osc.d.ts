declare module 'osc' {
  import { EventEmitter } from 'events';

  interface UDPPortOptions {
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remotePort?: number;
    metadata?: boolean;
  }

  export class UDPPort extends EventEmitter {
    constructor(options?: UDPPortOptions);
    open(): void;
    close(): void;
    send(message: any): void;
  }
}
