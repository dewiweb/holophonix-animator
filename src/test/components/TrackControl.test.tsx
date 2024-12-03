import React from 'react';
import { render, screen, fireEvent } from '../utils/test-utils';
import { TrackControl } from '../../react/components/TrackControl';

describe('TrackControl', () => {
  const mockTrack = {
    id: 'test-track',
    position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 }
  };

  const mockProps = {
    track: mockTrack,
    onPositionChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows no track message when no track selected', () => {
    render(<TrackControl onPositionChange={mockProps.onPositionChange} />);
    expect(screen.getByText('No Track Selected')).toBeInTheDocument();
    expect(screen.getByText('Select a track to control its position')).toBeInTheDocument();
  });

  it('renders position controls when track is selected', () => {
    render(<TrackControl {...mockProps} />);
    
    expect(screen.getByTestId('x-position-input')).toBeInTheDocument();
    expect(screen.getByTestId('y-position-input')).toBeInTheDocument();
    expect(screen.getByTestId('z-position-input')).toBeInTheDocument();
  });

  it('displays current position values', () => {
    const trackWithPosition = {
      ...mockTrack,
      position: { x: 0.5, y: -0.3, z: 0.1, rx: 0, ry: 0, rz: 0 }
    };
    
    render(<TrackControl track={trackWithPosition} onPositionChange={mockProps.onPositionChange} />);
    
    expect(screen.getByText('X: 0.50')).toBeInTheDocument();
    expect(screen.getByText('Y: -0.30')).toBeInTheDocument();
    expect(screen.getByText('Z: 0.10')).toBeInTheDocument();
  });

  it('handles position changes', () => {
    render(<TrackControl {...mockProps} />);
    
    const xSlider = screen.getByTestId('x-position-input');
    fireEvent.change(xSlider, { target: { value: 0.5 } });
    
    expect(mockProps.onPositionChange).toHaveBeenCalledWith({
      x: 0.5,
      y: 0,
      z: 0,
      rx: 0,
      ry: 0,
      rz: 0
    });
  });
});
