// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Canvas API
class MockContext2D {
  fillStyle: string = '#000';
  strokeStyle: string = '#000';
  lineWidth: number = 1;
  beginPath() {}
  moveTo() {}
  lineTo() {}
  stroke() {}
  arc() {}
  fill() {}
  clearRect() {}
}

// @ts-ignore
HTMLCanvasElement.prototype.getContext = function() {
  return new MockContext2D();
};

// Mock offsetWidth/offsetHeight since jsdom doesn't support them
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  value: 1000
});

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  value: 100
});
