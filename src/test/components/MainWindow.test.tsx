import React from 'react';
import { render, screen } from '../utils/test-utils';
import { MainWindow } from '../../react/components/MainWindow';

jest.mock('../../react/hooks/useOscConnection', () => ({
  useOscConnection: () => ({
    isConnected: false,
    connect: jest.fn(),
    disconnect: jest.fn()
  })
}));

describe('MainWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial state', () => {
    render(<MainWindow />);
    
    // Verify main components are rendered
    expect(screen.getByTestId('connection-panel')).toBeInTheDocument();
    expect(screen.getByTestId('track-control-empty')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-container')).toBeInTheDocument();
  });

  it('displays track information when track is selected', () => {
    render(<MainWindow />, {
      preloadedState: {
        trackState: {
          currentTrack: {
            id: 'test-track',
            position: { x: 0, y: 0, z: 0 },
            animation: null
          },
          tracks: [{
            id: 'test-track',
            position: { x: 0, y: 0, z: 0 },
            animation: null
          }]
        },
        oscConfig: {
          host: 'localhost',
          port: 8000
        }
      }
    });

    const trackControl = screen.getByTestId('track-control-active');
    expect(trackControl).toBeInTheDocument();
    expect(trackControl.querySelector('h4')).toHaveTextContent('Track test-track');
  });
});
