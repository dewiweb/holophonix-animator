import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { oscConfigReducer } from '../../react/store/slices/oscConfigSlice';
import { trackStateReducer } from '../../react/store/slices/trackStateSlice';

function render(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        oscConfig: oscConfigReducer,
        trackState: trackStateReducer
      },
      preloadedState
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  const container = document.createElement('div');
  const root = createRoot(container);
  root.render(<Wrapper>{ui}</Wrapper>);

  return {
    container,
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
  };
}

export * from '@testing-library/react';
export { render };
