import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnimationPanel } from '../AnimationPanel';
import { AnimationModel, AnimationType } from '../../types';

describe('AnimationPanel', () => {
  const mockModels: AnimationModel[] = [
    {
      id: '1',
      type: 'linear',
      name: 'Linear Move 1',
      parameters: { duration: 1000, startPosition: { x: 0, y: 0 }, endPosition: { x: 1, y: 1 } }
    },
    {
      id: '2',
      type: 'circular',
      name: 'Circle 1',
      parameters: { duration: 2000, radius: 0.5, center: { x: 0.5, y: 0.5 } }
    }
  ];

  const defaultProps = {
    availableModels: ['Linear Move', 'Circular Path', 'Random Walk'],
    activeModels: mockModels,
    selectedModelId: null,
    onModelSelect: jest.fn(),
    onModelAdd: jest.fn(),
    onModelRemove: jest.fn(),
    onModelUpdate: jest.fn(),
    onModelPlay: jest.fn(),
    onModelStop: jest.fn(),
  };

  it('renders available and active models', () => {
    render(<AnimationPanel {...defaultProps} />);
    expect(screen.getByText('Linear Move')).toBeInTheDocument();
    expect(screen.getByText('Linear Move 1')).toBeInTheDocument();
  });

  it('handles model selection', () => {
    render(<AnimationPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('Linear Move 1'));
    expect(defaultProps.onModelSelect).toHaveBeenCalledWith('1');
  });

  it('shows selected model as active', () => {
    render(<AnimationPanel {...defaultProps} selectedModelId="1" />);
    expect(screen.getByText('Linear Move 1').closest('.model-item')).toHaveClass('model-item--selected');
  });

  it('handles model addition', () => {
    render(<AnimationPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('Linear Move'));
    expect(defaultProps.onModelAdd).toHaveBeenCalledWith('linear');
  });

  it('handles model removal', () => {
    render(<AnimationPanel {...defaultProps} />);
    const removeButton = screen.getAllByRole('button', { name: /remove model/i })[0];
    fireEvent.click(removeButton);
    expect(defaultProps.onModelRemove).toHaveBeenCalledWith('1');
  });

  it('allows model name editing', () => {
    render(<AnimationPanel {...defaultProps} />);
    const modelName = screen.getByText('Linear Move 1');
    fireEvent.doubleClick(modelName);
    
    const input = screen.getByDisplayValue('Linear Move 1');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.blur(input);

    expect(defaultProps.onModelUpdate).toHaveBeenCalledWith('1', { name: 'New Name' });
  });

  it('provides playback controls for active models', () => {
    render(<AnimationPanel {...defaultProps} />);
    const playButtons = screen.getAllByRole('button', { name: /play model/i });
    const stopButtons = screen.getAllByRole('button', { name: /stop model/i });

    fireEvent.click(playButtons[0]);
    expect(defaultProps.onModelPlay).toHaveBeenCalledWith('1');

    fireEvent.click(stopButtons[0]);
    expect(defaultProps.onModelStop).toHaveBeenCalledWith('1');
  });

  it('shows preview for active models', () => {
    render(<AnimationPanel {...defaultProps} />);
    const previews = screen.getAllByTestId('model-preview');
    expect(previews).toHaveLength(2);
  });
});
