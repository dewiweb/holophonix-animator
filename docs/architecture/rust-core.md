# Rust Core Architecture

## Overview

The Rust core is the heart of the Holophonix Animator, responsible for high-performance computations, OSC communication, and state management.

## Core Components

### 1. OSC Communication Layer

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

### 2. External Control Applications

The Rust core accepts unidirectional OSC messages from various external control applications:

- **TouchOSC**: Mobile/tablet control interface
- **Max/MSP**: Audio/visual programming environment
- **Pure Data**: Multimedia programming environment
- **Custom OSC Apps**: Other OSC-compatible applications

External apps can send animation control commands such as:
- Animation playback control (play/pause/stop)
- Animation state management (active/inactive)
- Loop mode control
- Playback speed adjustment

### 3. State Management

#### Central State Store
Manages:
- Track states and properties
- Animation configurations
- Timeline state
- System configuration
- Runtime parameters

#### State Synchronization
Features:
- Real-time state updates
- Conflict resolution
- State persistence
- Recovery mechanisms
- Change notification system

### 4. Animation Engine

#### Timeline Management
Features:
- Time tracking and synchronization
- Marker management
- Track synchronization
- State transitions
- Playback control

#### Motion Models
Capabilities:
- Position calculations (AED/XYZ)
- Interpolation algorithms
- Velocity and acceleration handling
- Path optimization
- Coordinate system transformations

#### Animation Processing
Features:
- Real-time parameter updates
- Frame-accurate timing
- Performance optimization
- State interpolation
- Motion smoothing

### 5. Native Bridge (N-API)

#### FFI Interface
Features:
- Safe FFI boundary
- Context management
- Resource handling
- Error propagation
- Event system

#### Data Marshalling
Capabilities:
- Zero-copy when possible
- Type conversion
- Error handling and propagation
- Asynchronous operation support
- Callback registry for JavaScript functions

## Performance Considerations

### 1. Memory Management
- Custom allocators for real-time operations
- Memory pooling for frequent allocations
- Zero-copy message parsing
- Efficient buffer management for OSC messages
- Resource cleanup and recycling

### 2. Concurrency
- Lock-free algorithms where possible
- Thread pool for message handling
- Async I/O for network operations
- Message queuing and batching
- Resource contention management

### 3. Error Handling
- Comprehensive error types
- Error recovery strategies
- Logging and monitoring
- Graceful degradation
- Error reporting and notification

## Integration Points

### 1. Holophonix Communication
- Bidirectional OSC messaging
- Parameter querying
- State synchronization
- Error recovery
- Connection management

### 2. External Control
- Unidirectional message reception
- Animation control protocol
- Command validation
- State updates
- Error handling

### 3. Electron Integration
- N-API bindings
- Event system
- Configuration management
- Resource handling
- Process lifecycle management
