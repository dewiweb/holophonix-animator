import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import { AnimationControls } from '../AnimationControls';

describe('AnimationControls Component', () => {
  const mockAnimation = {
    id: 'anim1',
    type: 'linear' as const,
    name: 'Linear Move 1',
    isPlaying: false,
    duration: 5000, // 5 seconds
    currentTime: 0,
    parameters: {
      startPosition: { x: 0, y: 0, z: 0 },
      endPosition: { x: 1, y: 1, z: 1 }
    }
  };

  it('renders animation controls correctly', () => {
    act(() => {
      render(<AnimationControls animation={mockAnimation} />);
    });
    
    expect(screen.getByTestId('animation-name')).toHaveTextContent('Linear Move 1');
    expect(screen.getByTestId('play-button')).toBeInTheDocument();
    expect(screen.getByTestId('stop-button')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-slider')).toBeInTheDocument();
  });

  it('handles play/pause toggle', () => {
    const onPlayPause = jest.fn();
    act(() => {
      render(
        <AnimationControls 
          animation={mockAnimation}
          onPlayPause={onPlayPause}
        />
      );
    });

    const playButton = screen.getByTestId('play-button');
    act(() => {
      fireEvent.click(playButton);
    });
    expect(onPlayPause).toHaveBeenCalledWith(mockAnimation.id, true);

    // Update mock to simulate playing state
    const playingAnimation = { ...mockAnimation, isPlaying: true };
    act(() => {
      render(
        <AnimationControls 
          animation={playingAnimation}
          onPlayPause={onPlayPause}
        />
      );
    });

    const pauseButton = screen.getByTestId('pause-button');
    act(() => {
      fireEvent.click(pauseButton);
    });
    expect(onPlayPause).toHaveBeenCalledWith(mockAnimation.id, false);
  });

  it('handles stop action', () => {
    const onStop = jest.fn();
    act(() => {
      render(
        <AnimationControls 
          animation={mockAnimation}
          onStop={onStop}
        />
      );
    });

    const stopButton = screen.getByTestId('stop-button');
    act(() => {
      fireEvent.click(stopButton);
    });
    expect(onStop).toHaveBeenCalledWith(mockAnimation.id);
  });

  it('handles timeline scrubbing', () => {
    const onTimeUpdate = jest.fn();
    act(() => {
      render(
        <AnimationControls 
          animation={mockAnimation}
          onTimeUpdate={onTimeUpdate}
        />
      );
    });

    const timelineSlider = screen.getByTestId('timeline-slider');
    act(() => {
      fireEvent.change(timelineSlider, { target: { value: '2500' } });
    });
    expect(onTimeUpdate).toHaveBeenCalledWith(mockAnimation.id, 2500);
  });

  it('displays current time in correct format', () => {
    const animation = { ...mockAnimation, currentTime: 2500 };
    act(() => {
      render(<AnimationControls animation={animation} />);
    });
    
    expect(screen.getByTestId('current-time')).toHaveTextContent('00:02.50');
  });

  it('shows animation type indicator', () => {
    act(() => {
      render(<AnimationControls animation={mockAnimation} />);
    });
    
    const typeIndicator = screen.getByTestId('animation-type');
    expect(typeIndicator).toHaveTextContent('Linear');
    expect(typeIndicator).toHaveAttribute('title', 'Linear Movement Animation');
  });
});
