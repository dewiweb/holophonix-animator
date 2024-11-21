import { EventEmitter } from 'events';

/**
 * Mock UDPPort class for testing
 * Extends EventEmitter to support event-based testing
 */
export class MockUDPPort extends EventEmitter {
  public isOpen: boolean = false;
  private options: Record<string, any>;

  constructor(options: Record<string, any> = {}) {
    super();
    this.options = options;
  }

  public open(): void {
    if (this.isOpen) {
      throw new Error('Port already open');
    }
    this.isOpen = true;
    // Don't automatically emit ready - let tests control this
  }

  public close(): void {
    // Don't throw if port is not open in tests
    this.isOpen = false;
  }

  public send(message: any): void {
    if (!this.isOpen) {
      throw new Error('Cannot send: port not open');
    }
    this.emit('message', message);
  }
}
