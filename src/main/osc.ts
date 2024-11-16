import { ipcMain } from 'electron';
import { UDPPort } from 'osc';
import EventEmitter from 'events';

interface OSCConfig {
  localPort: number;
  remotePort: number;
  remoteAddress: string;
}

class OSCManager extends EventEmitter {
  private static instance: OSCManager;
  private udpPort: UDPPort | null = null;
  private config: OSCConfig | null = null;
  private isConnecting = false;
  private _isReady = false;

  private constructor() {
    super();
  }

  static getInstance(): OSCManager {
    if (!OSCManager.instance) {
      OSCManager.instance = new OSCManager();
    }
    return OSCManager.instance;
  }

  async connect(config: OSCConfig): Promise<void> {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    if (this._isReady) {
      await this.disconnect();
    }

    this.isConnecting = true;

    try {
      this.config = config;
      this.udpPort = new UDPPort({
        localAddress: '0.0.0.0',
        localPort: config.localPort,
        remoteAddress: config.remoteAddress,
        remotePort: config.remotePort,
        metadata: true
      });

      await new Promise<void>((resolve, reject) => {
        if (!this.udpPort) {
          reject(new Error('UDP Port not initialized'));
          return;
        }

        this.udpPort.on('ready', () => {
          this._isReady = true;
          this.emit('connected', this.config);
          resolve();
        });

        this.udpPort.on('error', (error: Error) => {
          this.emit('error', error);
          reject(error);
        });

        this.udpPort.on('message', (message: any) => {
          this.emit('message', message);
        });

        this.udpPort.open();
      });
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.udpPort && this._isReady) {
      this.udpPort.close();
      this.udpPort = null;
      this._isReady = false;
      this.config = null;
      this.emit('disconnected');
    }
  }

  async sendMessage(address: string, args: any[]): Promise<void> {
    if (!this._isReady || !this.udpPort) {
      throw new Error('Not connected');
    }

    this.udpPort.send({
      address,
      args
    });
  }

  isConnected(): boolean {
    return this._isReady;
  }

  getConfig(): OSCConfig | null {
    return this.config;
  }
}

const oscManager = OSCManager.getInstance();

export function setupOSCHandlers(): void {
  // Handle connect request
  ipcMain.handle('osc:connect', async (event, config: OSCConfig) => {
    try {
      await oscManager.connect(config);
      return { success: true };
    } catch (error) {
      console.error('Failed to connect:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Handle disconnect request
  ipcMain.handle('osc:disconnect', async () => {
    try {
      await oscManager.disconnect();
      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Handle OSC message sending
  ipcMain.handle('osc:sendMessage', async (event, { address, args }) => {
    try {
      await oscManager.sendMessage(address, args);
      return { success: true };
    } catch (error) {
      console.error('Failed to send message:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
