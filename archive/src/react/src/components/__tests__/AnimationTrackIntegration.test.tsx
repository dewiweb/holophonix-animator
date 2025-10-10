import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { TrackList } from '../TrackList';
import { Track, Group, LinearAnimation, CircularAnimation } from '../../types';
import '@testing-library/jest-dom';
import { MockContext2D, mockGetBoundingClientRect } from '../../test-utils';

describe('Animation-Track Integration', () => {
  beforeEach(() => {
    // Mock canvas context
    const mockContext = new MockContext2D();
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

    // Mock canvas dimensions
    Object.defineProperty(HTMLCanvasElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 200
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 100
    });

    // Mock getBoundingClientRect for all elements
    const element = document.createElement('div');
    mockGetBoundingClientRect(element);
    document.querySelector = jest.fn().mockReturnValue(element);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  const mockTracks: Track[] = [
    {
      id: 'track1',
      name: 'Track 1',
      position: { x: 0, y: 0, z: 0 }
    },
    {
      id: 'track2',
      name: 'Track 2',
      position: { x: 1, y: 1, z: 1 }
    }
  ];

  const mockGroup: Group = {
    id: 'group1',
    name: 'Group 1',
    tracks: ['track1', 'track2'],
    pattern: 'linear'
  };

  it('should highlight track when its animation is playing', async () => {
    const mockAnimation: LinearAnimation = {
      id: 'anim1',
      type: 'linear',
      name: 'Test Animation',
      isPlaying: true,
      duration: 1000,
      currentTime: 500,
      tracks: ['track1'],
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
      render(
        <TrackList 
          tracks={tracksWithAnimation} 
          groups={[mockGroup]} 
          animations={[mockAnimation]}
        />
      );
    });
    
    const track1 = screen.getByTestId('track-item-track1');
    const track2 = screen.getByTestId('track-item-track2');
    
    expect(track1).toHaveClass('playing');
    expect(track2).not.toHaveClass('playing');
  });

  it('should update track position based on animation timeline', () => {
    const mockAnimation: LinearAnimation = {
      id: 'anim1',
      type: 'linear',
      name: 'Test Animation',
      isPlaying: true,
      duration: 1000,
      currentTime: 500,
      tracks: ['track1'],
      keyframes: [
        { id: 'kf1', time: 0, type: 'position', value: { x: 0, y: 0, z: 0 } },
        { id: 'kf2', time: 1000, type: 'position', value: { x: 10, y: 10, z: 10 } }
      ],
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

    render(<TrackList tracks={tracksWithAnimation} groups={[mockGroup]} />);
    
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
      tracks: ['track1'],
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        radius: 10,
        startAngle: 0,
        endAngle: 360,
        direction: 'clockwise',
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
      tracks: ['track1'],
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

    // Mock canvas context
    const mockCtx = {
      beginPath: jest.fn(),
      arc: jest.fn(),
      stroke: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn()
    };

    // Mock getContext
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockCtx);

    await act(async () => {
      render(<TrackList tracks={tracksWithAnimation} groups={[mockGroup]} />);
    });
    
    // Check if preview canvas exists and has correct attributes
    const previewCanvas = screen.getByTestId('animation-preview-track1');
    expect(previewCanvas).toBeInTheDocument();
    expect(previewCanvas.tagName.toLowerCase()).toBe('canvas');
    expect(previewCanvas).toHaveAttribute('width', '60');
    expect(previewCanvas).toHaveAttribute('height', '40');

    // Verify the canvas context was called
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.arc).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  describe('Group Animation', () => {
    const mockGroupAnimation: LinearAnimation = {
      id: 'groupAnim1',
      type: 'linear',
      name: 'Group Movement',
      isPlaying: true,
      duration: 1000,
      currentTime: 500,
      tracks: ['track1', 'track2'],
      parameters: {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 10, y: 10, z: 10 }
      }
    };

    const mockGroupWithAnimation: Group = {
      id: 'group1',
      name: 'Group 1',
      tracks: ['track1', 'track2'],
      pattern: 'linear',
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

    it('should apply group animation to all tracks in the group', async () => {
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

      await act(async () => {
        render(<TrackList tracks={tracksWithoutAnimation} groups={[mockGroupWithAnimation]} />);
      });
      
      // Both tracks should show the same interpolated position
      const track1Position = screen.getByTestId('track-position-track1');
      const track2Position = screen.getByTestId('track-position-track2');
      
      // Allow for small rounding differences
      const track1Text = track1Position.textContent?.trim();
      const track2Text = track2Position.textContent?.trim();
      
      expect(track1Text).toMatch(/^5\.?0*,\s*5\.?0*,\s*5\.?0*$/);
      expect(track2Text).toMatch(/^5\.?0*,\s*5\.?0*,\s*5\.?0*$/);
    });

    it('should show animation preview for group', async () => {
      // Mock canvas context
      const mockCtx = {
        beginPath: jest.fn(),
        arc: jest.fn(),
        stroke: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn()
      };

      // Mock getContext
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockCtx);

      await act(async () => {
        render(<TrackList tracks={mockTracks} groups={[mockGroupWithAnimation]} />);
      });
      
      const groupPreview = screen.getByTestId('animation-preview-group-group1');
      expect(groupPreview).toBeInTheDocument();
      expect(groupPreview.tagName.toLowerCase()).toBe('canvas');
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should prioritize individual track animations over group animation', async () => {
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
            tracks: ['track1'],
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

      await act(async () => {
        render(<TrackList tracks={tracksWithMixedAnimations} groups={[mockGroupWithAnimation]} />);
      });
      
      const track1Position = screen.getByTestId('track-position-track1');
      const track2Position = screen.getByTestId('track-position-track2');
      
      // Track 1 should use its own animation (25% of 20 = 5)
      const track1Text = track1Position.textContent?.trim();
      expect(track1Text).toMatch(/^5\.?0*,\s*5\.?0*,\s*5\.?0*$/);
      
      // Track 2 should use group animation (50% of 10 = 5)
      const track2Text = track2Position.textContent?.trim();
      expect(track2Text).toMatch(/^5\.?0*,\s*5\.?0*,\s*5\.?0*$/);
      
      // Track1 should use its own animation (25% of 20 = 5)
      expect(track1Position).toHaveTextContent('5, 5, 5');
      // Track2 should use group animation (50% of 10 = 5)
      expect(track2Position).toHaveTextContent('5, 5, 5');
    });
  });
});
