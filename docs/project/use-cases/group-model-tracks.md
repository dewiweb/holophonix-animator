# Single Model Applied to Group of Tracks

## Overview

Groups of tracks can be created to apply a single animation model across multiple audio objects. This allows for coordinated movement patterns while maintaining specific relationships between tracks.

## Configuration Steps

### 1. Group Creation
- Use the Add Tracks form in the UI
- Specify track patterns to create groups:
  - Range syntax: `[start-end]` (e.g., `[1-10]` for tracks 1 through 10)
  - Set syntax: `{track1,track2,...}` (e.g., `{2,5,8}` for specific tracks)
  - Multiple patterns can be combined
- Selected tracks are automatically grouped for model application

### 2. Group Selection and Validation
- User selects multiple tracks to form a group
- System validates group formation:
  - Track compatibility check
  - Position state verification
  - Resource availability assessment

### 3. Model Selection and Configuration
- User chooses an animation model
- System validates model compatibility with group operation
- User configures model parameters:
  - Common parameters for the group
  - Group-specific parameters (e.g., spacing, formation)
  - Coordinate system selection (if supported)
  - Dimensional constraints (if applicable)

### 4. Track Relationship Configuration
- Select relationship type from Parameters Panel:
  - Leader-Follower: One track leads, others follow with defined offsets
  - Isobarycentric: Tracks move relative to their calculated center point
  - As Individuals: Each track maintains its own relative position
- Configure relationship parameters:
  - For Leader-Follower:
    - Leader track selection in Parameters Panel
    - Position offset parameters for followers
    - Time offset parameters for followers
  - For Isobarycentric:
    - Center point calculation parameters
    - Individual track weight parameters
    - Position offset parameters
  - For As Individuals:
    - Only available with 'relative' model option
    - Individual position offsets
    - Independent movement parameters

### 5. Execution Mode Selection
- Choose cycle mode (one-shot/cyclic)
- Configure interpolation settings:
  - Group-wide interpolation
  - Individual track adjustments
  - Relative position maintenance

## Track Relationships

### Leader-Follower Relationship
- Primary track (leader):
  - Directly follows the animation model path
  - Determines the base movement pattern
  - Can have unique movement parameters
- Secondary tracks (followers):
  - Maintain defined offsets from leader
  - Can have individual delay parameters
  - Follow leader's path with modifications

### Isobarycentric Relationship
- Virtual center point:
  - Calculated from all track positions
  - Serves as the reference for model application
  - Updates based on group movement
- Individual tracks:
  - Maintain relative positions to center
  - Move as a cohesive unit
  - Can have weighted influence on center

### As Individuals Relationship
- Independent track handling:
  - Each track maintains its own relative position
  - No shared reference point or dependencies
  - Movement calculated independently
- Model constraints:
  - Only compatible with 'relative' model option
  - Prevents overlapping positions
  - Maintains spatial separation
- Track parameters:
  - Individual position offsets
  - Independent timing parameters
  - Separate interpolation settings

## Model Configuration

### Model Application Options
- Based on relationship type and model nature:
  - Applied to center/leader in centric relationships
  - Applied to each track independently for 'as individuals'

### Coordinate System Options
- Relative/Absolute positioning:
  - Leader-Follower: Both available for leader movement
  - Isobarycentric: Both available for center point movement
  - As Individuals: Relative only (absolute would place all tracks at same position)
- 1D/2D coordinates:
  - Available based on model nature
  - Applies to center/leader movement in centric relationships
  - Applies to each track in 'as individuals'

### Movement Plane Selection
- For 2D models:
  - XY, XZ, YZ plane selection available
  - Applies to center/leader in centric relationships
  - Individual plane selection for 'as individuals'

### Interpolation Configuration
- Starting/stopping interpolation:
  - Configurable for center/leader movement
  - Affects entire group in centric relationships
  - Shared across all tracks in 'as individuals'
- Interpolation parameters:
  - Duration and curve type
  - Applied to center movement in centric relationships
  - Shared across all tracks in 'as individuals'

### Relationship-Specific Options

#### Leader-Follower
- Leader configuration:
  - Full model parameter access
  - All coordinate system options
  - Complete interpolation control
- Follower constraints:
  - Relative positioning only
  - Movement derived from leader
  - Interpolation inherited from leader

#### Isobarycentric
- Center point configuration:
  - Full model parameter access
  - All coordinate system options
  - Group-wide interpolation control
- Member constraints:
  - Relative positioning only
  - Formation-preserving movement
  - Synchronized with center interpolation

#### As Individuals
- Track configuration:
  - Same model parameter values applied to all tracks in group
  - Relative positioning only (required to maintain spatial separation)
  - Shared interpolation settings across group
- Movement constraints:
  - Spatial separation preserved through relative positioning
  - Independent coordinate systems
  - Synchronized interpolation behavior
- Model parameters:
  - Single set of parameters shared across all tracks
  - Changes to parameters affect entire group uniformly
  - Model-specific values applied identically to each track
  - Common interpolation settings for all tracks

## Model Application

### Center-Based Animation
- For relationship types with a center reference:
  - Animation model is applied to the center point/track
  - Relationships between center and tracks are strictly preserved during animation
  - Each center position update triggers position updates for all group members
  - All group member positions are sent simultaneously to maintain synchronization

### Relationship-Specific Behavior

#### Leader-Follower Relationship
- Model applies directly to leader track
- Leader track becomes the center of movement
- Every leader position update:
  - Triggers immediate follower position calculations
  - Results in synchronized position updates for all followers
  - Ensures group cohesion through simultaneous position sending

#### Isobarycentric Relationship
- Model applies to calculated center point
- Center point acts as virtual reference track
- Each center update:
  - Triggers recalculation of all group member positions
  - Results in simultaneous position updates for entire formation
  - Maintains perfect group synchronization through atomic updates

#### As Individuals Relationship
- Model applies to each track independently
- No central reference point
- Only available with 'relative' model option
- Each track:
  - Maintains its own position offset
  - Follows model path independently
  - Preserves spatial separation

## Execution Flow

### Initialization Phase
1. Group State Setup
   - Capture initial positions of all tracks
   - Calculate reference positions based on relationship type
   - Initialize relationship-specific parameters

2. Model Preparation
   - Initialize model with group parameters
   - Set up position calculations based on relationship type
   - Prepare interpolation system

### Execution Phase
1. Position Updates
   - Calculate primary reference position (leader or center)
   - Apply model transformations
   - Update individual track positions based on relationships

2. State Management
   - Track group-wide state
   - Monitor relative positions
   - Handle relationship maintenance

3. Interpolation Handling
   - Manage transitions while maintaining relationships
   - Handle individual track adjustments
   - Preserve relative positioning

## Error Handling

### Group-Level Errors
1. Relationship Violations
   - Detection of invalid positions
   - Automatic correction attempts
   - User notification if needed

2. Resource Constraints
   - Group size limitations
   - Computation resource management
   - Communication bandwidth control

### Track-Level Errors
1. Individual Track Issues
   - Position update failures
   - Communication errors
   - State inconsistencies

2. Recovery Procedures
   - Individual track recovery
   - Relationship reestablishment
   - State synchronization

## Performance Considerations

### Computation Efficiency
1. Group Calculations
   - Optimized reference point updates
   - Efficient relationship maintenance
   - Batch position processing

2. Resource Management
   - Memory pooling for group data
   - Efficient state tracking
   - Optimized communication patterns

### Scalability
1. Group Size Handling
   - Dynamic resource allocation
   - Performance scaling strategies
   - Load balancing mechanisms

2. Relationship Complexity
   - Efficient relative position calculations
   - Optimized constraint checking
   - Streamlined state updates
