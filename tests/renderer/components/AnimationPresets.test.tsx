import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnimationPresets } from '../../../src/react/src/components/AnimationPresets';
import { Animation, Track, Position } from '../../types';

describe('Animation Presets Library', () => {
  const mockPosition: Position = { x: 0, y: 0, z: 0 };
  
  const mockTrack: Track = {
    id: 'track1',
    name: 'Test Track',
    type: 'source',
    position: mockPosition,
    isSelected: true,
    isMuted: false,
    isSolo: false
  };

  const mockCirclePreset: Animation = {
    id: 'circle',
    type: 'circular',
    name: 'Circle Motion',
    category: 'Basic Shapes',
    description: 'Circular motion in XY plane',
    duration: 2000,
    isPlaying: false,
    currentTime: 0,
    parameters: {
      center: { x: 0, y: 0, z: 0 },
      radius: 5,
      startAngle: 0,
      endAngle: 360,
      plane: 'xy'
    }
  };

  const mockLinePreset: Animation = {
    id: 'line',
    type: 'linear',
    name: 'Line Motion',
    category: 'Basic Shapes',
    description: 'Linear motion along X axis',
    duration: 1000,
    isPlaying: false,
    currentTime: 0,
    parameters: {
      startPosition: { x: -5, y: 0, z: 0 },
      endPosition: { x: 5, y: 0, z: 0 }
    }
  };

  it('should display list of available animation presets', () => {
    const presets = [mockCirclePreset, mockLinePreset];
    render(<AnimationPresets presets={presets} selectedTrack={mockTrack} />);

    expect(screen.getByText('Circle Motion')).toBeInTheDocument();
    expect(screen.getByText('Line Motion')).toBeInTheDocument();
    // Check that Basic Shapes appears in the category dropdown
    expect(screen.getByRole('option', { name: 'Basic Shapes' })).toBeInTheDocument();
  });

  it('should filter presets by category', () => {
    const presets = [mockCirclePreset, mockLinePreset];
    render(<AnimationPresets presets={presets} selectedTrack={mockTrack} />);

    const categoryFilter = screen.getByTestId('category-filter');
    fireEvent.change(categoryFilter, { target: { value: 'Basic Shapes' } });

    expect(screen.getByText('Circle Motion')).toBeInTheDocument();
    expect(screen.getByText('Line Motion')).toBeInTheDocument();
  });

  it('should apply preset to selected track', () => {
    const onApplyPreset = jest.fn();
    const presets = [mockCirclePreset, mockLinePreset];
    
    render(
      <AnimationPresets 
        presets={presets} 
        selectedTrack={mockTrack} 
        onApplyPreset={onApplyPreset}
      />
    );

    const applyButton = screen.getByTestId('apply-preset-circle');
    fireEvent.click(applyButton);

    expect(onApplyPreset).toHaveBeenCalledWith(mockTrack.id, mockCirclePreset);
  });

  it('should create new custom preset', () => {
    const onCreatePreset = jest.fn();
    render(
      <AnimationPresets 
        presets={[]} 
        selectedTrack={mockTrack} 
        onCreatePreset={onCreatePreset}
      />
    );

    // Open create preset form
    const createButton = screen.getByText('Create Preset');
    fireEvent.click(createButton);

    // Fill out form
    const nameInput = screen.getByLabelText('Preset Name');
    const categoryInput = screen.getByLabelText('Category');
    const descriptionInput = screen.getByLabelText('Description');
    const durationInput = screen.getByLabelText('Duration (ms)');

    fireEvent.change(nameInput, { target: { value: 'Custom Circle' } });
    fireEvent.change(categoryInput, { target: { value: 'Custom' } });
    fireEvent.change(descriptionInput, { target: { value: 'My custom circle motion' } });
    fireEvent.change(durationInput, { target: { value: '3000' } });

    // Submit form
    const submitButton = screen.getByText('Save Preset');
    fireEvent.click(submitButton);

    expect(onCreatePreset).toHaveBeenCalledWith({
      name: 'Custom Circle',
      category: 'Custom',
      description: 'My custom circle motion',
      duration: 3000,
      type: 'circular',
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        radius: 5,
        startAngle: 0,
        endAngle: 360,
        plane: 'xy'
      }
    });
  });

  it('should preview preset animation', () => {
    const presets = [mockCirclePreset];
    render(<AnimationPresets presets={presets} selectedTrack={mockTrack} />);

    // Hover over preset to show preview
    const presetCard = screen.getByTestId('preset-card-circle');
    fireEvent.mouseEnter(presetCard);

    // Check if preview is shown
    const preview = screen.getByTestId('preset-preview-circle');
    expect(preview).toBeInTheDocument();

    // Preview should show animation path
    const previewPath = preview.querySelector('path');
    expect(previewPath).toBeInTheDocument();
  });

  it('should edit existing preset', () => {
    const onEditPreset = jest.fn();
    const presets = [mockCirclePreset];
    
    render(
      <AnimationPresets 
        presets={presets} 
        selectedTrack={mockTrack} 
        onEditPreset={onEditPreset}
      />
    );

    // Open edit mode
    const editButton = screen.getByTestId('edit-preset-circle');
    fireEvent.click(editButton);

    // Modify preset
    const nameInput = screen.getByLabelText('Preset Name');
    fireEvent.change(nameInput, { target: { value: 'Modified Circle' } });

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    expect(onEditPreset).toHaveBeenCalledWith({
      ...mockCirclePreset,
      name: 'Modified Circle'
    });
  });
});
