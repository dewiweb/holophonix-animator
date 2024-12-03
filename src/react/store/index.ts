import { configureStore } from '@reduxjs/toolkit';
import { oscConfigReducer } from './slices/oscConfigSlice';
import { trackStateReducer } from './slices/trackStateSlice';

export const store = configureStore({
    reducer: {
        oscConfig: oscConfigReducer,
        trackState: trackStateReducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
