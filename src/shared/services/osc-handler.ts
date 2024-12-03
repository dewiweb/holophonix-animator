import { EventEmitter } from 'events';
import { OSCMessage, OSCConfig } from '../types/osc.types';

export class OSCHandler extends EventEmitter {
  private config: OSCConfig;
  private connected: boolean = false;

  constructor(config: OSCConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.emit('ready');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async send(message: OSCMessage): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    // In a real implementation, this would send the OSC message
  }

  isConnected(): boolean {
    return this.connected;
  }
}
