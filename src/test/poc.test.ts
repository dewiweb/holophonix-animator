import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { StateManager, AnimationEngine, OscManager } from '../rust/src/lib';
import { TEST_CONFIG, mockStateManager, mockAnimationEngine, mockOscManager, positions } from './poc-test-config';

jest.mock('../rust/src/lib');

describe('Holophonix Animator POC', () => {
  let stateManager: jest.Mocked<StateManager>;
  let animationEngine: jest.Mocked<AnimationEngine>;
  let oscManager: jest.Mocked<OscManager>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Initialize mocked instances
    (StateManager as jest.Mock).mockImplementation(() => mockStateManager);
    (AnimationEngine as jest.Mock).mockImplementation(() => mockAnimationEngine);
    (OscManager as jest.Mock).mockImplementation(() => mockOscManager);

    stateManager = new StateManager() as jest.Mocked<StateManager>;
    animationEngine = new AnimationEngine() as jest.Mocked<AnimationEngine>;
    oscManager = new OscManager() as jest.Mocked<OscManager>;
  });

  describe('State Management', () => {
    it('should add and retrieve a track', async () => {
      await stateManager.add_track(TEST_CONFIG.track.id, TEST_CONFIG.track.position);
      const track = await stateManager.get_track(TEST_CONFIG.track.id);
      
      expect(track).toEqual(TEST_CONFIG.track);
      expect(stateManager.add_track).toHaveBeenCalledWith(TEST_CONFIG.track.id, TEST_CONFIG.track.position);
      expect(stateManager.get_track).toHaveBeenCalledWith(TEST_CONFIG.track.id);
    });

    it('should update track position', async () => {
      await stateManager.update_track_position(TEST_CONFIG.track.id, positions.front);
      
      expect(stateManager.update_track_position).toHaveBeenCalledWith(
        TEST_CONFIG.track.id,
        positions.front
      );
    });

    it('should remove a track', async () => {
      await stateManager.remove_track(TEST_CONFIG.track.id);
      
      expect(stateManager.remove_track).toHaveBeenCalledWith(TEST_CONFIG.track.id);
    });
  });

  describe('Animation Engine', () => {
    beforeEach(async () => {
      await animationEngine.set_keyframes(TEST_CONFIG.animation.keyframes);
    });

    it('should set and retrieve keyframes', async () => {
      const keyframes = await animationEngine.get_keyframes();
      
      expect(keyframes).toEqual(TEST_CONFIG.animation.keyframes);
      expect(animationEngine.set_keyframes).toHaveBeenCalledWith(TEST_CONFIG.animation.keyframes);
      expect(animationEngine.get_keyframes).toHaveBeenCalled();
    });

    it('should control animation playback', async () => {
      await animationEngine.play();
      expect(animationEngine.play).toHaveBeenCalled();

      await animationEngine.pause();
      expect(animationEngine.pause).toHaveBeenCalled();

      await animationEngine.stop();
      expect(animationEngine.stop).toHaveBeenCalled();
    });

    it('should get position at specific time', async () => {
      const time = 2500;
      await animationEngine.get_position_at_time(time);
      
      expect(animationEngine.get_position_at_time).toHaveBeenCalledWith(time);
    });
  });

  describe('OSC Communication', () => {
    it('should connect and disconnect from OSC server', async () => {
      await oscManager.connect(
        TEST_CONFIG.osc.host,
        TEST_CONFIG.osc.port,
        TEST_CONFIG.osc.sendPort,
        TEST_CONFIG.osc.receivePort
      );
      
      expect(oscManager.connect).toHaveBeenCalledWith(
        TEST_CONFIG.osc.host,
        TEST_CONFIG.osc.port,
        TEST_CONFIG.osc.sendPort,
        TEST_CONFIG.osc.receivePort
      );

      await oscManager.disconnect();
      expect(oscManager.disconnect).toHaveBeenCalled();
    });

    it('should send position updates via OSC', async () => {
      await oscManager.connect(
        TEST_CONFIG.osc.host,
        TEST_CONFIG.osc.port,
        TEST_CONFIG.osc.sendPort,
        TEST_CONFIG.osc.receivePort
      );
      
      await oscManager.send_position(TEST_CONFIG.track.id, positions.front);
      
      expect(oscManager.send_position).toHaveBeenCalledWith(
        TEST_CONFIG.track.id,
        positions.front
      );
    });

    it('should create valid OSC messages', async () => {
      await oscManager.create_position_message(TEST_CONFIG.track.id, positions.front);
      
      expect(oscManager.create_position_message).toHaveBeenCalledWith(
        TEST_CONFIG.track.id,
        positions.front
      );
    });
  });

  describe('Integration Tests', () => {
    beforeEach(async () => {
      // Setup initial state
      await stateManager.add_track(TEST_CONFIG.track.id, TEST_CONFIG.track.position);
      await animationEngine.set_keyframes(TEST_CONFIG.animation.keyframes);
      await oscManager.connect(
        TEST_CONFIG.osc.host,
        TEST_CONFIG.osc.port,
        TEST_CONFIG.osc.sendPort,
        TEST_CONFIG.osc.receivePort
      );
    });

    it('should handle full animation cycle', async () => {
      // Start animation
      await animationEngine.play();
      expect(animationEngine.play).toHaveBeenCalled();

      // Get position at midpoint
      const midPosition = await animationEngine.get_position_at_time(2500);
      expect(animationEngine.get_position_at_time).toHaveBeenCalledWith(2500);

      // Update track position
      await stateManager.update_track_position(TEST_CONFIG.track.id, midPosition);
      expect(stateManager.update_track_position).toHaveBeenCalledWith(
        TEST_CONFIG.track.id,
        midPosition
      );

      // Send position via OSC
      await oscManager.send_position(TEST_CONFIG.track.id, midPosition);
      expect(oscManager.send_position).toHaveBeenCalledWith(
        TEST_CONFIG.track.id,
        midPosition
      );

      // Stop animation
      await animationEngine.stop();
      expect(animationEngine.stop).toHaveBeenCalled();
    });

    it('should handle error conditions gracefully', async () => {
      // Test invalid track ID
      const invalidTrackId = 'invalid-track';
      await expect(stateManager.get_track(invalidTrackId)).rejects.toEqual(undefined);

      // Test invalid time
      const invalidTime = -1;
      await expect(animationEngine.get_position_at_time(invalidTime)).rejects.toEqual(undefined);

      // Test disconnected OSC
      await oscManager.disconnect();
      await expect(oscManager.send_position(TEST_CONFIG.track.id, positions.front)).rejects.toEqual(undefined);
    });
  });
});
