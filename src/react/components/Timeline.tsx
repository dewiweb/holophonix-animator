import React, { useState, useRef, useEffect } from 'react';
import { Button, Slider } from '@blueprintjs/core';
import { Animation, Position } from '../../bindings';
import './Timeline.css';

interface TimelineProps {
    currentTime: number;
    isPlaying: boolean;
    trackId: string;
    onPlayPause: () => void;
    onStop: () => void;
    onLoadAnimation: (animation: Animation) => void;
}

interface Keyframe {
    time: number;
    position: Position;
    interpolation: string;
}

export const Timeline: React.FC<TimelineProps> = ({
    currentTime,
    isPlaying,
    trackId,
    onPlayPause,
    onStop,
    onLoadAnimation,
}) => {
    const [duration, setDuration] = useState(5000); // 5 seconds default
    const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
    const timelineRef = useRef<HTMLDivElement>(null);

    const handleAddKeyframe = (position: Position) => {
        const newKeyframes = [...keyframes, { 
            time: currentTime,
            position,
            interpolation: 'linear'
        }];
        setKeyframes(newKeyframes.sort((a, b) => a.time - b.time));
        
        // Create animation from keyframes
        const animation: Animation = {
            track_id: trackId,
            duration: duration,
            keyframes: newKeyframes.map(kf => ({
                time: kf.time,
                position: kf.position,
                interpolation: kf.interpolation
            }))
        };
        onLoadAnimation(animation);
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (timelineRef.current) {
            const rect = timelineRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const newTime = percentage * duration;
            // Update time through animation engine
        }
    };

    return (
        <div className="timeline" data-testid="timeline-container">
            <div className="timeline-controls" data-testid="timeline-controls">
                <Button
                    icon={isPlaying ? "pause" : "play"}
                    data-testid="play-button"
                    onClick={onPlayPause}
                    minimal={true}
                />
                <Button
                    icon="stop"
                    data-testid="stop-button"
                    onClick={onStop}
                    minimal={true}
                />
                <span data-testid="time-display">
                    {(currentTime / 1000).toFixed(1)}s
                </span>
                <Button
                    icon="add"
                    data-testid="add-keyframe-button"
                    onClick={() => handleAddKeyframe({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 })}
                >
                    Add Keyframe
                </Button>
            </div>
            <div 
                className="timeline-track" 
                ref={timelineRef}
                onClick={handleTimelineClick}
                data-testid="timeline-track"
            >
                <div 
                    className="timeline-progress"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                    data-testid="timeline-progress"
                />
                {keyframes.map((kf, index) => (
                    <div
                        key={index}
                        className="keyframe-marker"
                        style={{ left: `${(kf.time / duration) * 100}%` }}
                        data-testid="keyframe-marker"
                    />
                ))}
            </div>
            <Slider
                min={0}
                max={duration}
                value={currentTime}
                labelStepSize={1000}
                onChange={(value) => {
                    const newKeyframes = [...keyframes];
                    const animation: Animation = {
                        track_id: trackId,
                        duration,
                        keyframes: newKeyframes
                    };
                    onLoadAnimation(animation);
                }}
                data-testid="timeline-slider"
            />
        </div>
    );
};
