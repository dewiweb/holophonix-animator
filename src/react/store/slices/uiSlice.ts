import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ConnectionStatus } from '../../../shared/types';

interface UIState {
    connectionStatus: ConnectionStatus;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
}

const initialState: UIState = {
    connectionStatus: ConnectionStatus.DISCONNECTED,
    isPlaying: false,
    currentTime: 0,
    duration: 5000 // Default 5 seconds
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
            state.connectionStatus = action.payload;
        },
        setPlaybackState: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        setCurrentTime: (state, action: PayloadAction<number>) => {
            state.currentTime = action.payload;
        },
        setDuration: (state, action: PayloadAction<number>) => {
            state.duration = action.payload;
        }
    }
});

export const {
    setConnectionStatus,
    setPlaybackState,
    setCurrentTime,
    setDuration
} = uiSlice.actions;

export const uiReducer = uiSlice.reducer;
