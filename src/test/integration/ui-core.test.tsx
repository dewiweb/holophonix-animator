import React from 'react';
import { render, fireEvent, act, waitFor, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MainWindow } from '../../react/components/MainWindow';
import { AnimationEngine, OSCManager, ConnectionStatus } from '../../bindings';
import { configureStore } from '@reduxjs/toolkit';
import { oscConfigReducer, trackStateReducer } from '../../react/store/slices';

describe('UI-Core Integration', () => {
    let animationEngine: jest.Mocked<AnimationEngine>;
    let oscManager: jest.Mocked<OSCManager>;
    const store = configureStore({
        reducer: {
            oscConfig: oscConfigReducer,
            trackState: trackStateReducer
        },
        preloadedState: {
            oscConfig: {
                host: 'localhost',
                port: 8000,
                timeout_ms: 1000
            },
            trackState: {
                currentTrack: {
                    id: 'test-track',
                    position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
                    animation: null
                },
                tracks: []
            }
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Create fresh instances of our mocked classes
        animationEngine = new AnimationEngine(oscManager) as jest.Mocked<AnimationEngine>;
        oscManager = new OSCManager({ host: 'localhost', port: 8000, timeout_ms: 1000 }) as jest.Mocked<OSCManager>;
    });

    it('connects to OSC server and updates UI', async () => {
        render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        // Mock successful connection
        (oscManager.connect as jest.Mock).mockResolvedValueOnce(undefined);
        (oscManager.is_connected as jest.Mock).mockReturnValue(true);

        // Click connect button
        const connectButton = screen.getByText(/connect/i);
        fireEvent.click(connectButton);

        // Verify OSC manager was called
        expect(oscManager.connect).toHaveBeenCalled();

        // Wait for connection status to update
        await waitFor(() => {
            const status = screen.getByTestId('connection-status');
            expect(status).toHaveTextContent('Connected');
        });
    });

    it('loads and plays animation', async () => {
        const { getByText, getByTestId } = render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        // Mock animation state
        const mockAnimation = {
            track_id: 'test-track',
            duration: 5000,
            keyframes: [
                {
                    time: 0,
                    position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
                    interpolation: 'linear'
                },
                {
                    time: 5000,
                    position: { x: 1, y: 1, z: 1, rx: 0, ry: 0, rz: 0 },
                    interpolation: 'linear'
                }
            ]
        };

        // Load animation
        await act(async () => {
            await animationEngine.load_animation(mockAnimation);
        });

        // Click play button
        const playButton = screen.getByTestId('play-button');
        fireEvent.click(playButton);

        // Verify animation started
        expect(animationEngine.play).toHaveBeenCalled();

        // Wait for timeline to update
        await waitFor(() => {
            const timeline = getByTestId('timeline');
            expect(timeline).toBeInTheDocument();
        });
    });

    it('updates position through OSC', async () => {
        const { getByTestId } = render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        // Mock position update
        const newPosition = { x: 1, y: 2, z: 3, rx: 0, ry: 0, rz: 0 };
        
        // Update position through UI
        const positionInput = getByTestId('position-input');
        fireEvent.change(positionInput, { target: { value: JSON.stringify(newPosition) } });

        // Verify OSC message was sent
        expect(oscManager.send).toHaveBeenCalledWith({
            address: '/source/test-track/xyz',
            args: [1, 2, 3]
        });
    });
});
