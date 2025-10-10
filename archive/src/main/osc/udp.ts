import { OscMessage } from './types';
import * as osc from 'osc';

interface OscPort {
  on(event: string, callback: (...args: any[]) => void): void;
  open(): void;
  close(): void;
  send(message: any): void;
  isReady?: boolean;
}

export class OscUdpClient {
  private connected: boolean = false;
  private host: string;
  private port: number;
  private oscPort: OscPort | null = null;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;

    // Validate port number
    if (port <= 0 || port >= 65536) {
      throw new Error('Invalid port number');
    }

    try {
      // Create an OSC UDP Port with proper type casting
      const localPort = new (osc as any).UDPPort({
        localAddress: "0.0.0.0",
        localPort: 0,  // Use 0 to let the OS assign a random port
        remoteAddress: host,
        remotePort: port,
        metadata: true,
        unref: true  // Allow the process to exit even if port is open
      });

      // Listen for errors
      localPort.on("error", (err: Error) => {
        console.error('UDP Client error:', err);
        this.connected = false;
        this.oscPort = null;
      });

      // Listen for ready state
      localPort.on("ready", () => {
        this.connected = true;
      });

      // Listen for close event
      localPort.on("close", () => {
        this.connected = false;
        this.oscPort = null;
      });

      // Open the port
      localPort.open();
      
      this.oscPort = localPort;
    } catch (err) {
      console.error('Error creating UDP client:', err);
      throw err;
    }
  }

  public isConnected(): boolean {
    return this.connected && !!this.oscPort;
  }

  public getPort(): number {
    return this.port;
  }

  public getHost(): string {
    return this.host;
  }

  public async send(message: OscMessage): Promise<void> {
    if (!this.isConnected() || !this.oscPort) {
      throw new Error('Failed to send OSC message: client not connected');
    }

    return new Promise((resolve, reject) => {
      try {
        // Convert our message format to OSC format
        const oscMessage = {
          address: message.address,
          args: message.args.map(arg => {
            // Handle null and undefined
            if (arg === null || arg === undefined) {
              return { type: 'N', value: null };
            }

            // Handle basic types
            if (typeof arg === 'number') {
              return { type: Number.isInteger(arg) ? 'i' : 'f', value: arg };
            }
            if (typeof arg === 'string') {
              return { type: 's', value: arg };
            }
            if (typeof arg === 'boolean') {
              return { type: arg ? 'T' : 'F', value: arg };
            }

            // Handle arrays
            if (Array.isArray(arg)) {
              return { type: 'a', value: arg };
            }

            // Handle objects - reject them directly
            if (typeof arg === 'object') {
              throw new Error('Unsupported argument type: object');
            }
            
            throw new Error(`Unsupported argument type: ${typeof arg}`);
          })
        };

        try {
          this.oscPort!.send(oscMessage);
          resolve();
        } catch (sendErr) {
          reject(new Error(`Failed to send OSC message: ${(sendErr as Error).message}`));
        }
      } catch (err) {
        reject(new Error(`Failed to send OSC message: ${(err as Error).message}`));
      }
    });
  }

  public async close(): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (this.oscPort) {
          // Always try to close the port, regardless of ready state
          try {
            this.oscPort.close();
          } catch (closeErr) {
            console.error('Error during port close:', closeErr);
          }
          // Remove all listeners to prevent memory leaks
          this.oscPort.on = () => {};
          this.oscPort = null;
        }
      } catch (err) {
        console.error('Error in close method:', err);
      } finally {
        this.connected = false;
        resolve();
      }
    });
  }
}
