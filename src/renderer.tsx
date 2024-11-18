// Import styles
import './styles/theme.css';
import './index.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { App } from './components/App';
import { theme } from './styles/theme';

console.log('Renderer script loaded');

const render = () => {
  console.log('Render function called');
  const container = document.getElementById('root');
  console.log('Root container:', container);

  if (container) {
    const root = createRoot(container);
    console.log('React root created');

    root.render(
      <React.StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </React.StrictMode>
    );

    console.log('App rendered');
  } else {
    console.error('Root container not found');
  }
};

// Call render when the document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render);
} else {
  render();
}

// Handle hot module replacement
if (module.hot) {
  module.hot.accept();
}
