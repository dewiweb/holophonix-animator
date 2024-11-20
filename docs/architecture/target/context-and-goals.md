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
- OSC Default Port: 9000
- Supports both absolute and normalized parameter values

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

## Goals

### Primary Goals
- What are the core objectives?
- What problems are we solving?
- What improvements are we targeting?

### User Experience Goals
- How should users interact with the system?
- What should be the learning curve?
- What workflows need to be optimized?

### Technical Goals
- What technical improvements are needed?
- What performance metrics should we achieve?
- What architectural improvements are required?

### Success Criteria
- How do we measure success?
- What are the key performance indicators?
- What user feedback indicates success?

## Development Progress Notes

### Session 2024-01-XX
- Defined detailed technical context for Holophonix OSC communication
- Documented OSC protocol structure for track control:
  - Coordinate systems (XYZ, AED)
  - Individual and bulk parameter queries
  - Message formats for get/set operations
- Next steps:
  1. Test partial coordinate queries (xy, ae)
  2. Define Primary Goals section
  3. Plan the animator's core features based on Holophonix capabilities

## Constraints

### Technical Constraints
- System requirements
- Integration requirements
- Performance boundaries

### Operational Constraints
- Deployment requirements
- Maintenance considerations
- Update mechanisms

### User Constraints
- Skill level requirements
- Training needs
- Support requirements

## Next Steps
- [ ] Fill in all sections with detailed information
- [ ] Review with stakeholders
- [ ] Validate technical feasibility
- [ ] Define priorities
- [ ] Create detailed requirements based on this context
