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

    try {
      // Validate port number
      if (port <= 0 || port >= 65536) {
        this.connected = false;
        throw new Error('Invalid port number');
      }

      // Create an OSC UDP Port
      const localPort = new (osc as any).UDPPort({
        localAddress: "0.0.0.0",
        localPort: 0,  // Use 0 to let the OS assign a random port
        remoteAddress: host,
        remotePort: port,
        metadata: true
      });

      // Listen for errors
      localPort.on("error", (err: Error) => {
        console.error('UDP Client error:', err);
        this.connected = false;
      });

      // Listen for ready state
      localPort.on("ready", () => {
        this.connected = true;
      });

      // Open the port
      localPort.open();
      
      try {
        this.oscPort = localPort;
      } catch (err) {
        console.error('Error creating UDP client:', err);
        this.connected = false;
        throw err;
      }

      // Ajoutez une vérification pour les numéros de port
      if (localPort < 1024 || localPort > 65535) {
        throw new Error('Invalid port number');
      }

      this.oscPort = localPort;
    } catch (err) {
      console.error('Error creating UDP client:', err);
      this.connected = false;
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
          args: message.args.map(arg => ({
            type: typeof arg === 'number' ? 'f' : 
                  typeof arg === 'string' ? 's' :
                  typeof arg === 'boolean' ? arg ? 'T' : 'F' : '?',
            value: arg
          }))
        };

        this.oscPort!.send(oscMessage);
        resolve();
      } catch (err) {
        console.error('OSC message creation error:', err);
        reject(new Error('Failed to send OSC message'));
      }
    });
  }

  public async close(): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (this.oscPort) {
          if (this.oscPort.isReady) {
            this.oscPort.close();
          }
          this.oscPort = null;
        }
      } catch (err) {
        console.error('Error closing port:', err);
      } finally {
        this.connected = false;
        resolve();
      }
    });
  }
}
