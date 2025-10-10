/**
 * @jest-environment jsdom
 */

import * as React from 'react';
import { screen, fireEvent, act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AnimationTimeline } from '../../../src/react/src/components/AnimationTimeline';
import { mockLinearAnimation, mockPosition, mockEndPosition } from '../../fixtures/animations';
import { LinearAnimation, Position, KeyframeType } from '../../../src/react/src/types';

describe('AnimationTimeline', () => {
  const mockOnTimeUpdate = jest.fn();
  const mockOnKeyframeSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });
  const mockAnimationWithKeyframes: LinearAnimation = {
    ...mockLinearAnimation,
    keyframes: [
      {
        id: 'kf1',
        time: 0,
        type: 'position',
        value: mockPosition
      },
      {
        id: 'kf2',
        time: 2500,
        type: 'position',
        value: {
          x: 0.5,
          y: 0.5,
          z: 0.5
        }
      },
      {
        id: 'kf3',
        time: 5000,
        type: 'position',
        value: mockEndPosition
      }
    ]
  };

  const renderTimeline = (props = {}) => {
    const defaultProps = {
      animation: mockLinearAnimation,
      onTimeUpdate: mockOnTimeUpdate,
      onKeyframeSelect: mockOnKeyframeSelect,
      ...props
    };

    return render(<AnimationTimeline {...defaultProps} />);
  };

  it('renders timeline with correct duration', async () => {
    await act(async () => {
      renderTimeline();
    });
    
    const timeline = screen.getByRole('slider');
    expect(timeline).toHaveAttribute('max', '5000');
  });

  it('shows current time marker', async () => {
    const animation = {
      ...mockLinearAnimation,
      currentTime: 2500
    };

    await act(async () => {
      renderTimeline({ animation });
    });
    
    const timeMarker = screen.getByTestId('playhead');
    expect(timeMarker).toHaveStyle({ left: '50%' });
  });

  it('displays keyframe markers', async () => {
    await act(async () => {
      renderTimeline({ animation: mockAnimationWithKeyframes });
    });
    
    const keyframeMarkers = screen.getAllByTestId('keyframe-marker');
    expect(keyframeMarkers).toHaveLength(3);
  });

  it('calls onTimeUpdate when timeline value changes', async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderTimeline();
    });
    
    const timeline = screen.getByRole('slider');
    await act(async () => {
      await user.type(timeline, '2500');
      fireEvent.change(timeline, { target: { value: '2500' } });
    });
    
    expect(mockOnTimeUpdate).toHaveBeenCalledWith(2500);
  });

  it('shows loop region if defined', async () => {
    const animationWithLoop = {
      ...mockLinearAnimation,
      loopRegion: {
        start: 1000,
        end: 4000
      }
    };

    await act(async () => {
      renderTimeline({ animation: animationWithLoop });
    });
    
    const loopRegion = screen.getByTestId('loop-region');
    expect(loopRegion).toHaveStyle({
      left: '20%',
      width: '60%'
    });
  });

  it('calls onKeyframeSelect when keyframe is clicked', async () => {
    await act(async () => {
      renderTimeline({ animation: mockAnimationWithKeyframes });
    });
    
    const keyframeMarkers = screen.getAllByTestId('keyframe-marker');
    const middleKeyframe = keyframeMarkers[1];
    
    // Verify keyframe ID is set correctly
    expect(middleKeyframe).toHaveAttribute('data-keyframe-id', 'kf2');
    
    await act(async () => {
      // Simulate mousedown to trigger keyframe selection
      fireEvent.mouseDown(middleKeyframe);
    });
    
    expect(mockOnKeyframeSelect).toHaveBeenCalledWith('kf2');
  });

  it('shows keyframe tooltip on hover', async () => {
    await act(async () => {
      renderTimeline({ animation: mockAnimationWithKeyframes });
    });
    
    const keyframeMarkers = screen.getAllByTestId('keyframe-marker');
    const middleKeyframe = keyframeMarkers[1];
    
    await act(async () => {
      fireEvent.mouseEnter(middleKeyframe);
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Get the tooltip by testid
    const tooltip = screen.getByTestId('keyframe-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('2.5s');
    expect(tooltip).toHaveTextContent('position: {"x":0.5,"y":0.5,"z":0.5}');
  });
});
