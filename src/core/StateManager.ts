import { Position, TrackParameters } from '../shared/types';
import { StateManager as NativeState } from '../bindings';

export class StateManager {
  private native: NativeState;

  constructor() {
    this.native = new NativeState();
  }

  async add_track(track: TrackParameters): Promise<boolean> {
    return await this.native.add_track(track.id, track.position);
  }

  async remove_track(id: string): Promise<boolean> {
    return await this.native.remove_track(id);
  }

  async update_track_position(id: string, position: Position): Promise<boolean> {
    return await this.native.update_track_position(id, position);
  }

  async get_track(id: string): Promise<TrackParameters | null> {
    const track = await this.native.get_track(id);
    return track || null;
  }

  async get_all_tracks(): Promise<TrackParameters[]> {
    return await this.native.get_all_tracks();
  }

  async clear_all_tracks(): Promise<void> {
    await this.native.clear_all_tracks();
  }
}
