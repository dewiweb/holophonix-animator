import { ipcMain, BrowserWindow } from 'electron';
import { UDPPort } from 'osc';
import EventEmitter from 'events';
import { OSCAddressType, OSCUtils, TrackControlMessage } from '../types/osc';
import { settingsManager } from './settings';

interface OSCConfig {
  localPort: number;
  remotePort: number;
  remoteAddress: string;
}

interface QueuedMessage {
  address: string;
  args: any[];
  timestamp: number;
  priority: number;
}

class OSCManager extends EventEmitter {
  private static instance: OSCManager;
  private udpPort: UDPPort | null = null;
  private config: OSCConfig | null = null;
  private isConnecting = false;
  private _isReady = false;
  private mainWindow: BrowserWindow | null = null;
  
  // Rate limiting and queuing
  private messageQueue: QueuedMessage[] = [];
  private lastMessageTime = 0;
  private isProcessingQueue = false;
  private queueProcessor: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.setupEventForwarding();
  }

  private get minMessageInterval(): number {
    return settingsManager.getSetting('oscRateLimit');
  }

  private setupEventForwarding() {
    // Forward events to renderer
    this.on('connected', () => {
      console.log('OSCManager: Emitting connected event to renderer');
      this.mainWindow?.webContents.send('osc:connected');
      this.startQueueProcessor();
    });

    this.on('disconnected', () => {
      console.log('OSCManager: Emitting disconnected event to renderer');
      this.mainWindow?.webContents.send('osc:disconnected');
      this.stopQueueProcessor();
    });

    this.on('error', (error: Error) => {
      console.log('OSCManager: Emitting error event to renderer:', error.message);
      this.mainWindow?.webContents.send('osc:error', error.message);
    });

    this.on('message', (message: any) => {
      console.log('OSCManager: Emitting message event to renderer:', message);
      this.mainWindow?.webContents.send('osc:message', message);
    });

    // Listen for settings changes
    ipcMain.on('settings:save', () => {
      if (this.queueProcessor) {
        // Restart queue processor with new interval
        this.startQueueProcessor();
      }
    });
  }

  private startQueueProcessor() {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
    }
    this.queueProcessor = setInterval(() => this.processQueue(), this.minMessageInterval);
  }

  private stopQueueProcessor() {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      this.queueProcessor = null;
    }
    this.messageQueue = [];
    this.isProcessingQueue = false;
  }

  private async processQueue() {
    if (!this._isReady || this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const now = Date.now();

    try {
      // Sort queue by priority (higher number = higher priority)
      this.messageQueue.sort((a, b) => b.priority - a.priority);

      // Process messages that respect the rate limit
      while (this.messageQueue.length > 0 && now - this.lastMessageTime >= this.minMessageInterval) {
        const message = this.messageQueue.shift();
        if (!message) break;

        await this.sendMessageImmediate(message.address, message.args);
        this.lastMessageTime = Date.now();
      }
    } catch (error) {
      console.error('Error processing message queue:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async sendMessageImmediate(address: string, args: any[]) {
    if (!this.udpPort || !this._isReady) {
      throw new Error('Not connected');
    }

    try {
      this.udpPort.send({ address, args });
    } catch (error) {
      console.error('Error sending OSC message:', error);
      throw error;
    }
  }

  private queueMessage(address: string, args: any[], priority = 0) {
    this.messageQueue.push({
      address,
      args,
      timestamp: Date.now(),
      priority
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

      // Handle query responses
      if (oscMsg.address.startsWith('/track/')) {
        const message = {
          address: oscMsg.address,
          args: oscMsg.args,
          timestamp: Date.now()
        };
        this.emit('message', message);
        return;
      }

      // Handle regular track control messages
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
        raw: value,
        timestamp: Date.now()
      };

      console.log('Emitting processed message:', message);
      this.emit('message', message);
    } catch (error) {
      console.error('Error handling OSC message:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async sendQuery(address: string): Promise<void> {
    if (!this._isReady || !this.udpPort) {
      console.error('Cannot send query: not connected');
      throw new Error('Not connected');
    }

    try {
      console.log('Queueing OSC query:', address);
      // Queries get highest priority
      this.queueMessage('/get', [address], 3);
    } catch (error) {
      console.error('Error queueing OSC query:', error);
      throw error;
    }
  }

  async testBidirectionalCommunication(): Promise<void> {
    if (!this._isReady) {
      throw new Error('Not connected');
    }

    console.log('Starting bidirectional communication test...');

    // Test sending a position update
    try {
      await this.sendTrackControl(1, 'azim', 90);
      console.log('Successfully sent position update');
    } catch (error) {
      console.error('Failed to send position update:', error);
      throw error;
    }

    // Test querying a track's position
    try {
      await this.sendQuery('track/1/xyz');
      console.log('Successfully sent position query');
    } catch (error) {
      console.error('Failed to send position query:', error);
      throw error;
    }

    // Test sending a gain update
    try {
      await this.sendTrackControl(1, 'gain/value', 0);
      console.log('Successfully sent gain update');
    } catch (error) {
      console.error('Failed to send gain update:', error);
      throw error;
    }

    // Test querying track's gain
    try {
      await this.sendQuery('track/1/gain/value');
      console.log('Successfully sent gain query');
    } catch (error) {
      console.error('Failed to send gain query:', error);
      throw error;
    }

    console.log('All test messages sent successfully');
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
      const address = OSCUtils.createTrackAddress(trackId, type);
      console.log('Queueing OSC message to:', address, 'with value:', value);

      // Queue the message with priority based on type
      const priority = type === 'gain/value' || type === 'mute' ? 2 : 1;
      this.queueMessage(address, [value], priority);
    } catch (error) {
      console.error('Error queueing OSC message:', error);
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

  // Handle OSC query
  ipcMain.handle('osc:query', async (event, address: string) => {
    try {
      console.log('Received query request for address:', address);
      await oscManager.sendQuery(address);
      console.log('Query sent successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to send query:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Handle test request
  ipcMain.handle('osc:test', async () => {
    try {
      console.log('Received test request');
      await oscManager.testBidirectionalCommunication();
      console.log('Test completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Test failed:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
