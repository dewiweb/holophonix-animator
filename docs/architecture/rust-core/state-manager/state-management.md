# State Management

## Overview
The Holophonix Animator implements a high-performance state management system with Rust at its core. The system handles real-time animations, OSC communication, and group relationships while React manages the UI state. For details on the UI implementation, see [Frontend Architecture](../../react/frontend-architecture.md).

## State Synchronization
The state synchronization process implements a robust state management system:

### Connection Management
- Initial connection: Progressive backoff (100ms to 5s)
- Health check interval: 1s
- State subscription refresh: 30s
- Batch update interval: 16.7ms (60 FPS)
- Error recovery with exponential backoff

### Health Monitoring
- Connection status tracking
- Message latency monitoring
- Error rate tracking
- Resource usage monitoring
- Performance metrics
- Recovery status tracking
- Subscription health
- Batch processing status

## Core State Components

### 1. Connection State
Manages bidirectional OSC communication:
- Remote device configuration
  - IP address and port settings
  - Protocol version
  - Device capabilities
  - Health check configuration
- Connection monitoring
  - Status tracking
  - Latency measurement
  - Error detection
  - Auto-recovery
  - Health metrics
  - Performance data
  - Resource usage
  - Subscription status

### 2. Track and Group Management

#### Track Registry
- Unique track identification
- Position state (AED/XYZ)
- Track properties
  - Name and metadata
  - Type information
  - Active state
  - Animation bindings
  - Health status
  - Performance metrics
  - Resource usage
  - Subscription data

#### Group System
- Pattern-based group creation
  - Range syntax: [start-end]
  - Set syntax: {track1,track2,...}
  - Template matching
- Relationship management
  - Leader-Follower bindings
  - Isobarycentric relationships
  - Formation patterns
  - Template-based formations
- Group hierarchies
  - Nested groups
  - Inheritance rules
  - Priority resolution
  - Health propagation
- Center-based animations
  - Group center tracking
  - Relative positioning
  - Formation maintenance
  - Template preservation
- Health monitoring
  - Group-wide metrics
  - Member status tracking
  - Formation health
  - Performance data

### 3. State Subscription System
- Parameter subscriptions
  - Individual track parameters
  - Group parameters
  - Formation parameters
  - System parameters
- Subscription management
  - Auto-refresh
  - Priority levels
  - Bandwidth optimization
  - Error recovery
- Health monitoring
  - Subscription status
  - Update frequency
  - Message latency
  - Error rates
- Batch processing
  - Update batching
  - Priority queuing
  - Resource management
  - Performance optimization

### 4. Formation Management
- Template system
  - Predefined formations
  - Custom templates
  - Dynamic scaling
  - Rotation support
- Position calculation
  - Center-based
  - Leader-based
  - Individual offsets
  - Batch updates
- Health monitoring
  - Formation integrity
  - Member positions
  - Update frequency
  - Performance metrics

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
