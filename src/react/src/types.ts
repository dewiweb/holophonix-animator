export interface Position {
  x: number;
  y: number;
  z: number;
}

export type KeyframeType = 'position';

export interface Keyframe {
  id: string;
  time: number;
  type: KeyframeType;
  value: Position;
}

export interface LoopRegion {
  start: number;
  end: number;
}

export type AnimationType = 'linear' | 'circular' | 'random' | 'custom';

interface BaseAnimation {
  id: string;
  name: string;
  type: AnimationType;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  keyframes: Keyframe[];
  loopRegion?: LoopRegion;
  tracks: string[];
}

export interface LinearAnimationParameters {
  startPosition: Position;
  endPosition: Position;
}

export interface CircularAnimationParameters {
  center: Position;
  radius: number;
  startAngle: number;
  endAngle: number;
  direction: 'clockwise' | 'counterclockwise';
}

export interface RandomAnimationParameters {
  bounds: {
    min: Position;
    max: Position;
  };
  speed: number;
}

export interface CustomAnimationParameters {
  points: Position[];
  tension: number;
}

export type AnimationParameters = 
  | LinearAnimationParameters
  | CircularAnimationParameters
  | RandomAnimationParameters
  | CustomAnimationParameters;

export interface LinearAnimation extends BaseAnimation {
  type: 'linear';
  parameters: LinearAnimationParameters;
}

export interface CircularAnimation extends BaseAnimation {
  type: 'circular';
  parameters: CircularAnimationParameters;
}

export interface RandomAnimation extends BaseAnimation {
  type: 'random';
  parameters: RandomAnimationParameters;
}

export interface CustomAnimation extends BaseAnimation {
  type: 'custom';
  parameters: CustomAnimationParameters;
}

export type Animation = 
  | LinearAnimation
  | CircularAnimation
  | RandomAnimation
  | CustomAnimation;

export interface Track {
  id: string;
  name: string;
  position: Position;
}

export interface Group {
  id: string;
  name: string;
  tracks: string[];
  pattern: string;
}

export interface AnimationPreset {
  id: string;
  name: string;
  type: AnimationType;
  parameters: AnimationParameters;
}

export const defaultPresets: AnimationPreset[] = [
  {
    id: 'linear-x',
    name: 'Linear X',
    type: 'linear',
    parameters: {
      startPosition: { x: -1, y: 0, z: 0 },
      endPosition: { x: 1, y: 0, z: 0 }
    }
  },
  {
    id: 'circle-xy',
    name: 'Circle XY',
    type: 'circular',
    parameters: {
      center: { x: 0, y: 0, z: 0 },
      radius: 1,
      startAngle: 0,
      endAngle: 360,
      direction: 'clockwise'
    }
  }
];
