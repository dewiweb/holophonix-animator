import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnimationControls } from '../../../src/react/src/components/AnimationControls';
import { mockLinearAnimation } from '../../fixtures/animations';

describe('AnimationControls', () => {
  it('renders play/pause button', async () => {
    render(<AnimationControls animation={mockLinearAnimation} />);
    
    const playPauseButton = screen.getByRole('button', { name: /play|pause/i });
    expect(playPauseButton).toBeInTheDocument();
  });

  it('calls onPlayPause when play button is clicked', async () => {
    const onPlayPause = jest.fn();
    render(
      <AnimationControls 
        animation={mockLinearAnimation}
        onPlayPause={onPlayPause}
      />
    );
    
    const playPauseButton = screen.getByRole('button', { name: /play/i });
    await userEvent.click(playPauseButton);
    expect(onPlayPause).toHaveBeenCalled();
  });

  it('shows pause button when animation is playing', async () => {
    const playingAnimation = {
      ...mockLinearAnimation,
      isPlaying: true
    };

    const { getByRole } = render(
      <AnimationControls 
        animation={playingAnimation}
        onPlayPause={jest.fn()}
      />
    );
    
    const pauseButton = getByRole('button', { name: /pause/i });
    expect(pauseButton).toBeInTheDocument();
  });

  it('calls onStop when stop button is clicked', async () => {
    const onStop = jest.fn();
    const { getByRole } = render(
      <AnimationControls 
        animation={mockLinearAnimation}
        onStop={onStop}
      />
    );
    
    const stopButton = getByRole('button', { name: /stop/i });
    await userEvent.click(stopButton);
    expect(onStop).toHaveBeenCalled();
  });

  it('calls onTimeUpdate when time slider changes', async () => {
    const onTimeUpdate = jest.fn();
    const { getByRole } = render(
      <AnimationControls 
        animation={mockLinearAnimation}
        onTimeUpdate={onTimeUpdate}
      />
    );
    
    const timeSlider = getByRole('slider');
    // Use fireEvent to simulate range input change
    fireEvent.change(timeSlider, { target: { value: '2500' } });
    expect(onTimeUpdate).toHaveBeenCalledWith(mockLinearAnimation.id, 2500);
  });

  it('displays current time and duration in mm:ss format', async () => {
    const animation = {
      ...mockLinearAnimation,
      currentTime: 61000 // 1:01
    };

    const { getByText } = render(
      <AnimationControls animation={animation} />
    );
    
    expect(getByText('01:01.00 / 00:05.00')).toBeInTheDocument();
  });
});
