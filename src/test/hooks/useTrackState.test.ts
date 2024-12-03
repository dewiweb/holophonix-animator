import { renderHook, act } from '@testing-library/react-hooks';
import { useTrackState } from '../../react/hooks/useTrackState';
import { StateManager, AnimationEngine, OscManager } from '../../rust/src/lib';
import { mockPosition, mockTrackParameters } from '../setup';

jest.mock('../../rust/src/lib');

describe('useTrackState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useTrackState());
    expect(result.current.position).toEqual(mockPosition);
    expect(result.current.tracks).toEqual([]);
  });

  it('adds a track', async () => {
    const { result } = renderHook(() => useTrackState());
    
    await act(async () => {
      await result.current.addTrack();
    });

    expect(result.current.tracks).toHaveLength(1);
    expect(result.current.tracks[0]).toEqual(mockTrackParameters);
  });

  it('updates track position', async () => {
    const { result } = renderHook(() => useTrackState());
    const newPosition = { x: 1, y: 1, z: 1 };
    
    await act(async () => {
      await result.current.addTrack();
      await result.current.updatePosition(newPosition);
    });

    expect(result.current.position).toEqual(newPosition);
  });

  it('removes a track', async () => {
    const { result } = renderHook(() => useTrackState());
    
    await act(async () => {
      await result.current.addTrack();
      await result.current.removeTrack(mockTrackParameters.id);
    });

    expect(result.current.tracks).toHaveLength(0);
  });
});
