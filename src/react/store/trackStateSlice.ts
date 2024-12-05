import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Position, TrackParameters } from '../../shared/types';

interface TrackState {
  tracks: Map<string, TrackParameters>;
  selectedTrackId: string | null;
}

const initialState: TrackState = {
  tracks: new Map(),
  selectedTrackId: null
};

const trackStateSlice = createSlice({
  name: 'trackState',
  initialState,
  reducers: {
    addTrack: (state, action: PayloadAction<TrackParameters>) => {
      state.tracks.set(action.payload.id, action.payload);
    },
    removeTrack: (state, action: PayloadAction<string>) => {
      state.tracks.delete(action.payload);
      if (state.selectedTrackId === action.payload) {
        state.selectedTrackId = null;
      }
    },
    updateTrackPosition: (state, action: PayloadAction<{ id: string; position: Position }>) => {
      const track = state.tracks.get(action.payload.id);
      if (track) {
        track.position = action.payload.position;
      }
    },
    selectTrack: (state, action: PayloadAction<string | null>) => {
      state.selectedTrackId = action.payload;
    }
  }
});

export const { addTrack, removeTrack, updateTrackPosition, selectTrack } = trackStateSlice.actions;
export const trackStateReducer = trackStateSlice.reducer;
