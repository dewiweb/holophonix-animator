import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ConnectionStatus } from '../../shared/types';

interface UIState {
  error: string | null;
  isPlaying: boolean;
  currentTime: number;
  connectionStatus: ConnectionStatus;
}

const initialState: UIState = {
  error: null,
  isPlaying: false,
  currentTime: 0,
  connectionStatus: ConnectionStatus.Disconnected,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },
  },
});

export const { setError, setIsPlaying, setCurrentTime, setConnectionStatus } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
