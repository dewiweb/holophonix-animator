import { StateSynchronizer } from '../state-synchronizer';
import { OSCHandler } from '../osc-handler';
import { TrackState, OSCErrorType } from '../../types/osc.types';

jest.mock('../osc-handler');

describe('StateSynchronizer', () => {
  let synchronizer: StateSynchronizer;
  let mockOscHandler: jest.Mocked<OSCHandler>;

  beforeEach(() => {
    mockOscHandler = new OSCHandler() as jest.Mocked<OSCHandler>;
    synchronizer = new StateSynchronizer(mockOscHandler);
  });

  describe('initializeTracks', () => {
    it('should query parameters for new tracks', async () => {
      const trackIds = [1, 2];
      const mockState: TrackState = {
        cartesian: { x: 0, y: 0, z: 0 },
        lastUpdate: new Date()
      };

      // Mock the getTrackState to simulate state updates
      mockOscHandler.getTrackState
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined)
        .mockReturnValue(mockState);

      const initPromise = synchronizer.initializeTracks(trackIds);

      // Simulate responses coming in
      mockOscHandler.emit('state', {
        trackId: 1,
        parameter: 'cartesian',
        value: mockState.cartesian,
        timestamp: new Date()
      });

      mockOscHandler.emit('state', {
        trackId: 2,
        parameter: 'cartesian',
        value: mockState.cartesian,
        timestamp: new Date()
      });

      await initPromise;

      // Verify that all necessary queries were sent
      expect(mockOscHandler.sendBatch).toHaveBeenCalledWith([
        { address: '/get', args: ['/track/1/xyz'] },
        { address: '/get', args: ['/track/1/aed'] },
        { address: '/get', args: ['/track/1/gain'] },
        { address: '/get', args: ['/track/1/mute'] },
        { address: '/get', args: ['/track/1/name'] },
        { address: '/get', args: ['/track/1/color'] },
        { address: '/get', args: ['/track/2/xyz'] },
        { address: '/get', args: ['/track/2/aed'] },
        { address: '/get', args: ['/track/2/gain'] },
        { address: '/get', args: ['/track/2/mute'] },
        { address: '/get', args: ['/track/2/name'] },
        { address: '/get', args: ['/track/2/color'] }
      ]);
    });

    it('should handle initialization timeout', async () => {
      const trackIds = [1];
      mockOscHandler.config = { connectionTimeout: 100 };

      const errorHandler = jest.fn();
      synchronizer.on('error', errorHandler);

      // Don't emit any state updates to trigger timeout
      await expect(synchronizer.initializeTracks(trackIds)).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalledWith({
        type: OSCErrorType.STATE_SYNC,
        message: 'Failed to initialize tracks: 1',
        retryable: true,
        data: expect.any(Error)
      });
    });
  });

  describe('synchronizeState', () => {
    it('should request full state from Holophonix', async () => {
      const trackId = 1;
      await synchronizer.synchronizeState(trackId);

      expect(mockOscHandler.sendBatch).toHaveBeenCalledWith([
        { address: '/get', args: [`/track/${trackId}/xyz`] },
        { address: '/get', args: [`/track/${trackId}/aed`] },
        { address: '/get', args: [`/track/${trackId}/gain`] },
        { address: '/get', args: [`/track/${trackId}/mute`] },
        { address: '/get', args: [`/track/${trackId}/name`] },
        { address: '/get', args: [`/track/${trackId}/color`] }
      ]);
    });

    it('should emit error on synchronization failure', async () => {
      const trackId = 1;
      const error = new Error('Sync failed');
      mockOscHandler.sendBatch.mockRejectedValueOnce(error);

      const errorHandler = jest.fn();
      synchronizer.on('error', errorHandler);

      await synchronizer.synchronizeState(trackId);

      expect(errorHandler).toHaveBeenCalledWith({
        type: OSCErrorType.STATE_SYNC,
        message: `Failed to synchronize state for track ${trackId}`,
        retryable: true,
        data: error
      });
    });
  });

  describe('handleStateUpdate', () => {
    it('should create new version on state update', async () => {
      const trackId = 1;
      const currentState: TrackState = {
        cartesian: { x: 0, y: 0, z: 0 },
        lastUpdate: new Date()
      };

      mockOscHandler.getTrackState.mockReturnValue(currentState);

      const update = {
        trackId,
        parameter: 'cartesian' as keyof TrackState,
        value: { x: 1, y: 0, z: 0 },
        timestamp: new Date()
      };

      // Emit state update
      mockOscHandler.emit('state', update);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify state was updated
      expect(mockOscHandler.getTrackState).toHaveBeenCalledWith(trackId);
    });
  });

  describe('resolveConflicts', () => {
    it('should detect and apply non-conflicting changes', async () => {
      const trackId = 1;
      const oldState: TrackState = {
        cartesian: { x: 0, y: 0, z: 0 },
        gain: 0,
        lastUpdate: new Date()
      };

      const newState: TrackState = {
        cartesian: { x: 1, y: 0, z: 0 },
        gain: 0,
        lastUpdate: new Date()
      };

      mockOscHandler.getTrackState.mockReturnValue(newState);

      // Simulate state updates
      mockOscHandler.emit('state', {
        trackId,
        parameter: 'cartesian',
        value: oldState.cartesian,
        timestamp: new Date()
      });

      mockOscHandler.emit('state', {
        trackId,
        parameter: 'cartesian',
        value: newState.cartesian,
        timestamp: new Date()
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      await synchronizer.resolveConflicts(trackId);

      // Verify changes were applied
      expect(mockOscHandler.updateTrackParameters).toHaveBeenCalledWith(
        trackId,
        { cartesian: newState.cartesian }
      );
    });
  });
});
