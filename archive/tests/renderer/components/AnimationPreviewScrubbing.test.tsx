import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { AnimationPreview } from '../../../src/react/src/components/TrackList/AnimationPreview';
import { Animation } from '../../types';

// Increase timeout for all tests in this file
jest.setTimeout(30000);

describe('Animation Preview Scrubbing', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Enable fake timers
    jest.useFakeTimers();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up canvas mock
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      closePath: jest.fn()
    });
    
    // Mock canvas dimensions
    Object.defineProperty(HTMLCanvasElement.prototype, 'width', { value: 200 });
    Object.defineProperty(HTMLCanvasElement.prototype, 'height', { value: 40 });
    
    // Create container
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  const mockLinearAnimation: Animation = {
    id: 'anim1',
    type: 'linear',
    name: 'Test Animation',
    isPlaying: false,
    duration: 1000,
    currentTime: 0,
    parameters: {
      startPosition: { x: 0, y: 0, z: 0 },
      endPosition: { x: 10, y: 10, z: 10 }
    }
  };

  it('should show scrubbing controls when hovering over preview', async () => {
    render(<AnimationPreview animation={mockLinearAnimation} trackId="track1" />, { container });
    // Wait for component to mount
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    // Wait for React to finish all updates
    await act(async () => {
      jest.runAllTimers();
    });
    
    const previewCanvas = screen.getByTestId('animation-preview-track1');
    fireEvent.mouseEnter(previewCanvas);
    
    const scrubHandle = screen.getByTestId('scrub-handle-track1');
    expect(scrubHandle).toBeInTheDocument();
  });

  it('should update animation time when scrubbing', async () => {
    const onTimeChange = jest.fn();
    await act(async () => {
      render(
        <AnimationPreview 
          animation={mockLinearAnimation} 
          trackId="track1" 
          onTimeChange={onTimeChange}
        />
      );
    });
    
    const previewCanvas = screen.getByTestId('animation-preview-track1');
    // Mock getBoundingClientRect
    const rect = { left: 0, width: 100, right: 100, top: 0, bottom: 100, height: 100 };
    jest.spyOn(previewCanvas, 'getBoundingClientRect').mockImplementation(() => rect);
    
    // Simulate scrubbing to 50% of the width
    fireEvent.mouseDown(previewCanvas, { clientX: rect.left });
    fireEvent.mouseMove(previewCanvas, { clientX: rect.left + rect.width * 0.5 });
    
    expect(onTimeChange).toHaveBeenCalledWith(500); // 50% of 1000ms duration
  });

  it('should snap to keyframes when scrubbing near them', async () => {
    const animationWithKeyframes: Animation = {
      ...mockLinearAnimation,
      keyframes: [
        { id: 'kf1', time: 250, type: 'position' },
        { id: 'kf2', time: 750, type: 'position' }
      ]
    };
    
    const onTimeChange = jest.fn();
    await act(async () => {
      render(
        <AnimationPreview 
          animation={animationWithKeyframes} 
          trackId="track1" 
          onTimeChange={onTimeChange}
          snapToKeyframes
        />
      );
    });
    
    const previewCanvas = screen.getByTestId('animation-preview-track1');
    // Mock getBoundingClientRect
    const rect = { left: 0, width: 100, right: 100, top: 0, bottom: 100, height: 100 };
    jest.spyOn(previewCanvas, 'getBoundingClientRect').mockImplementation(() => rect);
    
    // Scrub to 24% (near first keyframe at 25%)
    fireEvent.mouseDown(previewCanvas, { clientX: rect.left });
    fireEvent.mouseMove(previewCanvas, { clientX: rect.left + rect.width * 0.24 });
    // Add a small delay to allow for state updates
    jest.advanceTimersByTime(100);
    
    expect(onTimeChange).toHaveBeenCalledWith(250); // Should snap to first keyframe
  });

  it('should show time indicator while scrubbing', async () => {

    render(<AnimationPreview animation={mockLinearAnimation} trackId="track1" />, { container });
    // Wait for component to mount
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    // Wait for React to finish all updates
    await act(async () => {
      jest.runAllTimers();
    });
    
    const previewCanvas = screen.getByTestId('animation-preview-track1');
    const rect = { left: 0, width: 100, right: 100, top: 0, bottom: 100, height: 100 };
    jest.spyOn(previewCanvas, 'getBoundingClientRect').mockImplementation(() => rect);
    
    fireEvent.mouseDown(previewCanvas, { clientX: 0, clientY: 20 });
    fireEvent.mouseMove(previewCanvas, { clientX: 50, clientY: 20 });
    
    const timeIndicator = screen.getByTestId('time-indicator-track1');
    expect(timeIndicator).toBeInTheDocument();
    expect(timeIndicator).toHaveTextContent('0ms'); // Initial time
  });

  it('should update preview dot position while scrubbing', async () => {
    const onTimeChange = jest.fn();
    render(
      <AnimationPreview 
        animation={mockLinearAnimation} 
        trackId="track1" 
        onTimeChange={onTimeChange}
      />, 
      { container }
    );

    // Wait for component to mount
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    // Wait for React to finish all updates
    await act(async () => {
      jest.runAllTimers();
    });
    
    const previewCanvas = screen.getByTestId('animation-preview-track1');
    // Mock getBoundingClientRect
    const rect = { left: 0, width: 100, right: 100, top: 0, bottom: 100, height: 100 };
    jest.spyOn(previewCanvas, 'getBoundingClientRect').mockImplementation(() => rect);
    
    // Get initial canvas context
    const canvas = previewCanvas as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    const spy = jest.spyOn(ctx!, 'arc');
    
    // Scrub to 50%
    fireEvent.mouseDown(previewCanvas, { clientX: rect.left });
    fireEvent.mouseMove(previewCanvas, { clientX: rect.left + rect.width * 0.5 });
    
    // Canvas should have been redrawn
    expect(spy).toHaveBeenCalled();
  });

  it('should handle edge cases during scrubbing', async () => {
    const onTimeChange = jest.fn();
    render(
      <AnimationPreview 
        animation={mockLinearAnimation} 
        trackId="track1" 
        onTimeChange={onTimeChange}
        snapToKeyframes={true}
      />, 
      { container }
    );

    // Wait for component to mount
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    // Wait for React to finish all updates
    await act(async () => {
      jest.runAllTimers();
    });

    const preview = screen.getByTestId('animation-preview-track1');
    const rect = { left: 0, width: 200, right: 200, top: 0, bottom: 40, height: 40 };
    jest.spyOn(preview, 'getBoundingClientRect').mockImplementation(() => rect);

    // Reset mock before edge case tests
    onTimeChange.mockClear();

    // Test scrubbing beyond canvas boundaries
    fireEvent.mouseDown(preview, { clientX: 0, clientY: 20 });
    fireEvent.mouseMove(preview, { clientX: -50, clientY: 20 }); // Beyond left edge
    expect(onTimeChange).toHaveBeenCalledWith(0); // Should clamp to minimum

    fireEvent.mouseMove(preview, { clientX: 250, clientY: 20 }); // Beyond right edge
    expect(onTimeChange).toHaveBeenCalledWith(mockLinearAnimation.duration); // Should clamp to maximum

    // Reset mock before rapid movement test
    onTimeChange.mockClear();

    // Test rapid mouse movements
    for (let i = 0; i < 5; i++) {
      fireEvent.mouseMove(preview, { clientX: i * 40, clientY: 20 });
    }

    // Verify multiple time updates occurred
    expect(onTimeChange).toHaveBeenCalledTimes(5); // 5 moves

    fireEvent.mouseUp(preview);
  });
});
