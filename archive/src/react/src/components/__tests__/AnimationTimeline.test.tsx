import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AnimationTimeline } from '../AnimationTimeline';
import { Animation } from '../../types';
import '@testing-library/jest-dom';

describe('AnimationTimeline Component', () => {
  beforeEach(() => {
    Element.prototype.getBoundingClientRect = jest.fn().mockImplementation(() => ({
      width: 1000,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => {}
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockLinearAnimation: Animation = {
    id: 'anim1',
    type: 'linear',
    name: 'Linear Move 1',
    isPlaying: false,
    duration: 5000,
    currentTime: 2500,
    parameters: {
      startPosition: { x: 0, y: 0, z: 0 },
      endPosition: { x: 1, y: 1, z: 1 }
    }
  };

  const mockCircularAnimation: Animation = {
    id: 'anim2',
    type: 'circular',
    name: 'Circular Move 1',
    isPlaying: true,
    duration: 10000,
    currentTime: 5000,
    parameters: {
      center: { x: 0, y: 0, z: 0 },
      radius: 5,
      speed: 1,
      direction: 'clockwise'
    }
  };

  const mockAnimationWithKeyframes = {
    ...mockLinearAnimation,
    keyframes: [
      { id: 'kf1', time: 0, type: 'position', value: { x: 0, y: 0, z: 0 } },
      { id: 'kf2', time: 2500, type: 'position', value: { x: 0.5, y: 0.5, z: 0.5 } },
      { id: 'kf3', time: 5000, type: 'position', value: { x: 1, y: 1, z: 1 } }
    ]
  };

  const mockCustomMarkers = [
    { time: 1000, label: 'Start Effect', color: '#ff0000' },
    { time: 3000, label: 'Peak', color: '#00ff00' },
    { time: 4000, label: 'End Effect', color: '#0000ff' }
  ];

  it('renders timeline with correct duration markers', () => {
    act(() => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const timeMarkers = screen.getAllByTestId('time-marker');
    expect(timeMarkers[0]).toHaveTextContent('0.0s');
    expect(timeMarkers[timeMarkers.length - 1]).toHaveTextContent('5.0s');
  });

  it('shows current time indicator', () => {
    act(() => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const currentTime = screen.getByTestId('current-time');
    expect(currentTime).toHaveTextContent('2.5s');
  });

  it('handles timeline scrubbing', () => {
    const onTimeChange = jest.fn();
    act(() => {
      render(
        <AnimationTimeline 
          animation={mockLinearAnimation}
          onTimeChange={onTimeChange}
        />
      );
    });

    const timeline = screen.getByTestId('timeline-track');
    timeline.getBoundingClientRect = jest.fn().mockImplementation(() => ({
      width: 1000,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => {}
    }));

    act(() => {
      fireEvent.click(timeline, { 
        clientX: 750 // 75% of mockGetBoundingClientRect width
      });
    });
    
    expect(onTimeChange).toHaveBeenCalledWith(3750); // 75% of 5000ms
  });

  it('shows keyframe markers', () => {
    act(() => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const keyframes = screen.getAllByTestId('keyframe-marker');
    expect(keyframes).toHaveLength(2); // Start and end positions
  });

  it('displays different keyframe types for circular animation', () => {
    act(() => {
      render(<AnimationTimeline animation={mockCircularAnimation} />);
    });
    
    const keyframes = screen.getAllByTestId('keyframe-marker');
    expect(keyframes[0]).toHaveClass('center-keyframe');
  });

  it('shows timeline grid', () => {
    act(() => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const gridLines = screen.getAllByTestId('grid-line');
    expect(gridLines.length).toBeGreaterThan(0);
  });

  it('handles zoom controls', () => {
    act(() => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const zoomIn = screen.getByTestId('zoom-in');
    const zoomOut = screen.getByTestId('zoom-out');
    
    act(() => {
      fireEvent.click(zoomIn);
    });
    const timeMarkersAfterZoomIn = screen.getAllByTestId('time-marker');
    expect(timeMarkersAfterZoomIn.length).toBeGreaterThan(6);
    
    act(() => {
      fireEvent.click(zoomOut);
    });
    const timeMarkersAfterZoomOut = screen.getAllByTestId('time-marker');
    expect(timeMarkersAfterZoomOut.length).toBeGreaterThanOrEqual(6);
  });

  it('shows playhead marker', () => {
    act(() => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const playhead = screen.getByTestId('playhead');
    expect(playhead).toHaveStyle('left: 50%'); // 2500ms is 50% of 5000ms
  });

  it('handles keyboard navigation', () => {
    const onTimeChange = jest.fn();
    act(() => {
      render(
        <AnimationTimeline 
          animation={mockLinearAnimation}
          onTimeChange={onTimeChange}
        />
      );
    });

    const timeline = screen.getByTestId('timeline-track');
    timeline.focus();
    
    act(() => {
      fireEvent.keyDown(timeline, { key: 'ArrowRight' });
    });
    expect(onTimeChange).toHaveBeenCalledWith(2600); // 100ms increment
    
    act(() => {
      fireEvent.keyDown(timeline, { key: 'ArrowLeft' });
    });
    expect(onTimeChange).toHaveBeenCalledWith(2400);
  });

  it('shows loop region if defined', () => {
    const animationWithLoop = {
      ...mockLinearAnimation,
      loopRegion: { start: 1000, end: 4000 }
    };
    
    act(() => {
      render(<AnimationTimeline animation={animationWithLoop} />);
    });
    
    const loopRegion = screen.getByTestId('loop-region');
    expect(loopRegion).toHaveStyle('left: 20%'); // 1000ms is 20% of 5000ms
    expect(loopRegion).toHaveStyle('width: 60%'); // (4000-1000)/5000 = 60%
  });

  it('updates time display on hover', () => {
    act(() => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const timeline = screen.getByTestId('timeline-track');
    timeline.getBoundingClientRect = jest.fn().mockImplementation(() => ({
      width: 1000,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 1000,
      x: 0,
      y: 0,
      toJSON: () => {}
    }));

    act(() => {
      fireEvent.mouseMove(timeline, {
        clientX: 250 // 25% of mockGetBoundingClientRect width
      });
    });
    
    const hoverTime = screen.getByTestId('hover-time');
    expect(hoverTime).toHaveTextContent('1.3s');
  });

  describe('Keyframe Interaction', () => {
    it('allows dragging keyframes', () => {
      const onKeyframeChange = jest.fn();
      const { container } = render(
        <AnimationTimeline 
          animation={mockAnimationWithKeyframes}
          onKeyframeChange={onKeyframeChange}
        />
      );

      const timeline = screen.getByTestId('timeline-track');
      const keyframe = screen.getAllByTestId('keyframe-marker')[1];

      // Mock getBoundingClientRect for both timeline and keyframe
      const mockRect = {
        width: 1000,
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 1000,
        x: 0,
        y: 0,
        toJSON: () => {}
      };
      
      timeline.getBoundingClientRect = jest.fn().mockImplementation(() => mockRect);
      keyframe.getBoundingClientRect = jest.fn().mockImplementation(() => mockRect);

      // Simulate dragging keyframe
      fireEvent.mouseDown(keyframe, { clientX: 250, clientY: 0 });
      fireEvent.mouseMove(timeline, { clientX: 600, clientY: 0 });
      fireEvent.mouseUp(timeline, { clientX: 600, clientY: 0 });

      expect(onKeyframeChange).toHaveBeenCalledWith('kf2', 3000);
    });

    it('shows keyframe details on hover', () => {
      render(<AnimationTimeline animation={mockAnimationWithKeyframes} />);

      const keyframe = screen.getAllByTestId('keyframe-marker')[1];
      fireEvent.mouseEnter(keyframe);

      const tooltips = screen.getAllByTestId('keyframe-tooltip');
      expect(tooltips[1]).toHaveTextContent('position: {"x":0.5,"y":0.5,"z":0.5}');
    });

    it('allows deleting keyframes', () => {
      const onKeyframeDelete = jest.fn();
      render(
        <AnimationTimeline 
          animation={mockAnimationWithKeyframes}
          onKeyframeDelete={onKeyframeDelete}
        />
      );

      const keyframe = screen.getAllByTestId('keyframe-marker')[1];
      fireEvent.contextMenu(keyframe);
      
      const deleteButton = screen.getByText('Delete Keyframe');
      fireEvent.click(deleteButton);

      expect(onKeyframeDelete).toHaveBeenCalledWith('kf2');
    });
  });

  describe('Timeline Controls', () => {
    it('supports play/pause toggle', () => {
      const onPlayPause = jest.fn();
      const animation = { ...mockAnimationWithKeyframes, isPlaying: false };
      render(
        <AnimationTimeline 
          animation={animation}
          onPlayPause={onPlayPause}
        />
      );

      const playButton = screen.getByTestId('play-button');
      fireEvent.click(playButton);
      expect(onPlayPause).toHaveBeenCalledWith(true);

      onPlayPause.mockReset();
      animation.isPlaying = true;
      
      fireEvent.click(playButton);
      expect(onPlayPause).toHaveBeenCalledWith(false);
    });

    it('supports loop mode toggle', () => {
      const onLoopChange = jest.fn();
      render(
        <AnimationTimeline 
          animation={mockAnimationWithKeyframes}
          onLoopChange={onLoopChange}
        />
      );

      const loopButton = screen.getByTestId('loop-button');
      fireEvent.click(loopButton);
      expect(onLoopChange).toHaveBeenCalledWith(true);
    });

    it('snaps to nearby keyframes when dragging time marker', () => {
      const onTimeChange = jest.fn();
      render(
        <AnimationTimeline 
          animation={mockAnimationWithKeyframes}
          onTimeChange={onTimeChange}
          snapToKeyframes={true}
        />
      );

      const timeline = screen.getByTestId('timeline-track');
      const mockRect = {
        width: 1000,
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 1000,
        x: 0,
        y: 0,
        toJSON: () => {}
      };
      
      timeline.getBoundingClientRect = jest.fn().mockImplementation(() => mockRect);

      // Click near middle keyframe (48% of timeline width)
      fireEvent.mouseDown(timeline, { clientX: 480, clientY: 0 });
      fireEvent.mouseMove(timeline, { clientX: 480, clientY: 0 });
      fireEvent.mouseUp(timeline, { clientX: 480, clientY: 0 });

      expect(onTimeChange).toHaveBeenCalledWith(2500);
    });
  });

  describe('Custom Time Markers', () => {
    it('renders custom time markers', () => {
      render(
        <AnimationTimeline 
          animation={mockAnimationWithKeyframes}
          customMarkers={mockCustomMarkers}
        />
      );

      const markers = screen.getAllByTestId('custom-marker');
      expect(markers).toHaveLength(3);
      expect(markers[0]).toHaveStyle({ backgroundColor: '#ff0000' });
      expect(markers[0]).toHaveTextContent('Start Effect');
    });

    it('allows dragging custom markers', () => {
      const onMarkerChange = jest.fn();
      render(
        <AnimationTimeline 
          animation={mockAnimationWithKeyframes}
          customMarkers={mockCustomMarkers}
          onMarkerChange={onMarkerChange}
        />
      );

      const timeline = screen.getByTestId('timeline-track');
      const marker = screen.getAllByTestId('custom-marker')[0];

      const mockRect = {
        width: 1000,
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 1000,
        x: 0,
        y: 0,
        toJSON: () => {}
      };
      
      timeline.getBoundingClientRect = jest.fn().mockImplementation(() => mockRect);
      marker.getBoundingClientRect = jest.fn().mockImplementation(() => mockRect);

      // Simulate dragging marker to 25% of timeline
      fireEvent.mouseDown(marker, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(timeline, { clientX: 250, clientY: 0 });
      fireEvent.mouseUp(timeline, { clientX: 250, clientY: 0 });

      expect(onMarkerChange).toHaveBeenCalledWith(0, 1250);
    });
  });
});
