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
     - Default port: 4003 (configurable)
   - [ ] Support multiple OSC destinations (optional)
   - [ ] Plan communication between Animation Service and Holophonix:
     - Real-time state synchronization
     - Error handling and recovery
     - Connection monitoring
   - [ ] Implement network diagnostics and monitoring:
     - Connection status
     - Message latency
     - Error rates
   - [ ] Design error handling and recovery system

### OSC Communication Layer

The OSC Handler component manages bidirectional communication between the Holophonix Animator and the Holophonix System. This communication is crucial for maintaining system state and enabling real-time control.

#### Communication Flow
1. **Outbound Communication (Animator → Holophonix)**
   - Motion commands for source positioning (combined xyz/aed only)
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
- Coordinate Systems:
  * Cartesian (XYZ): Normalized -1.0 to 1.0 range
  * Polar (AED): Azimuth 0-360°, Elevation -90-90°, Distance 0-1
  * Conversions handled by backend for optimal performance

#### Error Handling
- Network connectivity monitoring
- Message validation and error reporting
- Automatic reconnection on connection loss
- Timeout handling for unresponsive queries
- Value range validation for coordinates and parameters

#### State Management
- Periodic state synchronization
- Cache invalidation on parameter changes
- Conflict resolution for concurrent updates
- Efficient coordinate system state tracking

4. **Main Process Architecture**
   - [ ] Design Animation Bridge implementation
   - [ ] Define service client requirements
   - [ ] Plan error handling and recovery strategies
   - [ ] Implement configuration management system
   - [ ] Design plugin architecture for motion patterns

5. **Data Flow and State Management**
   - [ ] Define data models for animation calculations
   - [ ] Specify state update patterns
   - [ ] Design high-performance data exchange format
   - [ ] Implement configuration import/export
   - [ ] Design backup and restore functionality

6. **Performance and Resource Management**
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
