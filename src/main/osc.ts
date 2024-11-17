import { ipcMain, BrowserWindow } from 'electron';
import { UDPPort } from 'osc';
import EventEmitter from 'events';
import { OSCAddressType, OSCUtils, TrackControlMessage } from '../types/osc';

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
  private mainWindow: BrowserWindow | null = null;

  private constructor() {
    super();
    this.setupEventForwarding();
  }

  private setupEventForwarding() {
    // Forward events to renderer
    this.on('connected', () => {
      console.log('OSCManager: Emitting connected event to renderer');
      this.mainWindow?.webContents.send('osc:connected');
    });

    this.on('disconnected', () => {
      console.log('OSCManager: Emitting disconnected event to renderer');
      this.mainWindow?.webContents.send('osc:disconnected');
    });

    this.on('error', (error: Error) => {
      console.log('OSCManager: Emitting error event to renderer:', error.message);
      this.mainWindow?.webContents.send('osc:error', error.message);
    });

    this.on('message', (message: any) => {
      console.log('OSCManager: Emitting message event to renderer:', message);
      this.mainWindow?.webContents.send('osc:message', message);
    });
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  static getInstance(): OSCManager {
    if (!OSCManager.instance) {
      OSCManager.instance = new OSCManager();
    }
    return OSCManager.instance;
  }

  async connect(config: OSCConfig): Promise<void> {
    console.log('Attempting to connect with config:', config);
    
    if (this.isConnecting) {
      console.log('Connection already in progress');
      throw new Error('Connection already in progress');
    }

    if (this._isReady) {
      console.log('Already connected, disconnecting first');
      await this.disconnect();
    }

    this.isConnecting = true;
    console.log('Setting isConnecting to true');

    try {
      this.config = config;
      console.log('Creating UDP port with config');

      // Create OSC UDP Port with minimal configuration
      this.udpPort = new UDPPort({
        localAddress: '0.0.0.0',
        localPort: config.localPort,
        remoteAddress: config.remoteAddress,
        remotePort: config.remotePort
      });

      await new Promise<void>((resolve, reject) => {
        if (!this.udpPort) {
          console.error('UDP Port not initialized');
          reject(new Error('UDP Port not initialized'));
          return;
        }

        console.log('Setting up UDP port event handlers');
        
        this.udpPort.on('ready', () => {
          console.log('UDP port ready event received');
          this._isReady = true;
          this.emit('connected');
          resolve();
        });

        this.udpPort.on('error', (error: Error) => {
          console.error('UDP port error:', error);
          this.emit('error', error);
          reject(error);
        });

        this.udpPort.on('message', (msg) => {
          console.log('UDP port received message:', msg);
          this.handleMessage(msg);
        });

        console.log('Opening UDP port');
        this.udpPort.open();
      });
    } catch (error) {
      console.error('Error during connection:', error);
      throw error;
    } finally {
      console.log('Setting isConnecting to false');
      this.isConnecting = false;
    }
  }

  private handleMessage(oscMsg: any): void {
    try {
      console.log('Handling OSC message:', oscMsg);
      const parsed = OSCUtils.parseTrackAddress(oscMsg.address);
      if (!parsed) {
        console.warn('Invalid OSC address:', oscMsg.address);
        return;
      }

      const { trackId, type } = parsed;
      const value = oscMsg.args[0];

      if (typeof value !== 'number') {
        console.warn('Invalid OSC value type:', typeof value);
        return;
      }

      // Constrain the value based on the parameter type
      const constrainedValue = OSCUtils.constrainValue(value, type);

      // Emit the processed message
      const message: TrackControlMessage = {
        trackId,
        type,
        value: constrainedValue,
        raw: value
      };

      console.log('Emitting processed message:', message);
      this.emit('message', message);
    } catch (error) {
      console.error('Error handling OSC message:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async disconnect(): Promise<void> {
    console.log('Attempting to disconnect');
    if (this.udpPort && this._isReady) {
      console.log('Closing UDP port');
      this.udpPort.close();
      this.udpPort = null;
      this._isReady = false;
      this.config = null;
      this.emit('disconnected');
      console.log('Disconnected successfully');
    } else {
      console.log('Not connected, nothing to disconnect');
    }
  }

  async sendTrackControl(trackId: string | number, type: OSCAddressType, value: number): Promise<void> {
    if (!this._isReady || !this.udpPort) {
      console.error('Cannot send message: not connected');
      throw new Error('Not connected');
    }

    try {
      // Create a simple message with just the address and float value
      const address = OSCUtils.createTrackAddress(trackId, type);
      console.log('Sending OSC message to:', address, 'with value:', value);

      // Send using the built-in send method with minimal formatting
      this.udpPort.send({
        address,
        args: [value]
      });
    } catch (error) {
      console.error('Error sending OSC message:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this._isReady;
  }

  getConfig(): OSCConfig | null {
    return this.config;
  }
}

const oscManager = OSCManager.getInstance();

export function setupOSCHandlers(mainWindow: BrowserWindow): void {
  // Set the main window for event forwarding
  oscManager.setMainWindow(mainWindow);

  // Handle connect request
  ipcMain.handle('osc:connect', async (event, config: OSCConfig) => {
    try {
      console.log('Received connect request with config:', config);
      await oscManager.connect(config);
      console.log('Connection successful');
      return { success: true };
    } catch (error) {
      console.error('Failed to connect:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Handle disconnect request
  ipcMain.handle('osc:disconnect', async () => {
    try {
      console.log('Received disconnect request');
      await oscManager.disconnect();
      console.log('Disconnect successful');
      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Handle track control message
  ipcMain.handle('osc:trackControl', async (event, { trackId, type, value }: TrackControlMessage) => {
    try {
      console.log('Received track control request:', { trackId, type, value });
      await oscManager.sendTrackControl(trackId, type, value);
      console.log('Track control message sent successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to send track control:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
