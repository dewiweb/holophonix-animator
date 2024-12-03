import { useState, useCallback, useEffect } from 'react';
import { Position } from '../types';
import { StateManager, AnimationEngine } from '../../rust/src/lib';

export const useTrackState = () => {
  const [stateManager] = useState(() => new StateManager());
  const [animationEngine] = useState(() => new AnimationEngine({
    fps: 60,
    update_interval: 16.67,
    interpolation_steps: 60,
  }));
  const [track, setTrack] = useState<{ id: string; position: Position } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize default track
    try {
      const defaultTrack = {
        id: 'default',
        name: 'Default Track',
        position: { x: 0, y: 0, z: 0 },
        is_active: true,
      };
      stateManager.add_track(defaultTrack);
      setTrack(defaultTrack);
    } catch (err) {
      setError(`Failed to initialize track: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [stateManager]);

  const updatePosition = useCallback(async (newPosition: Position) => {
    if (!track) return;

    try {
      await stateManager.update_track_position(track.id, newPosition);
      setTrack(prev => prev ? { ...prev, position: newPosition } : null);
      setError(null);
    } catch (err) {
      setError(`Failed to update position: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [track, stateManager]);

  const startAnimation = useCallback(async () => {
    if (!track) return;

    try {
      const currentPos = (await stateManager.get_track(track.id))?.position;
      if (!currentPos) throw new Error('Track not found');

      await animationEngine.update_position(currentPos);
      setError(null);
    } catch (err) {
      setError(`Failed to start animation: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [track, stateManager, animationEngine]);

  const stopAnimation = useCallback(async () => {
    try {
      const currentPos = track?.position;
      if (currentPos) {
        await animationEngine.update_position(currentPos);
      }
      setError(null);
    } catch (err) {
      setError(`Failed to stop animation: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [track, animationEngine]);

  const calculateAnimationPositions = useCallback(async (
    startPos: Position,
    endPos: Position,
    durationMs: number
  ) => {
    try {
      const positions = await animationEngine.calculate_linear_positions(
        startPos,
        endPos,
        durationMs
      );
      setError(null);
      return positions;
    } catch (err) {
      setError(`Failed to calculate animation positions: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }, [animationEngine]);

  return {
    track,
    error,
    updatePosition,
    startAnimation,
    stopAnimation,
    calculateAnimationPositions,
  };
};
