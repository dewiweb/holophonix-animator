import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AnimationTimeline } from '../AnimationTimeline';
import { Animation } from '../../types';
import '@testing-library/jest-dom';

describe('AnimationTimeline Component', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect for all elements
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

    Element.prototype.getBoundingClientRect = jest.fn().mockReturnValue(mockRect);
    
    // Mock querySelector to return elements with correct getBoundingClientRect
    document.querySelector = jest.fn().mockImplementation((selector) => {
      const element = document.createElement('div');
      element.getBoundingClientRect = jest.fn().mockReturnValue(mockRect);
      return element;
    });

    // Mock canvas context
    const mockContext = {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      closePath: jest.fn()
    };

    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);
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

  it('renders timeline with correct duration markers', async () => {
    await act(async () => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const timeMarkers = screen.getAllByTestId('time-marker');
    expect(timeMarkers).toHaveLength(11); // 0% to 100% in 10% increments
    expect(timeMarkers[0]).toHaveStyle({ left: '0%' });
    expect(timeMarkers[timeMarkers.length - 1]).toHaveStyle({ left: '100%' });
  });

  it('shows current time indicator', async () => {
    await act(async () => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const playhead = screen.getByTestId('playhead');
    expect(playhead).toHaveStyle({ left: '50%' }); // 2500ms is 50% of 5000ms
  });

  it('handles timeline scrubbing', async () => {
    const onTimeChange = jest.fn();
    await act(async () => {
      render(
        <AnimationTimeline 
          animation={mockLinearAnimation}
          onTimeChange={onTimeChange}
        />
      );
    });

    const timeline = screen.getByTestId('timeline');
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

    await act(async () => {
      const timeline = screen.getByTestId('timeline');
      // Click at 75% of timeline width (3750ms)
      fireEvent.mouseDown(timeline, { 
        clientX: 750,
        bubbles: true,
        cancelable: true
      });
      fireEvent.mouseUp(timeline, { clientX: 750 });
    });
    
    // Should snap to nearest 500ms interval (3750ms)
    expect(onTimeChange).toHaveBeenCalledWith(3750);
  });

  it('shows keyframe markers', async () => {
    await act(async () => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const timeline = screen.getByTestId('timeline');
    const keyframes = timeline.querySelectorAll('[data-testid^="keyframe"]');
    expect(keyframes.length).toBe(2); // Start and end positions
  });

  it('displays different keyframe types for circular animation', async () => {
    await act(async () => {
      render(<AnimationTimeline animation={mockCircularAnimation} />);
    });
    
    const timeline = screen.getByTestId('timeline');
    const centerKeyframe = timeline.querySelector('[data-testid="keyframe-center"]');
    expect(centerKeyframe).toBeInTheDocument();
  });

  it('shows timeline grid', async () => {
    await act(async () => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const timeMarkers = screen.getAllByTestId('time-marker');
    expect(timeMarkers).toHaveLength(11); // 0% to 100% in 10% increments
    timeMarkers.forEach((marker, index) => {
      expect(marker).toHaveStyle({ left: `${index * 10}%` });
    });
  });

  it('handles zoom controls', async () => {
    await act(async () => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const zoomIn = screen.getByTestId('zoom-in');
    const zoomOut = screen.getByTestId('zoom-out');
    
    await act(async () => {
      fireEvent.click(zoomIn);
    });
    
    const timeline = screen.getByTestId('timeline');
    expect(timeline).toHaveStyle({ transform: 'scaleX(1.2)' }); // 20% zoom in
    
    await act(async () => {
      fireEvent.click(zoomOut);
    });
    
    expect(timeline).toHaveStyle({ transform: 'scaleX(1)' }); // Back to normal
  });

  it('shows playhead marker', async () => {
    await act(async () => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const playhead = screen.getByTestId('playhead');
    expect(playhead).toHaveStyle({ left: '50%' }); // 2500ms is 50% of 5000ms
  });

  it('handles keyboard navigation', async () => {
    const onTimeChange = jest.fn();
    const animation = {
      ...mockLinearAnimation,
      currentTime: 2500 // Start at 2500ms
    };
    
    await act(async () => {
      render(
        <AnimationTimeline 
          animation={animation}
          onTimeChange={onTimeChange}
        />
      );
    });

    const timeline = screen.getByTestId('timeline');
    timeline.focus();
    
    // Test Home key
    await act(async () => {
      fireEvent.keyDown(timeline, { 
        key: 'Home',
        bubbles: true,
        cancelable: true
      });
    });

    await waitFor(() => {
      expect(onTimeChange).toHaveBeenCalledWith(0);
    });

    // Test End key
    await act(async () => {
      fireEvent.keyDown(timeline, { 
        key: 'End',
        bubbles: true,
        cancelable: true
      });
    });

    await waitFor(() => {
      expect(onTimeChange).toHaveBeenCalledWith(animation.duration);
    });

    // Test arrow keys
    await act(async () => {
      fireEvent.keyDown(timeline, { 
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true
      });
    });

    await waitFor(() => {
      expect(onTimeChange).toHaveBeenCalledWith(animation.currentTime + 100);
    });

    await act(async () => {
      fireEvent.keyDown(timeline, { 
        key: 'ArrowLeft',
        bubbles: true,
        cancelable: true
      });
    });

    await waitFor(() => {
      expect(onTimeChange).toHaveBeenCalledWith(animation.currentTime - 100);
    });
  });

  it('shows loop region if defined', async () => {
    const animationWithLoop = {
      ...mockLinearAnimation,
      loopRegion: { start: 1000, end: 4000 }
    };
    
    await act(async () => {
      render(<AnimationTimeline animation={animationWithLoop} />);
    });
    
    const loopRegion = screen.getByTestId('loop-region');
    expect(loopRegion).toHaveStyle({
      left: '20%', // 1000ms is 20% of 5000ms
      width: '60%' // (4000-1000)/5000 = 60%
    });
  });

  it('updates time display on hover', async () => {
    await act(async () => {
      render(<AnimationTimeline animation={mockLinearAnimation} />);
    });
    
    const timeline = screen.getByTestId('timeline');
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

    await act(async () => {
      const timeline = screen.getByTestId('timeline');
      fireEvent.mouseMove(timeline, {
        clientX: 250, // 25% of mockGetBoundingClientRect width
        bubbles: true,
        cancelable: true
      });
    });
    
    const hoverTime = screen.getByTestId('hover-time');
    expect(hoverTime).toHaveTextContent('1.3s'); // 25% of 5000ms = 1250ms
  });

  describe('Keyframe Interaction', () => {
    it('allows dragging keyframes', async () => {
      const onKeyframeChange = jest.fn();
      await act(async () => {
        render(
          <AnimationTimeline 
            animation={mockAnimationWithKeyframes}
            onKeyframeChange={onKeyframeChange}
          />
        );
      });

      const timeline = screen.getByTestId('timeline');
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

      // Simulate dragging keyframe to 30% of timeline (1500ms)
      await act(async () => {
        fireEvent.mouseDown(keyframe, { clientX: 250, clientY: 0 });
        // Move to 30% of timeline
        fireEvent.mouseMove(timeline, { clientX: 300, clientY: 0 });
        fireEvent.mouseUp(timeline, { clientX: 300, clientY: 0 });
      });

      // 30% of 5000ms = 1500ms, should snap to nearest 500ms interval
      expect(onKeyframeChange).toHaveBeenCalledWith('kf2', 1500);
    });

    it('shows keyframe details on hover', async () => {
      await act(async () => {
        render(<AnimationTimeline animation={mockAnimationWithKeyframes} />);
      });

      const keyframe = screen.getAllByTestId('keyframe-marker')[1];
      await act(async () => {
        fireEvent.mouseEnter(keyframe);
        // Wait for tooltip to appear
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const tooltip = screen.getByTestId('keyframe-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('2.5s');
      expect(tooltip).toHaveTextContent('position: {"x":0.5,"y":0.5,"z":0.5}');
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

      const timeline = screen.getByTestId('timeline');
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

    it('allows dragging custom markers', async () => {
      const onMarkerChange = jest.fn();
      
      // Create a mock animation with 5000ms duration
      const mockAnimation = {
        ...mockLinearAnimation,
        duration: 5000,
        currentTime: 0
      };
      
      render(
        <AnimationTimeline 
          animation={mockAnimation}
          customMarkers={[
            { time: 0, label: 'Start', color: '#ff0000' }
          ]}
          onMarkerChange={onMarkerChange}
        />
      );

      // Mock getBoundingClientRect for document.querySelector('.timeline')
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
      
      // Mock querySelector to return our timeline element
      const mockTimeline = document.createElement('div');
      mockTimeline.getBoundingClientRect = jest.fn().mockReturnValue(mockRect);
      document.querySelector = jest.fn().mockReturnValue(mockTimeline);

      const marker = screen.getByTestId('custom-marker-0');
      
      // Initial position of marker is at 0ms
      const startX = 0;
      const moveX = 200; // Move to 20% of timeline width (1000ms)
      
      await act(async () => {
        fireEvent.mouseDown(marker, { 
          clientX: startX,
          bubbles: true,
          cancelable: true
        });
      });
      
      await act(async () => {
        fireEvent.mouseMove(document, { 
          clientX: moveX,
          bubbles: true,
          cancelable: true
        });
      });
      
      await act(async () => {
        fireEvent.mouseUp(document, {
          bubbles: true,
          cancelable: true
        });
      });
      
      await waitFor(() => {
        // Should snap to nearest 500ms interval (1000ms)
        // The marker starts at 0ms and moves 200px right (20% of 5000ms = 1000ms)
        expect(onMarkerChange).toHaveBeenCalledWith(0, 1000);
      });
    });
  });
});
