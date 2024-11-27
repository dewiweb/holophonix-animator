# Data Flow

## Overview

The Holophonix Animator implements a hybrid data flow architecture with Rust at its core, handling all performance-critical operations and state management. While the internal application maintains unidirectional data flow for UI updates and state management, the system maintains bidirectional OSC communication with Holophonix devices for commands and queries.

## Communication Patterns

### Holophonix Communication
- **Commands**: The application sends OSC commands to control Holophonix parameters
- **Queries**: The application sends queries to request current state or parameters
- **Responses**: Holophonix responds to queries with current values and states
- **State Updates**: All responses are processed by the Rust core and propagated to the UI

### Internal Flow

### 1. User Interface → Rust Core
```
User Action → React Event → Electron IPC → N-API → Rust Core → State Update
```
- User interactions trigger React component events
- Events are serialized and sent through Electron IPC channels
- N-API bridge handles type conversion and memory management
- Rust core validates and processes actions
- State updates are computed with error handling

### 2. Rust Core → OSC Communication
```
Rust State Change → Zero-Copy Buffer → OSC Message → UDP Socket → Holophonix
```
- State changes trigger OSC message generation
- Zero-copy buffer management for performance
- Direct UDP socket management with error handling
- Efficient message transmission with retry logic
- Acknowledgment handling for critical messages

### 3. External Control → Application
```
External App → OSC → UDP Socket → Rust Parser → Validation → State Update
```
- External applications send OSC messages
- UDP socket managed by Rust with error handling
- Messages parsed with zero-copy when possible
- Strict validation of incoming messages
- State updated only after validation

### 4. Rust → UI Update
```
Rust State → N-API → IPC → React State → UI Update
```
- State changes in Rust core trigger update events
- N-API handles memory management and type conversion
- IPC messages batched for performance
- React state updates trigger efficient re-renders
- Error boundaries catch and handle failures

For implementation details of these patterns, see:
- [Node Integration](../rust-core/node-bridge/node-integration.md)
- [Frontend Architecture](../react/frontend-architecture.md)
- [State Management](../rust-core/state-manager/state-management.md)

### 5. File Upload Flow
```
File Selection → Electron → Native Module → Rust Processing → State Update
```
- User selects SVG file through Electron dialog
- File is read and validated in Electron
- Content is passed through native module
- Rust processes SVG data
- Path is stored in core state
- UI is updated with new path

## Data Processing

### 1. Input Processing (Rust)
- Type-safe validation
- Coordinate system conversions
- Parameter normalization
- Error handling
- SVG path parsing and validation

### 2. State Management (Rust)
- Centralized state store
- Atomic state changes
- Change validation
- Efficient update propagation

### 3. OSC Processing (Rust)
- Zero-copy message parsing
- UDP socket management
- Message validation
- Performance optimization

### 4. UI State Management (React)
- Component state
- View state
- User preferences
- Temporary UI states

## Performance Considerations

### 1. Native Module Bridge
- Direct memory access
- Minimal serialization
- Efficient threading
- Type safety across boundary

### 2. OSC Communication
- Zero-copy operations
- Efficient UDP handling
- Message batching
- Real-time processing

### 3. State Updates
- Lock-free operations
- Minimal copying
- Efficient propagation
- Predictable performance

## Error Handling

### 1. Rust Core
- Type-safe error handling
- Error propagation
- Recovery mechanisms
- Performance monitoring

### 2. Network Layer
- Connection monitoring
- Error recovery
- Message validation
- Performance tracking

### 3. UI Layer
- Error boundaries
- User feedback
- State recovery
- Graceful degradation
