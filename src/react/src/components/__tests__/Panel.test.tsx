import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Panel } from '../Panel';

describe('Panel Component', () => {
  const defaultProps = {
    title: 'Test Panel',
    children: <div>Panel Content</div>,
  };

  it('renders with required props', () => {
    render(<Panel {...defaultProps} />);
    expect(screen.getByText('Test Panel')).toBeInTheDocument();
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('handles collapse toggle when collapsible is true', () => {
    render(<Panel {...defaultProps} collapsible />);
    const toggleButton = screen.getByRole('button', { name: /toggle panel/i });
    const content = screen.getByText('Panel Content');

    expect(content).toBeVisible();
    fireEvent.click(toggleButton);
    expect(content).not.toBeVisible();
    fireEvent.click(toggleButton);
    expect(content).toBeVisible();
  });

  it('maintains width when resizable is true', () => {
    const onResize = jest.fn();
    render(<Panel {...defaultProps} resizable width={300} onResize={onResize} />);
    const resizeHandle = screen.getByTestId('resize-handle');

    // Simulate drag
    fireEvent.mouseDown(resizeHandle, { clientX: 300 });
    fireEvent.mouseMove(document, { clientX: 400 });
    fireEvent.mouseUp(document);

    expect(onResize).toHaveBeenCalledWith(400);
  });

  it('respects minimum width when resizing', () => {
    const onResize = jest.fn();
    render(
      <Panel {...defaultProps} resizable width={300} minWidth={200} onResize={onResize} />
    );
    const resizeHandle = screen.getByTestId('resize-handle');

    // Simulate drag below minimum
    fireEvent.mouseDown(resizeHandle, { clientX: 300 });
    fireEvent.mouseMove(document, { clientX: 100 });
    fireEvent.mouseUp(document);

    expect(onResize).toHaveBeenCalledWith(200);
  });

  it('applies custom className when provided', () => {
    render(<Panel {...defaultProps} className="custom-panel" />);
    expect(screen.getByTestId('panel')).toHaveClass('custom-panel');
  });

  it('handles double click on resize handle to reset width', () => {
    const onResize = jest.fn();
    render(
      <Panel 
        {...defaultProps} 
        resizable 
        width={400} 
        defaultWidth={300} 
        onResize={onResize} 
      />
    );
    const resizeHandle = screen.getByTestId('resize-handle');

    fireEvent.doubleClick(resizeHandle);
    expect(onResize).toHaveBeenCalledWith(300);
  });

  it('renders custom controls when provided', () => {
    const CustomControls = () => <button>Custom Control</button>;
    render(<Panel {...defaultProps} controls={<CustomControls />} />);
    expect(screen.getByText('Custom Control')).toBeInTheDocument();
  });
});
