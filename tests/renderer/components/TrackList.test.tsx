import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { TrackList } from '../../../src/react/src/components/TrackList';
import { Track, Group } from '../../types';
import '@testing-library/jest-dom';

describe('TrackList Component', () => {
  const mockTracks: Track[] = [
    {
      id: 'track1',
      name: 'Track 1',
      groupId: 'group1',
      type: 'source',
      position: { x: 0, y: 0, z: 0 },
      isSelected: false,
      isMuted: false,
      isSolo: false
    },
    {
      id: 'track2',
      name: 'Track 2',
      groupId: 'group1',
      type: 'source',
      position: { x: 1, y: 1, z: 1 },
      isSelected: true,
      isMuted: true,
      isSolo: false
    }
  ];

  const mockGroup: Group = {
    id: 'group1',
    name: 'Group 1',
    type: 'source',
    isExpanded: true,
    tracks: ['track1', 'track2']
  };

  it('renders track list correctly', () => {
    act(() => {
      render(<TrackList tracks={mockTracks} groups={[mockGroup]} />);
    });

    expect(screen.getByTestId('track-list')).toBeInTheDocument();
    expect(screen.getByTestId('group-name-group1')).toHaveTextContent('Group 1');
    expect(screen.getByTestId('track-name-track1')).toHaveTextContent('Track 1');
    expect(screen.getByTestId('track-name-track2')).toHaveTextContent('Track 2');
  });

  it('handles track selection', () => {
    const onTrackSelect = jest.fn();
    act(() => {
      render(
        <TrackList 
          tracks={mockTracks} 
          groups={[mockGroup]} 
          onTrackSelect={onTrackSelect}
        />
      );
    });

    const track1 = screen.getByTestId('track-item-track1');
    fireEvent.click(track1);
    expect(onTrackSelect).toHaveBeenCalledWith('track1');
  });

  it('shows track controls', () => {
    act(() => {
      render(<TrackList tracks={mockTracks} groups={[mockGroup]} />);
    });

    const muteButton = screen.getByTestId('mute-button-track2');
    const soloButton = screen.getByTestId('solo-button-track2');
    
    expect(muteButton).toHaveClass('muted');
    expect(soloButton).not.toHaveClass('soloed');
  });

  it('handles group expansion toggle', () => {
    const onGroupExpand = jest.fn();
    act(() => {
      render(
        <TrackList 
          tracks={mockTracks} 
          groups={[mockGroup]} 
          onGroupExpand={onGroupExpand}
        />
      );
    });

    const groupHeader = screen.getByTestId('group-header-group1');
    fireEvent.click(groupHeader);
    expect(onGroupExpand).toHaveBeenCalledWith('group1');
  });

  it('handles track mute toggle', () => {
    const onTrackMute = jest.fn();
    act(() => {
      render(
        <TrackList 
          tracks={mockTracks} 
          groups={[mockGroup]} 
          onTrackMute={onTrackMute}
        />
      );
    });

    const muteButton = screen.getByTestId('mute-button-track2');
    fireEvent.click(muteButton);
    expect(onTrackMute).toHaveBeenCalledWith('track2');
  });

  it('handles track solo toggle', () => {
    const onTrackSolo = jest.fn();
    act(() => {
      render(
        <TrackList 
          tracks={mockTracks} 
          groups={[mockGroup]} 
          onTrackSolo={onTrackSolo}
        />
      );
    });

    const soloButton = screen.getByTestId('solo-button-track2');
    fireEvent.click(soloButton);
    expect(onTrackSolo).toHaveBeenCalledWith('track2');
  });

  it('shows track type indicators', () => {
    act(() => {
      render(<TrackList tracks={mockTracks} groups={[mockGroup]} />);
    });

    const track1TypeIcon = screen.getByTestId('track-type-track1');
    expect(track1TypeIcon).toHaveAttribute('title', 'source Track');
  });

  it('supports keyboard navigation', () => {
    act(() => {
      render(<TrackList tracks={mockTracks} groups={[mockGroup]} />);
    });

    const track1 = screen.getByTestId('track-item-track1');
    track1.focus();
    
    fireEvent.keyDown(track1, { key: 'ArrowDown' });
    expect(screen.getByTestId('track-item-track2')).toHaveFocus();
    
    fireEvent.keyDown(screen.getByTestId('track-item-track2'), { key: 'ArrowUp' });
    expect(track1).toHaveFocus();
  });

  it('supports drag and drop reordering', () => {
    const onTrackReorder = jest.fn();
    act(() => {
      render(
        <TrackList 
          tracks={mockTracks} 
          groups={[mockGroup]} 
          onTrackReorder={onTrackReorder}
        />
      );
    });

    const track1 = screen.getByTestId('track-item-track1');
    const track2 = screen.getByTestId('track-item-track2');

    fireEvent.dragStart(track1);
    fireEvent.dragOver(track2);
    fireEvent.drop(track2);

    expect(onTrackReorder).toHaveBeenCalledWith('track1', 'track2');
  });
});
