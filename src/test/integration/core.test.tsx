import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MainWindow from '../../react/components/MainWindow';
import { rootReducer } from '../../react/store/reducers';
import { AnimationEngine, OSCManager } from '../../bindings';

// Mock the native modules
jest.mock('../../bindings');

describe('Core Integration', () => {
    let store: any;
    let mockAnimationEngine: jest.Mocked<AnimationEngine>;
    let mockOSCManager: jest.Mocked<OSCManager>;

    beforeEach(() => {
        store = configureStore({
            reducer: rootReducer,
            preloadedState: {
                animation: {
                    currentPosition: { x: 0, y: 0, z: 0 },
                    isPlaying: false,
                    currentTime: 0
                },
                connection: {
                    status: 'Disconnected',
                    config: {
                        host: 'localhost',
                        port: 8000
                    }
                }
            }
        });

        // Reset mocks before each test
        jest.clearAllMocks();
    });

    it('connects to OSC server successfully', async () => {
        render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        const connectButton = screen.getByTestId('connect-button');
        await act(async () => {
            fireEvent.click(connectButton);
        });

        expect(OSCManager.prototype.connect).toHaveBeenCalledWith('localhost', 8000);
        expect(store.getState().connection.status).toBe('Connected');
    });

    it('updates position through track controls', async () => {
        render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        const xSlider = screen.getByTestId('x-slider');
        await act(async () => {
            fireEvent.change(xSlider, { target: { value: '0.5' } });
        });

        expect(AnimationEngine.prototype.update).toHaveBeenCalled();
        expect(store.getState().animation.currentPosition.x).toBeCloseTo(0.5);
    });

    it('plays animation correctly', async () => {
        render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        const playButton = screen.getByTestId('play-button');
        await act(async () => {
            fireEvent.click(playButton);
        });

        expect(AnimationEngine.prototype.play).toHaveBeenCalled();
        expect(store.getState().animation.isPlaying).toBe(true);
    });

    it('adds and manages keyframes', async () => {
        render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        // Set position
        const xSlider = screen.getByTestId('x-slider');
        await act(async () => {
            fireEvent.change(xSlider, { target: { value: '0.5' } });
        });

        // Add keyframe
        const addKeyframeButton = screen.getByTestId('add-keyframe-button');
        await act(async () => {
            fireEvent.click(addKeyframeButton);
        });

        expect(AnimationEngine.prototype.update).toHaveBeenCalled();
        const state = store.getState();
        expect(state.animation.keyframes).toHaveLength(1);
        expect(state.animation.keyframes[0].position.x).toBeCloseTo(0.5);
    });

    it('handles connection errors gracefully', async () => {
        // Mock connection error
        (OSCManager.prototype.connect as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

        render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        const connectButton = screen.getByTestId('connect-button');
        await act(async () => {
            fireEvent.click(connectButton);
        });

        expect(store.getState().connection.status).toBe('Error');
        expect(screen.getByTestId('error-notification')).toBeInTheDocument();
    });

    it('persists and loads animation state', async () => {
        const mockState = {
            currentPosition: { x: 0.5, y: 0.5, z: 0 },
            isPlaying: false,
            currentTime: 2,
            keyframes: [
                { time: 0, position: { x: 0, y: 0, z: 0 } },
                { time: 5, position: { x: 1, y: 1, z: 0 } }
            ]
        };

        (AnimationEngine.prototype.get_state as jest.Mock).mockResolvedValueOnce(mockState);

        render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        await act(async () => {
            // Trigger state load (this would typically happen on component mount)
            store.dispatch({ type: 'animation/loadState' });
        });

        const state = store.getState();
        expect(state.animation.currentPosition).toEqual(mockState.currentPosition);
        expect(state.animation.currentTime).toBe(mockState.currentTime);
        expect(state.animation.keyframes).toEqual(mockState.keyframes);
    });
});
