# Animation System Implementation

## Overview
The animation system manages real-time animations for Holophonix sources through OSC protocol. It provides a workflow for creating, configuring, and controlling animations for individual tracks or groups of tracks.

## Core Workflow

### 1. Connection Setup
- User configures connection parameters:
  - Remote IP (Holophonix device)
  - Remote Port
  - Local IP
- System establishes and maintains OSC connection

### 2. Track Management
- Users can:
  - Add individual tracks
  - Create track groups
  - Select tracks/groups for animation
- Track Configuration:
  ```typescript
  interface Track {
    id: string;
    name: string;
    type: 'single' | 'group';
    position: Position;  // Current position
    children?: string[]; // For groups: child track IDs
  }
  ```

### 3. Animation Models
The system supports several animation models that can be applied to tracks or groups:

#### Available Models
- **Linear Movement**
  - Direct point-to-point movement
  - Parameters:
    - Start position
    - End position
    - Duration
    - Loop behavior

- **Circular Movement**
  - Orbital movement around a center
  - Parameters:
    - Center point
    - Radius
    - Speed
    - Direction (clockwise/counterclockwise)

- **Random Movement**
  - Controlled random movement
  - Parameters:
    - Boundary limits
    - Speed range
    - Update interval

- **Custom Path**
  - User-defined movement paths
  - Parameters:
    - Path points
    - Speed
    - Loop behavior

### 4. Animation Application
1. Select track/group from tracklist
2. Choose animation model from selector
3. Add to applied animations list
4. Configure animation parameters
5. Real-time parameter adjustment

## Coordinate Systems
The animation system uses two coordinate systems:

### Cartesian (XYZ)
- X: -1.0 to +1.0 (left to right)
- Y: -1.0 to +1.0 (back to front)
- Z: -1.0 to +1.0 (down to up)

### Polar (AED)
- Azimuth: 0° to 360°
- Elevation: -90° to 90°
- Distance: 0.0 to 1.0

## Technical Implementation

### State Management
```rust
pub struct AnimationState {
    // Track and Group Management
    tracks: HashMap<TrackId, Track>,
    groups: HashMap<GroupId, TrackGroup>,
    
    // Animation Management
    active_animations: HashMap<TrackId, Vec<Animation>>,
    animation_parameters: HashMap<AnimationId, AnimationParams>,
    
    // Connection State
    connection: ConnectionState,
}

pub struct Animation {
    id: AnimationId,
    model_type: AnimationModel,
    target: TrackId,  // Single track or group
    parameters: AnimationParams,
    state: AnimationState,
}
```

### Real-time Parameter Updates
- All animation parameters can be adjusted in real-time
- Changes are immediately reflected in the animation
- Updates are sent via OSC to the Holophonix device

### OSC Communication
- Regular position updates for each animated track
- Parameter change messages
- Connection status monitoring

## Error Handling
- Connection failure recovery
- Invalid parameter validation
- Animation state consistency checks

## Performance Considerations
- Efficient batch updates for groups
- Optimized parameter interpolation
- Minimal OSC message overhead
