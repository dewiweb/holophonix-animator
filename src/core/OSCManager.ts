import { EventEmitter } from 'events';
import { OSCConfig, OSCMessage } from '../shared/types';
import { OSCManager as NativeOSC } from '../bindings';

export class OSCManager extends EventEmitter {
  private native: NativeOSC;
  private config: OSCConfig;

  constructor(config: OSCConfig) {
    super();
    this.config = config;
    this.native = new NativeOSC();
  }

  async connect(): Promise<void> {
    await this.native.connect(
      this.config.host,
      this.config.port,
      this.config.port, // Use same port for send/receive in POC
      this.config.port + 1 // Receive on next port
    );
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    await this.native.disconnect();
    this.emit('disconnected');
  }

  async updateConfig(config: OSCConfig): Promise<void> {
    this.config = config;
    if (this.native.is_connected()) {
      await this.disconnect();
      await this.connect();
    }
  }

  async send(message: OSCMessage): Promise<void> {
    if (!this.native.is_connected()) {
      throw new Error('Not connected to OSC server');
    }
    await this.native.send(message);
  }

  getIsConnected(): boolean {
    return this.native.is_connected();
  }
}
