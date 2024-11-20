declare module 'osc' {
  import * as dgram from 'dgram';

  type OSCBasicType = 
    | "i" | "int32"     // 32-bit integer
    | "f" | "float32"   // 32-bit float
    | "s" | "string"    // String
    | "b" | "blob"      // Blob
    | "h" | "int64"     // 64-bit integer
    | "t" | "timetag"   // OSC Time Tag
    | "d" | "float64"   // 64-bit float
    | "S" | "symbol"    // Symbol
    | "c" | "char"      // Character
    | "r" | "rgba"      // RGBA Color
    | "m" | "midi"      // MIDI Message
    | "T" | "true"      // True
    | "F" | "false"     // False
    | "N" | "null"      // Null
    | "I" | "impulse"   // Impulse
    | "[" | "array"     // Array start
    | "]";             // Array end

  interface OSCArgument {
    type: OSCBasicType;
    value: number | string | boolean | Uint8Array | null;
  }

  interface OSCMessage {
    address: string;
    args: Array<OSCArgument | any>;
  }

  interface OSCBundle {
    timeTag: number;
    packets: Array<OSCMessage | OSCBundle>;
  }

  type OSCPacket = OSCMessage | OSCBundle;

  interface UDPPortOptions {
    localAddress?: string;
    localPort?: number;
    remoteAddress?: string;
    remotePort?: number;
    metadata?: boolean;
    socket?: dgram.Socket;
  }

  class UDPPort {
    constructor(options?: UDPPortOptions);
    
    socket: dgram.Socket;

    on(event: 'ready', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'message', listener: (message: OSCMessage, timeTag?: number, info?: any) => void): this;
    on(event: 'bundle', listener: (bundle: OSCBundle, timeTag?: number, info?: any) => void): this;
    on(event: string, listener: Function): this;

    removeListener(event: string, listener: Function): this;
    
    open(): void;
    close(): void;
    send(packet: OSCPacket): void;
  }

  function writeMessage(message: OSCMessage): Buffer;
  function readMessage(buffer: Buffer, options?: any): OSCMessage;

  export { UDPPort, OSCMessage, OSCBundle, OSCPacket, OSCArgument, OSCBasicType, writeMessage, readMessage };
}
