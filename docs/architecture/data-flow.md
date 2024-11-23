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
User Action → UI Event → IPC → Native Module → Rust State Update
```
- User interactions trigger UI events in React
- Events are sent through Electron IPC
- Native module bridges to Rust core
- Rust processes and validates actions
- State updates are computed in Rust

### 2. Rust Core → OSC Communication
```
Rust State Change → OSC Message Generation → UDP Socket → Holophonix Device
```
- State changes in Rust trigger OSC messages
- Zero-copy message generation
- Direct UDP socket management
- Efficient message transmission

### 3. External Control → Application
```
External App → OSC Message → Rust Parser → State Update
```
- External apps send OSC messages
- Rust directly handles UDP communication
- Messages are parsed and validated
- State is updated if valid

### 4. Rust → UI Update
```
Rust State → Native Module → IPC → React State → UI Update
```
- State changes in Rust core
- Propagated through native module
- Sent via IPC to renderer
- React updates UI accordingly

## Data Processing

### 1. Input Processing (Rust)
- Type-safe validation
- Coordinate system conversions
- Parameter normalization
- Error handling

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
