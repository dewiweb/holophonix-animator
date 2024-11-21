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
   - [ ] Bilingual support (English and French)
   - [ ] Accessibility features implementation
   - [ ] Responsive and intuitive motion control interface
   - [ ] Real-time preview capabilities
   - [ ] Configuration management interface

2. **Animation Service Architecture**
   - [ ] Choose optimal programming language (Rust/C++)
   - [ ] Define service communication protocol (WebSocket/gRPC)
   - [ ] Design computation modules interfaces
   - [ ] Specify performance requirements (real-time motion)
   - [ ] Plan scaling strategy for multiple objects
   - [ ] Implement state persistence and recovery

3. **External Systems Integration**
   - [ ] Implement bidirectional OSC protocol:
     - Send: Motion commands and parameter updates
     - Receive: State queries and responses
     - Network Configuration:
       - Server IP: User-defined Holophonix server address
       - Local Interface: Auto-detected network interfaces
       - Ports: Configurable input/output (defaults: 4003/9000)
     - Connection validation and monitoring
   - [ ] Support multiple OSC destinations (optional)
   - [ ] Plan communication between Animation Service and Holophonix:
     - Real-time state synchronization
     - Error handling and recovery
     - Connection monitoring
   - [ ] Implement network diagnostics and monitoring:
     - Connection status and interface availability
     - Message latency and throughput
     - Error rates and types
   - [ ] Design error handling and recovery system

### OSC Communication Layer

The OSC Handler component manages bidirectional communication between the Holophonix Animator and the Holophonix System. This communication is crucial for maintaining system state and enabling real-time control.

#### Network Configuration
- **Server Configuration**:
  - User-defined Holophonix server IP address
  - Configurable output port (default: 4003)
  - Connection validation and monitoring
  - Automatic reconnection handling

- **Local Interface Configuration**:
  - Auto-detection of available network interfaces
  - Interface selection from available options
  - Support for all-interfaces binding (0.0.0.0)
  - Configurable input port (default: 9000)

- **Validation and Error Handling**:
  - Server IP address validation
  - Network interface availability checking
  - Port conflict detection
  - Clear error messages with available options
  - Connection status monitoring

#### Communication Flow
1. **Outbound Communication (Animator → Holophonix)**
   - Motion commands for source positioning
   - Parameter value updates
   - State queries for synchronization
   - Configuration changes

2. **Inbound Communication (Holophonix → Animator)**
   - State query responses
   - Parameter update confirmations
   - Error notifications
   - System status updates

#### Protocol Specifications
- Transport: UDP
- Default Port: 4003 (configurable)
- Message Format: OSC 1.0 compliant
- Address Patterns: `/track/{id}/...` for source control
- Query Format: `/get <parameter_path>`

#### Error Handling
- Network connectivity monitoring
- Message validation and error reporting
- Automatic reconnection on connection loss
- Timeout handling for unresponsive queries

#### State Management
- Periodic state synchronization
- Cache invalidation on parameter changes
- Conflict resolution for concurrent updates

4. **Storage Layer Architecture**
   - [ ] Implement JSON-based storage system:
     - `settings.json`: Application and OSC configuration
     - `presets.json`: Parameter presets and track configurations
     - `state.json`: Application state and behavior data
   - [ ] File system operations:
     - Atomic write operations to prevent corruption
     - Backup creation before writes
     - Migration handling for schema updates
   - [ ] Data validation:
     - JSON schema validation
     - Type checking
     - Data integrity verification
   - [ ] Error handling:
     - File system access errors
     - Parse/write failures
     - Recovery from corrupted files
   - [ ] Performance considerations:
     - Caching frequently accessed data
     - Batching write operations
     - Lazy loading of large datasets

### Storage Layer Implementation

The storage layer uses a JSON-based approach for data persistence, chosen for its simplicity, human readability, and sufficient functionality for the application's needs.

#### Storage Components

1. **Configuration Store (settings.json)**
   - Application settings
   - OSC configuration
   - Network preferences
   - UI preferences
   - Performance settings

2. **Preset Store (presets.json)**
   - Parameter presets
   - Track configurations
   - Behavior templates
   - User-defined defaults

3. **State Store (state.json)**
   - Current application state
   - Track states
   - Active behaviors
   - Session information

#### Implementation Details

- **File Operations**:
  - Atomic writes using temporary files
  - Backup creation before modifications
  - File locking for concurrent access
  - Error recovery mechanisms

- **Data Validation**:
  - JSON schema validation
  - Type checking using TypeScript
  - Data integrity verification
  - Migration handling for schema updates

- **Performance Optimization**:
  - In-memory caching
  - Batched write operations
  - Lazy loading for large datasets
  - Periodic state persistence

- **Error Handling**:
  - Graceful degradation on file access errors
  - Automatic recovery from corrupted files
  - Backup restoration when needed
  - Clear error reporting

5. **Main Process Architecture**
   - [ ] Design Animation Bridge implementation
   - [ ] Define service client requirements
   - [ ] Plan error handling and recovery strategies
   - [ ] Implement configuration management system
   - [ ] Design plugin architecture for motion patterns

6. **Data Flow and State Management**
   - [ ] Define data models for animation calculations
   - [ ] Specify state update patterns
   - [ ] Design high-performance data exchange format
   - [ ] Implement configuration import/export
   - [ ] Design backup and restore functionality

7. **Performance and Resource Management**
   - [ ] Define computation performance targets
   - [ ] Specify maximum latency requirements (<10ms)
   - [ ] Plan resource allocation strategy
   - [ ] Define scaling limits
   - [ ] Implement performance monitoring

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
