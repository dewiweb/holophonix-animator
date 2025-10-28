import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock implementations for testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock WebGL context for Three.js
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId) => {
  if (contextId === 'webgl' || contextId === 'experimental-webgl') {
    return {
      // Mock WebGL context methods
      createBuffer: vi.fn(),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      createProgram: vi.fn(),
      createShader: vi.fn(),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      useProgram: vi.fn(),
      getUniformLocation: vi.fn(),
      uniformMatrix4fv: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      viewport: vi.fn(),
      clear: vi.fn(),
      clearColor: vi.fn(),
      drawArrays: vi.fn(),
      drawElements: vi.fn(),
      // Add other necessary WebGL methods as needed
    }
  }
  return null
})
