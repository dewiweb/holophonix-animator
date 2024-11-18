import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { Track } from '../types/tracks';
import { createXYZPosition, createAEDPosition, getXYZValues } from '../types/position';

interface SceneProps {
  selectedTrack: Track | null;
}

export const Scene: React.FC<SceneProps> = ({ selectedTrack }) => {
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
        const pos = getXYZValues(track.position);
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
