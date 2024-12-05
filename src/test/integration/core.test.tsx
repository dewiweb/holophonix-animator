import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MainWindow } from '../../react/components/MainWindow';
import { trackStateReducer } from '../../react/store/trackStateSlice';
import { oscConfigReducer } from '../../react/store/oscConfigSlice';
import { uiReducer } from '../../react/store/uiSlice';
import { AnimationEngine, OSCManager } from '../../bindings';

// Mock the native modules
jest.mock('../../bindings');

describe('Core Integration', () => {
    let store;
    let mockAnimationEngine: jest.Mocked<AnimationEngine>;
    let mockOSCManager: jest.Mocked<OSCManager>;

    beforeEach(() => {
        store = configureStore({
            reducer: {
                trackState: trackStateReducer,
                oscConfig: oscConfigReducer,
                ui: uiReducer
            }
        });

        // Reset mocks before each test
        jest.clearAllMocks();
    });

    it('connects to OSC server successfully', async () => {
        const { getByTestId } = render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        const connectButton = getByTestId('connect-button');
        await act(async () => {
            fireEvent.click(connectButton);
        });

        expect(OSCManager.prototype.connect).toHaveBeenCalledWith('localhost', 8000);
        expect(store.getState().oscConfig.status).toBe('Connected');
    });

    it('updates position through track controls', async () => {
        const { getByTestId } = render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        const xSlider = getByTestId('x-slider');
        await act(async () => {
            fireEvent.change(xSlider, { target: { value: '0.5' } });
        });

        expect(AnimationEngine.prototype.update).toHaveBeenCalled();
        expect(store.getState().trackState.currentPosition.x).toBeCloseTo(0.5);
    });

    it('plays animation correctly', async () => {
        const { getByTestId } = render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        const playButton = getByTestId('play-button');
        await act(async () => {
            fireEvent.click(playButton);
        });

        expect(AnimationEngine.prototype.play).toHaveBeenCalled();
        expect(store.getState().trackState.isPlaying).toBe(true);
    });

    it('adds and manages keyframes', async () => {
        const { getByTestId } = render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        // Set position
        const xSlider = getByTestId('x-slider');
        await act(async () => {
            fireEvent.change(xSlider, { target: { value: '0.5' } });
        });

        // Add keyframe
        const addKeyframeButton = getByTestId('add-keyframe-button');
        await act(async () => {
            fireEvent.click(addKeyframeButton);
        });

        expect(AnimationEngine.prototype.update).toHaveBeenCalled();
        const state = store.getState();
        expect(state.trackState.keyframes).toHaveLength(1);
        expect(state.trackState.keyframes[0].position.x).toBeCloseTo(0.5);
    });

    it('handles connection errors gracefully', async () => {
        // Mock connection error
        (OSCManager.prototype.connect as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

        const { getByTestId } = render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        const connectButton = getByTestId('connect-button');
        await act(async () => {
            fireEvent.click(connectButton);
        });

        expect(store.getState().oscConfig.status).toBe('Error');
        expect(getByTestId('error-notification')).toBeInTheDocument();
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

        const { getByTestId } = render(
            <Provider store={store}>
                <MainWindow />
            </Provider>
        );

        await act(async () => {
            // Trigger state load (this would typically happen on component mount)
            store.dispatch({ type: 'trackState/loadState' });
        });

        const state = store.getState();
        expect(state.trackState.currentPosition).toEqual(mockState.currentPosition);
        expect(state.trackState.currentTime).toBe(mockState.currentTime);
        expect(state.trackState.keyframes).toEqual(mockState.keyframes);
    });
});
