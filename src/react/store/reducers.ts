import { combineReducers } from '@reduxjs/toolkit';
import { trackStateReducer } from './trackStateSlice';
import { uiReducer } from './uiSlice';
import { oscConfigReducer } from './oscConfigSlice';

export const rootReducer = combineReducers({
  trackState: trackStateReducer,
  ui: uiReducer,
  oscConfig: oscConfigReducer,
});
