# Holophonix Animator API Reference

## Core Modules

### State Management (`StateManager`)

#### Overview
The `StateManager` handles the application's state, including tracks, animations, and persistence.

#### Methods
```typescript
class StateManager {
    // Track Management
    add_track(params: TrackParameters): Promise<boolean>
    get_track(id: string): Promise<Track | null>
    update_track_position(id: string, position: Position): Promise<boolean>
    remove_track(id: string): Promise<boolean>

    // State Persistence
    save_state(): Promise<string>  // Returns save file path
    load_state(): Promise<boolean>
    cleanup_old_saves(keep_count: number): Promise<void>
}
```

### Animation Engine (`AnimationEngine`)

#### Overview
The `AnimationEngine` manages animation playback and timeline control.

#### Methods
```typescript
class AnimationEngine {
    // Playback Control
    play(): Promise<boolean>
    pause(): Promise<boolean>
    stop(): Promise<boolean>
    is_playing(): Promise<boolean>
    
    // Timeline Management
    get_current_time(): Promise<number>
    set_current_time(time: number): Promise<boolean>
    
    // Keyframe Management
    set_keyframes(keyframes: Keyframe[]): Promise<boolean>
    get_keyframes(): Promise<Keyframe[]>
    get_position_at_time(time: number): Promise<Position>
}
```

### OSC Communication (`OscManager`)

#### Overview
The `OscManager` handles communication with the Holophonix system via OSC protocol.

#### Methods
```typescript
class OscManager {
    // Connection Management
    connect(config: OscConfig): Promise<boolean>
    disconnect(): Promise<boolean>
    is_connected(): Promise<boolean>
    
    // Message Handling
    send_position(position: Position): Promise<boolean>
    create_position_message(position: Position): Promise<Uint8Array>
}
```

## Data Types

### Position
```typescript
interface Position {
    x: number;  // Range: -1 to 1
    y: number;  // Range: -1 to 1
    z: number;  // Range: -1 to 1
}
```

### Track
```typescript
interface Track {
    id: string;
    position: Position;
    keyframes?: Keyframe[];
}
```

### Keyframe
```typescript
interface Keyframe {
    time: number;      // Milliseconds
    position: Position;
}
```

### OSC Configuration
```typescript
interface OscConfig {
    host: string;
    port: number;
    sendPort: number;
    receivePort: number;
}
```

## Animation Models

### Linear Model
Basic linear interpolation between keyframes.

```typescript
interface LinearModel {
    type: 'linear';
    start_position: Position;
    end_position: Position;
}
```

### Circular Model
Circular movement pattern.

```typescript
interface CircularModel {
    type: 'circular';
    center: Position;
    radius: number;
    speed: number;
}
```

### Pattern Model
Pre-defined movement patterns.

```typescript
interface PatternModel {
    type: 'pattern';
    pattern_type: 'figure8' | 'spiral' | 'random';
    scale: number;
    speed: number;
}
```

## Events

### Connection Events
```typescript
enum ConnectionStatus {
    Connected = 'Connected',
    Connecting = 'Connecting',
    Disconnected = 'Disconnected',
    Error = 'Error'
}
```

### Animation Events
```typescript
interface AnimationEvent {
    type: 'start' | 'pause' | 'stop' | 'complete';
    timestamp: number;
}
```

## Error Handling

### Error Types
```typescript
enum AnimatorError {
    ConnectionFailed = 'ConnectionFailed',
    InvalidPosition = 'InvalidPosition',
    TrackNotFound = 'TrackNotFound',
    StateError = 'StateError'
}
```

## Performance Monitoring

### Performance Metrics
```typescript
interface PerformanceMetrics {
    position_update_latency: number;  // milliseconds
    animation_frame_time: number;     // milliseconds
    memory_usage: number;            // bytes
    osc_latency: number;            // milliseconds
}
```

## Usage Examples

### Basic Track Control
```typescript
const stateManager = new StateManager();
const track = await stateManager.add_track({
    id: 'track1',
    position: { x: 0, y: 0, z: 0 }
});
```

### Animation Setup
```typescript
const animationEngine = new AnimationEngine();
await animationEngine.set_keyframes([
    { time: 0, position: { x: 0, y: 0, z: 0 } },
    { time: 1000, position: { x: 1, y: 1, z: 0 } }
]);
await animationEngine.play();
```

### OSC Communication
```typescript
const oscManager = new OscManager();
await oscManager.connect({
    host: 'localhost',
    port: 4003,
    sendPort: 4003,
    receivePort: 4004
});
```
