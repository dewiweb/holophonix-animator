import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { Track } from '../types/tracks';
import { createXYZPosition, isXYZPosition, convertAEDtoXYZ, HolophonixPosition } from '../types/position';

interface SceneProps {
  selectedTrack: Track | null;
  previewPosition: HolophonixPosition | null;
}

export const Scene: React.FC<SceneProps> = ({ selectedTrack, previewPosition }) => {
  const tracks = useRef<Track[]>([{
    id: 'track-1',
    name: 'Default Track',
    position: createXYZPosition(0, 0, 0),
    aedPosition: createAEDPosition(0, 0, 1),
    behaviors: [],
    active: true
  }]);

  useFrame(() => {
    // Update track positions from behaviors
  });

  // Update sphere position
  useEffect(() => {
    if (!tracks.current) return;

    let position: HolophonixPosition;
    if (previewPosition) {
      position = previewPosition;
    } else if (selectedTrack?.behaviors[0]) {
      position = selectedTrack.behaviors[0].getPosition();
    } else {
      position = createXYZPosition(0, 0, 0);
    }

    // Convert to XYZ if needed
    const xyzPos = isXYZPosition(position) ? position : convertAEDtoXYZ(position);
    
    tracks.current.forEach((track) => {
      track.position = xyzPos;
    });
  }, [selectedTrack, previewPosition]);

  return (
    <>
      {/* Grid for reference */}
      <Grid
        args={[10, 10]}
        cellSize={1}
        cellThickness={1}
        cellColor="#6f6f6f"
        sectionSize={3}
        sectionThickness={1.5}
        sectionColor="#9d4b4b"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* Origin marker */}
      <Box args={[0.1, 0.1, 0.1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="red" />
      </Box>

      {/* Tracks */}
      {tracks.current.map((track) => {
        const pos = track.position;
        return (
          <Sphere
            key={track.id}
            args={[0.2]}
            position={[pos.x, pos.y, pos.z]}
          >
            <meshStandardMaterial 
              color={track.id === selectedTrack?.id ? 'yellow' : 'blue'}
              opacity={track.active ? 1 : 0.5}
              transparent
            />
          </Sphere>
        );
      })}
    </>
  );
};
