# Animation Engine Architecture [WIP]

## Overview

The Animation Engine is a core component of the Holophonix Animator, responsible for computing and managing real-time spatial audio animations. It provides high-performance, deterministic animation calculations while ensuring smooth transitions and precise timing.

## Core Components

### 1. Animation Manager

The Animation Manager orchestrates the entire animation system, coordinating between different animation models and the state management system.

Components and responsibilities:
- Animation lifecycle management
- Model registration and instantiation
- Animation scheduling and synchronization
- Resource management
- Performance optimization
- Error handling and recovery

### 2. Animation Models

The engine supports various animation models, each implementing specific movement patterns and behaviors.

#### Built-in Models

##### Linear Movement
- Start and end position calculation
- Interpolation methods
- Easing functions
- Timing control
- Boundary handling

##### Circular Movement
- Center point tracking
- Radius management
- Angular velocity control
- Direction control
- Phase calculation

##### Random Movement
- Boundary enforcement
- Random seed management
- Movement patterns
- Speed control
- Direction changes

##### Custom Path Movement
- Path validation
- Point interpolation
- Curve smoothing
- Speed control
- Path following logic

### 3. Computation Engine

The computation engine handles all mathematical calculations required for animations.

Components:
- Vector calculations
- Interpolation engine
- Timing system
- Performance optimizations
- Coordinate transformations

Key features:
- Real-time position calculation
- Velocity and acceleration management
- Collision detection
- Boundary checking
- Performance monitoring

### 4. Parameter System

Manages all configurable aspects of animations.

Components:
- Parameter registry
- Value validation
- Range constraints
- Default values
- Unit conversion

Parameters types:
- Spatial coordinates
- Time values
- Speed settings
- Acceleration values
- Custom parameters

### 5. Synchronization System

Handles timing and synchronization of animations.

Features:
- Global clock management
- Animation scheduling
- Frame timing
- Event synchronization
- External sync support

### 6. Event System

Manages animation-related events and callbacks.

Components:
- Event dispatcher
- Callback registry
- Error handling
- Event queuing
- Priority management

Event types:
- Animation start/stop
- Parameter changes
- State transitions
- Error conditions
- External triggers

## Animation Stack

The Animation Engine supports a powerful concept called Animation Stacks, where multiple animation models can be daisy-chained together to create complex, layered animations. Each model in the stack processes the output of the previous model, allowing for sophisticated motion compositions.

### Stack Operation

1. **Sequential Processing**
   - Models are processed in order from top to bottom
   - Each model receives the output position from the previous model
   - The final model's output becomes the actual source position

2. **State Flow**
   - Position data flows through the stack
   - Each model can modify, enhance, or transform the position
   - State changes are propagated through the chain

3. **Stack Configuration**
   - Models can be dynamically added or removed
   - Stack order can be reorganized at runtime
   - Individual model parameters remain independently configurable

### Common Stack Patterns

1. **Motion Refinement**
   - Base motion model (e.g., Linear) → Smoothing model → Boundary constraint model
   - Each layer refines the motion characteristics

2. **Complex Behaviors**
   - Circular model → Random jitter model → Path constraint model
   - Combines multiple motion types for natural movement

3. **Effect Composition**
   - Primary motion → Effect layer → Post-processing
   - Allows separation of core movement and effects

## Animation Flow Processing

The Animation Engine processes incoming flows differently based on whether they target individual tracks or groups of tracks. This distinction is fundamental to how animations are computed and applied.

### Flow Types

#### 1. Individual Track Flow
The simplest form of animation flow, targeting a single track:
- Direct parameter control
- Independent timeline
- Immediate state updates
- Standalone behavior

#### 2. Group Flow
Complex animation flow affecting multiple tracks simultaneously:
- Coordinated parameter control
- Synchronized timeline
- Shared state updates
- Collective behavior

### Processing Pipeline

#### Individual Track Processing
1. **Input Validation**
   - Track existence verification
   - Parameter validation
   - Animation model compatibility check

2. **Animation Application**
   - Direct parameter mapping
   - Independent timeline tracking
   - Immediate state updates
   - Single animation stack processing

3. **Output Generation**
   - Direct position calculation
   - Single OSC message generation
   - Immediate feedback

#### Group Processing
1. **Input Validation**
   - Group existence verification
   - Member resolution
   - Collective parameter validation
   - Group behavior compatibility

2. **Animation Distribution**
   - Parameter distribution to members
   - Relative position calculations
   - Synchronized timeline management
   - Shared animation stack processing

3. **Output Generation**
   - Coordinated position calculations
   - Multiple synchronized OSC messages
   - Collective state updates

### Behavioral Differences

#### Individual Track Behavior
- **State Management**
  - Independent state tracking
  - Direct parameter updates
  - Standalone animation timeline
  - Individual position history

- **Animation Control**
  - Direct position manipulation
  - Independent parameter control
  - Single animation stack
  - Immediate state changes

- **Output Handling**
  - Single message generation
  - Direct parameter mapping
  - Independent update timing
  - Standalone feedback

#### Group Behavior
- **State Management**
  - Shared state tracking
  - Coordinated parameter updates
  - Synchronized animation timeline
  - Collective position history

- **Animation Control**
  - Relative position manipulation
  - Coordinated parameter control
  - Shared animation stack
  - Synchronized state changes

- **Output Handling**
  - Multiple message coordination
  - Parameter distribution
  - Synchronized update timing
  - Collective feedback

### Performance Considerations

#### Individual Track Optimization
- Direct state access
- Minimal validation overhead
- Single-thread processing
- Immediate updates

#### Group Optimization
- Batch state updates
- Shared validation context
- Multi-thread processing capability
- Coordinated updates

### Integration Points

#### Individual Track Integration
- Direct OSC messaging
- Simple state synchronization
- Independent error handling
- Standalone recovery

#### Group Integration
- Coordinated OSC messaging
- Complex state synchronization
- Collective error handling
- Group-wide recovery

## Animation Model Behavior Modes

For individual tracks not belonging to a group, the animation engine supports two fundamental behavior modes: Relative and Absolute. The user selects the desired behavior mode through the UI when configuring the animation.

#### User Configuration

- Behavior mode selection available in UI
- Choice between Relative and Absolute
- Applied per animation configuration
- Can be modified through UI controls
- Takes effect when animation starts

#### Behavior Modes

1. **Absolute Mode**
   - Selected when exact positions are needed
   - Requires user input for starting position:
     - Input fields for position coordinates in UI
     - Validation button to confirm position
     - Position validation before model start
   - Model calculates final positions directly
   - Uses fixed coordinate space
   - Position updates override current position
   - Calculations use target space coordinates
   - Example: Moving to specific coordinates (x,y)

2. **Relative Mode**
   - Selected when incremental movement is desired
   - Model calculations start from initial track position
   - Applies incremental changes from initial position
   - Preserves spatial relationships
   - Position updates are relative to initial position
   - Example: Moving 2 units forward from initial position

#### Mode Impact on Processing

1. **Position Calculation**
   - **Absolute**: 
     ```
     // Starting position entered by user through UI
     starting_position = user_input_position
     final_position = model_calculation(starting_position)
     ```
   - **Relative**: 
     ```
     delta = model_calculation()
     final_position = initial_position + delta
     ```

2. **Reference Points**
   - **Absolute**: 
     - Uses user-defined starting position
     - Requires UI input and validation
     - Must be set before model start
   - **Relative**: Uses initial track position as reference

3. **State Updates**
   - **Absolute**: 
     - Validates user input position
     - Stores validated starting position
     - Uses position as model reference
   - **Relative**: Position changes from initial state

#### Model Application Process

1. **Mode Detection**
   - Read user-selected behavior from UI
   - For absolute mode:
     - Wait for user position input
     - Validate input coordinates
     - Store as starting position
   - For relative mode:
     - Store initial track position
   - Set processing parameters

2. **Position Processing**
   - For absolute mode:
     - Use validated user starting position
     - Apply model calculations
     - Transform in target space
   - For relative mode:
     - Use stored initial position as reference
     - Calculate deltas from initial position
     - Apply transformations relative to start

3. **State Management**
   - Update position according to user-selected mode
   - Maintain movement history
   - Track behavioral context
   - Store reference positions:
     - User-input position for absolute mode
     - Initial position for relative mode

## Initial Position Management

The Animation Engine relies on initial position data that is queried and stored when tracks or groups are added to the application. This process is handled through a coordinated flow between the UI, OSC layer, and state manager.

#### Position Acquisition Flow

1. **UI Interaction**
   - User adds track(s) through the UI
   - UI triggers track/group creation event
   - Request is forwarded to Rust core

2. **OSC Layer Processing**
   - Rust OSC layer sends position queries
   - Communicates with Holophonix device
   - Receives current position data
   - Validates received coordinates

3. **State Management**
   - State manager stores received positions
   - Associates positions with track IDs
   - Maintains position history
   - Ensures data consistency

#### Individual Track Processing
- Single OSC query for position
- Direct position storage in state
- Immediate UI feedback
- Ready for animation application

#### Group Processing
- Parallel OSC queries for all members
- Collective position storage
- Group spatial relationship recording
- Synchronized state updates

### Position Data Flow

#### Track Addition
```
UI Action → Rust Core → OSC Query → Position Receipt → State Storage → UI Update
```
- User adds track in UI
- Position query sent via OSC
- Position data received
- State manager stores position
- UI reflects current position

#### Group Addition
```
UI Action → Member Resolution → Parallel OSC Queries → Collective Storage → UI Update
```
- User creates group in UI
- Members identified
- Multiple position queries sent
- All positions stored together
- UI updates with group state

### State Storage Structure

#### Individual Track Data
- Track ID
- Current position
- Position timestamp
- Coordinate system info

#### Group Data
- Group ID
- Member track IDs
- Member positions
- Spatial relationships

## Position Update Mechanisms

The system provides multiple ways to update track positions through dedicated UI buttons, allowing users to refresh position data at various scopes.

#### Update Scopes

1. **Individual Track Updates**
   - Single track position refresh
   - Dedicated update button per track
   - Direct OSC query and state update
   - Immediate UI reflection

2. **Group Member Updates**
   - Per-member update buttons
   - Update all group members button
   - Parallel OSC queries for group
   - Synchronized state updates

3. **Global Updates**
   - Update all tracks button
   - Covers both individual and group members
   - Batch OSC queries
   - Complete state refresh

#### Update Flow Process

```
UI Update Button → OSC Query → Position Receipt → State Update → UI Refresh
```

1. **Trigger Phase**
   - User clicks relevant update button
   - System identifies update scope
   - Prepares query batch

2. **Query Phase**
   - OSC layer sends position queries
   - Handles single or multiple tracks
   - Manages response collection
   - Validates received data

3. **Storage Phase**
   - State manager updates positions
   - Maintains update history
   - Triggers UI refresh
   - Updates relevant displays

#### Update Scenarios

1. **Single Track Update**
   ```
   Track Update Button → Single OSC Query → Position Update → UI Refresh
   ```

2. **Group Member Update**
   ```
   Member Update Button → Member OSC Query → Member Position Update → Group State Update
   ```

3. **Full Group Update**
   ```
   Group Update Button → Parallel Member Queries → Collective Position Updates → Group Refresh
   ```

4. **Global Update**
   ```
   Global Update Button → All Track Queries → Complete State Refresh → Full UI Update
   ```

## Integration Points

### State Management Integration

The Animation Engine tightly integrates with the State Management system for maintaining animation state and configuration.

#### State Synchronization
- **State Updates**
  - Animation configuration persistence
  - Real-time state changes
  - Track and group associations
  - Parameter updates
  - Animation lifecycle events

#### Configuration Management
- **Model Configuration**
  - Animation model parameters
  - Track assignments
  - Group configurations
  - Timing settings
  - Boundary conditions

#### Persistence Layer
- **State Serialization**
  - Animation model serialization
  - Parameter persistence
  - Configuration storage
  - State recovery data

### OSC Layer Integration

The Animation Engine interfaces with the OSC Layer for real-time control and position updates.

#### Message Handling
- **Incoming Messages**
  - Position update commands
  - Control messages (start/stop/pause)
  - Parameter modifications
  - Synchronization signals
  - External triggers

- **Outgoing Messages**
  - Position updates
  - Animation state changes
  - Status notifications
  - Error reports
  - Sync acknowledgments

#### Protocol Integration
- **OSC Address Patterns**
  - `/animation/[id]/position`
  - `/animation/[id]/control`
  - `/animation/[id]/params`
  - `/animation/[id]/status`
  - `/animation/[id]/sync`

- **Message Formats**
  - Position data structures
  - Control command formats
  - Parameter update formats
  - Status report formats
  - Error message formats

### N-API Bridge Integration

The Animation Engine exposes its functionality to the JavaScript layer through the N-API Bridge.

#### Exposed Functionality
- **Animation Control**
  - Create/delete animations
  - Start/stop/pause
  - Parameter modifications
  - State queries
  - Event subscriptions

- **Data Marshalling**
  - Position data conversion
  - Parameter serialization
  - State object mapping
  - Error handling
  - Event data formatting

#### Async Operations
- **Event Handling**
  - Animation state changes
  - Position updates
  - Error notifications
  - Status changes
  - External triggers

- **Callback Management**
  - Progress updates
  - State change notifications
  - Error reporting
  - Performance metrics
  - Debug information

### Thread Management

The Animation Engine manages multiple threads for optimal performance and responsiveness.

#### Thread Architecture
- **Computation Thread**
  - Animation calculations
  - Position updates
  - Parameter processing
  - Performance monitoring

- **Communication Thread**
  - OSC message handling
  - State synchronization
  - Event dispatching
  - External communication

- **Bridge Thread**
  - JavaScript callbacks
  - Event queuing
  - Data marshalling
  - Async operations

#### Synchronization Mechanisms
- **Thread Safety**
  - Mutex protection
  - Atomic operations
  - Lock-free algorithms
  - Memory barriers
  - Thread pools

### Error Handling and Recovery

Comprehensive error handling across component boundaries.

#### Error Types
- **State Errors**
  - Invalid state transitions
  - Serialization failures
  - State corruption
  - Recovery failures

- **OSC Errors**
  - Communication failures
  - Protocol violations
  - Message validation errors
  - Timing errors

- **Bridge Errors**
  - Marshalling errors
  - Callback failures
  - Memory errors
  - Thread errors

#### Recovery Strategies
- **State Recovery**
  - State rollback
  - Configuration reload
  - Safe state restoration
  - Graceful degradation

- **Communication Recovery**
  - Message retries
  - Connection reestablishment
  - Protocol fallbacks
  - Error reporting

### Performance Optimization

Cross-component performance optimization strategies.

#### Inter-component Optimization
- **Data Flow Optimization**
  - Minimal copying
  - Zero-copy transfers
  - Batch processing
  - Message coalescing

- **Resource Sharing**
  - Memory pools
  - Thread pools
  - Buffer reuse
  - Cache optimization

## Coordinate System Modes

The animation engine supports different coordinate system modes for position calculations: AED (Azimuth, Elevation, Distance) and XYZ (Cartesian coordinates). Models may operate in AED, XYZ, or both modes.

#### Mode Determination

1. **Model Capabilities**
   - AED-only models
   - XYZ-only models
   - Dual-mode models (both AED and XYZ)

2. **Mode Selection**
   - For dual-mode models:
     - User selects mode through UI
     - Choice between AED or XYZ
     - Selection required before model start
   - For single-mode models:
     - Mode fixed by model type
     - No user selection needed
     - Mode displayed in UI

#### Coordinate Processing

1. **AED Mode**
   - Azimuth calculations (angular position)
   - Elevation computations (height angle)
   - Distance calculations (from origin)
   - Spherical coordinate transformations

2. **XYZ Mode**
   - X-axis calculations (left/right)
   - Y-axis computations (front/back)
   - Z-axis calculations (up/down)
   - Cartesian coordinate transformations

#### Mode-Specific Processing

1. **Position Handling**
   - **AED Mode**: 
     ```
     position = (azimuth, elevation, distance)
     ```
   - **XYZ Mode**: 
     ```
     position = (x, y, z)
     ```

2. **Calculations**
   - **AED Mode**:
     - Angular calculations
     - Spherical transformations
     - Polar coordinate math
   - **XYZ Mode**:
     - Linear calculations
     - Cartesian transformations
     - Vector math

#### UI Integration

1. **Mode Selection Interface**
   - For dual-mode models:
     - Coordinate system selector
     - Mode switch controls
     - Visual mode indicator
   - For single-mode models:
     - Mode display
     - Parameter input fields matching mode
     - Coordinate system indicator

2. **Parameter Input**
   - **AED Mode**:
     - Azimuth angle input
     - Elevation angle input
     - Distance value input
   - **XYZ Mode**:
     - X coordinate input
     - Y coordinate input
     - Z coordinate input

#### Processing Pipeline

1. **Mode Setup**
   - Determine model capabilities
   - Present UI options if applicable
   - Configure calculation framework
   - Set coordinate system context

2. **Execution**
   - Load appropriate calculations
   - Apply mode-specific transformations
   - Process position updates
   - Generate mode-specific output

#### State Management

1. **Mode State**
   - Current coordinate system
   - Model mode capabilities
   - User selection (if applicable)
   - Processing context

2. **Position State**
   - Coordinate values
   - System-specific parameters
   - Transformation cache
   - Update history

## Dimensional Processing Modes

The animation engine processes models based on their dimensional capabilities (1D, 2D, or 3D) and the coordinates they affect. For 1D and 2D models, users select which specific coordinates or planes are affected through the UI parameters panel.

#### Dimensional Capabilities

1. **1D Models**
   - Single coordinate manipulation
   - User selects affected coordinate in UI:
     - AED mode options:
       - Azimuth-only movement
       - Elevation-only movement
       - Distance-only movement
     - XYZ mode options:
       - X-axis-only movement
       - Y-axis-only movement
       - Z-axis-only movement

2. **2D Models**
   - Two coordinate manipulation
   - User selects affected plane in UI:
     - AED mode options:
       - Azimuth-Elevation plane
       - Azimuth-Distance plane
       - Elevation-Distance plane
     - XYZ mode options:
       - XY plane
       - XZ plane
       - YZ plane

3. **3D Models**
   - Full coordinate manipulation
   - No coordinate selection needed
   - AED mode: All spherical coordinates
   - XYZ mode: All Cartesian coordinates

#### UI Parameter Configuration

1. **Coordinate Selection Interface**
   - For 1D Models:
     - Dropdown or radio buttons for coordinate selection
     - Visual indication of selected coordinate
     - Coordinate-specific parameter inputs
     - Validation of selection

   - For 2D Models:
     - Plane selection controls
     - Visual representation of selected plane
     - Plane-specific parameter inputs
     - Selection validation

2. **Parameter Organization**
   - Coordinate selection at top of panel
   - Dynamic parameter display based on selection
   - Clear visual grouping of related parameters
   - Immediate feedback on selection

#### Coordinate Application

1. **Model Definition**
   - Dimensional capability specification
   - User-selected coordinate mapping
   - Valid coordinate combinations
   - Coordinate constraints

2. **Processing Rules**
   - Process user-selected coordinates only
   - Maintain unaffected coordinates
   - Apply dimensional constraints
   - Handle coordinate dependencies

#### Processing Implementation

1. **1D Processing**
   ```
   // User-selected coordinate processing
   new_position = (
     coordinate_selected == "azimuth" ? calculate_new_azimuth() : current_azimuth,
     coordinate_selected == "elevation" ? calculate_new_elevation() : current_elevation,
     coordinate_selected == "distance" ? calculate_new_distance() : current_distance
   )
   ```

2. **2D Processing**
   ```
   // User-selected plane processing
   new_position = {
     switch(selected_plane) {
       case "AE":
         return (new_azimuth, new_elevation, current_distance)
       case "AD":
         return (new_azimuth, current_elevation, new_distance)
       case "ED":
         return (current_azimuth, new_elevation, new_distance)
     }
   }
   ```

#### State Management

1. **Coordinate Selection State**
   - Store user coordinate selection
   - Track affected coordinates
   - Maintain unaffected values
   - Validate selection state

2. **Update Management**
   - Apply updates to selected coordinates only
   - Preserve unselected coordinate values
   - Validate coordinate updates
   - Maintain state consistency

Note: The UI parameters panel provides clear controls for selecting which coordinates or planes are affected by 1D and 2D models. This selection is required before the animation can begin.

## Animation Model Application

This section covers the basic case where a single animation model is applied to an individual track. More complex scenarios (multiple chained models, group animations) will be covered in subsequent sections.

#### Model Selection and Assignment

1. **User Model Selection**
   - Model chosen through UI
   - Single model per track (basic case)
   - Model parameters configurable in UI
   - Model assigned to specific track

2. **Model Configuration**
   - Model type identification
   - Parameter validation
   - Behavior mode setting (relative/absolute)
   - Starting position configuration

#### Model Processing Pipeline

1. **Model Initialization**
   - Load selected model type
   - Apply user configurations
   - Initialize model parameters
   - Set up calculation context

2. **Track Association**
   - Link model to target track
   - Verify track compatibility
   - Establish processing context
   - Prepare state management

3. **Execution Setup**
   - Configure processing parameters
   - Set up timing framework
   - Initialize position calculations
   - Prepare output handling

#### Processing Flow

```
User Selection → Model Config → Track Association → Execution
     ↓              ↓               ↓                 ↓
Model Choice    Parameters     Track Binding      Animation
     ↓              ↓               ↓                 ↓
UI Input       Validation     State Setup        Processing
```

#### State Management

1. **Model State**
   - Current model type
   - Model parameters
   - Execution status
   - Calculation context

2. **Track State**
   - Track identifier
   - Current position
   - Model association
   - Animation status

3. **Processing State**
   - Execution phase
   - Timing information
   - Position updates
   - Output status

#### Simple Case Constraints

- Single model per track
- Individual track processing
- No model chaining
- Direct track-to-model mapping
- Straightforward execution flow

Note: More complex scenarios involving multiple models, model chaining, and group animations will be detailed in subsequent sections.

## Performance Considerations

### Optimization Strategies
1. **Computation Optimization**
   - Vector math optimization
   - SIMD operations
   - Cache-friendly data structures
   - Memory pooling

2. **Resource Management**
   - Memory efficiency
   - CPU utilization
   - Thread management
   - Resource pooling

3. **Real-time Performance**
   - Deterministic timing
   - Low latency
   - Smooth transitions
   - Consistent frame rate

### Error Handling

1. **Runtime Errors**
   - Boundary violations
   - Parameter validation
   - Resource exhaustion
   - Timing issues

2. **Recovery Strategies**
   - Graceful degradation
   - State recovery
   - Error correction
   - Fallback modes

## Future Considerations

### Planned Enhancements
- Additional animation models
- Advanced interpolation methods
- Multi-track animations
- Complex path generation
- Performance optimizations

### Extensibility
- Plugin system
- Custom model support
- External control integration
- Advanced synchronization
- Third-party integration

## Animation Execution Control

#### Timing and Synchronization
1. **Animation Timeline**
   - Start time reference
   - Duration management
   - Frame rate control
   - Synchronization points

2. **Playback Control**
   - Play/Pause functionality
   - Stop and reset capabilities
   - Speed control (if supported)
   - Loop behavior management

#### Error Handling and Recovery
1. **Validation Checks**
   - Parameter bounds verification
   - Coordinate range validation
   - Model-specific constraints
   - State consistency checks

2. **Error Recovery**
   - Position reset capabilities
   - State recovery mechanisms
   - Graceful degradation options
   - Error notification system

#### Resource Management
1. **Memory Management**
   - Position history buffering
   - State cache management
   - Resource cleanup
   - Memory optimization

2. **Processing Optimization**
   - Calculation scheduling
   - Update batching
   - Resource prioritization
   - Performance monitoring

#### Animation Progress Tracking
1. **Progress Monitoring**
   - Completion percentage
   - Current animation phase
   - Time remaining
   - Frame counting

2. **State Reporting**
   - Position updates
   - Parameter changes
   - Error conditions
   - Performance metrics

#### OSC Communication
1. **Message Management**
   - Position update messages
   - Timing synchronization
   - Error reporting
   - State updates

2. **Communication Control**
   - Message rate limiting
   - Bandwidth optimization
   - Connection monitoring
   - Retry mechanisms

#### Model Chain Preparation
1. **Future Extension Support**
   - Prepare for model chaining
   - State transition handling
   - Parameter inheritance
   - Chain validation

Note: These additional aspects ensure robust animation execution, proper error handling, and efficient resource utilization. They also prepare the engine for future extensions like model chaining and group animations.
