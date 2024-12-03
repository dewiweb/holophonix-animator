import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OSCConfig } from '../../../bindings';

const initialState: OSCConfig = {
    host: 'localhost',
    port: 8000,
    timeout_ms: 1000
};

const oscConfigSlice = createSlice({
    name: 'oscConfig',
    initialState,
    reducers: {
        updateOscConfig: (state, action: PayloadAction<OSCConfig>) => {
            return { ...action.payload };
        }
    }
});

export const { updateOscConfig } = oscConfigSlice.actions;
export const oscConfigReducer = oscConfigSlice.reducer;
