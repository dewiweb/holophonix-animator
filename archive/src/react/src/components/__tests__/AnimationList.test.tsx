import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { AnimationList } from '../AnimationList';
import { Animation } from '../../types';
import '@testing-library/jest-dom';

describe('AnimationList Component', () => {
  const mockAnimations: Animation[] = [
    {
      id: 'anim1',
      type: 'linear',
      name: 'Linear Move 1',
      isPlaying: false,
      duration: 5000,
      currentTime: 0,
      parameters: {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 1, y: 1, z: 1 }
      }
    },
    {
      id: 'anim2',
      type: 'circular',
      name: 'Circular Move 1',
      isPlaying: true,
      duration: 5000,
      currentTime: 2500,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        radius: 5,
        speed: 1,
        direction: 'clockwise'
      }
    }
  ];

  it('renders list of animations', () => {
    act(() => {
      render(<AnimationList animations={mockAnimations} />);
    });
    
    expect(screen.getByText('Linear Move 1')).toBeInTheDocument();
    expect(screen.getByText('Circular Move 1')).toBeInTheDocument();
  });

  it('shows animation type indicators', () => {
    act(() => {
      render(<AnimationList animations={mockAnimations} />);
    });
    
    const types = screen.getAllByTestId('animation-type-badge');
    expect(types[0]).toHaveTextContent('Linear');
    expect(types[1]).toHaveTextContent('Circular');
  });

  it('handles animation selection', () => {
    const onSelect = jest.fn();
    act(() => {
      render(
        <AnimationList 
          animations={mockAnimations}
          selectedId="anim1"
          onSelect={onSelect}
        />
      );
    });

    const animation2 = screen.getByTestId('animation-item-anim2');
    act(() => {
      fireEvent.click(animation2);
    });
    expect(onSelect).toHaveBeenCalledWith('anim2');
  });

  it('shows playing state indicators', () => {
    act(() => {
      render(<AnimationList animations={mockAnimations} />);
    });
    
    const playStates = screen.getAllByTestId('animation-play-state');
    expect(playStates[0]).toHaveTextContent('Paused');
    expect(playStates[1]).toHaveTextContent('Playing');
  });

  it('shows progress indicators', () => {
    act(() => {
      render(<AnimationList animations={mockAnimations} />);
    });
    
    const progressBars = screen.getAllByTestId('animation-progress');
    expect(progressBars[0]).toHaveStyle('width: 0%');
    expect(progressBars[1]).toHaveStyle('width: 50%');
  });

  it('handles animation deletion', () => {
    const onDelete = jest.fn();
    act(() => {
      render(
        <AnimationList 
          animations={mockAnimations}
          onDelete={onDelete}
        />
      );
    });

    const deleteButton = screen.getAllByTestId('delete-button')[0];
    act(() => {
      fireEvent.click(deleteButton);
    });
    expect(onDelete).toHaveBeenCalledWith('anim1');
  });

  it('shows empty state when no animations', () => {
    act(() => {
      render(<AnimationList animations={[]} />);
    });
    
    expect(screen.getByText('No animations created yet')).toBeInTheDocument();
    expect(screen.getByText('Create an animation to get started')).toBeInTheDocument();
  });

  it('handles animation duplication', () => {
    const onDuplicate = jest.fn();
    act(() => {
      render(
        <AnimationList 
          animations={mockAnimations}
          onDuplicate={onDuplicate}
        />
      );
    });

    const duplicateButton = screen.getAllByTestId('duplicate-button')[0];
    act(() => {
      fireEvent.click(duplicateButton);
    });
    expect(onDuplicate).toHaveBeenCalledWith('anim1');
  });

  it('shows duration in readable format', () => {
    act(() => {
      render(<AnimationList animations={mockAnimations} />);
    });
    
    const durations = screen.getAllByTestId('animation-duration');
    expect(durations[0]).toHaveTextContent('0:05');
    expect(durations[1]).toHaveTextContent('0:05');
  });

  it('handles animation reordering', () => {
    const onReorder = jest.fn();
    act(() => {
      render(
        <AnimationList 
          animations={mockAnimations}
          onReorder={onReorder}
        />
      );
    });

    const moveUpButton = screen.getAllByTestId('move-up-button')[1];
    act(() => {
      fireEvent.click(moveUpButton);
    });
    expect(onReorder).toHaveBeenCalledWith('anim2', 'up');
  });
});
