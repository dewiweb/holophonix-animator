import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { combineReducers } from 'redux';

// Import reducers
const oscConfigReducer = (state = {
  host: 'localhost',
  port: 8000,
  timeout_ms: 1000,
  isConnected: false
}, action) => {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    default:
      return state;
  }
};

const trackStateReducer = (state = {
  currentTrack: {
    id: 'test-track',
    position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
    animation: null
  },
  tracks: []
}, action) => {
  switch (action.type) {
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  oscConfig: oscConfigReducer,
  trackState: trackStateReducer
});

function render(
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: rootReducer,
      preloadedState
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';
export { render };
export { rootReducer };
