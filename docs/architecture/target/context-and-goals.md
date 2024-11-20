# Project Context and Goals

## Context

### Project Background

#### What led to the creation of v1?
The project was initiated to create a cross-platform desktop application for managing motion models in Holophonix spatial audio systems. The key drivers were:
- Need for a tool to create and manage complex spatial movements
- Requirement to support both absolute and relative coordinate changes
- Support for multiple coordinate systems (AED and XYZ)
- Need for real-time control via OSC protocol

#### What are the learnings from v1?
1. **Technical Stack Choices**
   - Electron + React stack provided cross-platform capability but introduced complexity
   - TypeScript helped with type safety but the type system could be more robust
   - The motion model system architecture became complex over time

2. **Architecture Challenges**
   - Tight coupling between UI and motion model logic
   - Performance bottlenecks in real-time calculations
   - Complex state management
   - Difficulty in extending the motion model system

3. **User Experience Issues**
   - UI became cluttered as features were added
   - Complex workflows for simple tasks
   - Lack of simple previews for motion models selection

#### What are the current limitations?
1. **Technical Limitations**
   - Performance overhead from JavaScript/TypeScript for real-time calculations
   - Complex state management affecting reliability
   - Difficulty in maintaining consistent motion across coordinate systems
   - Limited testing capabilities for complex motion models

2. **Functional Limitations**
   - Limited support for complex group movements
   - No preview system for motion model selection
   - Basic error handling and recovery
   - Limited offline capabilities

3. **Development Limitations**
   - Difficult to extend without affecting existing models
   - Complex debugging process
   - Lack of proper separation between core logic and UI
   - Testing challenges for real-time motion models

### User Context

#### Who are the users?
Sound technicians and audio professionals who:
- Work with Holophonix spatial audio processor
- Create and manage object-based spatial audio experiences
- Need to automate spatial movements of audio objects
- Are familiar with the Holophonix server interface and its object-oriented approach

#### Technical Background
- Professional audio system experience
- Understanding of object-based spatial audio concepts
- Familiar with spatial object manipulation (position, movement)
- Understanding of coordinate systems (AED/XYZ) in spatial audio
- Experience with the Holophonix system and its UI
- May have varying levels of technical expertise beyond audio systems

#### Working Environment
- Professional audio setups (theaters, concert halls, studios)
- Working with Holophonix processor/server for object-based spatial audio
- Often time-critical situations (live events, production deadlines)
- May need to make quick adjustments to object movements during setup or performance

#### Primary Tasks
- Creating automated movement patterns for audio objects
- Setting up spatial audio scenes with multiple objects
- Fine-tuning motion parameters for each object
- Managing multiple audio objects and their spatial relationships
- Integrating object movements with existing audio workflows

### Technical Context

#### System Overview
- Holophonix is an advanced platform for live sound spatialization and immersive experiences
- Uses object-based mixing approach where each input channel can be associated with multiple objects
- Supports both 2D and 3D sound spatialization
- Integrates multiple spatialization algorithms developed at IRCAM-STMS Lab
- Provides true 3D reverberation capabilities

#### Core Capabilities
- Multiple spatialization algorithms (11 available rendering modes)
- Real-time object manipulation in 2D/3D space
- Advanced reverberation and acoustic simulation
- Live sound processing and mixing
- Multi-channel input/output support

#### Integration Points
- Interfaces with the Holophonix server for real-time audio processing
- Communicates with the main Holophonix interface for object control
- Supports OSC (Open Sound Control) protocol for external control
- OSC communication focused on:
  - Source positioning (coordinates in space)
  - Source parameters (gain, mute, etc.)
- Needs to handle various coordinate systems (AED/XYZ) for spatial positioning
- Must maintain synchronization with the audio processing chain

#### Communication Protocol Details
- OSC Protocol:
  - Bidirectional communication over UDP
  - Default listening port: 4003 (configurable)
  - Supports both sending commands and receiving responses
  - Handles state queries and updates
  - Maintains synchronization with Holophonix state

##### OSC Message Types
1. **Outgoing Messages (Animator to Holophonix)**
   - Setting values: `/track/{id}/...`
   - State queries: `/get <path>`
   - Parameter updates
   - Motion commands

2. **Incoming Messages (Holophonix to Animator)**
   - Query responses
   - State updates
   - Parameter confirmations
   - Error notifications

##### OSC Message Structure
- Setting values: 
  - Address pattern starts with `/track/{id}/...`
  - Example: `/track/1/x 1.0`
- Getting values:
  - Query:
    - Address: `/get`
    - Argument: full address pattern of the parameter to query
  - Response:
    - Address: the queried path
    - Arguments: value(s) for the queried parameter(s)
  - Examples: 
    - Single coordinate:
      - Query: `/get /track/1/x`
      - Response: `/track/1/x 1.0`
    - All XYZ coordinates:
      - Query: `/get /track/1/xyz`
      - Response: `/track/1/xyz 1.0 0.5 0.2`
    - All AED coordinates:
      - Query: `/get /track/1/aed`
      - Response: `/track/1/aed 45.0 30.0 0.7`

##### Track Position Control
- Individual Coordinates:
  - Cartesian:
    - Set: `/track/{id}/x {value}` (-1.0 to 1.0)
    - Set: `/track/{id}/y {value}` (-1.0 to 1.0)
    - Set: `/track/{id}/z {value}` (-1.0 to 1.0)
    - Get single: `/get /track/{id}/x` → `/track/{id}/x {value}`
    - Get all XYZ: `/get /track/{id}/xyz` → `/track/{id}/xyz {x} {y} {z}`
    - Get XY only (to be tested): `/get /track/{id}/xy` → `/track/{id}/xy {x} {y}`

  - Polar:
    - Set: `/track/{id}/azimuth {value}` (0.0 to 360.0)
    - Set: `/track/{id}/elevation {value}` (-90.0 to 90.0)
    - Set: `/track/{id}/distance {value}` (0.0 to 1.0)
    - Get single: `/get /track/{id}/azimuth` → `/track/{id}/azimuth {value}`
    - Get all AED: `/get /track/{id}/aed` → `/track/{id}/aed {azimuth} {elevation} {distance}`
    - Get AE only (to be tested): `/get /track/{id}/ae` → `/track/{id}/ae {azimuth} {elevation}`

##### Coordinate Query Options
- Full coordinates:
  - `/track/{id}/xyz` - all Cartesian coordinates
  - `/track/{id}/aed` - all polar coordinates
- Partial coordinates (to be tested):
  - `/track/{id}/xy` - X and Y coordinates only
  - `/track/{id}/ae` - Azimuth and Elevation only
- Individual coordinates:
  - `/track/{id}/x`, `/track/{id}/y`, `/track/{id}/z`
  - `/track/{id}/azimuth`, `/track/{id}/elevation`, `/track/{id}/distance`

##### Track Parameters
- Gain control:
  - Set: `/track/{id}/gain {value}` (-inf to 10.0)
  - Get: `/get /track/{id}/gain` → `/track/{id}/gain {value}`
- Mute control:
  - Set: `/track/{id}/mute {0|1}`
  - Get: `/get /track/{id}/mute` → `/track/{id}/mute {value}`

##### State Monitoring
- Query format: `/get <path>`
- Response format: `<path> <value(s)>`
- Can get individual parameters or complete coordinate sets (xyz/aed)
- Useful for:
  - Initial state synchronization
  - Verifying parameter changes
  - Monitoring track positions
  - Error checking

#### Performance Requirements
- Real-time performance for live events
- Low-latency response for object movements
- Smooth interpolation between position changes
- Efficient handling of multiple simultaneous objects
- Stable operation in professional audio environments
- OSC message handling within 16ms to maintain 60fps update rate

## Goals

### Primary Goals
1. **Enhanced Motion Control System**
   - Create an intuitive and powerful system for defining complex spatial movements
   - Support both simple and advanced motion patterns (linear, circular, spiral, custom paths)
   - Enable precise control over motion timing and synchronization
   - Implement robust group movement capabilities

2. **Improved Real-time Performance**
   - Optimize motion calculations for minimal latency
   - Ensure smooth transitions between position updates
   - Support efficient handling of multiple simultaneous objects
   - Maintain stable performance under heavy load

3. **Better State Management**
   - Implement robust state synchronization with Holophonix server
   - Provide reliable error recovery mechanisms
   - Enable seamless coordinate system transitions
   - Support comprehensive undo/redo capabilities

### User Experience Goals
1. **Streamlined Workflow**
   - Minimize steps for common tasks
   - Enable quick parameter adjustments
   - Support rapid scene setup
   - Provide efficient preset management

2. **Motion Pattern Preview**
   - Simple 2D preview of motion behaviors
   - Quick preview of behavior models
   - Easy comparison between different patterns
   - Clear representation of timing and rhythm

3. **Professional Control**
   - Quick access to frequently used patterns
   - Efficient multi-object management
   - Fast response to live situations
   - Intuitive parameter mapping

### Technical Goals
1. **Core Architecture**
   - Clean separation between motion logic and UI
   - Modular system for behavior patterns
   - Efficient state management
   - Robust error handling

2. **Performance**
   - Fast motion calculations
   - Smooth OSC communication
   - Responsive UI interactions
   - Efficient memory usage

3. **Integration**
   - Reliable OSC protocol implementation
   - Robust coordinate system conversions
   - Consistent state synchronization
   - Flexible preset system

### Success Criteria
1. **Technical Performance**
   - Motion updates sent within 16ms (60fps)
   - OSC round-trip latency < 100ms
   - UI response time < 50ms
   - Memory usage < 500MB

2. **Reliability**
   - Zero data loss during connection issues
   - 100% recovery from connection drops
   - No unexpected motion interruptions
   - Correct coordinate conversions

3. **Usability**
   - Pattern setup completed in < 1 minute
   - New users productive within 30 minutes
   - Preset creation in < 3 steps
   - Pattern adjustments in real-time

## Constraints

### Technical Constraints
1. **Network Requirements**
   - Must operate over standard TCP/IP network
   - Requires stable connection to Holophonix server
   - Must support configurable OSC ports for both send and receive
   - Default OSC receive port: 4003 (Holophonix standard)
   - Restricted ports: 4002, 4001, and ports below 1024 not allowed
   - Local network latency < 100ms
   - Support for multiple OSC destinations (optional)

2. **System Compatibility**
   - Cross-platform support (Windows, macOS, Linux)
   - Minimum 4GB RAM
   - x64 architecture required
   - ARM support optional if development effort reasonable

3. **Performance Boundaries**
   - Standard target: 64 simultaneous objects
   - Scale with system capabilities for more objects (optional)
   - Motion updates at 60fps (16.7ms)
   - Maximum 1GB memory usage
   - CPU usage < 15% on modern processors
   - OSC message handling within 16ms to maintain 60fps update rate
   - Support for multiple simultaneous OSC connections (optional)

### Operational Constraints
1. **Deployment Requirements**
   - Self-contained application package
   - Automatic handling of dependencies
   - Support for standard user installation
   - Configurable installation paths (optional)
   - Preservation of user settings during updates

2. **Update Management**
   - Automated update checks
   - Rollback capability for failed updates
   - Delta updates to minimize download size (optional)
   - Update deferral options for critical sessions
   - Version compatibility checks with Holophonix server (optional)

3. **Configuration Management**
   - User-specific configuration profiles
   - Export/Import of configuration settings (optional)
   - Backup of user presets and patterns
   - Network settings persistence
   - OSC configuration templates (optional)
   - Logging level configuration

4. **Maintenance Operations**
   - Automated log rotation and cleanup
   - Built-in diagnostic tools (optional)
   - Configuration validation tools
   - Network connection testing utilities (optional)
   - Performance monitoring and reporting (optional)
   - Error reporting with privacy controls

5. **Recovery and Backup**
   - Automatic backup of critical user data
   - Session state recovery after crashes
   - Configuration restore points (optional)
   - Emergency recovery mode (optional)
   - Offline operation capability (optional)
   - Data export functionality

### User Constraints
1. **Required Skills**
   - Basic understanding of spatial audio concepts
   - Familiarity with coordinate systems (AED/XYZ)
   - Experience with Holophonix system interface
   - Understanding of OSC protocol basics
   - Basic computer operation skills

2. **Training Requirements**
   - Quick-start guide completion (30 minutes)
   - Basic motion pattern tutorial (1 hour)
   - Reference documentation for advanced features
   - Video tutorials for common workflows
   - Interactive help system within the application
   - All training materials available in English and French

3. **Support Requirements**
   - First-line support:
     - Built-in help documentation in English and French
     - Troubleshooting guides in both languages
     - Common issues FAQ in both languages
     - Error message explanations in both languages
   - Second-line support:
     - Email support in English and French
     - Bug reporting system with bilingual interface
     - Feature request tracking in both languages
   - Emergency support:
     - Critical issue resolution during live events (optional)
     - Rapid response for show-critical bugs
     - Support available in both English and French

4. **Accessibility Requirements**
   - Clear, readable interface text in both languages
   - Keyboard shortcuts for common actions
   - High contrast display options (optional)
   - Screen reader compatibility (optional)
   - Configurable UI scaling
   - Keyboard shortcuts documentation in both languages

5. **Language Requirements**
   - English and French interfaces required
   - Technical terms consistent with Holophonix in both languages
   - Clear error messages and notifications in both languages
   - Additional language support (optional)
   - Language selection persisted in user preferences
   - Real-time language switching without application restart

## Next Steps
1. **Immediate Actions** (0-2 months)
   - [ ] Create detailed technical specifications for motion system
   - [ ] Design and prototype UI components with bilingual support
   - [ ] Set up basic OSC communication with configurable ports
   - [ ] Develop initial English and French quick-start guides
   - [ ] Create technical glossary in both languages

2. **Short-term Goals** (2-4 months)
   - [ ] Implement core motion calculation engine
   - [ ] Complete language switching system and persistence
   - [ ] Develop testing framework for motion patterns
   - [ ] Set up bilingual bug tracking system
   - [ ] Create basic troubleshooting guides in both languages

3. **Medium-term Goals** (4-8 months)
   - [ ] Implement advanced group behaviors
   - [ ] Create plugin system for custom patterns
   - [ ] Develop comprehensive error handling in both languages
   - [ ] Build performance monitoring tools
   - [ ] Establish full bilingual support workflow
   - [ ] Complete interactive help system with language support

4. **Long-term Vision** (8-12 months)
   - [ ] Support for complex choreographed sequences
   - [ ] Integration with timeline-based editors
   - [ ] Advanced pattern generation and manipulation
   - [ ] Machine learning for pattern recognition
   - [ ] Comprehensive user testing in both language contexts
   - [ ] Advanced accessibility features implementation

5. **Future Possibilities** (12+ months)
   - [ ] Additional language support beyond English and French
   - [ ] AI-assisted motion pattern generation
   - [ ] Virtual reality preview system
   - [ ] Advanced collaboration features
   - [ ] Integration with other spatial audio platforms
