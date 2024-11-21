import { UDPPort } from 'osc';
import { EventEmitter } from 'events';
import * as winston from 'winston';
import * as os from 'os';
import {
  OSCConfig,
  OSCError,
  OSCErrorType,
  DEFAULT_OSC_CONFIG,
  PORT_CONSTRAINTS,
  NetworkInterface,
  ConnectionState
} from '../types/osc.types';

const IP_REGEX = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * Base OSC Handler Service
 * Manages basic UDP communication with Holophonix system
 */
export class OSCBaseHandler extends EventEmitter {
  protected inputPort!: UDPPort;
  protected outputPort!: UDPPort;
  protected config: OSCConfig;
  protected logger!: winston.Logger;
  protected connectionPromise: Promise<void> | null = null;
  protected retryCount: number = 0;
  protected connected: boolean = false;
  protected connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  protected connectionTimeout: NodeJS.Timeout | null = null;
  protected reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<OSCConfig> = {}) {
    super();
    this.config = { ...DEFAULT_OSC_CONFIG, ...config };
    this.validateConfig();
    this.setupLogger();
    this.setupPorts();
  }

  /**
   * Connect to Holophonix system
   */
  public async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      this.setConnectionState(ConnectionState.CONNECTING);

      // Store timeout reference for cleanup
      this.connectionTimeout = setTimeout(() => {
        cleanup();
        this.setConnectionState(ConnectionState.ERROR);
        reject(this.createError(
          OSCErrorType.TIMEOUT,
          'Connection attempt timed out',
          true
        ));
      }, this.config.connectionTimeout);

      const cleanup = () => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        this.inputPort.removeListener('ready', onReady);
        this.inputPort.removeListener('error', onError);
        this.outputPort.removeListener('ready', onReady);
        this.outputPort.removeListener('error', onError);
      };

      let portsReady = 0;
      const onReady = () => {
        portsReady++;
        if (portsReady === 2) {
          cleanup();
          this.connected = true;
          this.setConnectionState(ConnectionState.CONNECTED);
          resolve();
        }
      };

      const onError = (error: Error) => {
        cleanup();
        this.setConnectionState(ConnectionState.ERROR);
        reject(this.createError(
          OSCErrorType.CONNECTION,
          'Failed to connect to Holophonix system',
          true,
          error
        ));
      };

      this.inputPort.on('ready', onReady);
      this.inputPort.on('error', onError);
      this.outputPort.on('ready', onReady);
      this.outputPort.on('error', onError);

      try {
        this.inputPort.open();
        this.outputPort.open();
      } catch (error) {
        cleanup();
        this.setConnectionState(ConnectionState.ERROR);
        reject(this.createError(
          OSCErrorType.CONNECTION,
          'Failed to open UDP ports',
          true,
          error instanceof Error ? error : new Error(String(error))
        ));
      }
    }).finally(() => {
      this.connectionPromise = null;
      if (this.connectionState === ConnectionState.CONNECTING) {
        this.setConnectionState(ConnectionState.ERROR);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Close connection and cleanup resources
   */
  public close(): void {
    // Clear any pending timers
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Close ports
    try {
      if (this.inputPort) {
        this.inputPort.close();
      }
      if (this.outputPort) {
        this.outputPort.close();
      }
    } catch (error) {
      this.logger.error('Error closing ports:', error);
    }

    // Reset state
    this.connected = false;
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.connectionPromise = null;
    this.retryCount = 0;

    // Remove all listeners
    this.removeAllListeners();
  }

  /**
   * Get available network interfaces
   */
  public static getAvailableInterfaces(): NetworkInterface[] {
    const interfaces: NetworkInterface[] = [];
    const networkInterfaces = os.networkInterfaces();

    for (const [name, ifaces] of Object.entries(networkInterfaces)) {
      if (ifaces) {
        for (const iface of ifaces) {
          if (iface.family === 'IPv4' && !iface.internal) {
            interfaces.push({
              name,
              ip: iface.address,
              family: 'IPv4',
              internal: iface.internal
            });
          }
        }
      }
    }

    return interfaces;
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Set up event listeners for UDP ports
   */
  protected setupEventListeners(): void {
    this.inputPort.on('error', (error: Error) => {
      this.handleError(error);
    });

    this.outputPort.on('error', (error: Error) => {
      this.handleError(error);
    });

    // Add message event handlers
    this.inputPort.on('message', (oscMsg: any) => {
      this.logger.info('Received message:', oscMsg);
      this.emit('message', oscMsg);
    });

    this.outputPort.on('message', (oscMsg: any) => {
      this.logger.info('Received message on output port:', oscMsg);
      this.emit('message', oscMsg);
    });

    // Add bundle event handlers
    this.inputPort.on('bundle', (bundle: any) => {
      this.logger.info('Received bundle:', bundle);
      this.emit('bundle', bundle);
    });

    this.outputPort.on('bundle', (bundle: any) => {
      this.logger.info('Received bundle on output port:', bundle);
      this.emit('bundle', bundle);
    });
  }

  /**
   * Handle port errors
   */
  protected handleError(error: Error): void {
    this.logger.error('UDP port error:', error);
    
    // Only emit error if we're not already in an error state
    if (this.connectionState !== ConnectionState.ERROR) {
      this.setConnectionState(ConnectionState.ERROR);
      this.emit('error', this.createError(
        OSCErrorType.CONNECTION,
        'UDP port error',
        true,
        error
      ));
    }
  }

  /**
   * Start reconnection process
   */
  protected startReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.retryCount < this.config.maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, this.retryCount), 5000);
      this.reconnectTimer = setTimeout(() => {
        this.retryCount++;
        this.connect().catch(() => {
          // Error will be handled by error event
        });
      }, delay);
    } else {
      this.setConnectionState(ConnectionState.ERROR);
      this.emit('error', this.createError(
        OSCErrorType.CONNECTION,
        'Max reconnection attempts reached',
        false
      ));
    }
  }

  /**
   * Set up UDP ports
   */
  private setupPorts(): void {
    this.inputPort = new UDPPort({
      localAddress: this.config.localIP,
      localPort: this.config.inputPort,
      remoteAddress: this.config.serverIP,
      remotePort: this.config.outputPort
    });

    this.outputPort = new UDPPort({
      localAddress: this.config.localIP,
      localPort: this.config.outputPort + 1,
      remoteAddress: this.config.serverIP,
      remotePort: this.config.inputPort
    });

    this.setupEventListeners();
  }

  /**
   * Set up logger
   */
  private setupLogger(): void {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.serverIP || !IP_REGEX.test(this.config.serverIP)) {
      throw this.createError(
        OSCErrorType.INVALID_MESSAGE,
        'Invalid server IP address',
        false
      );
    }

    if (!this.config.localIP || (this.config.localIP !== '0.0.0.0' && !IP_REGEX.test(this.config.localIP))) {
      throw this.createError(
        OSCErrorType.INVALID_MESSAGE,
        'Invalid local IP address',
        false
      );
    }

    if (!this.isValidPort(this.config.inputPort)) {
      throw this.createError(
        OSCErrorType.INVALID_MESSAGE,
        'Invalid input port',
        false
      );
    }

    if (!this.isValidPort(this.config.outputPort)) {
      throw this.createError(
        OSCErrorType.INVALID_MESSAGE,
        'Invalid output port',
        false
      );
    }
  }

  /**
   * Check if port number is valid
   */
  private isValidPort(port: number): boolean {
    return Number.isInteger(port) && port >= PORT_CONSTRAINTS.MIN_PORT && port <= PORT_CONSTRAINTS.MAX_PORT;
  }

  /**
   * Set connection state and emit event
   */
  protected setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    if (state === ConnectionState.ERROR || state === ConnectionState.DISCONNECTED) {
      this.connected = false;
    }
    this.emit('connectionStateChanged', state);
  }

  /**
   * Create OSC error object
   */
  protected createError(
    type: OSCErrorType,
    message: string,
    retryable: boolean,
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
