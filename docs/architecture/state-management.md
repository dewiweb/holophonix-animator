# State Management

## Overview
The Holophonix Animator uses a centralized state management system with Rust at its core, handling real-time animations and OSC communication while React manages the UI state.

## Core State Components

### 1. Connection State
```rust
pub struct ConnectionState {
    remote_ip: String,
    remote_port: u16,
    local_ip: String,
    status: ConnectionStatus,
    last_error: Option<String>,
}
```

### 2. Track Management
```rust
pub struct TrackState {
    tracks: HashMap<TrackId, Track>,
    groups: HashMap<GroupId, TrackGroup>,
    selected: Option<SelectionId>,  // Track or group ID
}

pub struct Track {
    id: TrackId,
    name: String,
    position: Position,
    animations: Vec<AnimationId>,
}

pub struct TrackGroup {
    id: GroupId,
    name: String,
    members: Vec<TrackId>,
    animations: Vec<AnimationId>,
}
```

### 3. Animation State
```rust
pub struct AnimationState {
    models: HashMap<ModelId, AnimationModel>,
    active_animations: HashMap<AnimationId, ActiveAnimation>,
    parameters: HashMap<AnimationId, ModelParameters>,
}

pub struct ActiveAnimation {
    id: AnimationId,
    model_id: ModelId,
    target_id: SelectionId,  // ID of the selected track or group
    state: RunningState,
}

pub enum SelectionId {
    Track(TrackId),
    Group(GroupId),
}

pub enum AnimationModel {
    Linear(LinearMovement),
    Circular(CircularMovement),
    Random(RandomMovement),
    Custom(CustomPath),
}

pub enum ModelParameters {
    Linear(LinearParams),
    Circular(CircularParams),
    Random(RandomParams),
    Custom(CustomParams),
}

pub struct LinearParams {
    start_position: Position,
    end_position: Position,
    duration: Duration,
}

pub struct CircularParams {
    center: Position,
    radius: f64,
    speed: f64,
    direction: RotationDirection,
}

pub struct RandomParams {
    bounds: BoundingBox,
    speed_range: Range<f64>,
    update_interval: Duration,
}

pub struct CustomParams {
    points: Vec<Position>,
    speed: f64,
    loop_behavior: LoopMode,
}
```

## State Flow

### 1. Connection Flow
1. User inputs connection parameters
2. System attempts connection
3. Connection state updated
4. UI reflects connection status

### 2. Track Management Flow
1. User adds track/group via form
2. Core validates and stores track
3. UI updates track list
4. Selection state managed

### 3. Animation Flow
1. User selects track/group from tracklist
2. Chooses animation model from selector
3. Animation is applied to selected track or group
4. Model-specific parameters are configurable in real-time:
   - Linear Movement: start position, end position, duration
   - Circular Movement: center point, radius, speed, direction
   - Random Movement: boundary limits, speed range, update interval
   - Custom Path: path points, speed, loop behavior
5. Real-time updates via OSC

## Implementation

### Core State (Rust)
```rust
pub struct CoreState {
    connection: ConnectionState,
    tracks: TrackState,
    animations: AnimationState,
    
    // Performance monitoring
    metrics: PerformanceMetrics,
}

impl CoreState {
    pub fn update_animation_parameter(&mut self, animation_id: AnimationId, param: ParamUpdate) -> Result<(), StateError> {
        // Update parameter
        // Recalculate animation
        // Send OSC update
    }
    
    pub fn add_animation(&mut self, target: SelectionId, model: AnimationModel) -> Result<AnimationId, StateError> {
        // Create new animation
        // Initialize parameters
        // Start if needed
    }
}
```

### UI State (TypeScript)
```typescript
interface UIState {
    // Connection UI
    connectionForm: {
        remoteIp: string;
        remotePort: number;
        localIp: string;
    };
    
    // Track Management
    trackForm: {
        name: string;
        type: 'single' | 'group';
    };
    
    // Animation UI
    selectedTrack: string | null;
    selectedAnimation: string | null;
    parameterEditors: Record<string, ParamEditor>;
    
    // Status
    errors: ErrorState[];
    loading: boolean;
}
```

## Error Handling
- Connection failures
- Invalid track configurations
- Animation parameter validation
- OSC communication errors

## Performance Optimization
- Batch OSC updates
- Efficient parameter updates
- Minimal state copying
- Lock-free operations where possible
