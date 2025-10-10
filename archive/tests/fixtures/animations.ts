import { LinearAnimation, CircularAnimation, Position, KeyframeType, Keyframe } from '../../src/react/src/types';

export const mockPosition: Position = {
  x: 0,
  y: 0,
  z: 0
};

export const mockEndPosition: Position = {
  x: 1,
  y: 1,
  z: 1
};

export const mockKeyframe: Keyframe = {
  id: 'kf1',
  time: 1000,
  type: 'position',
  value: mockPosition
};

export const mockLinearAnimation: LinearAnimation = {
  id: 'anim1',
  name: 'Test Animation',
  type: 'linear',
  duration: 5000,
  currentTime: 0,
  isPlaying: false,
  parameters: {
    startPosition: mockPosition,
    endPosition: mockEndPosition
  },
  keyframes: [
    {
      id: 'kf1',
      time: 0,
      type: 'position',
      value: mockPosition
    },
    {
      id: 'kf2',
      time: 5000,
      type: 'position',
      value: mockEndPosition
    }
  ],
  loopRegion: {
    start: 1000,
    end: 4000
  }
};
