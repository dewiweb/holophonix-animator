import { OSCHandler } from '../osc-handler';
import { CartesianCoordinates, PolarCoordinates } from '../../types/osc.types';

// Mock UDP Port
const mockUDPPort = {
  on: jest.fn(),
  once: jest.fn(),
  open: jest.fn(),
  send: jest.fn(),
  close: jest.fn()
};

jest.mock('osc', () => ({
  UDPPort: jest.fn().mockImplementation(() => mockUDPPort)
}));

describe('OSC Handler - Coordinate System Tests', () => {
  let handler: OSCHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    handler = new OSCHandler();
    mockUDPPort.once.mockImplementation((event, callback) => {
      if (event === 'ready') {
        callback();
      }
    });
    await handler.connect();
    mockUDPPort.send.mockImplementation(() => Promise.resolve());
  });

  describe('Cartesian Coordinates', () => {
    it('should validate cartesian coordinates correctly', async () => {
      const validCoords: CartesianCoordinates = { x: 0.5, y: -0.3, z: 0.1 };
      await expect(handler.updateTrackParameters(1, { cartesian: validCoords }))
        .resolves.not.toThrow();

      const invalidCoords: CartesianCoordinates = { x: 1.5, y: 0, z: 0 };
      await expect(handler.updateTrackParameters(1, { cartesian: invalidCoords }))
        .rejects.toThrow('Cartesian coordinates must be in range -1.0 to 1.0');
    });

    it('should send combined xyz message for cartesian coordinates', async () => {
      const coords: CartesianCoordinates = { x: 0.5, y: -0.3, z: 0.1 };
      await handler.updateTrackParameters(1, { cartesian: coords });

      expect(mockUDPPort.send).toHaveBeenCalledWith({
        address: '/track/1/xyz',
        args: [0.5, -0.3, 0.1]
      });
    });

    it('should update track state with cartesian coordinates', async () => {
      const coords: CartesianCoordinates = { x: 0.5, y: -0.3, z: 0.1 };
      await handler.updateTrackParameters(1, { cartesian: coords });

      const state = handler.getTrackState(1);
      expect(state?.cartesian).toEqual(coords);
      expect(state?.polar).toBeUndefined();
    });
  });

  describe('Polar Coordinates', () => {
    it('should validate polar coordinates correctly', async () => {
      const validCoords: PolarCoordinates = { azim: 45, elev: 30, dist: 0.8 };
      await expect(handler.updateTrackParameters(1, { polar: validCoords }))
        .resolves.not.toThrow();

      const invalidAzim: PolarCoordinates = { azim: 400, elev: 0, dist: 0.5 };
      await expect(handler.updateTrackParameters(1, { polar: invalidAzim }))
        .rejects.toThrow('Azimuth must be in range 0.0 to 360.0 degrees');

      const invalidElev: PolarCoordinates = { azim: 45, elev: 100, dist: 0.5 };
      await expect(handler.updateTrackParameters(1, { polar: invalidElev }))
        .rejects.toThrow('Elevation must be in range -90.0 to 90.0 degrees');

      const invalidDist: PolarCoordinates = { azim: 45, elev: 30, dist: 1.5 };
      await expect(handler.updateTrackParameters(1, { polar: invalidDist }))
        .rejects.toThrow('Distance must be in range 0.0 to 1.0');
    });

    it('should send combined aed message for polar coordinates', async () => {
      const coords: PolarCoordinates = { azim: 45, elev: 30, dist: 0.8 };
      await handler.updateTrackParameters(1, { polar: coords });

      expect(mockUDPPort.send).toHaveBeenCalledWith({
        address: '/track/1/aed',
        args: [45, 30, 0.8]
      });
    });

    it('should update track state with polar coordinates', async () => {
      const coords: PolarCoordinates = { azim: 45, elev: 30, dist: 0.8 };
      await handler.updateTrackParameters(1, { polar: coords });

      const state = handler.getTrackState(1);
      expect(state?.polar).toEqual(coords);
      expect(state?.cartesian).toBeUndefined();
    });
  });
});
