# Electron Main Process Architecture

## Overview

The Electron main process serves as the bridge between the Rust core and the renderer process, managing system resources, IPC communication, and application lifecycle.

## Core Components

### 1. Native Module Integration

#### Rust Bridge
The Rust bridge provides core functionality for animation processing, including initialization, frame processing, and cleanup operations.

#### Resource Management
- Native module lifecycle management
- Memory management
- Error propagation from Rust

### 2. IPC Communication

#### Message Types
The application uses a structured message system for IPC communication, handling state updates, animation control, track updates, and error reporting.

#### Channel Management
- Bidirectional communication with renderer
- Message validation
- Error handling

### 3. System Integration

#### Configuration Management
The application configuration handles OSC port settings, language preferences, theme selection, and auto-save functionality.

#### Window Management
- Window creation and lifecycle
- State persistence
- Multi-window coordination

### 4. File System Operations

#### Project Management
- Project file handling
- Auto-save functionality
- Backup management

#### Asset Management
- Resource loading
- Cache management
- Cleanup operations

## Process Communication

### 1. Renderer Communication
The main process handles IPC events for animation control, state management, and error handling between the renderer and native modules.

### 2. Native Module Communication
- Async operation handling
- Error propagation
- Performance monitoring

## Error Handling

### 1. Error Types
The application handles various error categories including Rust errors, IPC errors, and system errors, each with specific handling strategies.

### 2. Error Recovery
- Graceful shutdown
- State recovery
- Error reporting

## Performance Optimization

### 1. Resource Management
- Memory usage monitoring
- CPU usage optimization
- Garbage collection control

### 2. IPC Optimization
- Message batching
- Throttling/debouncing
- Binary data handling

## Security

### 1. IPC Security
- Message validation
- Permission checking
- Context isolation

### 2. File System Security
- Sandbox restrictions
- Path validation
- Resource access control

## Testing Strategy

### 1. Unit Tests
Unit tests cover core functionality including animation control, IPC communication, and error handling.

### 2. Integration Tests
- IPC communication testing
- Native module integration
- System resource handling
