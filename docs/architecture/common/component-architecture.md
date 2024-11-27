# Component Architecture

## Overview

The Holophonix Animator is built with a modular component architecture that separates concerns and promotes maintainability. The architecture consists of distinct layers: Frontend (React/TypeScript), Electron, and Rust Core, with the Rust Core handling all native functionality including Node.js integration.

For detailed information about inter-component communication patterns, error handling, and performance considerations, see [Inter-Component Communications](./inter-component-communication.md).

## Layer Architecture

### 1. Frontend Layer

#### UI Components (React/TypeScript)
- User interface components and views
- State management and UI logic
- Event handling and user interactions
- Real-time visualization
- Animation controls and timeline
- Parameter editing interfaces

### 2. Electron Layer

#### Main Process
- System integration
- Window management
- IPC communication with frontend
- Native module loading
- File system access
- Application lifecycle management

### 3. Rust Core

The Rust Core is the heart of the Holophonix Animator, providing high-performance native functionality. See [Rust Core Architecture](../rust-core/rust-core.md) for detailed documentation.

Key components:
- Node Bridge: Rust-Node.js integration via N-API
- OSC System: Communication with Holophonix and control apps
- Animation Engine: Spatial audio positioning and movement
- State Management: Central state coordination
- Computation Engine: High-performance calculations

## Performance Considerations

### Native Module Integration
- Direct memory access between Node and Rust
- Efficient retry mechanisms
- Real-time performance monitoring

### State Management
- Zero-copy state updates where possible
- Lock-free concurrent state access
- Optimized state synchronization
