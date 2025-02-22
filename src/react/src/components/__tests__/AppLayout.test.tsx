import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppLayout } from '../AppLayout';

// Mock the useConnection hook
jest.mock('../../hooks/useConnection', () => ({
  useConnection: () => ({
    isConnected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

describe('AppLayout', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  const mockChildren = {
    tracksPanel: <div data-testid="tracks-panel">Tracks Panel</div>,
    animationModelsPanel: <div data-testid="animation-models-panel">Animation Models Panel</div>,
    parametersPanel: <div data-testid="parameters-panel">Parameters Panel</div>,

    statusBar: <div data-testid="status-bar">Status Bar</div>
  };

  it('renders all panels and components', () => {
    const onConnectionChange = jest.fn();
    render(
      <AppLayout onConnectionChange={onConnectionChange}>
        {mockChildren}
      </AppLayout>
    );

    // Check if all main components are rendered
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    expect(screen.getByTestId('connection-status')).toBeInTheDocument();

    expect(screen.getByTestId('tracks-panel')).toBeInTheDocument();
    expect(screen.getByTestId('animation-models-panel')).toBeInTheDocument();
    expect(screen.getByTestId('parameters-panel')).toBeInTheDocument();
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('maintains minimum panel widths', () => {
    render(
      <AppLayout>
        {mockChildren}
      </AppLayout>
    );

    const leftPanel = screen.getByTestId('left-panel');
    const rightPanel = screen.getByTestId('right-panel');

    expect(leftPanel).toHaveStyle({ width: '250px' });
    expect(rightPanel).toHaveStyle({ width: '250px' });
  });

  it('saves panel sizes in local storage', () => {
    render(
      <AppLayout>
        {mockChildren}
      </AppLayout>
    );

    // Default sizes should be saved
    expect(localStorage.getItem('leftPanelWidth')).toBe('250');
    expect(localStorage.getItem('rightPanelWidth')).toBe('250');
  });

  it('allows panel resizing', () => {
    render(
      <AppLayout>
        {mockChildren}
      </AppLayout>
    );

    const leftResizer = screen.getByTestId('left-panel-resizer');
    const rightResizer = screen.getByTestId('right-panel-resizer');

    // Check if resizers are present
    expect(leftResizer).toBeInTheDocument();
    expect(rightResizer).toBeInTheDocument();

    // Simulate resize
    fireEvent.mouseDown(leftResizer);
    fireEvent.mouseMove(document, { clientX: 300 });
    fireEvent.mouseUp(document);

    const leftPanel = screen.getByTestId('left-panel');
    expect(leftPanel).toHaveStyle({ width: '300px' });
  });

  it('allows panels to be collapsed', () => {
    render(
      <AppLayout>
        {mockChildren}
      </AppLayout>
    );

    const leftPanel = screen.getByTestId('left-panel');
    const rightPanel = screen.getByTestId('right-panel');
    const leftCollapseButton = screen.getByTestId('left-panel-collapse');
    const rightCollapseButton = screen.getByTestId('right-panel-collapse');

    // Initially panels should not be collapsed
    expect(leftPanel).not.toHaveClass('collapsed');
    expect(rightPanel).not.toHaveClass('collapsed');

    // Click collapse buttons
    fireEvent.click(leftCollapseButton);
    fireEvent.click(rightCollapseButton);

    // Panels should now be collapsed
    expect(leftPanel).toHaveClass('collapsed');
    expect(rightPanel).toHaveClass('collapsed');
  });


});
