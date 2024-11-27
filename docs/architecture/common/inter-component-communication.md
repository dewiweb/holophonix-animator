# Inter-Component Communications

## Overview

This document details how different components of the Holophonix Animator communicate with each other. The architecture involves three main layers (Frontend, Electron, and Rust Core) plus external components (Holophonix Device and Control Apps), each with specific communication patterns.

## Communication Channels

### Frontend ↔ Electron

#### Technology: IPC (Inter-Process Communication)
- **Channel Type**: Bidirectional
- **Protocol**: Electron IPC
- **Data Format**: JSON-serialized messages

#### Key Interactions
1. UI Events → Main Process
   - User input events
   - Configuration changes
   - Animation controls
   - Track management commands

2. Main Process → UI
   - State updates
   - Animation progress
     - Frame-by-frame position updates
     - Timeline progress indicators
     - Animation parameter feedback
   - Configuration changes
   - Error notifications
   - Device status updates
   - Performance metrics
     - State sync status
     - Network latency
     - Resource utilization
     - Frame rates

See [Frontend Architecture](../react/frontend-architecture.md#performance-monitor) for details on how these metrics are visualized in the UI.

### Electron ↔ Rust Core

#### Technology: N-API
- **Channel Type**: Bidirectional
- **Protocol**: Foreign Function Interface (FFI)
- **Data Format**: Native types via N-API bindings

#### Key Interactions
1. Main Process → Rust Core
   - Animation commands
   - Configuration updates
   - Device control commands
   - State queries
   - Resource management

2. Rust Core → Main Process
   - State updates
   - Computation results
   - Error notifications
   - Resource status
   - Performance metrics

### External Communications

#### OSC Control Apps → Rust Core
- **Channel Type**: One-way (incoming)
- **Protocol**: OSC over UDP
- **Port**: Configurable (default: 8000)
- **Message Types**:
  - Control commands
  - Parameter updates
  - Animation triggers
  - Custom messages

#### Rust Core ↔ Holophonix Device
- **Channel Type**: Bidirectional
- **Protocol**: OSC over UDP
- **Ports**: 
  - Commands: Device-specific
  - State Updates: Device-specific
- **Message Types**:
  1. Rust Core → Device
     - Position commands
     - Parameter updates
     - Configuration changes
     - Status queries
  2. Device → Rust Core
     - State updates
     - Parameter values
     - Status information
     - Error notifications

## Data Flow Examples

### Animation Control Flow
1. UI: User initiates animation
2. Frontend → Electron: Animation command via IPC
3. Electron → Rust Core: Command via N-API
4. Rust Core: Processes animation
5. Rust Core → Holophonix: OSC commands
6. Holophonix → Rust Core: State updates
7. Rust Core → Electron → Frontend: Progress updates

### External Control Flow
1. OSC App: Sends control message
2. Rust Core: Receives and validates
3. Rust Core: Updates internal state
4. Rust Core → Holophonix: Required commands
5. Rust Core → Electron → Frontend: UI updates

## Error Handling

### Frontend Errors
- Validation errors shown in UI
- Network status indicators
- Connection state feedback
- User input validation

### Electron Layer Errors
- IPC communication errors
- Native module loading issues
- System resource problems
- File system errors

### Rust Core Errors
- OSC communication failures
- Animation computation errors
- State management issues
- Resource allocation failures

### Cross-Layer Error Propagation
1. Error Detection
   - Layer-specific error types
   - Error context preservation
   - Stack trace maintenance

2. Error Reporting
   - User-friendly messages
   - Technical details logging
   - Error metrics collection

3. Error Recovery
   - Automatic retry mechanisms
   - Fallback behaviors
   - State recovery procedures
   - Connection re-establishment

## Performance Considerations

### Data Transfer Optimization
- Minimal serialization
- Batch updates
- Delta compression
- Zero-copy where possible

### State Synchronization
- Efficient update propagation
- Lock-free algorithms
- Concurrent processing
- Update coalescing

### Resource Management
- Connection pooling
- Memory management
- Thread coordination
- Resource cleanup
