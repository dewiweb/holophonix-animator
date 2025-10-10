// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { MockContext2D, mockElementDimensions } from './test-utils';

// Mock Canvas API
// @ts-ignore
HTMLCanvasElement.prototype.getContext = function() {
  return new MockContext2D();
};

// Mock element dimensions
mockElementDimensions();
