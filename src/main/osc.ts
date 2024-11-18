import { ipcMain, BrowserWindow } from 'electron';
import { UDPPort } from 'osc';
import EventEmitter from 'events';
import { OSCAddressType, OSCUtils, TrackControlMessage, OSCQueryType } from '../types/osc';
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
  responseCallback?: (response: any) => void;
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

  // Track query response handling
  private queryResponseHandlers = new Map<string, (response: any) => void>();
  private queryTimeout = 2000; // 2 seconds timeout for queries

  private constructor() {
    super();
    this.setupEventForwarding();
  }

  private get minMessageInterval(): number {
    return settingsManager.getSettings().oscRateLimit;
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
      console.log('OSCManager: Forwarding OSC message to renderer:', JSON.stringify(message));
      if (this.mainWindow) {
        try {
          this.mainWindow.webContents.send('osc:message', message);
        } catch (error) {
          console.error('Error sending message to renderer:', error);
        }
      } else {
        console.warn('No main window available to send message');
      }
    });

    this.on('track:message', (message: TrackControlMessage) => {
      console.log('OSCManager: Emitting track message event to renderer:', message);
      this.mainWindow?.webContents.send('osc:track:message', message);
    });

    // Listen for settings changes
    ipcMain.on('settings:save', () => {
      if (this.queueProcessor) {
        // Restart queue processor with new interval
        this.startQueueProcessor();
      }
    });

    // Handle track state queries from renderer
    ipcMain.handle('osc:query:states', async (_, trackId: number | string, types: OSCQueryType[]) => {
      try {
        return await this.queryTrackStates(trackId, types);
      } catch (error) {
        console.error('Error handling track state query:', error);
        throw error;
      }
    });

    ipcMain.handle('osc:query:state', async (_, trackId: number | string, type: OSCQueryType) => {
      try {
        return await this.queryTrackState(trackId, type);
      } catch (error) {
        console.error('Error handling track state query:', error);
        throw error;
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
    if (!this._isReady || !this.udpPort) {
      console.error('Cannot send message: not connected');
      throw new Error('Not connected');
    }

    try {
      console.log('Sending OSC message:', { address, args });
      this.udpPort.send({ address, args });

      // Emit outgoing message
      const message = {
        address,
        args,
        timestamp: Date.now(),
        direction: 'out'
      };
      this.emit('message', message);
    } catch (error) {
      console.error('Error sending OSC message:', error);
      throw error;
    }
  }

  private queueMessage(address: string, args: any[], priority: number = 0): void {
    try {
      if (!this._isReady || !this.udpPort) {
        throw new Error('OSC connection not ready');
      }

      const message: QueuedMessage = {
        address,
        args,
        timestamp: Date.now(),
        priority
      };

      // Add to queue based on priority
      const insertIndex = this.messageQueue.findIndex(m => m.priority < priority);
      if (insertIndex === -1) {
        this.messageQueue.push(message);
      } else {
        this.messageQueue.splice(insertIndex, 0, message);
      }

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    } catch (error) {
      console.error('Error queueing OSC message:', error);
      throw error;
    }
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  private async tryAutoConnect() {
    const settings = settingsManager.getSettings();
    if (settings.oscConnection.autoConnect) {
      try {
        await this.connect({
          localPort: settings.oscConnection.localPort,
          remotePort: settings.oscConnection.remotePort,
          remoteAddress: settings.oscConnection.remoteAddress
        });
      } catch (error) {
        console.error('Auto-connect failed:', error);
      }
    }
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

  private handleMessage(oscMsg: { address: string; args: any[] }): void {
    try {
      console.log('Received OSC message:', oscMsg);

      // Parse track control messages
      const trackInfo = OSCUtils.parseTrackAddress(oscMsg.address);
      if (trackInfo) {
        const value = oscMsg.args[0];
        if (typeof value === 'number') {
          const constrainedValue = OSCUtils.constrainValue(value, trackInfo.type);
          const trackMessage: TrackControlMessage = {
            trackId: parseInt(trackInfo.trackId, 10),
            type: trackInfo.type,
            value: constrainedValue,
            timestamp: Date.now()
          };
          this.emit('track:message', trackMessage);
        }
      }

      // Check if this is a response to a query
      const queryHandler = this.queryResponseHandlers.get(oscMsg.address);
      if (queryHandler) {
        queryHandler(oscMsg);
        this.queryResponseHandlers.delete(oscMsg.address);
        return;
      }

      this.emit('message', oscMsg);
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

  async queryTrackState(trackId: number | string, type: OSCQueryType): Promise<TrackControlMessage | null> {
    if (!this._isReady) {
      throw new Error('Not connected');
    }

    return new Promise((resolve, reject) => {
      const queryPath = `/track/${trackId}/${type}`;
      const address = '/get';

      // Set up response handler
      this.queryResponseHandlers.set(address, (response) => {
        const result = OSCUtils.parseQueryResponse(address, response.args);
        resolve(result);
      });

      // Send query
      this.queueMessage(address, [queryPath], 2);

      // Set timeout
      setTimeout(() => {
        if (this.queryResponseHandlers.has(address)) {
          this.queryResponseHandlers.delete(address);
          resolve(null);
        }
      }, this.queryTimeout);
    });
  }

  async queryTrackStates(trackId: number | string, types: OSCQueryType[]): Promise<(TrackControlMessage | null)[]> {
    const results = await Promise.all(
      types.map(type => this.queryTrackState(trackId, type))
    );
    return results;
  }

  isConnected(): boolean {
    return this._isReady;
  }

  getConfig(): OSCConfig | null {
    return this.config;
  }

  updateConfig(config: OSCConfig): void {
    this.config = config;
  }
}

const oscManager = OSCManager.getInstance();

export async function initializeOSC() {
  // Load settings but don't auto-connect
  const settings = settingsManager.getSettings();
  if (settings.oscConnection) {
    oscManager.updateConfig({
      localPort: settings.oscConnection.localPort,
      remotePort: settings.oscConnection.remotePort,
      remoteAddress: settings.oscConnection.remoteAddress
    });
  }
}

export function setupOSCHandlers(mainWindow: BrowserWindow) {
  const oscManager = OSCManager.getInstance();
  oscManager.setMainWindow(mainWindow);

  // Remove existing handlers
  ipcMain.removeHandler('osc:connect');
  ipcMain.removeHandler('osc:disconnect');
  ipcMain.removeHandler('osc:get-config');
  ipcMain.removeHandler('osc:is-connected');
  ipcMain.removeHandler('osc:track:control');
  ipcMain.removeHandler('osc:query:state');
  ipcMain.removeHandler('osc:query:states');

  // Handle OSC connection
  ipcMain.handle('osc:connect', async (_, config) => {
    try {
      await oscManager.connect(config);
      return { success: true };
    } catch (error) {
      console.error('Failed to connect:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Handle OSC disconnection
  ipcMain.handle('osc:disconnect', async () => {
    try {
      await oscManager.disconnect();
      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Get current OSC config
  ipcMain.handle('osc:get-config', () => {
    return oscManager.getConfig();
  });

  // Check if OSC is connected
  ipcMain.handle('osc:is-connected', () => {
    return oscManager.isConnected();
  });

  // Handle track control messages
  ipcMain.handle('osc:track:control', async (_, trackId, type, value) => {
    try {
      await oscManager.sendTrackControl(trackId, type, value);
      return { success: true };
    } catch (error) {
      console.error('Failed to send track control:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Handle track state queries
  ipcMain.handle('osc:query:state', async (_, trackId, type) => {
    try {
      return await oscManager.queryTrackState(trackId, type);
    } catch (error) {
      console.error('Failed to query track state:', error);
      return null;
    }
  });

  ipcMain.handle('osc:query:states', async (_, trackId, types) => {
    try {
      return await oscManager.queryTrackStates(trackId, types);
    } catch (error) {
      console.error('Failed to query track states:', error);
      return null;
    }
  });
}
