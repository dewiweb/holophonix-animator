import { EventEmitter } from 'events';
import { TrackState, TrackParameters, OSCMessage, OSCErrorType } from '../types/osc.types';
import { OSCHandler } from './osc-handler';

interface StateVersion {
  version: number;
  timestamp: Date;
  state: TrackState;
}

export class StateSynchronizer extends EventEmitter {
  private stateVersions: Map<number, StateVersion[]> = new Map();
  private currentVersion: number = 0;
  private pendingSynchronizations: Set<number> = new Set();
  
  constructor(private oscHandler: OSCHandler) {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for state updates from OSC handler
    this.oscHandler.on('state', async (update) => {
      await this.handleStateUpdate(update);
    });
  }

  /**
   * Initialize tracks with parameter queries
   * @param trackIds Array of track IDs to initialize
   */
  public async initializeTracks(trackIds: number[]): Promise<void> {
    const messages: OSCMessage[] = [];
    
    // For each track, query all parameters
    for (const trackId of trackIds) {
      if (this.pendingSynchronizations.has(trackId)) {
        continue; // Skip if already synchronizing
      }
      
      this.pendingSynchronizations.add(trackId);
      
      messages.push(
        { address: '/get', args: [`/track/${trackId}/xyz`] },
        { address: '/get', args: [`/track/${trackId}/aed`] },
        { address: '/get', args: [`/track/${trackId}/gain`] },
        { address: '/get', args: [`/track/${trackId}/mute`] },
        { address: '/get', args: [`/track/${trackId}/name`] },
        { address: '/get', args: [`/track/${trackId}/color`] }
      );
    }

    try {
      // Send all queries in batches
      await this.oscHandler.sendBatch(messages);
      
      // Wait for responses with timeout
      await Promise.race([
        Promise.all(trackIds.map(trackId => this.waitForInitialization(trackId))),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Track initialization timeout')), 
          this.oscHandler.config.connectionTimeout)
        )
      ]);
      
    } catch (error) {
      this.emit('error', {
        type: OSCErrorType.STATE_SYNC,
        message: `Failed to initialize tracks: ${trackIds.join(', ')}`,
        retryable: true,
        data: error
      });
    } finally {
      // Clean up pending synchronizations
      trackIds.forEach(trackId => this.pendingSynchronizations.delete(trackId));
    }
  }

  /**
   * Wait for track initialization to complete
   */
  private waitForInitialization(trackId: number): Promise<void> {
    return new Promise((resolve) => {
      const checkState = () => {
        const state = this.oscHandler.getTrackState(trackId);
        if (state && (state.cartesian || state.polar)) {
          resolve();
        } else {
          setTimeout(checkState, 100); // Check every 100ms
        }
      };
      checkState();
    });
  }

  /**
   * Handle incoming state updates
   */
  private async handleStateUpdate(update: { trackId: number; parameter: keyof TrackParameters; value: any; timestamp: Date }): Promise<void> {
    const trackId = update.trackId;
    const currentState = this.oscHandler.getTrackState(trackId);
    
    if (!currentState) return;

    // Create new version
    const newVersion: StateVersion = {
      version: ++this.currentVersion,
      timestamp: update.timestamp,
      state: { ...currentState }
    };

    // Store version history
    let versions = this.stateVersions.get(trackId) || [];
    versions.push(newVersion);
    
    // Keep only last 10 versions for memory efficiency
    if (versions.length > 10) {
      versions = versions.slice(-10);
    }
    
    this.stateVersions.set(trackId, versions);
  }

  /**
   * Synchronize state with Holophonix
   */
  public async synchronizeState(trackId: number): Promise<void> {
    try {
      // Request full state from Holophonix
      const messages: OSCMessage[] = [
        { address: '/get', args: [`/track/${trackId}/xyz`] },
        { address: '/get', args: [`/track/${trackId}/aed`] },
        { address: '/get', args: [`/track/${trackId}/gain`] },
        { address: '/get', args: [`/track/${trackId}/mute`] },
        { address: '/get', args: [`/track/${trackId}/name`] },
        { address: '/get', args: [`/track/${trackId}/color`] }
      ];

      await this.oscHandler.sendBatch(messages);
    } catch (error) {
      this.emit('error', {
        type: OSCErrorType.STATE_SYNC,
        message: `Failed to synchronize state for track ${trackId}`,
        retryable: true,
        data: error
      });
    }
  }

  /**
   * Resolve conflicts between local and remote state
   */
  public async resolveConflicts(trackId: number): Promise<void> {
    const versions = this.stateVersions.get(trackId);
    if (!versions || versions.length < 2) return;

    const latestVersion = versions[versions.length - 1];
    const previousVersion = versions[versions.length - 2];

    // Detect changes between versions
    const changes = this.detectStateChanges(previousVersion.state, latestVersion.state);
    if (Object.keys(changes).length === 0) return;

    // Apply only the changes that don't conflict
    await this.applyNonConflictingChanges(trackId, changes);
  }

  /**
   * Detect changes between two states
   */
  private detectStateChanges(oldState: TrackState, newState: TrackState): Partial<TrackParameters> {
    const changes: Partial<TrackParameters> = {};

    // Compare each parameter
    if (JSON.stringify(oldState.cartesian) !== JSON.stringify(newState.cartesian)) {
      changes.cartesian = newState.cartesian;
    }
    if (JSON.stringify(oldState.polar) !== JSON.stringify(newState.polar)) {
      changes.polar = newState.polar;
    }
    if (oldState.gain !== newState.gain) {
      changes.gain = newState.gain;
    }
    if (oldState.mute !== newState.mute) {
      changes.mute = newState.mute;
    }
    if (oldState.name !== newState.name) {
      changes.name = newState.name;
    }
    if (JSON.stringify(oldState.color) !== JSON.stringify(newState.color)) {
      changes.color = newState.color;
    }

    return changes;
  }

  /**
   * Apply changes that don't conflict with remote state
   */
  private async applyNonConflictingChanges(trackId: number, changes: Partial<TrackParameters>): Promise<void> {
    try {
      await this.oscHandler.updateTrackParameters(trackId, changes);
    } catch (error) {
      this.emit('error', {
        type: OSCErrorType.STATE_SYNC,
        message: `Failed to apply state changes for track ${trackId}`,
        retryable: true,
        data: error
      });
    }
  }
}
