export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Track {
  id: string;
  name: string;
  position: Position;
  is_active: boolean;
}

export interface Keyframe {
  time: number;
  position: Position;
}

export interface TimelineProps {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onTimeChange: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  keyframes: Keyframe[];
  onAddKeyframe: (time: number) => void;
  onRemoveKeyframe: (time: number) => void;
  onUpdateKeyframe: (time: number, position: Position) => void;
  onPlayPause: () => void;
  disabled: boolean;
  currentPosition: Position;
  onPositionChange: (position: Position) => void;
  onTimeUpdate: (time: number) => void;
}

export interface TrackControlProps {
  position: Position;
  onPositionChange: (position: Position) => void;
  disabled: boolean;
}

export interface PositionVisualizerProps {
  position: Position;
  width: number;
  height: number;
  onPositionChange: (position: Position) => void;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}
