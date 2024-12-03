import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { PositionVisualizer } from '../../react/components/PositionVisualizer';
import { Position } from '../../react/types';

describe('PositionVisualizer', () => {
  const mockProps = {
    position: {
      x: 0,
      y: 0,
      z: 0,
      rx: 0,
      ry: 0,
      rz: 0
    } as Position,
    onPositionChange: jest.fn(),
    size: 200
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PositionVisualizer {...mockProps} />);
  });

  it('renders canvas with correct dimensions', () => {
    const { container } = render(<PositionVisualizer {...mockProps} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('width', '200');
    expect(canvas).toHaveAttribute('height', '200');
  });

  it('updates position when dragging', () => {
    const { container } = render(<PositionVisualizer {...mockProps} />);
    const canvas = container.querySelector('canvas');
    
    if (!canvas) {
      throw new Error('Canvas not found');
    }

    // Mock getBoundingClientRect
    const rect = {
      left: 0,
      top: 0,
      width: mockProps.size,
      height: mockProps.size,
      right: mockProps.size,
      bottom: mockProps.size,
      x: 0,
      y: 0,
      toJSON: () => {}
    };
    canvas.getBoundingClientRect = jest.fn().mockReturnValue(rect);

    // Start dragging at center (0, 0)
    fireEvent.mouseDown(canvas, {
      clientX: mockProps.size / 2,
      clientY: mockProps.size / 2
    });

    const firstCall = mockProps.onPositionChange.mock.calls[0][0];
    expect(Math.abs(firstCall.x)).toBeLessThan(0.001);
    expect(Math.abs(firstCall.y)).toBeLessThan(0.001);

    // Move to top-right quadrant
    fireEvent.mouseMove(canvas, {
      clientX: mockProps.size * 0.75, // Should result in x = 0.5
      clientY: mockProps.size * 0.25  // Should result in y = 0.5
    });

    expect(mockProps.onPositionChange).toHaveBeenCalledWith(expect.objectContaining({
      x: 0.5,
      y: 0.5
    }));

    // Release mouse
    fireEvent.mouseUp(canvas);

    // Move without pressing - should not trigger update
    fireEvent.mouseMove(canvas, {
      clientX: mockProps.size,
      clientY: mockProps.size
    });

    // Should still be called only twice (from mouseDown and mouseMove while dragging)
    expect(mockProps.onPositionChange).toHaveBeenCalledTimes(2);
  });

  it('clamps position values between -1 and 1', () => {
    const { container } = render(<PositionVisualizer {...mockProps} />);
    const canvas = container.querySelector('canvas');
    
    if (!canvas) {
      throw new Error('Canvas not found');
    }

    // Mock getBoundingClientRect
    const rect = {
      left: 0,
      top: 0,
      width: mockProps.size,
      height: mockProps.size,
      right: mockProps.size,
      bottom: mockProps.size,
      x: 0,
      y: 0,
      toJSON: () => {}
    };
    canvas.getBoundingClientRect = jest.fn().mockReturnValue(rect);

    // Try to move beyond bounds
    fireEvent.mouseDown(canvas, {
      clientX: mockProps.size * 2, // Should clamp to 1
      clientY: -mockProps.size     // Should clamp to 1
    });

    expect(mockProps.onPositionChange).toHaveBeenCalledWith(expect.objectContaining({
      x: 1,
      y: 1
    }));
  });
});
