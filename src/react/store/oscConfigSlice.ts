import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OSCConfig } from '../../shared/types';

const initialState: OSCConfig = {
  host: 'localhost',
  port: 8000
};

const oscConfigSlice = createSlice({
  name: 'oscConfig',
  initialState,
  reducers: {
    updateConfig: (state, action: PayloadAction<Partial<OSCConfig>>) => {
      return { ...state, ...action.payload };
    },
    resetConfig: () => initialState
  }
});

export const { updateConfig, resetConfig } = oscConfigSlice.actions;
export const oscConfigReducer = oscConfigSlice.reducer;
