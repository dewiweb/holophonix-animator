# Single Model Application to Individual Track

This document illustrates the use case of applying a single animation model to an individual track, covering the complete flow from user configuration to animation execution.

## Use Case Flow

![Single Model Flow](diagrams/single-model-flow.mmd)

## Configuration Steps

1. **Track Selection**
   - User selects individual track
   - System loads track state
   - Current position displayed

2. **Model Selection**
   - User chooses animation model
   - System loads model capabilities:
     - Coordinate system support (AED/XYZ)
     - Dimensional capabilities (1D/2D/3D)
     - Parameter requirements

3. **Behavior Configuration**
   - User selects:
     - Relative/Absolute mode
     - Coordinate system (if applicable)
     - Affected coordinates (for 1D/2D)
   - System validates choices

4. **Parameter Setup**
   - Model-specific parameters
   - Starting position (if absolute mode)
   - Animation timing
   - Update rate

## Execution Flow

1. **Initialization**
   - Load track state
   - Query initial position
   - Initialize model
   - Set up animation timeline

2. **Animation Loop**
   - Calculate positions
   - Apply coordinate transformations
   - Send OSC updates
   - Update UI display

3. **State Management**
   - Track position history
   - Monitor execution
   - Handle errors
   - Report progress

## Position Interpolation

### Start-up Interpolation
1. **Absolute Mode**
   - Track starts from initial position
   - Smoothly interpolates to user-defined start position
   - Interpolation occurs before main animation begins
   - Ensures smooth transition to animation start point

2. **Relative Mode**
   - No initial interpolation needed
   - Animation starts directly from initial position
   - Model calculations begin immediately

### Stop Behavior (Both Modes)
1. **Animation Stop**
   - User triggers stop
   - Main animation calculations cease
   - Begin return interpolation phase

2. **Return to Initial**
   - Smoothly interpolate back to initial position
   - Maintain consistent movement speed
   - Update position until initial position reached
   - Complete stop once initial position achieved

### Interpolation Parameters
1. **Movement Control**
   - Interpolation speed/duration
   - Position update frequency
   - Smoothing function
   - Coordinate system handling

2. **State Management**
   - Track current interpolation progress
   - Monitor position updates
   - Ensure smooth transitions
   - Handle interruptions

## Animation Cycle Modes

### Mode Selection
1. **User Configuration**
   - Mode selection in parameters panel
   - Choice between cyclic and one-shot
   - Configuration before animation start
   - Can be modified between runs

2. **Mode Types**
   - **Cyclic Mode**:
     - Animation repeats continuously
     - Loops until user stops
     - Maintains continuous motion
     - No natural end point
   
   - **One-shot Mode**:
     - Single animation cycle
     - Stops automatically at completion
     - Returns to initial position
     - Clear start and end points

### Execution Behavior

1. **Cyclic Mode Execution**
   - Continuous animation cycles
   - No automatic termination
   - Only stops on user command
   - Seamless cycle transitions

2. **One-shot Mode Execution**
   - Single animation cycle
   - Automatic completion detection
   - Natural termination at end
   - Automatic return to initial position

### Termination Handling

1. **Cyclic Mode Stop**
   - User-initiated stop only
   - Clean cycle interruption
   - Begin return interpolation
   - Complete movement to initial position

2. **One-shot Mode Stop**
   - Two stop scenarios:
     - Natural completion
     - User interruption
   - Both cases trigger return interpolation
   - Return to initial position

### State Management

1. **Cycle Tracking**
   - Monitor cycle completion
   - Track animation progress
   - Handle mode transitions
   - Manage stop conditions

2. **Mode-specific States**
   - Cycle count (cyclic mode)
   - Completion percentage
   - Stop condition type
   - Return status

## Error Handling

1. **Input Validation**
   - Parameter bounds checking
   - Coordinate system validation
   - Position range verification

2. **Runtime Errors**
   - Position calculation errors
   - Communication failures
   - Resource issues

3. **Recovery Actions**
   - State reset
   - Position recovery
   - Error notification

## Performance Considerations

1. **Update Rate**
   - Position calculation frequency
   - OSC message rate
   - UI update frequency

2. **Resource Usage**
   - Memory management
   - CPU utilization
   - Network bandwidth

## Example Configuration

```javascript
{
    "track": {
        "id": "track_1",
        "type": "individual"
    },
    "model": {
        "type": "circular",
        "behavior": "relative",
        "coordinateSystem": "AED",
        "dimensions": "2D",
        "affectedCoordinates": ["azimuth", "distance"]
    },
    "parameters": {
        "radius": 2.0,
        "speed": 1.0,
        "direction": "clockwise"
    },
    "timing": {
        "duration": 10.0,
        "updateRate": 60
    }
}
```

This example shows a circular movement model applied to a single track, operating in relative mode on the azimuth-distance plane in AED coordinates.
