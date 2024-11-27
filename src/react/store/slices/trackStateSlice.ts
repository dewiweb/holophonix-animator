import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TrackState {
  id: string;
  x: number;
  y: number;
  z: number;
  gain: number;
  mute: boolean;
}

interface TracksState {
  [trackId: string]: TrackState;
}

const initialState: TracksState = {};

const trackStateSlice = createSlice({
  name: 'trackState',
  initialState,
  reducers: {
    updateTrack: (state, action: PayloadAction<TrackState>) => {
      const track = action.payload;
      state[track.id] = track;
    },
    removeTrack: (state, action: PayloadAction<string>) => {
      delete state[action.payload];
    },
    setTracks: (state, action: PayloadAction<TracksState>) => {
      return action.payload;
    },
  },
});

export const { updateTrack, removeTrack, setTracks } = trackStateSlice.actions;
export default trackStateSlice.reducer;
