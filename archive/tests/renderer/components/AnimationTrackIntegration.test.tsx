import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { TrackList } from '../../../src/react/src/components/TrackList';
import { Track, Group, LinearAnimation, CircularAnimation } from '../../types';
import '@testing-library/jest-dom';

describe('Animation-Track Integration', () => {
  const mockTracks: Track[] = [
    {
      id: 'track1',
      name: 'Track 1',
      groupId: 'group1',
      type: 'source',
      position: { x: 0, y: 0, z: 0 },
      isSelected: false,
      isMuted: false,
      isSolo: false,
      animationState: {
        isPlaying: true,
        currentTime: 0,
        animation: {
          id: 'anim1',
          type: 'linear',
          name: 'Test Animation',
          isPlaying: true,
          duration: 1000,
          currentTime: 0,
          parameters: {
            startPosition: { x: 0, y: 0, z: 0 },
            endPosition: { x: 10, y: 10, z: 10 }
          }
        }
      }
    },
    {
      id: 'track2',
      name: 'Track 2',
      groupId: 'group1',
      type: 'source',
      position: { x: 1, y: 1, z: 1 },
      isSelected: false,
      isMuted: false,
      isSolo: false,
      animationState: {
        isPlaying: false,
        currentTime: 0
      }
    }
  ];

  const mockGroup: Group = {
    id: 'group1',
    name: 'Group 1',
    type: 'source',
    isExpanded: true,
    tracks: ['track1', 'track2']
  };

  it('should highlight track when its animation is playing', async () => {
    await act(async () => {
      render(<TrackList tracks={mockTracks} groups={[mockGroup]} />);
    });
    
    const track1 = screen.getByTestId('track-item-track1');
    const track2 = screen.getByTestId('track-item-track2');
    
    expect(track1).toHaveClass('track-item', 'playing');
    expect(track2).toHaveClass('track-item');
    expect(track2).not.toHaveClass('playing');
  });

  it('should update track position based on animation timeline', async () => {
    const mockAnimation: LinearAnimation = {
      id: 'anim1',
      type: 'linear',
      name: 'Test Animation',
      isPlaying: true,
      duration: 1000,
      currentTime: 500,
      parameters: {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 10, y: 10, z: 10 }
      }
    };

    const tracksWithAnimation = mockTracks.map(track => 
      track.id === 'track1' 
        ? { 
            ...track, 
            animationState: { 
              isPlaying: true, 
              currentTime: 500,
              animation: mockAnimation
            }
          }
        : track
    );

    await act(async () => {
      render(<TrackList tracks={tracksWithAnimation} groups={[mockGroup]} />);
    });
    
    const track1Position = screen.getByTestId('track-position-track1');
    expect(track1Position).toHaveTextContent('5, 5, 5');
  });

  it('should update track position based on circular animation', async () => {
    const mockCircularAnimation: CircularAnimation = {
      id: 'anim2',
      type: 'circular',
      name: 'Circular Test',
      isPlaying: true,
      duration: 1000,
      currentTime: 250, // 1/4 of the circle
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        radius: 10,
        startAngle: 0,
        endAngle: 360,
        plane: 'xy' // Rotating in XY plane
      }
    };

    const tracksWithAnimation = mockTracks.map(track => 
      track.id === 'track1' 
        ? { 
            ...track, 
            animationState: { 
              isPlaying: true, 
              currentTime: 250,
              animation: mockCircularAnimation
            }
          }
        : track
    );

    await act(async () => {
      render(<TrackList tracks={tracksWithAnimation} groups={[mockGroup]} />);
    });
    
    const track1Position = screen.getByTestId('track-position-track1');
    // At 1/4 of the circle (90 degrees), position should be (0, 10, 0) in XY plane
    expect(track1Position).toHaveTextContent('0, 10, 0');
  });

  it('should show animation preview in track list', async () => {
    const mockCircularAnimation: CircularAnimation = {
      id: 'anim2',
      type: 'circular',
      name: 'Circular Test',
      isPlaying: true,
      duration: 1000,
      currentTime: 250,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        radius: 10,
        startAngle: 0,
        endAngle: 360,
        plane: 'xy'
      }
    };

    const tracksWithAnimation = mockTracks.map(track => 
      track.id === 'track1' 
        ? { 
            ...track, 
            animationState: { 
              isPlaying: true, 
              currentTime: 250,
              animation: mockCircularAnimation
            }
          }
        : track
    );

    await act(async () => {
      render(<TrackList tracks={tracksWithAnimation} groups={[mockGroup]} />);
    });
    
    const track1 = screen.getByTestId('track-item-track1');
    const animationPreview = track1.querySelector('.animation-preview');
    expect(animationPreview).toBeInTheDocument();
    expect(animationPreview?.tagName.toLowerCase()).toBe('canvas');
  });

  describe('Group Animation', () => {
    const mockGroupAnimation: LinearAnimation = {
      id: 'groupAnim1',
      type: 'linear',
      name: 'Group Movement',
      isPlaying: true,
      duration: 1000,
      currentTime: 500,
      parameters: {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 10, y: 10, z: 10 }
      }
    };

    const mockGroupWithAnimation: Group = {
      id: 'group1',
      name: 'Group 1',
      type: 'source',
      isExpanded: true,
      tracks: ['track1', 'track2'],
      animationState: {
        isPlaying: true,
        currentTime: 500,
        animation: mockGroupAnimation
      }
    };

    it('should show group animation indicator when group has animation', () => {
      render(<TrackList tracks={mockTracks} groups={[mockGroupWithAnimation]} />);
      
      const groupHeader = screen.getByTestId('group-header-group1');
      expect(groupHeader).toHaveClass('has-animation');
      expect(groupHeader).toHaveClass('playing');
    });

    it('should apply group animation to all tracks in the group', () => {
      // Create tracks without their own animations
      const tracksWithoutAnimation = [
        {
          id: 'track1',
          name: 'Track 1',
          groupId: 'group1',
          type: 'source',
          position: { x: 0, y: 0, z: 0 },
          isSelected: false,
          isMuted: false,
          isSolo: false,
          animationState: {
            isPlaying: false,
            currentTime: 0
          }
        },
        {
          id: 'track2',
          name: 'Track 2',
          groupId: 'group1',
          type: 'source',
          position: { x: 1, y: 1, z: 1 },
          isSelected: false,
          isMuted: false,
          isSolo: false,
          animationState: {
            isPlaying: false,
            currentTime: 0
          }
        }
      ];

      render(<TrackList tracks={tracksWithoutAnimation} groups={[mockGroupWithAnimation]} />);
      
      // Both tracks should show the same interpolated position
      const track1Position = screen.getByTestId('track-position-track1');
      const track2Position = screen.getByTestId('track-position-track2');
      
      expect(track1Position).toHaveTextContent('5, 5, 5');
      expect(track2Position).toHaveTextContent('5, 5, 5');
    });

    it('should show animation preview for group', () => {
      render(<TrackList tracks={mockTracks} groups={[mockGroupWithAnimation]} />);
      
      const previewContainer = screen.getByTestId('animation-preview-container-group-group1');
      expect(previewContainer).toBeInTheDocument();
      
      const canvas = screen.getByTestId('animation-preview-group-group1');
      expect(canvas).toBeInTheDocument();
      expect(canvas.tagName.toLowerCase()).toBe('canvas');
    });

    it('should prioritize individual track animations over group animation', () => {
      const trackWithOwnAnimation = {
        ...mockTracks[0],
        animationState: {
          isPlaying: true,
          currentTime: 250,
          animation: {
            id: 'trackAnim1',
            type: 'linear' as const,
            name: 'Track Movement',
            isPlaying: true,
            duration: 1000,
            currentTime: 250,
            parameters: {
              startPosition: { x: 0, y: 0, z: 0 },
              endPosition: { x: 20, y: 20, z: 20 }
            }
          }
        }
      };

      const tracksWithMixedAnimations = [
        trackWithOwnAnimation,
        mockTracks[1]
      ];

      render(<TrackList tracks={tracksWithMixedAnimations} groups={[mockGroupWithAnimation]} />);
      
      const track1Position = screen.getByTestId('track-position-track1');
      const track2Position = screen.getByTestId('track-position-track2');
      
      // Track1 should use its own animation (25% of 20 = 5)
      expect(track1Position).toHaveTextContent('5, 5, 5');
      // Track2 should use group animation (50% of 10 = 5)
      expect(track2Position).toHaveTextContent('5, 5, 5');
    });
  });
});
