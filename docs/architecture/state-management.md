# State Management

## Overview
The Holophonix Animator implements a high-performance state management system with Rust at its core. The system handles real-time animations, OSC communication, and group relationships while React manages the UI state.

## Core State Components

### 1. Connection State
Manages bidirectional OSC communication:
- Remote device configuration
  - IP address and port settings
  - Protocol version
  - Device capabilities
- Connection monitoring
  - Status tracking
  - Latency measurement
  - Error detection
  - Auto-recovery

### 2. Track and Group Management

#### Track Registry
- Unique track identification
- Position state (AED/XYZ)
- Track properties
  - Name and metadata
  - Type information
  - Active state
  - Animation bindings

#### Group System
- Pattern-based group creation
- Relationship management
  - Leader-Follower bindings
  - Isobarycentric relationships
  - Formation patterns
- Group hierarchies
  - Nested groups
  - Inheritance rules
  - Priority resolution
- Center-based animations
  - Group center tracking
  - Relative positioning
  - Formation maintenance

### 3. Animation State

#### Animation Registry
- Model registration
- Instance management
- Resource allocation
- Performance monitoring

#### Animation Models
Supported model types with deterministic behavior:

**Linear Movement**
- Start/end positions
- Duration and timing
- Easing functions
- Group coordination

**Circular Movement**
- Center point tracking
- Radius management
- Angular velocity
- Formation preservation
- Group rotation

**Pattern Movement**
- Pattern definition
- Scaling parameters
- Group synchronization
- Formation rules

**Custom Path**
- Path definition
- Velocity control
- Group path following
- Formation adaptation

#### Parameter Management
- Real-time updates
- Validation rules
- Group parameter inheritance
- State interpolation
- Batch processing

## State Flow

### 1. Connection Management
1. Configuration validation
2. Connection establishment
3. Protocol negotiation
4. State synchronization
5. Error recovery

### 2. Track and Group Operations
1. Track/group creation
2. Relationship establishment
3. State validation
4. Position synchronization
5. Group behavior coordination

### 3. Animation Processing
1. Model instantiation
2. Parameter validation
3. Group coordination
4. State calculation
5. OSC update batching

## Core Responsibilities

### Rust Core
- High-performance state management
- Group relationship processing
- Animation calculations
- OSC communication
- Resource optimization
- Error recovery

### React UI
- User interaction state
- Visual feedback
- Form management
- Error display
- Loading indicators
- Group visualization

## Error Handling
- Connection management
  - Timeout handling
  - Retry strategies
  - Fallback modes
- State validation
  - Parameter bounds
  - Group constraints
  - Animation limits
- Recovery procedures
  - State restoration
  - Group reconciliation
  - Animation reset

## Performance Optimization

### State Updates
- Lock-free operations
- Batch processing
- Memory pooling
- Cache optimization

### Group Operations
- Efficient relationship tracking
- Formation calculations
- Position updates
- State synchronization

### Animation Processing
- Pre-calculation optimization
- Parameter caching
- Group update batching
- Memory efficiency

*Last Updated: 2024-11-25*
