import React from 'react';
import { Card, Slider, H4 } from '@blueprintjs/core';
import { Position } from '../../bindings';
import './TrackControl.css';

interface Track {
    id: string;
    position: Position;
}

interface TrackControlProps {
    track?: Track;
    onPositionChange: (position: Position) => void;
}

export const TrackControl: React.FC<TrackControlProps> = ({
    track,
    onPositionChange,
}) => {
    const handleAxisChange = (axis: keyof Position, value: number) => {
        if (!track) return;
        
        onPositionChange({
            ...track.position,
            [axis]: Math.max(-1, Math.min(1, value)), // Clamp between -1 and 1
        });
    };

    if (!track) {
        return (
            <Card className="track-control" data-testid="track-control-empty">
                <H4>No Track Selected</H4>
                <p>Select a track to control its position</p>
            </Card>
        );
    }

    return (
        <Card className="track-control" data-testid="track-control">
            <div className="track-control-content">
                <H4>Track {track.id}</H4>
                <div className="track-control-sliders">
                    <div className="slider-group">
                        <label>X: {track.position.x.toFixed(2)}</label>
                        <Slider
                            data-testid="x-position-input"
                            min={-1}
                            max={1}
                            stepSize={0.01}
                            labelStepSize={0.5}
                            value={track.position.x}
                            onChange={(value) => handleAxisChange('x', value)}
                        />
                    </div>

                    <div className="slider-group">
                        <label>Y: {track.position.y.toFixed(2)}</label>
                        <Slider
                            data-testid="y-position-input"
                            min={-1}
                            max={1}
                            stepSize={0.01}
                            labelStepSize={0.5}
                            value={track.position.y}
                            onChange={(value) => handleAxisChange('y', value)}
                        />
                    </div>

                    <div className="slider-group">
                        <label>Z: {track.position.z.toFixed(2)}</label>
                        <Slider
                            data-testid="z-position-input"
                            min={-1}
                            max={1}
                            stepSize={0.01}
                            labelStepSize={0.5}
                            value={track.position.z}
                            onChange={(value) => handleAxisChange('z', value)}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
};
