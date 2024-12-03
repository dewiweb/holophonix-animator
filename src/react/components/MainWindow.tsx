import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConnectionPanel } from './ConnectionPanel';
import { TrackControl } from './TrackControl';
import { Timeline } from './Timeline';
import { PositionVisualizer } from './PositionVisualizer';
import { ErrorNotification } from './ErrorNotification';
import { Position, AnimationEngine, OSCManager, ConnectionStatus, Animation } from '../../bindings';
import { RootState } from '../store';
import { updatePosition, setAnimation } from '../store/slices/trackStateSlice';
import '../styles/components.css';

const oscManager = new OSCManager({ host: 'localhost', port: 8000, timeout_ms: 1000 });
const engine = new AnimationEngine(oscManager);

export const MainWindow: React.FC = () => {
    const dispatch = useDispatch();
    const oscConfig = useSelector((state: RootState) => state.oscConfig);
    const trackState = useSelector((state: RootState) => state.trackState);
    
    const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.Disconnected);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    // Initialize OSC connection
    useEffect(() => {
        oscManager.update_config(oscConfig).catch(err => {
            setError(`Failed to update OSC config: ${err.message}`);
        });
    }, [oscConfig]);

    // Handle animation updates
    useEffect(() => {
        let animationFrame: number;
        
        const updateAnimation = async () => {
            if (isPlaying && trackState.currentTrack?.animation) {
                try {
                    await engine.update();
                    const state = await engine.get_state();
                    if (state?.current_animation) {
                        setCurrentTime(state.timeline.current_time);
                        const position = state.timeline.current_position;
                        if (position) {
                            dispatch(updatePosition(position));
                            try {
                                await oscManager.send({
                                    address: `/source/${trackState.currentTrack.id}/xyz`,
                                    args: [position.x, position.y, position.z]
                                });
                            } catch (err) {
                                setError(`Failed to send position: ${err instanceof Error ? err.message : String(err)}`);
                            }
                        }
                    }
                } catch (err) {
                    setError(`Animation error: ${err instanceof Error ? err.message : String(err)}`);
                    setIsPlaying(false);
                }
            }
            animationFrame = requestAnimationFrame(updateAnimation);
        };

        if (isPlaying) {
            animationFrame = requestAnimationFrame(updateAnimation);
        }

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [isPlaying, trackState.currentTrack, dispatch]);

    const handleConnect = async () => {
        try {
            setStatus(ConnectionStatus.Connecting);
            await oscManager.connect();
            setStatus(ConnectionStatus.Connected);
            setError(null);
        } catch (err) {
            setError(`Connection failed: ${err.message}`);
            setStatus(ConnectionStatus.Error);
        }
    };

    const handleDisconnect = async () => {
        try {
            await oscManager.disconnect();
            setStatus(ConnectionStatus.Disconnected);
            setError(null);
        } catch (err) {
            setError(`Disconnect failed: ${err.message}`);
        }
    };

    const handlePositionChange = async (newPosition: Position) => {
        try {
            if (trackState.currentTrack) {
                dispatch(updatePosition(newPosition));
                await oscManager.send({
                    address: `/source/${trackState.currentTrack.id}/xyz`,
                    args: [newPosition.x, newPosition.y, newPosition.z]
                });
            }
        } catch (err) {
            setError(`Failed to update position: ${err.message}`);
        }
    };

    const handlePlayPause = async () => {
        try {
            if (isPlaying) {
                await engine.pause();
            } else if (trackState.currentTrack?.animation) {
                await engine.play(trackState.currentTrack.animation);
            }
            setIsPlaying(!isPlaying);
            setError(null);
        } catch (err) {
            setError(`Failed to ${isPlaying ? 'pause' : 'play'} animation: ${err.message}`);
        }
    };

    const handleStop = async () => {
        try {
            setIsPlaying(false);
            await engine.pause();
            setCurrentTime(0);
            const state = await engine.get_state();
            if (state?.current_animation?.initial_position) {
                dispatch(updatePosition(state.current_animation.initial_position));
            }
        } catch (err) {
            setError(`Failed to stop animation: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    const handleLoadAnimation = async (animation: Animation) => {
        try {
            if (trackState.currentTrack) {
                dispatch(setAnimation({ 
                    trackId: trackState.currentTrack.id, 
                    animation 
                }));
                await engine.load_animation(animation);
                setError(null);
            }
        } catch (err) {
            setError(`Failed to load animation: ${err.message}`);
        }
    };

    return (
        <div className="main-window">
            <div data-testid="connection-panel" className="connection-panel bp5-card bp5-elevation-0">
                <ConnectionPanel 
                    status={status}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                />
            </div>
            {error && <ErrorNotification message={error} onDismiss={() => setError(null)} />}
            <div className="content">
                <div data-testid="track-control" className="track-control bp5-card bp5-elevation-0">
                    <TrackControl
                        track={trackState.currentTrack}
                        onPositionChange={handlePositionChange}
                    />
                </div>
                <div data-testid="timeline" className="timeline">
                    <Timeline
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        onPlayPause={handlePlayPause}
                        onStop={handleStop}
                        onLoadAnimation={handleLoadAnimation}
                    />
                </div>
                <div data-testid="position-visualizer" className="position-visualizer">
                    <PositionVisualizer position={trackState.currentTrack?.position} />
                </div>
            </div>
        </div>
    );
};
