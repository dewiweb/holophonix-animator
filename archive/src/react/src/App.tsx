import React, { useState } from 'react';
import { TrackList } from './components/TrackList';
import { AnimationTimeline } from './components/AnimationTimeline';
import { Animation, Position } from './types';
import './App.css';

const sampleAnimation: Animation = {
  id: 'anim1',
  type: 'linear',
  name: 'Linear Move 1',
  isPlaying: false,
  duration: 5000,
  currentTime: 2500,
  parameters: {
    startPosition: { x: 0, y: 0, z: 0 },
    endPosition: { x: 1, y: 1, z: 1 }
  },
  keyframes: [
    { id: 'kf1', time: 0, type: 'position', value: { x: 0, y: 0, z: 0 } },
    { id: 'kf2', time: 2500, type: 'position', value: { x: 0.5, y: 0.5, z: 0.5 } },
    { id: 'kf3', time: 5000, type: 'position', value: { x: 1, y: 1, z: 1 } }
  ],
  loopRegion: {
    start: 1000,
    end: 4000
  }
};

const sampleCustomMarkers = [
  { time: 1000, label: 'Start Effect', color: '#ff0000' },
  { time: 3000, label: 'Peak', color: '#00ff00' },
  { time: 4000, label: 'End Effect', color: '#0000ff' }
];

function App() {
  const [animation, setAnimation] = useState(sampleAnimation);
  const [customMarkers, setCustomMarkers] = useState(sampleCustomMarkers);

  const handleTimeChange = (time: number) => {
    setAnimation(prev => ({ ...prev, currentTime: time }));
  };

  const handlePlayPause = (isPlaying: boolean) => {
    setAnimation(prev => ({ ...prev, isPlaying }));
  };

  const handleKeyframeChange = (id: string, time: number) => {
    setAnimation(prev => ({
      ...prev,
      keyframes: prev.keyframes.map(kf => 
        kf.id === id ? { ...kf, time } : kf
      )
    }));
  };

  const handleMarkerChange = (index: number, time: number) => {
    setCustomMarkers(prev => 
      prev.map((marker, i) => 
        i === index ? { ...marker, time } : marker
      )
    );
  };

  return (
    <div className="App">
      <div className="timeline-container">
        <AnimationTimeline 
          animation={animation}
          customMarkers={customMarkers}
          onTimeChange={handleTimeChange}
          onPlayPause={handlePlayPause}
          onKeyframeChange={handleKeyframeChange}
          onMarkerChange={handleMarkerChange}
          snapToKeyframes={true}
        />
      </div>
      <div className="track-list-container">
        <TrackList tracks={[]} groups={[]} />
      </div>
    </div>
  );
}

export default App;
