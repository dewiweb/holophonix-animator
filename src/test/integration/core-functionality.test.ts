import { act } from '@testing-library/react';
import { AnimationCore } from '../../core/AnimationCore';
import { OSCManager } from '../../core/OSCManager';
import { StateManager } from '../../core/StateManager';

jest.mock('../../core/OSCManager');

describe('Core Functionality Integration', () => {
  let animationCore: AnimationCore;
  let oscManager: jest.Mocked<OSCManager>;
  let stateManager: StateManager;

  beforeEach(() => {
    oscManager = new OSCManager() as jest.Mocked<OSCManager>;
    stateManager = new StateManager();
    animationCore = new AnimationCore(oscManager, stateManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Track Management', () => {
    it('should create and manage tracks correctly', async () => {
      const trackId = await animationCore.createTrack();
      expect(trackId).toBeDefined();
      
      const tracks = animationCore.getTracks();
      expect(tracks).toHaveLength(1);
      expect(tracks[0].id).toBe(trackId);
    });

    it('should update track positions and notify OSC', async () => {
      const trackId = await animationCore.createTrack();
      const newPosition = { x: 1.0, y: 0.5, z: 0.0 };
      
      await animationCore.updateTrackPosition(trackId, newPosition);
      
      expect(oscManager.sendPosition).toHaveBeenCalledWith(
        trackId,
        expect.objectContaining(newPosition)
      );
    });
  });

  describe('Animation Playback', () => {
    it('should play animations and update positions', async () => {
      const trackId = await animationCore.createTrack();
      const keyframes = [
        { time: 0, position: { x: 0, y: 0, z: 0 } },
        { time: 1000, position: { x: 1, y: 1, z: 0 } }
      ];
      
      await animationCore.setKeyframes(trackId, keyframes);
      
      act(() => {
        animationCore.play();
      });
      
      // Fast-forward time
      jest.advanceTimersByTime(500);
      
      expect(oscManager.sendPosition).toHaveBeenCalledWith(
        trackId,
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
          z: expect.any(Number)
        })
      );
    });
  });

  describe('State Management', () => {
    it('should save and load state correctly', async () => {
      const trackId = await animationCore.createTrack();
      const position = { x: 1.0, y: 0.5, z: 0.0 };
      await animationCore.updateTrackPosition(trackId, position);
      
      const state = stateManager.saveState();
      expect(state).toBeDefined();
      
      // Clear current state
      await animationCore.reset();
      expect(animationCore.getTracks()).toHaveLength(0);
      
      // Load saved state
      await stateManager.loadState(state);
      const tracks = animationCore.getTracks();
      expect(tracks).toHaveLength(1);
      expect(tracks[0].position).toEqual(position);
    });
  });

  describe('Performance', () => {
    it('should maintain performance requirements during animation', async () => {
      const trackId = await animationCore.createTrack();
      const keyframes = Array.from({ length: 100 }, (_, i) => ({
        time: i * 100,
        position: {
          x: Math.sin(i * 0.1),
          y: Math.cos(i * 0.1),
          z: 0
        }
      }));
      
      await animationCore.setKeyframes(trackId, keyframes);
      
      const startTime = performance.now();
      act(() => {
        animationCore.play();
      });
      
      // Measure time for 100 updates
      for (let i = 0; i < 100; i++) {
        jest.advanceTimersByTime(16); // ~60fps
      }
      
      const endTime = performance.now();
      const averageUpdateTime = (endTime - startTime) / 100;
      
      // Ensure updates are happening within 5ms
      expect(averageUpdateTime).toBeLessThan(5);
    });
  });
});
