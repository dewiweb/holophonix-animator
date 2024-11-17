declare module 'osc' {
  interface UDPPortOptions {
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remotePort?: number;
    metadata?: boolean;
  }

  interface OSCMessage {
    address: string;
    args: any[];
  }

  class UDPPort {
    constructor(options?: UDPPortOptions);
    
    on(event: 'ready', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'message', listener: (message: OSCMessage) => void): this;
    on(event: string, listener: Function): this;

    removeListener(event: string, listener: Function): this;
    
    open(): void;
    close(): void;
    send(message: OSCMessage): void;
  }

  export { UDPPort, OSCMessage };
}
