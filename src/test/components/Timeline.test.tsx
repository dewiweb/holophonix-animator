import React from 'react';
import { render, screen, fireEvent } from '../utils/test-utils';
import { Timeline } from '../../react/components/Timeline';

describe('Timeline', () => {
  const mockProps = {
    currentTime: 0,
    isPlaying: false,
    trackId: 'test-track',
    onPlayPause: jest.fn(),
    onStop: jest.fn(),
    onLoadAnimation: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders timeline controls', () => {
    render(<Timeline {...mockProps} />);
    
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-controls')).toBeInTheDocument();
    expect(screen.getByTestId('play-button')).toBeInTheDocument();
    expect(screen.getByTestId('stop-button')).toBeInTheDocument();
  });

  it('handles play/pause button click', () => {
    render(<Timeline {...mockProps} />);
    
    const playButton = screen.getByTestId('play-button');
    fireEvent.click(playButton);
    expect(mockProps.onPlayPause).toHaveBeenCalled();
  });

  it('updates play/pause button icon based on isPlaying', () => {
    const { rerender } = render(<Timeline {...mockProps} />);
    
    // Initially shows play icon
    const playButton = screen.getByTestId('play-button');
    expect(playButton.querySelector('.bp5-icon-play')).toBeInTheDocument();
    
    // After setting isPlaying to true
    rerender(<Timeline {...mockProps} isPlaying={true} />);
    expect(playButton.querySelector('.bp5-icon-pause')).toBeInTheDocument();
  });

  it('handles stop button click', () => {
    render(<Timeline {...mockProps} />);
    
    const stopButton = screen.getByTestId('stop-button');
    fireEvent.click(stopButton);
    expect(mockProps.onStop).toHaveBeenCalled();
  });

  it('displays current time', () => {
    render(<Timeline {...mockProps} currentTime={2500} />);
    expect(screen.getByTestId('time-display')).toHaveTextContent('2.5s');
  });

  it('adds keyframe on button click', () => {
    render(<Timeline {...mockProps} />);
    
    const addKeyframeButton = screen.getByTestId('add-keyframe-button');
    fireEvent.click(addKeyframeButton);
    
    expect(mockProps.onLoadAnimation).toHaveBeenCalledWith(expect.objectContaining({
      track_id: 'test-track',
      keyframes: expect.arrayContaining([
        expect.objectContaining({
          time: 0,
          position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
          interpolation: 'linear'
        })
      ])
    }));
  });
});
