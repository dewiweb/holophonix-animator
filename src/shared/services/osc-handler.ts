import { UDPPort } from 'osc';
import { EventEmitter } from 'events';
import * as winston from 'winston';
import {
  OSCConfig,
  OSCError,
  OSCErrorType,
  OSCMessage,
  TrackParameters,
  DEFAULT_OSC_CONFIG,
  TrackState,
  OSCIncomingMessage,
  OSCStateUpdate,
  MessageType
} from '../types/osc.types';

/**
 * OSC Handler Service
 * Manages bidirectional UDP communication with Holophonix system
 */
export class OSCHandler extends EventEmitter {
  private port: UDPPort;
  private config: OSCConfig;
  private logger: winston.Logger;
  private connectionPromise: Promise<void> | null = null;
  private retryCount: number = 0;
  private validationTimer?: NodeJS.Timeout;
  private connected: boolean = false;
  private trackStates: Map<number, TrackState> = new Map();
  private pendingQueries: Map<string, (value: any) => void> = new Map();

  constructor(config: Partial<OSCConfig> = {}) {
    super();
    this.config = { ...DEFAULT_OSC_CONFIG, ...config };
    
    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'osc-handler' },
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });

    // Initialize OSC port
    this.port = new UDPPort({
      localAddress: '0.0.0.0',
      localPort: 0, // Random local port for receiving
      remoteAddress: this.config.host,
      remotePort: this.config.port,
      metadata: true
    });

    this.setupEventListeners();
  }

  /**
   * Initialize connection to Holophonix
   */
  public async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(this.createError(
          OSCErrorType.TIMEOUT,
          'Connection timeout',
          true
        ));
      }, this.config.connectionTimeout);

      this.port.once('ready', () => {
        clearTimeout(timeout);
        this.connected = true;
        this.retryCount = 0;
        this.startValidationTimer();
        resolve();
      });

      this.port.once('error', (error) => {
        clearTimeout(timeout);
        reject(this.createError(
          OSCErrorType.CONNECTION,
          `Connection failed: ${(error as Error).message}`,
          true,
          error
        ));
      });

      try {
        this.port.open();
      } catch (error) {
        clearTimeout(timeout);
        reject(this.createError(
          OSCErrorType.CONNECTION,
          `Failed to open port: ${(error as Error).message}`,
          true,
          error
        ));
      }
    }).finally(() => {
      this.connectionPromise = null;
    });

    return this.connectionPromise;
  }

  /**
   * Send OSC message with retry logic
   */
  public async send(message: OSCMessage): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const sendWithRetry = async (attempt: number = 0) => {
        try {
          await this.port.send({
            address: message.address,
            args: message.args
          });
          resolve();
        } catch (error) {
          if (attempt < this.config.maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            await new Promise(r => setTimeout(r, delay));
            sendWithRetry(attempt + 1);
          } else {
            reject(this.createError(
              OSCErrorType.CONNECTION,
              `Failed to send message after ${attempt} retries`,
              false,
              error
            ));
          }
        }
      };

      sendWithRetry();
    });
  }

  /**
   * Send batch of OSC messages
   */
  public async sendBatch(messages: OSCMessage[]): Promise<void> {
    if (messages.length > this.config.maxBatchSize) {
      const chunks = this.chunkArray(messages, this.config.maxBatchSize);
      for (const chunk of chunks) {
        await this.sendBatch(chunk);
      }
      return;
    }

    for (const message of messages) {
      await this.send(message);
    }
  }

  /**
   * Update track parameters
   */
  public async updateTrackParameters(trackId: number, params: Partial<TrackParameters>): Promise<void> {
    const messages: OSCMessage[] = [];

    // Handle cartesian coordinates
    if (params.cartesian) {
      const { x, y, z } = params.cartesian;
      if (x !== undefined) {
        messages.push({ address: `/track/${trackId}/x`, args: [x] });
      }
      if (y !== undefined) {
        messages.push({ address: `/track/${trackId}/y`, args: [y] });
      }
      if (z !== undefined) {
        messages.push({ address: `/track/${trackId}/z`, args: [z] });
      }
      // If all coordinates are present, also send the combined message
      if (x !== undefined && y !== undefined && z !== undefined) {
        messages.push({ address: `/track/${trackId}/xyz`, args: [x, y, z] });
      }
    }

    // Handle polar coordinates
    if (params.polar) {
      const { azim, elev, dist } = params.polar;
      if (azim !== undefined) {
        messages.push({ address: `/track/${trackId}/azim`, args: [azim] });
      }
      if (elev !== undefined) {
        messages.push({ address: `/track/${trackId}/elev`, args: [elev] });
      }
      if (dist !== undefined) {
        messages.push({ address: `/track/${trackId}/dist`, args: [dist] });
      }
      // If all coordinates are present, also send the combined message
      if (azim !== undefined && elev !== undefined && dist !== undefined) {
        messages.push({ address: `/track/${trackId}/aed`, args: [azim, elev, dist] });
      }
    }

    // Handle other parameters
    if (params.gain !== undefined) {
      messages.push({ address: `/track/${trackId}/gain`, args: [params.gain] });
    }
    if (params.mute !== undefined) {
      messages.push({ address: `/track/${trackId}/mute`, args: [params.mute ? 1 : 0] });
    }
    if (params.name !== undefined) {
      messages.push({ address: `/track/${trackId}/name`, args: [params.name] });
    }

    // Handle color parameter
    if (params.color !== undefined) {
      const { r, g, b, a } = params.color;
      messages.push({ 
        address: `/track/${trackId}/color`, 
        args: [r, g, b, a] 
      });
    }

    await this.sendBatch(messages);
  }

  /**
   * Get current state of a track
   */
  public getTrackState(trackId: number): TrackState | undefined {
    return this.trackStates.get(trackId);
  }

  /**
   * Query track parameter value
   */
  public async queryParameter(trackId: number, parameter: string): Promise<any> {
    const queryId = `${trackId}:${parameter}:${Date.now()}`;
    const result = new Promise((resolve) => {
      this.pendingQueries.set(queryId, resolve);
      // Clean up pending query after timeout
      setTimeout(() => {
        if (this.pendingQueries.has(queryId)) {
          this.pendingQueries.delete(queryId);
          resolve(undefined);
        }
      }, this.config.connectionTimeout);
    });

    await this.send({ address: '/get', args: [`/track/${trackId}/${parameter}`] });
    return result;
  }

  /**
   * Close the connection
   */
  public close(): void {
    this.stopValidationTimer();
    if (this.port) {
      this.port.close();
    }
    this.connected = false;
  }

  private setupEventListeners(): void {
    this.port.on('message', (oscMsg) => {
      this.logger.debug('Received OSC message:', oscMsg);
      const parsedMessage = this.parseIncomingMessage(oscMsg);
      
      if (parsedMessage.trackId !== undefined) {
        this.updateTrackState(parsedMessage);
      }

      this.handleIncomingMessage(parsedMessage);
      this.emit('message', parsedMessage);
    });

    this.port.on('error', (error) => {
      this.logger.error('OSC error:', error);
      this.emit('error', this.createError(
        OSCErrorType.CONNECTION,
        error.message,
        true,
        error
      ));
    });
  }

  private parseIncomingMessage(oscMsg: any): OSCIncomingMessage {
    const address = oscMsg.address as string;
    const args = oscMsg.args;
    let type: MessageType = 'status_update';
    let trackId: number | undefined;
    let parameter: string | undefined;

    if (address.startsWith('/track/')) {
      const parts = address.split('/');
      if (parts.length >= 3) {
        trackId = parseInt(parts[2], 10);
        parameter = parts.slice(3).join('/');
        
        if (parameter.includes('xyz') || parameter.includes('aed') || parameter === 'color') {
          type = 'state_response';
        } else {
          type = 'parameter_update';
        }
      }
    } else if (address.startsWith('/error/')) {
      type = 'error';
    }

    return { address, args, type, trackId, parameter };
  }

  private updateTrackState(message: OSCIncomingMessage): void {
    if (!message.trackId) return;

    let state = this.trackStates.get(message.trackId) || {
      lastUpdate: new Date()
    };

    if (message.parameter) {
      switch (message.parameter) {
        case 'xyz':
          state.cartesian = {
            x: message.args[0],
            y: message.args[1],
            z: message.args[2]
          };
          break;
        case 'aed':
          state.polar = {
            azim: message.args[0],
            elev: message.args[1],
            dist: message.args[2]
          };
          break;
        case 'color':
          state.color = {
            r: message.args[0],
            g: message.args[1],
            b: message.args[2],
            a: message.args[3]
          };
          break;
        case 'gain':
          state.gain = message.args[0];
          break;
        case 'mute':
          state.mute = message.args[0] === 1;
          break;
        case 'name':
          state.name = message.args[0];
          break;
      }
      state.lastUpdate = new Date();
      this.trackStates.set(message.trackId, state);
    }
  }

  private handleIncomingMessage(message: OSCIncomingMessage): void {
    // Handle pending queries
    if (message.trackId && message.parameter) {
      const queryId = Array.from(this.pendingQueries.keys()).find(key => 
        key.startsWith(`${message.trackId}:${message.parameter}`)
      );
      
      if (queryId) {
        const resolve = this.pendingQueries.get(queryId);
        if (resolve) {
          resolve(message.args);
          this.pendingQueries.delete(queryId);
        }
      }
    }

    // Emit specific events based on message type
    switch (message.type) {
      case 'state_response':
        this.emit('state', {
          trackId: message.trackId,
          parameter: message.parameter,
          value: message.args,
          timestamp: new Date()
        } as OSCStateUpdate);
        break;
      case 'error':
        this.emit('error', this.createError(
          OSCErrorType.STATE_SYNC,
          `Error from Holophonix: ${message.args.join(' ')}`,
          true
        ));
        break;
    }
  }

  private startValidationTimer(): void {
    this.stopValidationTimer();
    if (process.env.NODE_ENV !== 'test') {
      this.validationTimer = setInterval(() => {
        this.validateState();
      }, this.config.validationInterval);
    }
  }

  private stopValidationTimer(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = undefined;
    }
  }

  private async validateState(): Promise<void> {
    try {
      // Query critical parameters using the correct paths
      await this.send({ address: '/get', args: ['/track/*/xyz'] }); // Get all cartesian coordinates
      await this.send({ address: '/get', args: ['/track/*/gain'] }); // Get gain values
      await this.send({ address: '/get', args: ['/track/*/mute'] }); // Get mute states
      await this.send({ address: '/get', args: ['/track/*/color'] }); // Get color values
    } catch (error) {
      this.emit('error', this.createError(
        OSCErrorType.VALIDATION,
        'State validation failed',
        true,
        error
      ));
    }
  }

  private createError(
    type: OSCErrorType,
    message: string,
    retryable: boolean,
    originalError?: unknown
  ): OSCError {
    return {
      type,
      message,
      retryable,
      data: originalError
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
