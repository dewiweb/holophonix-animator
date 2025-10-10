import '@testing-library/jest-dom';
import { cleanup, configure } from '@testing-library/react';
import * as React from 'react';

// Make React available globally
global.React = React;

// Configure React testing
configure({ testIdAttribute: 'data-testid' });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});


// Store original console.error
const originalError = console.error;

// Configure test environment
beforeAll(() => {
  // Mock requestAnimationFrame
  global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  global.cancelAnimationFrame = (id) => clearTimeout(id);

  // Set up error handling
  console.error = (...args) => {
    // Allow all errors during testing
    originalError.call(console, ...args);
  };
});

// Reset test environment
afterAll(() => {
  console.error = originalError;
});

// Configure React testing
configure({ testIdAttribute: 'data-testid' });

beforeEach(() => {
  cleanup();
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});
