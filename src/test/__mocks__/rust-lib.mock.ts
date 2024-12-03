export class StateManager {
  private tracks: Map<string, any> = new Map();

  add_track = jest.fn((track) => {
    this.tracks.set(track.id, track);
  });

  remove_track = jest.fn((id: string) => {
    this.tracks.delete(id);
  });

  update_track_position = jest.fn((id: string, position: any) => {
    const track = this.tracks.get(id);
    if (track) {
      track.position = position;
    }
  });

  get_track = jest.fn((id: string) => {
    return this.tracks.get(id);
  });

  get_all_tracks = jest.fn(() => {
    return Array.from(this.tracks.values());
  });
}

export class AnimationEngine {
  constructor(config: any) {}

  update_position = jest.fn();

  calculate_linear_positions = jest.fn((startPos: any, endPos: any, durationMs: number) => {
    return [startPos, endPos];
  });
}

export class OscManager {
  constructor(config: any) {}

  connect = jest.fn();
  disconnect = jest.fn();
  send = jest.fn();
  on = jest.fn();
  once = jest.fn();
  emit = jest.fn();
  removeAllListeners = jest.fn();
}
