import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackPanel } from '../TrackPanel';
import { Track } from '../../types';

describe('TrackPanel', () => {
  const mockTracks: Track[] = [
    { id: '1', name: 'Track 1', position: { x: 0, y: 0, z: 0 } },
    { id: '2', name: 'Track 2', position: { x: 0.5, y: 0.5, z: 0 } },
  ];

  const defaultProps = {
    tracks: mockTracks,
    selectedTrackId: null,
    onTrackSelect: jest.fn(),
    onTrackAdd: jest.fn(),
    onTrackRemove: jest.fn(),
    onTrackUpdate: jest.fn(),
    width: 300,
    onResize: jest.fn(),
  };

  it('renders track list with tracks', () => {
    render(<TrackPanel {...defaultProps} />);
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 2')).toBeInTheDocument();
  });

  it('handles track selection', () => {
    render(<TrackPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('Track 1'));
    expect(defaultProps.onTrackSelect).toHaveBeenCalledWith('1');
  });

  it('shows selected track as active', () => {
    render(<TrackPanel {...defaultProps} selectedTrackId="1" />);
    expect(screen.getByText('Track 1').closest('.track-item')).toHaveClass('track-item--selected');
  });

  it('handles track addition', () => {
    render(<TrackPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /add track/i }));
    expect(defaultProps.onTrackAdd).toHaveBeenCalled();
  });

  it('handles track removal', () => {
    render(<TrackPanel {...defaultProps} />);
    const removeButton = screen.getAllByRole('button', { name: /remove track/i })[0];
    fireEvent.click(removeButton);
    expect(defaultProps.onTrackRemove).toHaveBeenCalledWith('1');
  });

  it('allows track name editing', () => {
    render(<TrackPanel {...defaultProps} />);
    const trackName = screen.getByText('Track 1');
    fireEvent.doubleClick(trackName);
    
    const input = screen.getByDisplayValue('Track 1');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.blur(input);

    expect(defaultProps.onTrackUpdate).toHaveBeenCalledWith('1', { name: 'New Name' });
  });

  it('shows mini preview for each track', () => {
    render(<TrackPanel {...defaultProps} />);
    const previews = screen.getAllByTestId('track-mini-preview');
    expect(previews).toHaveLength(2);
  });

  it('allows track reordering via drag and drop', () => {
    render(<TrackPanel {...defaultProps} />);
    const track1 = screen.getByText('Track 1');
    const track2 = screen.getByText('Track 2');

    fireEvent.dragStart(track1, {
      dataTransfer: {
        effectAllowed: 'move',
        dropEffect: 'move',
        setData: jest.fn(),
        getData: jest.fn(),
      },
    });
    fireEvent.dragOver(track2, {
      dataTransfer: {
        effectAllowed: 'move',
        dropEffect: 'move',
        setData: jest.fn(),
        getData: jest.fn(),
      },
    });
    fireEvent.drop(track2);

    expect(defaultProps.onTrackUpdate).toHaveBeenCalledWith('1', {
      order: 1
    });
  });
});
