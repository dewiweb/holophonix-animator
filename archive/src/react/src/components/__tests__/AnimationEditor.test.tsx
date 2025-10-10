import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import { AnimationEditor } from '../AnimationEditor';
import { Animation } from '../../types';

describe('AnimationEditor', () => {
  const mockAnimation: Animation = {
    id: 'anim1',
    name: 'Test Animation',
    type: 'linear',
    duration: 5000,
    tracks: ['track1'],
    keyframes: [
      { id: 'kf1', time: 0, position: { x: 0, y: 0 } },
      { id: 'kf2', time: 5000, position: { x: 100, y: 100 } }
    ],
    parameters: {
      startPosition: { x: 0, y: 0, z: 0 },
      endPosition: { x: 100, y: 100, z: 0 }
    }
  };

  it('renders editor with animation details', () => {
    act(() => {
      render(<AnimationEditor animation={mockAnimation} />);
    });

    expect(screen.getByDisplayValue('Test Animation')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
    expect(screen.getByTestId('animation-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('animation-type-select')).toHaveValue('linear');
  });

  it('handles name change', () => {
    const onUpdate = jest.fn();
    act(() => {
      render(<AnimationEditor animation={mockAnimation} onUpdate={onUpdate} />);
    });

    const nameInput = screen.getByDisplayValue('Test Animation');
    act(() => {
      fireEvent.change(nameInput, { target: { value: 'New Name' } });
    });

    expect(onUpdate).toHaveBeenCalledWith({
      ...mockAnimation,
      name: 'New Name'
    });
  });

  it('handles duration change', () => {
    const onUpdate = jest.fn();
    act(() => {
      render(<AnimationEditor animation={mockAnimation} onUpdate={onUpdate} />);
    });

    const durationInput = screen.getByDisplayValue('5000');
    act(() => {
      fireEvent.change(durationInput, { target: { value: '6000' } });
    });

    expect(onUpdate).toHaveBeenCalledWith({
      ...mockAnimation,
      duration: 6000
    });
  });

  it('handles position updates', () => {
    const onUpdate = jest.fn();
    act(() => {
      render(<AnimationEditor animation={mockAnimation} onUpdate={onUpdate} />);
    });

    const startPositionX = screen.getByTestId('start-position-x');
    act(() => {
      fireEvent.change(startPositionX, { target: { value: '10' } });
    });

    expect(onUpdate).toHaveBeenCalledWith({
      ...mockAnimation,
      parameters: {
        ...mockAnimation.parameters,
        startPosition: {
          ...mockAnimation.parameters.startPosition,
          x: 10
        }
      }
    });
  });

  it('validates numeric inputs', () => {
    const onUpdate = jest.fn();
    act(() => {
      render(<AnimationEditor animation={mockAnimation} onUpdate={onUpdate} />);
    });

    const startPositionX = screen.getByTestId('start-position-x');
    act(() => {
      fireEvent.change(startPositionX, { target: { value: 'invalid' } });
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('shows presets button', () => {
    act(() => {
      render(<AnimationEditor animation={mockAnimation} />);
    });

    expect(screen.getByTestId('presets-button')).toBeInTheDocument();
  });
});
