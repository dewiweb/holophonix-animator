import { OSCBaseHandler } from './osc-base-handler';
import { OSCConfig, OSCMessage, OSCErrorType, MessageType, AnimationControlMessage } from '../types/osc.types';

/**
 * OSC Message Handler Service
 * Handles sending and receiving OSC messages for animation control
 */
export class OSCMessageHandler extends OSCBaseHandler {
  constructor(config: Partial<OSCConfig> = {}) {
    super(config);
    this.setupMessageHandlers();
  }

  /**
   * Send animation control message
   */
  public async sendAnimationControl(message: AnimationControlMessage): Promise<void> {
    if (!this.connected) {
      throw this.createError(
        OSCErrorType.NOT_CONNECTED,
        'Cannot send message: not connected',
        true
      );
    }

    try {
      const oscMessage: OSCMessage = {
        address: '/animation/control',
        args: [
          {
            type: 's',
            value: message.command
          },
          {
            type: 's',
            value: JSON.stringify(message.parameters || {})
          }
        ]
      };

      await this.sendMessage(oscMessage);
    } catch (error) {
      throw this.createError(
        OSCErrorType.SEND_FAILED,
        'Failed to send animation control message',
        true,
        error
      );
    }
  }

  /**
   * Send OSC message
   */
  private async sendMessage(message: OSCMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.outputPort.send(message);
        resolve();
      } catch (error) {
        reject(this.createError(
          OSCErrorType.SEND_FAILED,
          'Failed to send OSC message',
          true,
          error
        ));
      }
    });
  }

  /**
   * Set up message handlers
   */
  private setupMessageHandlers(): void {
    this.inputPort.on('message', (oscMessage: OSCMessage) => {
      try {
        this.handleMessage(oscMessage);
      } catch (error) {
        this.logger.error('Error handling message:', error);
        this.emit('error', this.createError(
          OSCErrorType.INVALID_MESSAGE,
          'Failed to handle incoming message',
          false,
          error
        ));
      }
    });
  }

  /**
   * Handle incoming OSC message
   */
  private handleMessage(message: OSCMessage): void {
    const messageType = this.getMessageType(message.address);

    switch (messageType) {
      case MessageType.ANIMATION_CONTROL:
        this.handleAnimationControl(message);
        break;
      case MessageType.STATUS:
        this.handleStatus(message);
        break;
      default:
        throw this.createError(
          OSCErrorType.INVALID_MESSAGE,
          `Unknown message type: ${message.address}`,
          false
        );
    }
  }

  /**
   * Get message type from address
   */
  private getMessageType(address: string): MessageType {
    if (address.startsWith('/animation/control')) {
      return MessageType.ANIMATION_CONTROL;
    }
    if (address.startsWith('/status')) {
      return MessageType.STATUS;
    }
    return MessageType.UNKNOWN;
  }

  /**
   * Handle animation control message
   */
  private handleAnimationControl(message: OSCMessage): void {
    if (!message.args || message.args.length < 2) {
      throw this.createError(
        OSCErrorType.INVALID_MESSAGE,
        'Invalid animation control message format',
        false
      );
    }

    try {
      const command = message.args[0].value as string;
      const parameters = JSON.parse(message.args[1].value as string);

      const controlMessage: AnimationControlMessage = {
        command,
        parameters
      };

      this.emit('animationControl', controlMessage);
    } catch (error) {
      throw this.createError(
        OSCErrorType.INVALID_MESSAGE,
        'Failed to parse animation control message',
        false,
        error
      );
    }
  }

  /**
   * Handle status message
   */
  private handleStatus(message: OSCMessage): void {
    if (!message.args || !message.args.length) {
      throw this.createError(
        OSCErrorType.INVALID_MESSAGE,
        'Invalid status message format',
        false
      );
    }

    try {
      const status = JSON.parse(message.args[0].value as string);
      this.emit('status', status);
    } catch (error) {
      throw this.createError(
        OSCErrorType.INVALID_MESSAGE,
        'Failed to parse status message',
        false,
        error
      );
    }
  }
}
