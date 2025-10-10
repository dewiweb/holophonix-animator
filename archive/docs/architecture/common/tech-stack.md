# Holophonix Animator Target Architecture

This document outlines the target architecture we want to achieve for the Holophonix Animator application. It serves as a working document to define and refine the architectural needs of the project.

## Target Architecture Diagram

The architecture diagram is available in the following formats:

- **Mermaid Source**: [target-architecture.mmd](./diagrams/target-architecture.mmd)
- View this diagram using:
  1. [Mermaid Live Editor](https://mermaid.live) - Copy and paste the contents of the .mmd file
  2. VS Code with Mermaid extension - Open the .mmd file directly
  3. Any Mermaid-compatible diagram viewer

## Core Architecture Requirements

1. **User Interface Layer**
   - [x] Bilingual support (English and French)
   - [x] Accessibility features implementation
   - [x] Responsive and intuitive motion control interface
   - [x] Real-time preview capabilities
   - [x] Configuration management interface

2. **Animation Service Architecture**
   - [x] Rust implementation with N-API integration
   - [x] Native module communication via N-API
   - [x] Modular computation architecture
   - [x] Real-time motion support (60 FPS target)
   - [x] Multi-object animation scaling
   - [x] State persistence and recovery

3. **External Systems Integration**
   - [x] Bidirectional OSC protocol implementation:
     - Send: Motion commands and parameter updates
     - Receive: State queries and responses
     - Default port: 4003 (configurable)
   - [x] Multiple OSC destination support
   - [x] Real-time state synchronization
   - [x] Error handling and recovery
   - [x] Connection monitoring
   - [x] Network diagnostics:
     - Connection status
     - Message latency
     - Error rates
   - [x] Error recovery system

### OSC Communication Layer

The OSC Handler component manages bidirectional communication between the Holophonix Animator and the Holophonix System. This communication is crucial for maintaining system state and enabling real-time control.

#### Communication Flow
1. **Outbound Communication (Animator → Holophonix)**
   - Motion commands for source positioning (combined xyz/aed only)
   - Parameter value updates
   - State queries for synchronization
   - Configuration changes
   - Group control commands
   - Formation updates

2. **Inbound Communication (Holophonix → Animator)**
   - State query responses
   - Parameter update confirmations
   - Error notifications
   - System status updates
   - Group state updates
   - Health check responses

#### Protocol Specifications
- Transport: UDP
- Default Port: 4003 (configurable)
- Message Format: OSC 1.0 compliant
- Address Patterns: 
  * `/track/{id}/...` for source control
  * `/group/{id}/...` for group control
  * `/formation/{id}/...` for formation control
- Query Format: `/get <parameter_path>`
- Coordinate Systems:
  * Cartesian (XYZ): Normalized -1.0 to 1.0 range
  * Polar (AED): Azimuth 0-360°, Elevation -90-90°, Distance 0-1
  * Conversions handled by backend for optimal performance
- State Subscription Format: `/subscribe <parameter_path>`

#### Error Handling
- Network connectivity monitoring
- Message validation and error reporting
- Automatic reconnection with progressive backoff
- Timeout handling for unresponsive queries
- Value range validation for coordinates and parameters
- Batch error recovery for group operations

#### State Management
- Real-time state synchronization (60Hz)
- State subscription system
- Cache invalidation on parameter changes
- Conflict resolution for concurrent updates
- Efficient coordinate system state tracking
- Group state persistence
- Formation state tracking

4. **Main Process Architecture**
   - [x] Animation Bridge implementation
   - [x] Service client implementation
   - [x] Error handling and recovery strategies
   - [x] Configuration management system
   - [x] Plugin architecture for motion patterns

5. **Data Flow and State Management**
   - [x] Data models for animation calculations
   - [x] State update patterns
   - [x] High-performance data exchange format
   - [x] Configuration import/export
   - [x] Backup and restore functionality

6. **Performance and Resource Management**
   - [x] Computation performance targets (60 FPS)
   - [x] Maximum latency requirements (<16.7ms for 60 FPS)
   - [x] Resource allocation strategy
   - [x] Scaling limits (up to 128 tracks)
   - [x] Performance monitoring

## Technology Stack

### Core Technologies

#### 1. Node.js Core
- **Purpose**: OSC Communication and State Management
- **Key Libraries**:
  - `osc`: High-performance OSC implementation
  - `typescript`: Type safety and developer experience
  - `rxjs`: Reactive state management
  - `jest`: Testing framework

#### 2. Rust Computation Engine
- **Purpose**: High-performance mathematical operations
- **Key Features**:
  - Vector operations
  - Trajectory calculations
  - Motion pattern processing
  - Performance-critical algorithms
- **Integration**: Node-API (N-API) for Node.js integration

#### 3. Electron
- **Purpose**: Cross-platform desktop application
- **Components**:
  - Main Process: System integration
  - Renderer Process: UI rendering
  - IPC: Inter-process communication

#### 4. React Frontend
- **Purpose**: User interface
- **Key Libraries**:
  - `react`: UI framework
  - `@emotion/styled`: Styling
  - `react-testing-library`: Component testing
  - `three.js`: 3D visualization

## Communication Layer

### 1. OSC Protocol
- **Implementation**: Node.js `osc` module
- **Features**:
  - Type-tagged messaging
  - Bundle support
  - High-performance UDP
  - Message optimization
  - Error handling

### 2. Inter-Process Communication
- **Main ↔ Renderer**: Electron IPC
- **Node.js ↔ Rust**: Node-API (N-API)
- **React ↔ Core**: Event-based communication

## Development Tools

### 1. Build Tools
- **TypeScript**: `tsc`, `ts-node`
- **Rust**: `cargo`
- **Frontend**: `vite`
- **Testing**: `jest`, `cargo test`

### 2. Development Environment
- **Editor Support**:
  - TypeScript: Language service
  - Rust: RLS/rust-analyzer
  - React: DevTools
- **Debugging**:
  - Chrome DevTools
  - VSCode debugger
  - Rust GDB/LLDB

### 3. Quality Assurance
- **Linting**:
  - ESLint for TypeScript/JavaScript
  - Clippy for Rust
- **Formatting**:
  - Prettier for TypeScript/JavaScript
  - rustfmt for Rust
- **Testing**:
  - Jest for Node.js/React
  - cargo test for Rust
  - Playwright for E2E

## Performance Monitoring

### 1. Runtime Metrics
- **OSC Performance**:
  - Message throughput
  - Latency monitoring
  - Error rates
- **Computation Performance**:
  - Algorithm benchmarks
  - Memory usage
  - CPU utilization

### 2. Development Metrics
- **Test Coverage**:
  - Jest coverage for TypeScript
  - cargo tarpaulin for Rust
- **Build Performance**:
  - Compilation times
  - Bundle sizes
  - Load times

## Security Considerations

### 1. Input Validation
- OSC message validation
- Type checking
- Boundary validation

### 2. Error Handling
- Graceful degradation
- Error recovery
- User feedback

### 3. Resource Management
- Memory management
- Connection handling
- Resource cleanup

## Support Infrastructure

1. **Documentation System**
   - [ ] Technical documentation in English and French
   - [ ] API documentation for plugin development
   - [ ] User guides and tutorials
   - [ ] System administration guides
   - [ ] Troubleshooting documentation

2. **Development Infrastructure**
   - [ ] Continuous Integration/Deployment pipeline
   - [ ] Automated testing framework
   - [ ] Code quality monitoring
   - [ ] Performance benchmarking system
   - [ ] Localization management system

## Notes and Decisions

1. **Architecture Decisions**:
   - Separate Animation Core into dedicated high-performance service
   - Use WebSocket/gRPC for efficient service communication
   - Implement modular computation system
   - Support bilingual interface (English/French)
   - Configurable OSC communication

2. **Technology Considerations**:
   - Rust/C++ for performance-critical calculations
   - Binary protocol for minimal communication overhead
   - Potential for distributed computation
   - Modern UI framework with language support
   - Built-in diagnostic tools

3. **Open Questions**:
   - Service deployment strategy
   - Inter-process communication optimization
   - State synchronization approach
   - Error recovery mechanisms
   - Plugin system architecture
