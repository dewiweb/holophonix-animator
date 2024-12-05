import { Position, TrackParameters, OSCMessage, OSCConfig } from '../../shared/types';

export class StateManager {
  private tracks: Map<string, TrackParameters> = new Map();

  add_track = jest.fn((track: TrackParameters): boolean => {
    this.tracks.set(track.id, track);
    return true;
  });

  remove_track = jest.fn((id: string): boolean => {
    return this.tracks.delete(id);
  });

  update_track_position = jest.fn((id: string, position: Position): boolean => {
    const track = this.tracks.get(id);
    if (track) {
      track.position = position;
      return true;
    }
    return false;
  });

  get_track = jest.fn((id: string): TrackParameters | null => {
    return this.tracks.get(id) || null;
  });

  get_all_tracks = jest.fn((): TrackParameters[] => {
    return Array.from(this.tracks.values());
  });

  save_state = jest.fn(async (): Promise<string> => {
    return 'mock-save-path';
  });

  load_state = jest.fn(async (): Promise<boolean> => {
    return true;
  });

  cleanup_old_saves = jest.fn(async (keepCount: number): Promise<void> => {
    // Mock implementation
  });
}

export class AnimationEngine {
  constructor(private oscManager: OscManager) {}

  initialize = jest.fn(async (): Promise<void> => {
    // Mock implementation
  });

  reset = jest.fn(async (): Promise<void> => {
    // Mock implementation
  });

  update_position = jest.fn((position: Position): void => {
    // Mock implementation
  });

  calculate_linear_positions = jest.fn((startPos: Position, endPos: Position, durationMs: number): Position[] => {
    return [startPos, endPos];
  });
}

export class OscManager {
  private isConnected: boolean = false;

  constructor(private config: OSCConfig) {}

  connect = jest.fn(async (): Promise<void> => {
    this.isConnected = true;
  });

  disconnect = jest.fn(async (): Promise<void> => {
    this.isConnected = false;
  });

  updateConfig = jest.fn(async (config: OSCConfig): Promise<void> => {
    this.config = config;
  });

  send = jest.fn(async (message: OSCMessage): Promise<void> => {
    // Mock implementation
  });

  on = jest.fn();
  once = jest.fn();
  emit = jest.fn();
  removeAllListeners = jest.fn();

  getIsConnected(): boolean {
    return this.isConnected;
  }
}
