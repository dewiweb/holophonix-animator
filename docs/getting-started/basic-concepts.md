# Basic Concepts

## Core Concepts

### 1. Spatial Audio

Spatial audio is the technique of creating and manipulating sound in three-dimensional space. In Holophonix Animator, this involves:

- **Position**: (x, y, z) coordinates in 3D space
- **Movement**: Dynamic changes in position over time
- **Speaker Layout**: Physical arrangement of speakers

### 2. Tracks

A track represents a single sound source that can be positioned and animated:

- **Properties**: Position, velocity, animation state
- **Controls**: Start, stop, pause animation
- **State**: Current position and movement information

### 3. Animations

Animations define how tracks move through space:

#### Types of Movement
- **Linear**: Straight-line movement between points
- **Circular**: Circular patterns around a center point
- **Bezier**: Smooth curves using control points
- **Custom**: User-defined movement patterns

#### Animation Properties
- **Duration**: Length of the animation
- **Easing**: How movement accelerates/decelerates
- **Loop**: Whether the animation repeats

### 4. Groups

Groups allow multiple tracks to be controlled together:

- **Formation**: Spatial relationship between tracks
- **Synchronization**: Coordinated movement
- **Group Controls**: Apply changes to all members

### 5. OSC Communication

OSC (Open Sound Control) is the protocol used to communicate with the Holophonix system:

- **Messages**: Commands and state updates
- **Real-time Control**: Immediate response to changes
- **Synchronization**: Keeping UI and system in sync

## Visual Overview

```
    [Speaker Layout]          [Movement Types]
    
    S1    S2    S3           Linear: A → B
     ○     ○     ○           
                             Circular: ⟲
    S4     •     S5          
     ○     ↓     ○           Bezier: ⌒
         Sound
    S6    S7    S8           Custom: ⌇
     ○     ○     ○
```

## Next Steps

1. Try the [Quick Start Guide](quick-start.md)
2. Explore [Basic Tutorials](../tutorials/basic-setup.md)
3. Learn about [Advanced Features](../user-guide/advanced-features.md)
