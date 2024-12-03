import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MainWindow } from '../react/components/MainWindow';
import { ConnectionPanel } from '../react/components/ConnectionPanel';
import { TrackControl } from '../react/components/TrackControl';
import { Timeline } from '../react/components/Timeline';
import { ConnectionStatus, Position } from '../types';
import { TEST_CONFIG } from './poc-test-config';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { oscConfigReducer, trackStateReducer, setConnectionStatus } from '../react/reducers';

// Mock the hooks
jest.mock('../react/hooks/useOscConnection', () => ({
  useOscConnection: () => ({
    status: ConnectionStatus.Disconnected,
    error: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendPosition: jest.fn(),
    isConnected: false,
  }),
}));

jest.mock('../react/hooks/useTrackState', () => ({
  useTrackState: () => ({
    track: {
      id: TEST_CONFIG.track.id,
      position: TEST_CONFIG.track.position,
    },
    error: null,
    updatePosition: jest.fn(),
    startAnimation: jest.fn(),
    stopAnimation: jest.fn(),
    calculateAnimationPositions: jest.fn(),
  }),
}));

describe('React Components', () => {
  describe('ConnectionPanel', () => {
    const mockProps = {
      host: 'localhost',
      port: 8000,
      onHostChange: jest.fn(),
      onPortChange: jest.fn(),
      onConnect: jest.fn(),
      onDisconnect: jest.fn(),
      status: ConnectionStatus.Disconnected,
      error: null
    };

    it('renders connection form', () => {
      render(<ConnectionPanel {...mockProps} />);
      
      expect(screen.getByLabelText('Host')).toBeInTheDocument();
      expect(screen.getByLabelText('Port')).toBeInTheDocument();
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });

    it('handles connection state changes', () => {
      const mockConnect = jest.fn();
      const mockDisconnect = jest.fn();

      const { rerender } = render(
        <ConnectionPanel
          status={ConnectionStatus.Disconnected}
          onConnect={mockConnect}
          onDisconnect={mockDisconnect}
        />
      );

      const connectButton = screen.getByText('Connect');
      fireEvent.click(connectButton);
      expect(mockConnect).toHaveBeenCalled();

      rerender(
        <ConnectionPanel
          status={ConnectionStatus.Connected}
          onConnect={mockConnect}
          onDisconnect={mockDisconnect}
        />
      );

      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('TrackControl', () => {
    const mockTrack = {
      id: 'test-track',
      position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 }
    };

    const mockProps = {
      track: mockTrack,
      onPositionChange: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('shows no track message when no track selected', () => {
      render(<TrackControl onPositionChange={mockProps.onPositionChange} />);
      expect(screen.getByText('No Track Selected')).toBeInTheDocument();
      expect(screen.getByText('Select a track to control its position')).toBeInTheDocument();
    });

    it('renders position controls when track is selected', () => {
      render(<TrackControl {...mockProps} />);
      
      expect(screen.getByLabelText('X Position')).toBeInTheDocument();
      expect(screen.getByLabelText('Y Position')).toBeInTheDocument();
      expect(screen.getByLabelText('Z Position')).toBeInTheDocument();
    });

    it('displays current position values', () => {
      const trackWithPosition = {
        ...mockTrack,
        position: { x: 0.5, y: -0.3, z: 0.1, rx: 0, ry: 0, rz: 0 }
      };
      
      render(<TrackControl track={trackWithPosition} onPositionChange={mockProps.onPositionChange} />);
      
      const xInput = screen.getByLabelText('X Position') as HTMLInputElement;
      const yInput = screen.getByLabelText('Y Position') as HTMLInputElement;
      const zInput = screen.getByLabelText('Z Position') as HTMLInputElement;
      
      expect(xInput.value).toBe('0.5');
      expect(yInput.value).toBe('-0.3');
      expect(zInput.value).toBe('0.1');
    });

    it('handles position changes', () => {
      render(<TrackControl {...mockProps} />);
      
      const xInput = screen.getByLabelText('X Position');
      fireEvent.change(xInput, { target: { value: '0.5' } });
      
      expect(mockProps.onPositionChange).toHaveBeenCalledWith({
        x: 0.5,
        y: 0,
        z: 0,
        rx: 0,
        ry: 0,
        rz: 0
      });
    });
  });

  describe('Timeline', () => {
    const mockProps = {
      currentTime: 0,
      duration: 5000,
      isPlaying: false,
      onTimeChange: jest.fn(),
      onPlay: jest.fn(),
      onPause: jest.fn(),
      onStop: jest.fn(),
      onAddKeyframe: jest.fn(),
      trackId: 'test-track'
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders timeline controls', () => {
      render(<Timeline {...mockProps} />);
      
      expect(screen.getByTestId('play-button')).toBeInTheDocument();
      expect(screen.getByTestId('stop-button')).toBeInTheDocument();
      expect(screen.getByTestId('time-display')).toBeInTheDocument();
      expect(screen.getByTestId('add-keyframe-button')).toBeInTheDocument();
    });

    it('handles play/pause button click', () => {
      render(<Timeline {...mockProps} />);
      
      const playButton = screen.getByTestId('play-button');
      fireEvent.click(playButton);
      expect(mockProps.onPlay).toHaveBeenCalled();
    });

    it('updates button icon when isPlaying changes', () => {
      const { rerender } = render(<Timeline {...mockProps} />);
      
      // Initially shows play icon
      expect(screen.getByTestId('play-button')).toHaveAttribute('aria-label', 'Play');
      
      // Update to playing state
      rerender(<Timeline {...mockProps} isPlaying={true} />);
      expect(screen.getByTestId('play-button')).toHaveAttribute('aria-label', 'Pause');
    });

    it('handles stop button click', () => {
      render(<Timeline {...mockProps} />);
      
      const stopButton = screen.getByTestId('stop-button');
      fireEvent.click(stopButton);
      expect(mockProps.onStop).toHaveBeenCalled();
    });

    it('handles add keyframe button click', () => {
      render(<Timeline {...mockProps} />);
      
      const addKeyframeButton = screen.getByTestId('add-keyframe-button');
      fireEvent.click(addKeyframeButton);
      expect(mockProps.onAddKeyframe).toHaveBeenCalled();
    });

    it('displays current time', () => {
      render(<Timeline {...mockProps} currentTime={2500} />);
      expect(screen.getByTestId('time-display')).toHaveTextContent('2.5s');
    });
  });

  describe('MainWindow', () => {
    it('renders correctly with Redux store', () => {
      const store = configureStore({
        reducer: {
          oscConfig: oscConfigReducer,
          trackState: trackStateReducer
        },
        preloadedState: {
          trackState: {
            currentTrack: {
              id: 'test-track',
              position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
              animation: null
            },
            tracks: []
          },
          oscConfig: {
            host: 'localhost',
            port: 8000,
            timeout_ms: 1000
          }
        }
      });

      render(
        <Provider store={store}>
          <MainWindow />
        </Provider>
      );

      expect(screen.getByTestId('main-window')).toBeInTheDocument();
    });
  });
});
