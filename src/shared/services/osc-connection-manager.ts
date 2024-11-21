import { EventEmitter } from 'events';
import { OSCBaseHandler } from './osc-base-handler';
import { OSCConfig, OSCError, OSCErrorType, ConnectionState } from '../types/osc.types';

/**
 * OSC Connection Manager
 * Handles connection state management, monitoring, and recovery
 */
export class OSCConnectionManager extends EventEmitter {
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private monitoringInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private lastPingTime?: number;
  private missedPings: number = 0;

  constructor(
    private readonly handler: OSCBaseHandler,
    private readonly config: OSCConfig
  ) {
    super();
    this.setupEventListeners();
  }

  /**
   * Start connection monitoring
   */
  public startMonitoring(): void {
    if (this.monitoringInterval) {
      return;
    }

    // Monitor connection every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkConnection();
    }, 5000);

    this.updateState(ConnectionState.CONNECTING);
  }

  /**
   * Stop connection monitoring and cleanup resources
   */
  public stopMonitoring(): void {
    // Clear monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    // Clear reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    // Reset state
    this.lastPingTime = undefined;
    this.missedPings = 0;
    this.updateState(ConnectionState.DISCONNECTED);

    // Remove all event listeners
    this.removeAllListeners();
    this.handler.removeAllListeners('error');
    this.handler.removeAllListeners('message');
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connection is active
   */
  private async checkConnection(): Promise<void> {
    try {
      // Send ping message
      await this.handler.send({
        address: '/ping',
        args: [Date.now()]
      });

      this.lastPingTime = Date.now();
      this.missedPings = 0;

      if (this.connectionState !== ConnectionState.CONNECTED) {
        this.updateState(ConnectionState.CONNECTED);
      }
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: Error): void {
    this.missedPings++;

    // After 3 missed pings (15 seconds), consider connection lost
    if (this.missedPings >= 3) {
      this.updateState(ConnectionState.ERROR);
      this.initiateReconnect();
    }
  }

  /**
   * Initiate reconnection process
   */
  private initiateReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    this.updateState(ConnectionState.RECONNECTING);

    // Exponential backoff for reconnection attempts
    const delay = Math.min(1000 * Math.pow(2, this.missedPings - 3), 30000);
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.handler.connect();
        this.reconnectTimeout = undefined;
        this.missedPings = 0;
        this.updateState(ConnectionState.CONNECTED);
      } catch (error) {
        this.handleConnectionError(error as Error);
      }
    }, delay);
  }

  /**
   * Update connection state and emit events
   */
  private updateState(newState: ConnectionState): void {
    if (newState === this.connectionState) {
      return;
    }

    const oldState = this.connectionState;
    this.connectionState = newState;

    this.emit('stateChange', {
      oldState,
      newState,
      timestamp: new Date().toISOString()
    });

    // Emit specific events for state changes
    switch (newState) {
      case ConnectionState.CONNECTED:
        this.emit('connected');
        break;
      case ConnectionState.ERROR:
        this.emit('error', this.createError(
          OSCErrorType.CONNECTION_ERROR,
          `Connection lost after ${this.missedPings} missed pings`,
          true,
          { lastPingTime: this.lastPingTime }
        ));
        break;
      case ConnectionState.RECONNECTING:
        this.emit('reconnecting');
        break;
    }
  }

  /**
   * Setup event listeners for connection events
   */
  private setupEventListeners(): void {
    this.handler.on('error', (error: OSCError) => {
      if (error.type === OSCErrorType.CONNECTION_ERROR) {
        this.handleConnectionError(new Error(error.message));
      }
    });

    this.handler.on('message', (msg: any) => {
      if (msg.address === '/pong') {
        this.lastPingTime = Date.now();
        this.missedPings = 0;
      }
    });
  }

  /**
   * Create error object
   */
  private createError(
    type: OSCErrorType,
    message: string,
    retryable: boolean = true,
    data?: unknown
  ): OSCError {
    return {
      type,
      message,
      retryable,
      data,
      timestamp: new Date().toISOString()
    };
  }
}
