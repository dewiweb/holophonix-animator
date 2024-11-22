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
  MessageType,
  Color,
  CartesianCoordinates,
  PolarCoordinates
} from '../types/osc.types';
import { StateSynchronizer } from './state-synchronizer';

/**
 * OSC Handler Service
 * Manages bidirectional UDP communication with Holophonix system
 */
export class OSCHandler extends EventEmitter {
  private port: UDPPort;
  private config: OSCConfig;
  private logger: winston.Logger;
  private connected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private validationTimer?: NodeJS.Timeout;
  private retryCount: number = 0;
  private trackStates: Map<number, TrackState> = new Map();
  private pendingQueries: Map<string, (value: any) => void> = new Map();
  private stateSynchronizer: StateSynchronizer;

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

    // Initialize state synchronizer
    this.stateSynchronizer = new StateSynchronizer(this);

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
   * Helper function to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Process a single batch of messages with rate limiting
   */
  private async processBatch(messages: OSCMessage[], batchIndex: number): Promise<void> {
    this.logger.debug(`Processing batch ${batchIndex + 1} with ${messages.length} messages`);
    
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    try {
      // Process messages with a small delay between each to prevent flooding
      for (const [index, message] of messages.entries()) {
        try {
          await this.send(message);
          successCount++;
          
          // Add a small delay between messages (1ms) to prevent flooding
          if (index < messages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        } catch (error) {
          errorCount++;
          this.logger.error(`Failed to send message in batch ${batchIndex + 1}:`, error);
          // Continue processing the batch even if one message fails
        }
      }
    } finally {
      const duration = Date.now() - startTime;
      this.logger.info(
        `Batch ${batchIndex + 1} completed: ${successCount} succeeded, ${errorCount} failed, duration: ${duration}ms`
      );
    }
  }

  /**
   * Send batch of OSC messages with improved handling
   */
  public async sendBatch(messages: OSCMessage[]): Promise<void> {
    if (!messages.length) {
      return;
    }

    if (!this.connected) {
      await this.connect();
    }

    // Validate batch size
    if (messages.length > this.config.maxBatchSize * 10) {
      throw this.createError(
        OSCErrorType.VALIDATION,
        `Batch size (${messages.length}) exceeds maximum allowed size (${this.config.maxBatchSize * 10})`,
        false
      );
    }

    // Split into chunks if needed
    const chunks = this.chunkArray(messages, this.config.maxBatchSize);
    this.logger.info(`Processing ${chunks.length} batches of messages`);

    // Process chunks with some concurrency, but not all at once
    const concurrencyLimit = 3; // Process up to 3 batches concurrently
    const batchPromises: Promise<void>[] = [];
    
    for (const [index, chunk] of chunks.entries()) {
      // If we've reached the concurrency limit, wait for one batch to complete
      if (batchPromises.length >= concurrencyLimit) {
        await Promise.race(batchPromises);
        // Remove completed promises
        const completedIndex = await Promise.race(
          batchPromises.map(async (p, i) => {
            try {
              await p;
              return i;
            } catch {
              return -1;
            }
          })
        );
        if (completedIndex >= 0) {
          batchPromises.splice(completedIndex, 1);
        }
      }

      // Add new batch to processing queue
      const batchPromise = this.processBatch(chunk, index).catch(error => {
        this.logger.error(`Batch ${index + 1} failed:`, error);
        throw error;
      });
      batchPromises.push(batchPromise);
    }

    // Wait for all remaining batches to complete
    await Promise.all(batchPromises);
  }

  /**
   * Update track parameters with improved state synchronization
   */
  public async updateTrackParameters(trackId: number, params: Partial<TrackParameters>): Promise<void> {
    const messages: OSCMessage[] = [];

    // Handle cartesian coordinates
    if (params.cartesian) {
      const { x, y, z } = params.cartesian;
      messages.push({ address: `/track/${trackId}/xyz`, args: [x, y, z] });
    }

    // Handle polar coordinates
    if (params.polar) {
      const { azim, elev, dist } = params.polar;
      messages.push({ address: `/track/${trackId}/aed`, args: [azim, elev, dist] });
    }

    // Handle color
    if (params.color) {
      this.validateColor(params.color);
      const { r, g, b, a } = params.color;
      messages.push({ address: `/track/${trackId}/color`, args: [r, g, b, a] });
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

    // Update track state before sending messages
    const currentState = this.trackStates.get(trackId) || { lastUpdate: new Date() };

    // Store only the provided coordinate system, let backend handle validation and conversions
    this.trackStates.set(trackId, {
      ...currentState,
      ...params,
      lastUpdate: new Date()
    });

    if (messages.length > 0) {
      await this.sendBatch(messages);
      // Trigger state synchronization after update
      await this.stateSynchronizer.synchronizeState(trackId);
      await this.stateSynchronizer.resolveConflicts(trackId);
    }
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
        true
      ));
    });
  }

  /**
   * Parse incoming message
   */
  private parseIncomingMessage(oscMsg: any): OSCIncomingMessage {
    const address = oscMsg.address as string;
    const args = oscMsg.args;

    // Parse track ID and parameter from address
    const match = address.match(/^\/track\/(\d+)\/(.+)$/);
    if (!match) {
      return { address, args, type: 'status_update' };
    }

    const trackId = parseInt(match[1], 10);
    const parameter = match[2];

    // Handle color messages
    if (parameter === 'color' && args.length === 4) {
      return {
        address,
        args,
        type: 'parameter_update',
        trackId,
        parameter: 'color',
        value: {
          r: args[0],
          g: args[1],
          b: args[2],
          a: args[3]
        }
      };
    }

    // Handle other parameters
    return {
      address,
      args,
      type: 'parameter_update',
      trackId,
      parameter,
      value: args[0]
    };
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
      await this.send({ address: '/get', args: ['/track/*/aed'] }); // Get all polar coordinates
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

  /**
   * Validate color values are in correct range (0-1)
   */
  private validateColor(color: Color): void {
    const validateComponent = (value: number, name: string) => {
      if (value < 0 || value > 1) {
        throw this.createError(
          OSCErrorType.VALIDATION,
          `Color ${name} value ${value} is out of range (0-1)`,
          false
        );
      }
    };

    validateComponent(color.r, 'red');
    validateComponent(color.g, 'green');
    validateComponent(color.b, 'blue');
    validateComponent(color.a, 'alpha');
  }
}
