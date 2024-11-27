# Rust Core Architecture

## Overview

The Rust core is the heart of the Holophonix Animator, responsible for high-performance computations, OSC communication, and state management.

## Core Components

### 1. Node.js Bridge

The Node.js Bridge provides seamless integration between the Rust core and Electron's main process, enabling high-performance native functionality while maintaining the benefits of the Node.js ecosystem.

#### Architecture
- N-API/Node-API implementation for stable ABI compatibility
- Zero-copy buffer sharing for performance
- Asynchronous operation support
- Error handling and type conversion
- Memory management and cleanup
- Event system integration
- State synchronization

#### Key Features
- Bidirectional communication
- Native threading support
- Efficient data serialization
- Resource management
- Error propagation
- Performance monitoring
- Type safety guarantees

For detailed information about the Node.js integration, see the [Node Integration Guide](../rust-core/node-bridge/node-integration.md).

### 2. OSC Communication Layer

The OSC Communication Layer handles all OSC-based interactions, including communication with Holophonix devices and external control applications.

#### OSC Server
Components and responsibilities:
- UDP socket management for incoming messages
- Message validation and parsing
- Concurrent connection handling
- Error recovery and logging
- Control app message handling
- State updates from incoming messages
- Error handling and recovery

#### OSC Client
The OSC client manages outgoing messages to Holophonix devices as part of the bidirectional communication system.

Key features:
- UDP socket management
- Message retry mechanism
- Queue management for outgoing messages
- Batch processing capabilities
- Error handling and recovery
- Parameter query handling
- Message bundling for efficient transmission

#### Protocol Handler
Manages message formats and validation for both Holophonix and external control applications.

Components:
- Message parser
- Type checker
- Value validator
- Address mapper
- Argument builder
- Control app protocol handler

Key features:
- Message format validation
- Type checking and conversion
- Value range validation
- Address pattern matching
- Command validation for control apps
- Error reporting and handling

### 3. Animation Engine

The Animation Engine provides high-performance, deterministic animation calculations for spatial audio positioning.

#### Animation Manager
Core responsibilities:
- Animation lifecycle management
- Model registration and instantiation
- Group and relationship coordination
- Animation scheduling
- Resource management
- Performance optimization
- Error handling and recovery

#### Group System
Components:
- Group Manager
  - Pattern-based group creation (`[start-end]`, `{track1,track2,...}`)
  - Relationship type management
  - Center-based animations
  - Position synchronization
- Relationship Manager
  - Leader-Follower implementation
  - Isobarycentric relationships
  - As Individuals mode
  - Formation maintenance

#### Animation Models
Provides a modular system for different animation behaviors:
- Base Model Interface
  - Behavior control
  - State management
  - Parameter handling
  - Group support
- Common Components
  - State tracking
  - Interpolation
  - Parameter validation
  - Coordinate system handling
- Model Types
  - Linear Movement
  - Circular Movement
  - Pattern Movement
  - Custom Path Movement

#### Interpolation System
Handles smooth transitions for all position changes:
- Start-up interpolation
  - Absolute mode transition
  - Relative mode handling
- Stop behavior
  - Clean interruption
  - Return to initial position
- Movement control
  - Speed/duration
  - Update frequency
  - Smoothing functions

#### Animation Cycle Manager
Controls animation execution modes:
- Cyclic Mode
  - Continuous repetition
  - Seamless transitions
  - Loop tracking
- One-shot Mode
  - Single execution
  - Auto-completion
  - Return behavior

### 4. State Management

#### Central State Store
Manages:
- Track states and properties
- Animation configurations
- Timeline state
- System configuration
- Runtime parameters
- Group relationships
- Formation states

#### State Synchronization
Features:
- Real-time state updates
- Conflict resolution
- State persistence
- Recovery mechanisms
- Change notification system
- Group state coordination
- Formation preservation

### 5. Computation Engine

Handles mathematical calculations and optimizations:

#### Vector Operations
- Position calculations
- Velocity computations
- Acceleration handling
- Formation geometry
- Center point tracking

#### Optimization Features
- SIMD operations
- Cache optimization
- Memory pooling
- Batch processing
- Lock-free algorithms

#### Group Calculations
- Center point computation
- Formation maintenance
- Position propagation
- Relationship preservation
- Synchronized updates

## Performance Considerations

### 1. Computation Efficiency
- Optimized animation calculations
- Efficient state synchronization
- Minimal memory allocation
- Cache-friendly data structures
- Batch processing support
- Formation calculations
- Group synchronization

### 2. Memory Management
- Resource pooling
- Smart pointer usage
- Efficient state updates
- Minimal cloning
- Memory mapping for large datasets
- Formation state caching
- Group state optimization

### 3. Concurrency
- Lock-free algorithms where possible
- Efficient thread synchronization
- Work stealing scheduler
- Async I/O operations
- Thread pool management
- Group update batching
- Formation update coordination

### 4. Error Handling
- Comprehensive error types
- Recovery strategies
- Graceful degradation
- Error propagation
- Logging and monitoring
- Group state recovery
- Formation restoration

*Last Updated: 2024-11-25*
