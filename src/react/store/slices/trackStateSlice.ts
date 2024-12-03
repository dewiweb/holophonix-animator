import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Position, Animation } from '../../../bindings';

interface Track {
    id: string;
    position: Position;
    animation?: Animation;
}

interface TrackState {
    currentTrack: Track | null;
    tracks: Record<string, Track>;
    error: string | null;
}

const initialState: TrackState = {
    currentTrack: null,
    tracks: {},
    error: null
};

const trackStateSlice = createSlice({
    name: 'trackState',
    initialState,
    reducers: {
        addTrack: (state, action: PayloadAction<Track>) => {
            state.tracks[action.payload.id] = action.payload;
            if (!state.currentTrack) {
                state.currentTrack = action.payload;
            }
        },
        removeTrack: (state, action: PayloadAction<string>) => {
            delete state.tracks[action.payload];
            if (state.currentTrack?.id === action.payload) {
                const remainingTracks = Object.values(state.tracks);
                state.currentTrack = remainingTracks.length > 0 ? remainingTracks[0] : null;
            }
        },
        setCurrentTrack: (state, action: PayloadAction<string>) => {
            const track = state.tracks[action.payload];
            if (track) {
                state.currentTrack = track;
                state.error = null;
            } else {
                state.error = `Track ${action.payload} not found`;
            }
        },
        updatePosition: (state, action: PayloadAction<Position>) => {
            if (state.currentTrack) {
                state.currentTrack.position = action.payload;
                state.tracks[state.currentTrack.id].position = action.payload;
            }
        },
        setAnimation: (state, action: PayloadAction<{ trackId: string; animation: Animation }>) => {
            const track = state.tracks[action.payload.trackId];
            if (track) {
                track.animation = action.payload.animation;
                if (state.currentTrack?.id === action.payload.trackId) {
                    state.currentTrack.animation = action.payload.animation;
                }
            }
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        }
    }
});

export const {
    addTrack,
    removeTrack,
    setCurrentTrack,
    updatePosition,
    setAnimation,
    setError
} = trackStateSlice.actions;

export const trackStateReducer = trackStateSlice.reducer;
