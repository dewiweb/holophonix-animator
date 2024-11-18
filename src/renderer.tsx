// Import styles
import './styles/theme.css';
import './index.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';

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
        <App />
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
