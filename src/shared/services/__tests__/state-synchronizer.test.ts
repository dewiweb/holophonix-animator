import { StateSynchronizer } from '../state-synchronizer';
import { OSCErrorType } from '../../types';
import { mockOscHandler, mockErrorHandler } from '../../test/mocks';

jest.mock('../../handlers/osc-handler');

describe('StateSynchronizer', () => {
  let synchronizer: StateSynchronizer;
  
  beforeEach(() => {
    jest.clearAllMocks();
    synchronizer = new StateSynchronizer(mockOscHandler, mockErrorHandler);
  });

  describe('initializeTracks', () => {
    it('should query parameters for new tracks', async () => {
      const trackIds = [1];
      const mockState = {
        cartesian: { x: 0, y: 0, z: 0 },
        spherical: { azimuth: 0, elevation: 0, distance: 1 },
        gain: 0,
        mute: false,
        name: 'Track 1',
        color: '#FF0000'
      };

      mockOscHandler.getTrackState.mockResolvedValueOnce(mockState);

      await synchronizer.initializeTracks(trackIds);

      expect(mockOscHandler.getTrackState).toHaveBeenCalledWith(1);
    }, 30000); // Increased timeout

    it('should handle initialization timeout', async () => {
      const trackIds = [1];
      mockOscHandler.getTrackState.mockRejectedValueOnce(new Error('Timeout'));

      await expect(synchronizer.initializeTracks(trackIds)).rejects.toThrow();

      expect(mockErrorHandler).toHaveBeenCalledWith({
        type: OSCErrorType.STATE_SYNC,
        message: 'Failed to initialize track states',
        retryable: true,
        data: expect.any(Error)
      });
    });
  });

  describe('synchronizeState', () => {
    it('should request full state from Holophonix', async () => {
      const trackId = 1;
      mockOscHandler.sendBatch.mockResolvedValueOnce(undefined);

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

      await synchronizer.synchronizeState(trackId);

      expect(mockErrorHandler).toHaveBeenCalledWith({
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
      const mockState = {
        cartesian: { x: 1, y: 1, z: 1 }
      };

      await synchronizer.handleStateUpdate(trackId, mockState);

      expect(mockOscHandler.getTrackState).toHaveBeenCalledWith(trackId);
    });
  });
});
