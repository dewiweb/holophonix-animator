import { StateSynchronizer } from '../state-synchronizer';
import { OSCHandler } from '../osc-handler';
import { TrackState, OSCMessage, TrackParameters, OSCConfig, DEFAULT_OSC_CONFIG } from '../../types/osc.types';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock OSC Handler for integration testing
class MockOSCHandler extends OSCHandler {
  protected trackStates: Map<number, TrackState> = new Map();
  protected _connected = false;
  private handlingMessage = false;

  constructor(config: Partial<OSCConfig> = {}) {
    super(config);
    this.setupMockStates();
  }

  async connect(): Promise<void> {
    this._connected = true;
    this.emit('ready');
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    return Promise.resolve();
  }

  private setupMockStates() {
    // Initialize with some default states
    this.trackStates.set(1, {
      cartesian: { x: 0, y: 0, z: 0 },
      polar: { distance: 0, azimuth: 0, elevation: 0 }
    });
    this.trackStates.set(2, {
      cartesian: { x: 0.5, y: 0.5, z: 0 },
      polar: { distance: 0.7, azimuth: 45, elevation: 0 }
    });
    this.trackStates.set(3, {
      cartesian: { x: -0.5, y: -0.5, z: 0 },
      polar: { distance: 0.7, azimuth: -135, elevation: 0 }
    });
  }

  async sendBatch(messages: OSCMessage[]): Promise<void> {
    if (!this._connected) {
      throw new Error('Not connected');
    }

    // Process messages sequentially with delay
    for (const message of messages) {
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      this.handleMessage(message);
    }
  }

  async updateTrackParameters(trackId: number, params: Partial<TrackParameters>): Promise<void> {
    if (!this._connected) {
      throw new Error('Not connected');
    }

    const currentState = this.trackStates.get(trackId) || {
      lastUpdate: new Date(),
      ...params
    };

    this.trackStates.set(trackId, {
      ...currentState,
      ...params,
      lastUpdate: new Date()
    });

    // Only emit state update if not handling a message
    if (!this.handlingMessage) {
      this.emit('state', {
        trackId,
        parameter: Object.keys(params)[0] as keyof TrackParameters,
        value: Object.values(params)[0],
        timestamp: new Date()
      });
    }
  }

  getTrackState(trackId: number): TrackState | undefined {
    return this.trackStates.get(trackId);
  }

  private handleMessage(message: OSCMessage) {
    const [trackId, parameter] = this.parseAddress(message.address);
    if (!trackId || !parameter) return;

    const value = message.args[0];
    this.handlingMessage = true;
    try {
      this.updateTrackParameters(trackId, { [parameter]: value });
    } finally {
      this.handlingMessage = false;
    }
  }

  private parseAddress(address: string): [number | null, string | null] {
    const match = address.match(/\/track\/(\d+)\/(\w+)/);
    if (!match) return [null, null];
    return [parseInt(match[1]), match[2]];
  }
}

describe('StateSynchronizer Integration Tests', () => {
  const stateDir = path.join(process.cwd(), '.temp-test-states');
  let oscHandler: MockOSCHandler;
  let synchronizer: StateSynchronizer;

  // Increase timeout for all tests
  jest.setTimeout(60000);

  beforeAll(async () => {
    // Ensure state directory exists
    await fs.mkdir(stateDir, { recursive: true });
  });

  beforeEach(async () => {
    oscHandler = new MockOSCHandler();
    synchronizer = new StateSynchronizer(oscHandler as unknown as OSCHandler, stateDir);

    // Connect and wait for ready
    await oscHandler.connect();
    await new Promise<void>((resolve) => {
      oscHandler.once('ready', resolve);
      oscHandler.emit('ready'); // Simulate ready event
    });
  });

  afterEach(async () => {
    // Clean up state files after each test
    try {
      const files = await fs.readdir(stateDir);
      await Promise.all(files.map(file => fs.unlink(path.join(stateDir, file))));
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }

    // Clean up event listeners
    oscHandler.removeAllListeners();
    synchronizer.removeAllListeners();
  });

  afterAll(async () => {
    // Clean up state directory after all tests
    try {
      await fs.rm(stateDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }
  });

  describe('State Synchronization', () => {
    it('should initialize tracks and receive all parameters', async () => {
      const trackIds = [1, 2, 3];
      const initPromise = synchronizer.initializeTracks(trackIds);
      
      // Wait for initialization
      await expect(initPromise).resolves.not.toThrow();

      // Verify all tracks have states
      for (const trackId of trackIds) {
        const state = oscHandler.getTrackState(trackId);
        expect(state).toBeDefined();
        expect(state?.cartesian || state?.polar).toBeDefined();
      }
    });

    it('should handle concurrent track updates', async () => {
      // Initialize track
      await synchronizer.initializeTracks([1]);

      // Set up state update handler
      const updatePromise = new Promise<void>((resolve) => {
        let updateCount = 0;
        synchronizer.on('stateUpdated', () => {
          updateCount++;
          if (updateCount === 3) resolve();
        });
      });

      // Simulate multiple concurrent updates
      const updates = [
        { trackId: 1, parameter: 'cartesian' as keyof TrackParameters, value: { x: 1, y: 1, z: 1 } },
        { trackId: 1, parameter: 'gain' as keyof TrackParameters, value: 0.5 },
        { trackId: 1, parameter: 'mute' as keyof TrackParameters, value: true }
      ];

      // Send updates sequentially to ensure order
      for (const update of updates) {
        await oscHandler.emit('state', { ...update, timestamp: new Date() });
      }

      // Wait for all updates to complete
      await updatePromise;

      // Verify final state
      const finalState = oscHandler.getTrackState(1);
      expect(finalState).toBeDefined();
      expect(finalState?.mute).toBe(true);
      expect(finalState?.gain).toBe(0.5);
      expect(finalState?.cartesian).toEqual({ x: 1, y: 1, z: 1 });
    });

    it('should recover from connection loss', async () => {
      // Initialize track
      await synchronizer.initializeTracks([1]);

      // Set up error handler
      const errorPromise = new Promise<void>((resolve) => {
        synchronizer.once('error', () => resolve());
      });

      // Simulate connection loss and wait for error
      await oscHandler.disconnect();
      await errorPromise;

      // Wait and reconnect
      await new Promise(resolve => setTimeout(resolve, 100));
      await oscHandler.connect();

      // Attempt update after reconnection
      const updatePromise = new Promise<void>((resolve) => {
        synchronizer.once('stateUpdated', () => resolve());
      });

      // Send update
      await oscHandler.emit('state', {
        trackId: 1,
        parameter: 'gain',
        value: 0.8,
        timestamp: new Date()
      });

      // Wait for update to complete
      await updatePromise;

      // Verify state was updated
      const finalState = oscHandler.getTrackState(1);
      expect(finalState?.gain).toBe(0.8);
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed track initialization', async () => {
      let attempts = 0;
      const originalSend = oscHandler.send;

      // Mock send to fail twice then succeed
      oscHandler.send = async (message: OSCMessage) => {
        if (attempts++ < 2) {
          throw new Error('Temporary failure');
        }
        await originalSend.call(oscHandler, message);
      };

      // Should eventually succeed
      await synchronizer.initializeTracks([1]);
      expect(attempts).toBeGreaterThan(1);

      // Restore original send
      oscHandler.send = originalSend;
    });

    it('should handle partial state updates', async () => {
      await synchronizer.initializeTracks([1]);

      // Set up state handler
      const updatePromise = new Promise<void>((resolve) => {
        synchronizer.once('stateUpdated', () => resolve());
      });

      // Send first update
      await oscHandler.emit('state', {
        trackId: 1,
        parameter: 'cartesian',
        value: { x: 1, y: 1, z: 1 },
        timestamp: new Date()
      });

      await updatePromise;

      // Verify state
      const finalState = oscHandler.getTrackState(1);
      expect(finalState).toBeDefined();
      expect(finalState?.cartesian).toEqual({ x: 1, y: 1, z: 1 });
    });
  });

  describe('State Persistence', () => {
    const stateFile = path.join(stateDir, 'track-1-state.json');

    it('should persist state changes to disk', async () => {
      const trackId = 1;
      const parameter = 'gain';
      const value = 0.5;

      const stateUpdatedPromise = new Promise<void>((resolve) => {
        synchronizer.once('stateUpdated', () => resolve());
      });

      await synchronizer.updateTrackState(trackId, parameter, value);
      await stateUpdatedPromise;
      await synchronizer.waitForStatePersistence(trackId);

      const savedState = await synchronizer['loadState'](trackId);
      expect(savedState).toBeTruthy();
      expect(savedState?.gain).toBe(value);
    }, 10000);

    it('should handle multiple state updates in sequence', async () => {
      const trackId = 1;
      const updates = [
        { parameter: 'gain' as keyof TrackParameters, value: 0.3 },
        { parameter: 'cartesian' as keyof TrackParameters, value: { x: 0.5, y: 0.7, z: 0 } }
      ];

      for (const update of updates) {
        const stateUpdatedPromise = new Promise<void>((resolve) => {
          synchronizer.once('stateUpdated', () => resolve());
        });

        await synchronizer.updateTrackState(trackId, update.parameter, update.value);
        await stateUpdatedPromise;
        await synchronizer.waitForStatePersistence(trackId);

        const savedState = await synchronizer['loadState'](trackId);
        expect(savedState).toBeTruthy();
        if (update.parameter === 'gain') {
          expect(savedState?.gain).toBe(update.value);
        } else if (update.parameter === 'cartesian') {
          expect(savedState?.cartesian).toEqual(update.value);
        }
      }
    }, 15000);

    it('should restore state from persistence', async () => {
      // Create mock persisted state
      const mockState: TrackState = {
        cartesian: { x: 2, y: 2, z: 2 },
        gain: 0.7,
        mute: false,
        name: 'Persisted Track',
        color: { r: 0, g: 1, b: 0, a: 1 },
        lastUpdate: new Date()
      };

      await fs.writeFile(stateFile, JSON.stringify(mockState, null, 2));

      // Initialize synchronizer with persisted state
      const newSynchronizer = new StateSynchronizer(oscHandler as unknown as OSCHandler, stateDir);
      await newSynchronizer.initializeTracks([1]);

      // Wait for state to be restored
      await synchronizer.waitForStatePersistence(1);

      // Verify state was restored
      const restoredState = oscHandler.getTrackState(1);
      expect(restoredState?.cartesian).toEqual(mockState.cartesian);
      expect(restoredState?.gain).toBe(mockState.gain);
    });

    it('should handle corrupted state files', async () => {
      // Write corrupted state file
      await fs.writeFile(stateFile, 'corrupted json');

      // Should handle corrupted file gracefully
      const newSynchronizer = new StateSynchronizer(oscHandler as unknown as OSCHandler, stateDir);
      await expect(newSynchronizer.initializeTracks([1])).resolves.not.toThrow();
    });
  });
});
