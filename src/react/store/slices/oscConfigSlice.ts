import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OSCConfig {
  host: string;
  port: number;
  enabled: boolean;
}

const initialState: OSCConfig = {
  host: 'localhost',
  port: 8000,
  enabled: false,
};

const oscConfigSlice = createSlice({
  name: 'oscConfig',
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<OSCConfig>) => {
      return action.payload;
    },
    setEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },
  },
});

export const { setConfig, setEnabled } = oscConfigSlice.actions;
export default oscConfigSlice.reducer;
