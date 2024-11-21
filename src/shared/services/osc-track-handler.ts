import { OSCMessageHandler } from './osc-message-handler';
import {
  TrackParameters,
  TrackState,
  OSCMessage,
  OSCIncomingMessage,
  OSCStateUpdate,
  OSCErrorType,
} from '../types/osc.types';

/**
 * OSC Track Handler Service
 * Handles track-specific operations and state management
 */
export class OSCTrackHandler extends OSCMessageHandler {
  private trackStates: Map<number, TrackState> = new Map();
  private pendingQueries: Map<string, (value: any) => void> = new Map();
  private validationTimer?: NodeJS.Timeout;

  protected setupEventListeners(): void {
    super.setupEventListeners();

    this.inputPort.on('message', (oscMsg) => {
      const parsedMessage = this.parseIncomingMessage(oscMsg);
      if (parsedMessage.trackId !== undefined) {
        this.updateTrackState(parsedMessage);
        this.handleIncomingMessage(parsedMessage);
      }
    });
  }

  /**
   * Update track parameters
   */
  public async updateTrackParameters(trackId: number, params: Partial<TrackParameters>): Promise<void> {
    const messages: OSCMessage[] = [];

    // Handle cartesian coordinates
    if (params.cartesian) {
      const { x, y, z } = params.cartesian;
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
      }, this.config.queryTimeout);
    });

    await this.send({ address: '/get', args: [`/track/${trackId}/${parameter}`] });
    return result;
  }

  protected updateTrackState(message: OSCIncomingMessage): void {
    if (!message.trackId) return;

    let state = this.trackStates.get(message.trackId);
    if (!state) {
      state = { lastUpdate: new Date() };
      this.trackStates.set(message.trackId, state);
    }

    state.lastUpdate = new Date();
    this.emit('state_update', {
      trackId: message.trackId,
      parameter: message.parameter as keyof TrackParameters,
      value: message.args[0],
      timestamp: state.lastUpdate
    } as OSCStateUpdate);
  }

  protected handleIncomingMessage(message: OSCIncomingMessage): void {
    if (!message.trackId || !message.parameter) return;

    const queryId = `${message.trackId}:${message.parameter}`;
    const resolver = Array.from(this.pendingQueries.entries())
      .find(([key]) => key.startsWith(queryId))?.[1];

    if (resolver) {
      resolver(message.args[0]);
      this.pendingQueries.delete(queryId);
    }
  }

  public startValidationTimer(): void {
    if (this.validationTimer) return;
    
    this.validationTimer = setInterval(
      () => this.validateState(),
      this.config.validationInterval
    );
  }

  public stopValidationTimer(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = undefined;
    }
  }

  private async validateState(): Promise<void> {
    try {
      // Implement state validation logic here
      // For example, query critical parameters for each track
    } catch (error) {
      this.emit('error', {
        type: OSCErrorType.TIMEOUT,
        message: 'Track validation failed: no response received',
        retryable: true,
        data: { trackId: typeof error === 'object' && error !== null ? (error as any).trackId : undefined }
      });
    }
  }
}
