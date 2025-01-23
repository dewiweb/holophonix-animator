export type TrackType = 'source' | 'group';
export type GroupPattern = 'range' | 'set' | 'union';
export type GroupRelation = 'independent' | 'leader-follower' | 'isobarycentric';

export type Position = {
  x: number;
  y: number;
  z: number;
};

export type KeyframeType = 'position' | 'rotation' | 'scale' | 'color';

export interface Keyframe {
  id: string;
  time: number;
  type: KeyframeType;
  value: Position;
}

export type AnimationType = 'linear' | 'circular' | 'random' | 'custom';

export interface LinearAnimationParameters {
  startPosition: Position;
  endPosition: Position;
}

export interface CircularAnimationParameters {
  center: Position;
  radius: number;
  speed: number;
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
  speed: number;
}

export type AnimationParameters = 
  | LinearAnimationParameters 
  | CircularAnimationParameters 
  | RandomAnimationParameters 
  | CustomAnimationParameters;

export interface BaseAnimation {
  id: string;
  name: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  loopRegion?: {
    start: number;
    end: number;
  };
  keyframes?: Keyframe[];
}

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

export interface AnimationPreset {
  name: string;
  parameters: AnimationParameters;
}

export const defaultPresets: Record<AnimationType, AnimationPreset[]> = {
  linear: [
    {
      name: 'Simple Forward',
      parameters: {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 10, y: 0, z: 0 }
      }
    }
  ],
  circular: [
    {
      name: 'Circle XY',
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        radius: 5,
        speed: 1,
        direction: 'clockwise'
      }
    }
  ],
  random: [
    {
      name: 'Bounded Random',
      parameters: {
        bounds: {
          min: { x: -5, y: -5, z: -5 },
          max: { x: 5, y: 5, z: 5 }
        },
        speed: 1
      }
    }
  ],
  custom: [
    {
      name: 'Square Path',
      parameters: {
        points: [
          { x: 0, y: 0, z: 0 },
          { x: 5, y: 0, z: 0 },
          { x: 5, y: 5, z: 0 },
          { x: 0, y: 5, z: 0 }
        ],
        speed: 1
      }
    }
  ]
};

export interface CustomMarker {
  time: number;
  label: string;
  color: string;
}

export interface Track {
  id: string;
  name: string;
  groupId: string;
  type: TrackType;
  position: Position;
  isSelected: boolean;
  isMuted: boolean;
  isSolo: boolean;
  animationState: {
    animation: Animation;
  };
}

export interface Group {
  id: string;
  name: string;
  type: TrackType;
  isExpanded: boolean;
  tracks: Track[];
  animationState: {
    animation: Animation;
  };
}
