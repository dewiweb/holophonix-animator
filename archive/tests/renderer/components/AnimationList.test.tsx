import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnimationList } from '../../../src/react/src/components/AnimationList';
import { mockLinearAnimation } from '../../fixtures/animations';
import { Animation } from '../../../src/react/src/types';

describe('AnimationList', () => {
  const mockAnimations: Animation[] = [
    {
      ...mockLinearAnimation,
      id: 'anim1',
      name: 'Animation 1'
    },
    {
      ...mockLinearAnimation,
      id: 'anim2',
      name: 'Animation 2'
    }
  ];

  it('renders list of animations', async () => {
    render(
      <AnimationList 
        animations={mockAnimations} 
        selectedId="" 
        onSelect={() => {}} 
      />);
    
    expect(screen.getByText('Animation 1')).toBeInTheDocument();
    expect(screen.getByText('Animation 2')).toBeInTheDocument();
  });

  it('calls onSelect when animation is clicked', async () => {
    const onSelect = jest.fn();
    render(
      <AnimationList 
        animations={mockAnimations}
        selectedId=""
        onSelect={onSelect}
      />
    );
    
    await userEvent.click(screen.getByText('Animation 1'));
    expect(onSelect).toHaveBeenCalledWith('anim1');
  });

  it('shows selected animation with different style', () => {
    const { getByText } = render(
      <AnimationList 
        animations={mockAnimations}
        selectedId="anim1"
        onSelect={() => {}}
      />
    );
    
    const selectedItem = getByText('Animation 1').closest('li');
    expect(selectedItem).toHaveClass('selected');
  });

  it('displays animation duration', () => {
    const { container } = render(
      <AnimationList 
        animations={mockAnimations}
        selectedId=""
        onSelect={() => {}}
      />
    );
    
    // mockLinearAnimation has duration of 5000ms (0:05)
    const durationElements = container.getElementsByClassName('animation-duration');
    expect(durationElements[0]).toHaveTextContent('0:05');
  });

  it('displays animation type', () => {
    const { getAllByText } = render(
      <AnimationList 
        animations={mockAnimations}
        selectedId=""
        onSelect={() => {}}
      />
    );
    
    const typeLabels = getAllByText('Linear');
    expect(typeLabels).toHaveLength(2);
  });
});
