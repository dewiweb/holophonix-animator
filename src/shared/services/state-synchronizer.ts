import { EventEmitter } from 'events';
import { TrackState, TrackParameters } from '../types/osc.types';
import { AnimationCoreClient } from '../clients/animation-core.client';
import { validateTrackParameters } from '../utils/coordinate-validator';
import * as fs from 'fs/promises';
import * as path from 'path';

interface StateVersion {
  version: number;
  timestamp: Date;
  state: TrackState;
}

export class StateSynchronizer extends EventEmitter {
  private stateVersions: Map<number, StateVersion[]> = new Map();
  private currentVersion: number = 0;
  private pendingSynchronizations: Set<number> = new Set();
  private stateDir: string;
  private handlingUpdate = false;

  constructor(
    private animationCore: AnimationCoreClient,
    stateDir?: string
  ) {
    super();
    this.stateDir = stateDir || path.join(process.cwd(), '.state');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for state updates from the Rust core
    this.animationCore.on('stateUpdate', async (update) => {
      if (!this.handlingUpdate) {
        await this.handleStateUpdate(update);
      }
    });
  }

  private async ensureStateDirectory(): Promise<void> {
    await fs.mkdir(this.stateDir, { recursive: true });
  }

  private getStateFilePath(trackId: number): string {
    return path.join(this.stateDir, `track-${trackId}-state.json`);
  }

  private async saveState(trackId: number, state: TrackState): Promise<void> {
    try {
      await this.ensureStateDirectory();
      const filePath = this.getStateFilePath(trackId);
      
      // Create a serializable copy of the state
      const serializedState = {
        ...state,
        lastUpdate: state.lastUpdate.toISOString()
      };
      
      await fs.writeFile(filePath, JSON.stringify(serializedState, null, 2));
    } catch (error) {
      this.emit('error', {
        type: 'STATE_SYNC',
        message: `Failed to save state for track ${trackId}`,
        retryable: true,
        data: error
      });
      throw error; // Re-throw to ensure caller knows about failure
    }
  }

  private async loadState(trackId: number): Promise<TrackState | null> {
    try {
      const filePath = this.getStateFilePath(trackId);
      const content = await fs.readFile(filePath, 'utf8');
      const parsedState = JSON.parse(content);
      
      // Convert ISO string back to Date
      return {
        ...parsedState,
        lastUpdate: new Date(parsedState.lastUpdate)
      };
    } catch (error) {
      // If file doesn't exist or is corrupted, return null
      return null;
    }
  }

  /**
   * Wait for state to be persisted to disk
   */
  public async waitForStatePersistence(trackId: number, maxWaitMs: number = 2000): Promise<void> {
    const filePath = this.getStateFilePath(trackId);
    const startTime = Date.now();
    const retryDelay = 100;

    while (Date.now() - startTime < maxWaitMs) {
      try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, 'utf8');
        JSON.parse(content); // Verify it's valid JSON
        return;
      } catch {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error(`Timeout waiting for state persistence for track ${trackId}`);
  }

  /**
   * Initialize tracks with parameter queries
   */
  public async initializeTracks(trackIds: number[]): Promise<void> {
    const messages: any[] = [];

    for (const trackId of trackIds) {
      if (this.pendingSynchronizations.has(trackId)) {
        continue; // Skip if already initializing
      }

      this.pendingSynchronizations.add(trackId);

      try {
        // Load persisted state if available
        const persistedState = await this.loadState(trackId);
        if (persistedState) {
          // Update state after validation
          await this.handleStateUpdate({
            trackId,
            parameter: 'initialization',
            value: persistedState,
            timestamp: new Date()
          });
        }
      } catch (error) {
        this.emit('error', {
          type: 'STATE_SYNC',
          message: `Failed to load persisted state for track ${trackId}`,
          retryable: false,
          data: error
        });
      }

      // Query current state from the Rust core
      messages.push(
        { address: '/get', args: [`/track/${trackId}/cartesian`] },
        { address: '/get', args: [`/track/${trackId}/polar`] },
        { address: '/get', args: [`/track/${trackId}/gain`] },
        { address: '/get', args: [`/track/${trackId}/mute`] },
        { address: '/get', args: [`/track/${trackId}/name`] },
        { address: '/get', args: [`/track/${trackId}/color`] }
      );
    }

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        // Send all queries in batches
        // await this.oscHandler.sendBatch(messages);

        // Wait for responses with timeout
        await Promise.race([
          Promise.all(trackIds.map(trackId => this.waitForInitialization(trackId))),
          new Promise((_, reject) => {
            const timeout = 1000;
            setTimeout(() => reject(new Error('Track initialization timeout')), timeout);
          })
        ]);

        // Success - exit retry loop
        break;
      } catch (error) {
        retryCount++;

        if (retryCount > maxRetries) {
          this.emit('error', {
            type: 'STATE_SYNC',
            message: `Failed to initialize tracks: ${trackIds.join(', ')}`,
            retryable: true,
            data: error
          });
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
      }
    }

    // Clean up pending synchronizations
    trackIds.forEach(trackId => this.pendingSynchronizations.delete(trackId));
  }

  /**
   * Wait for track initialization to complete
   */
  private waitForInitialization(trackId: number): Promise<void> {
    return new Promise((resolve) => {
      const checkState = () => {
        // const state = this.oscHandler.getTrackState(trackId);
        // if (state && (state.cartesian || state.polar)) {
        //   resolve();
        // } else {
        //   setTimeout(checkState, 100); // Check every 100ms
        // }
        resolve();
      };
      checkState();
    });
  }

  /**
   * Update the state for a track
   */
  public async updateTrackState(trackId: number, parameter: keyof TrackParameters, value: any): Promise<void> {
    try {
      // Quick UI validation for immediate feedback
      const quickValidation = validateTrackParameters(parameter, value);
      if (!quickValidation.valid) {
        this.emit('error', {
          type: 'VALIDATION',
          message: quickValidation.error || 'Invalid coordinate values',
          retryable: false,
          data: { trackId, parameter, value }
        });
        throw new Error(quickValidation.error);
      }

      // Send to Animation Core for precise validation and computation
      if (parameter === 'cartesian' || parameter === 'polar') {
        const validationResult = await this.animationCore.validateCoordinates({
          trackId,
          parameter,
          value
        });

        if (!validationResult.valid) {
          this.emit('error', {
            type: 'VALIDATION',
            message: validationResult.error || 'Invalid coordinate values (Animation Core)',
            retryable: false,
            data: { trackId, parameter, value }
          });
          throw new Error(validationResult.error);
        }

        // Use the potentially adjusted value from Animation Core
        value = validationResult.value;
      }

      // Update state after validation
      await this.handleStateUpdate({
        trackId,
        parameter,
        value,
        timestamp: new Date()
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        this.emit('error', error);
      } else {
        this.emit('error', {
          type: 'STATE_UPDATE',
          message: 'Failed to update state',
          retryable: true,
          data: error
        });
      }
      throw error;
    }
  }

  private async handleStateUpdate(update: {
    trackId: number;
    parameter: keyof TrackParameters;
    value: any;
    timestamp: Date;
  }): Promise<void> {
    const { trackId, parameter, value } = update;

    try {
      // Get current state
      let versions = this.stateVersions.get(trackId) || [];
      const currentState = versions.length > 0
        ? versions[versions.length - 1].state
        : await this.loadState(trackId) || {
            lastUpdate: new Date()
          };
      
      // Create a new state version
      const newVersion: StateVersion = {
        version: ++this.currentVersion,
        timestamp: new Date(),
        state: {
          ...currentState,
          [parameter]: value,
          lastUpdate: new Date()
        }
      };

      // Add new version to history
      versions.push(newVersion);
      
      // Keep only last 10 versions for memory efficiency
      if (versions.length > 10) {
        versions = versions.slice(-10);
      }
      
      this.stateVersions.set(trackId, versions);

      // Apply update to the Rust core without triggering another state update
      // The Rust backend will validate the coordinates
      this.handlingUpdate = true;
      try {
        // await this.oscHandler.updateTrackParameters(trackId, { [parameter]: value });
      } finally {
        this.handlingUpdate = false;
      }

      // Save state after successful backend validation
      await this.saveState(trackId, newVersion.state);

      // Emit state update event
      this.emit('stateUpdated', { trackId, parameter, value });
    } catch (error) {
      // Handle validation errors from backend
      if (error && typeof error === 'object' && 'type' in error) {
        if (error.type === 'VALIDATION') {
          this.emit('error', {
            type: 'VALIDATION',
            message: error.message || 'Invalid coordinate values',
            retryable: false,
            data: { trackId, parameter, value }
          });
        } else {
          this.emit('error', {
            type: 'STATE_UPDATE',
            message: `Failed to update state for track ${trackId}`,
            retryable: true,
            data: error
          });
        }
      }
      throw error;
    }
  }

  /**
   * Synchronize state with the Rust core
   */
  public async synchronizeState(trackId: number): Promise<void> {
    try {
      if (this.pendingSynchronizations.has(trackId)) {
        return; // Already synchronizing
      }

      this.pendingSynchronizations.add(trackId);

      // Load persisted state if available
      const persistedState = await this.loadState(trackId);
      if (persistedState) {
        // Update state after validation
        await this.handleStateUpdate({
          trackId,
          parameter: 'initialization',
          value: persistedState,
          timestamp: new Date()
        });
      }

      // Query current state from the Rust core
      // const messages = [
      //   { address: '/get', args: [`/track/${trackId}/xyz`] },
      //   { address: '/get', args: [`/track/${trackId}/aed`] },
      //   { address: '/get', args: [`/track/${trackId}/gain`] },
      //   { address: '/get', args: [`/track/${trackId}/mute`] },
      //   { address: '/get', args: [`/track/${trackId}/name`] },
      //   { address: '/get', args: [`/track/${trackId}/color`] }
      // ];

      // await this.oscHandler.sendBatch(messages);
    } catch (error) {
      this.emit('error', {
        type: 'STATE_SYNC',
        message: `Failed to synchronize state for track ${trackId}`,
        retryable: true,
        data: error
      });
      throw error;
    } finally {
      this.pendingSynchronizations.delete(trackId);
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
      // Apply each change individually to handle partial failures
      for (const [parameter, value] of Object.entries(changes)) {
        try {
          // await this.oscHandler.updateTrackParameters(trackId, { [parameter]: value });
        } catch (error) {
          // Log error for this parameter but continue with others
          this.emit('error', {
            type: 'STATE_SYNC',
            message: `Failed to apply ${parameter} change for track ${trackId}`,
            retryable: true,
            data: error
          });
        }
      }
    } catch (error) {
      this.emit('error', {
        type: 'STATE_SYNC',
        message: `Failed to apply state changes for track ${trackId}`,
        retryable: true,
        data: error
      });
    }
  }
}
