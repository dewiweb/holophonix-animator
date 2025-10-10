import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import { AnimationVisualizer } from '../../../src/react/src/components/AnimationVisualizer';
import { Animation } from '../../../src/react/src/types';

describe('AnimationVisualizer', () => {
  const mockLinearAnimation = {
    id: 'anim1',
    name: 'Test Animation',
    type: 'linear',
    duration: 5000,
    tracks: ['track1'],
    keyframes: [
      { id: 'kf1', time: 0, position: { x: 0, y: 0 } },
      { id: 'kf2', time: 5000, position: { x: 100, y: 100 } }
    ],
    currentTime: 2500,
    isPlaying: false,
    parameters: {
      startPosition: { x: 0, y: 0, z: 0 },
      endPosition: { x: 100, y: 100, z: 0 }
    }
  };

  const mockCircularAnimation = {
    ...mockLinearAnimation,
    type: 'circular',
    parameters: {
      center: { x: 50, y: 50, z: 0 },
      radius: 25,
      speed: 1,
      direction: 'clockwise'
    }
  };

  it('renders canvas element', () => {
    act(() => {
      render(<AnimationVisualizer animation={mockLinearAnimation} />);
    });
    const canvas = screen.getByTestId('animation-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName.toLowerCase()).toBe('canvas');
  });

  it('shows animation type', () => {
    act(() => {
      render(<AnimationVisualizer animation={mockLinearAnimation} />);
    });
    expect(screen.getByTestId('animation-type')).toHaveTextContent('Linear');
  });

  it('shows play state', () => {
    const { rerender } = render(<AnimationVisualizer animation={mockLinearAnimation} />);
    expect(screen.getByTestId('play-state')).toHaveTextContent('Paused');

    const playingAnimation = { ...mockLinearAnimation, isPlaying: true };
    act(() => {
      rerender(<AnimationVisualizer animation={playingAnimation} />);
    });
    expect(screen.getByTestId('play-state')).toHaveTextContent('Playing');
  });

  it('shows current position', () => {
    act(() => {
      render(<AnimationVisualizer animation={mockLinearAnimation} />);
    });
    const position = screen.getByTestId('current-position');
    expect(position).toBeInTheDocument();
    expect(position).toHaveTextContent('X:');
    expect(position).toHaveTextContent('Y:');
  });

  it('shows progress indicator', () => {
    act(() => {
      render(<AnimationVisualizer animation={mockLinearAnimation} />);
    });
    expect(screen.getByTestId('progress-indicator')).toHaveTextContent('50%');
  });

  it('handles canvas interactions', () => {
    const onTimeChange = jest.fn();
    act(() => {
      render(
        <AnimationVisualizer 
          animation={mockLinearAnimation}
          onTimeChange={onTimeChange}
        />
      );
    });

    const canvas = screen.getByTestId('animation-canvas');
    act(() => {
      fireEvent.click(canvas, { clientX: 200, clientY: 200 });
    });
    expect(onTimeChange).toHaveBeenCalled();
  });

  it('shows axis labels', () => {
    act(() => {
      render(<AnimationVisualizer animation={mockLinearAnimation} />);
    });
    expect(screen.getByText('X')).toBeInTheDocument();
    expect(screen.getByText('Y')).toBeInTheDocument();
  });

  it('handles animation type change', () => {
    const { rerender } = render(<AnimationVisualizer animation={mockLinearAnimation} />);
    expect(screen.getByTestId('path-type')).toHaveTextContent('Linear Path');

    act(() => {
      rerender(<AnimationVisualizer animation={mockCircularAnimation} />);
    });
    expect(screen.getByTestId('path-type')).toHaveTextContent('Circular Path');
  });
});
