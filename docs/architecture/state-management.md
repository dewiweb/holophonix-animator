# State Management

## Overview

The Holophonix Animator uses a hybrid state management system with Rust at its core, handling all performance-critical state while React manages UI-specific state.

## State Architecture

### 1. Core State (Rust)
- Track positions and parameters
- Animation states and timelines
- Motion model computations
- OSC message handling
- Performance-critical operations

### 2. UI State (React)
- View configurations
- Selected elements
- User preferences
- Temporary UI states
- Visual feedback states

### 3. Bridge State (Native Module)
- State synchronization
- Event queuing
- Error handling
- Performance monitoring

## State Flow

### 1. Core State Updates (Rust)
- Computed in Rust core
- Type-safe operations
- Zero-copy where possible
- Lock-free concurrency
- Direct OSC handling

### 2. State Persistence
- Critical states saved to disk
- Crash recovery handling
- State versioning
- Automatic backups
- Safe file operations

### 3. State Propagation
- Rust → Native Module → Electron → React
- Efficient serialization
- Minimal copying
- Type safety across boundaries
- Performance optimization

## Implementation

### Core State (Rust)
```rust
pub struct CoreState {
    // Track Management
    tracks: HashMap<TrackId, Track>,
    active_tracks: HashSet<TrackId>,
    
    // Animation State
    animations: HashMap<AnimationId, Animation>,
    timeline: Timeline,
    playback_state: PlaybackState,
    
    // OSC State
    osc_connections: OscConnections,
    message_queue: MessageQueue,
    
    // Performance Monitoring
    metrics: PerformanceMetrics,
}

// Type-safe state updates
impl CoreState {
    pub fn update_track_position(&mut self, id: TrackId, position: Position) -> Result<(), StateError> {
        // Validate and update track position
    }
    
    pub fn update_animation_state(&mut self, id: AnimationId, state: AnimationState) -> Result<(), StateError> {
        // Update animation state
    }
}
```

### UI State (TypeScript)
```typescript
interface UIState {
  // View State
  selectedTrack: TrackId | null;
  viewMode: ViewMode;
  zoomLevel: number;
  
  // User Preferences
  theme: Theme;
  language: Language;
  
  // Temporary States
  isDragging: boolean;
  isEditing: boolean;
  
  // Error States
  errors: ErrorState[];
}
```

### Native Bridge
```typescript
interface NativeBridge {
  // State Sync
  syncState(): Promise<void>;
  
  // Core Operations
  updateTrack(id: TrackId, update: TrackUpdate): Promise<void>;
  updateAnimation(id: AnimationId, update: AnimationUpdate): Promise<void>;
  
  // Event Handling
  onStateChange(callback: (state: CoreState) => void): void;
  onError(callback: (error: StateError) => void): void;
}
```

## Performance Considerations

### 1. State Updates
- Computed in Rust for performance
- Minimal data copying
- Efficient memory usage
- Lock-free operations

### 2. State Synchronization
- Batched updates
- Efficient serialization
- Minimal IPC overhead
- Type-safe transfers

### 3. Memory Management
- Zero-copy operations
- Smart pointer usage
- Automatic cleanup
- Resource pooling

## Error Handling

### 1. State Errors
- Type-safe error handling
- Error propagation
- Automatic recovery
- State validation

### 2. Sync Errors
- Connection recovery
- State reconciliation
- Error reporting
- Fallback states

### 3. UI Errors
- Error boundaries
- User feedback
- State recovery
- Graceful degradation
