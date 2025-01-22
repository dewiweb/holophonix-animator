# OSC Protocol Reference

## Overview

The Holophonix Animator implements OSC (Open Sound Control) communication using the Node.js `osc` module for efficient and reliable messaging.

## Network Configuration
```typescript
interface OSCConfig {
  localPort: number;      // Default: 9000
  localAddress: string;   // Default: '0.0.0.0'
  remotePort: number;     // Default: 9001
  remoteAddress: string;  // Default: '127.0.0.1'
  metadata: boolean;      // Enable type metadata
}
```

## Message Types

### 1. Position Control
```typescript
// Single position update
{
  address: '/track/1/xyz',
  args: [
    { type: 'f', value: 1.0 },  // x
    { type: 'f', value: 2.0 },  // y
    { type: 'f', value: 3.0 }   // z
  ]
}

// Batch position update (using bundles)
{
  timeTag: osc.timeTag(0),
  packets: [
    {
      address: '/track/1/xyz',
      args: [
        { type: 'f', value: 1.0 },
        { type: 'f', value: 2.0 },
        { type: 'f', value: 3.0 }
      ]
    },
    {
      address: '/track/2/xyz',
      args: [
        { type: 'f', value: 4.0 },
        { type: 'f', value: 5.0 },
        { type: 'f', value: 6.0 }
      ]
    }
  ]
}
```

### 2. Animation Control
```typescript
// Start animation
{
  address: '/animation/start',
  args: [
    { type: 's', value: 'circular' },  // pattern
    { type: 'i', value: 1 }            // track ID
  ]
}

// Update parameters
{
  address: '/animation/params',
  args: [
    { type: 'i', value: 1 },    // track ID
    { type: 'f', value: 2.0 },  // radius
    { type: 'f', value: 1.0 }   // speed
  ]
}
```

## Performance Optimization

### 1. Message Bundling
- Group related messages into bundles
- Reduce network overhead
- Maintain timing relationships
- Optimize packet size

### 2. Type Tags
- Use explicit type tags
- Enable fast parsing
- Ensure data integrity
- Support all OSC types

### 3. Error Handling
- Validate message format
- Check value ranges
- Handle network errors
- Provide error feedback

## Example Implementation

```typescript
import * as osc from 'osc';

class OSCController {
  private port: osc.UDPPort;

  constructor(config: OSCConfig) {
    this.port = new osc.UDPPort({
      localAddress: config.localAddress,
      localPort: config.localPort,
      remoteAddress: config.remoteAddress,
      remotePort: config.remotePort,
      metadata: true
    });

    this.port.on('ready', () => {
      console.log('OSC Port ready');
    });

    this.port.on('error', (error) => {
      console.error('OSC error:', error);
    });

    this.port.open();
  }

  sendPosition(trackId: number, x: number, y: number, z: number) {
    this.port.send({
      address: `/track/${trackId}/xyz`,
      args: [
        { type: 'f', value: x },
        { type: 'f', value: y },
        { type: 'f', value: z }
      ]
    });
  }

  sendBundle(messages: OSCMessage[]) {
    this.port.send({
      timeTag: osc.timeTag(0),
      packets: messages
    });
  }
}
```

## 1. Holophonix Device Communication

### Message Format

#### Basic Structure
```
/path/to/parameter <type tag> <value>
```

#### Common Paths

1. Track Control
```
# Position Control
/track/{id}/xyz <fff> <x> <y> <z>           # x,y,z in meters
/track/{id}/aed <fff> <azim> <elev> <dist>  # azim: 0-360°, elev: -90-90°, dist in meters

# Individual Coordinates
/track/{id}/x <f> <value>      # X coordinate in meters
/track/{id}/y <f> <value>      # Y coordinate in meters
/track/{id}/z <f> <value>      # Z coordinate in meters
/track/{id}/azim <f> <value>   # Azimuth: 0-360°
/track/{id}/elev <f> <value>   # Elevation: -90-90°
/track/{id}/dist <f> <value>   # Distance in meters (non-negative)

# Coordinate Pairs
/track/{id}/xy <ff> <x> <y>    # X,Y coordinates in meters
/track/{id}/ae <ff> <a> <e>    # Azimuth (0-360°), Elevation (-90-90°)

# Relative Movement
/track/{id}/x+ <f> <delta>      # Increment X by delta meters
/track/{id}/x- <f> <delta>      # Decrement X by delta meters
/track/{id}/y+ <f> <delta>      # Increment Y by delta meters
/track/{id}/y- <f> <delta>      # Decrement Y by delta meters
/track/{id}/z+ <f> <delta>      # Increment Z by delta meters
/track/{id}/z- <f> <delta>      # Decrement Z by delta meters
/track/{id}/azim+ <f> <delta>   # Increment azimuth by delta degrees
/track/{id}/azim- <f> <delta>   # Decrement azimuth by delta degrees
/track/{id}/elev+ <f> <delta>   # Increment elevation by delta degrees
/track/{id}/elev- <f> <delta>   # Decrement elevation by delta degrees
/track/{id}/dist+ <f> <delta>   # Increment distance by delta meters
/track/{id}/dist- <f> <delta>   # Decrement distance by delta meters

# Audio Properties
/track/{id}/gain/value <f> <value>  # Gain in dB (-60 to +12)
/track/{id}/mute <T|F> <value>      # Boolean (true/false)

# Visual Properties
/track/{id}/color <ffff> <r> <g> <b> <a>  # RGBA values (0.0 to 1.0)
```

2. State Queries
```
# Query Format
/get <s> <parameter_path>  # Query any parameter

# Query Examples
/get "track/{id}/xyz"         # Get XYZ position
/get "track/{id}/aed"         # Get AED position
/get "track/{id}/xy"          # Get XY position
/get "track/{id}/ae"          # Get AE position
/get "track/{id}/gain/value"  # Get gain value
/get "track/{id}/mute"        # Get mute state
/get "track/{id}/color"       # Get track color

```

## 2. External Control Interface

The Holophonix Animator can receive OSC messages from external applications to control animations and application state.

### Animation Control
```
# Transport Controls
/animation/{id}/play            # Start animation playback
/animation/{id}/pause           # Pause animation playback
/animation/{id}/stop            # Stop animation playback

# Animation States
/animation/{id}/active T          # Enable animation
/animation/{id}/active F          # Disable animation
/animation/{id}/loop T            # Enable loop mode
/animation/{id}/loop F            # Disable loop mode
/animation/{id}/speed f 1.0       # Set playback speed multiplier (default: 1.0)

# Timeline Control
/animation/{id}/marker i          # Jump to marker number
/animation/{id}/time f            # Set current time in seconds
```

### Examples

```
# Start Animation Playback
/animation/1/play

# Set Animation Speed
/animation/1/speed f 0.5

# Enable Loop Mode
/animation/1/loop T

# Set Timeline Position
/animation/1/time f 0.5
```

### Notes

1. **Port Configuration**
   - Default input port (9000) can be configured in application settings
   - Multiple external applications can send control messages

2. **Message Handling**
   - All messages are processed in order of arrival
   - Invalid messages are ignored
   - State changes trigger internal events

3. **Future Expansion**
   - Additional control parameters may be added in future versions
   - Backward compatibility will be maintained
   - New features will be documented in release notes

## Message Types

### 1. Control Messages
- Setting parameter values (position, gain, mute, color)
- Parameter updates
- State queries

### 2. Status Messages
- State updates
- Error reports
- Notifications

## Implementation Details

### 1. Message Handling
- Message parsing
- Type validation
- Error detection
- Response matching

### 2. Connection Management
- Connection setup
- Keep-alive mechanism
- Error recovery
- Connection monitoring

### 3. Performance
- Message batching
- Rate limiting
- Buffer management
- Latency optimization

## Error Handling

### 1. Network Errors
- Connection loss
- Timeout handling
- Retry logic
- State recovery

### 2. Protocol Errors
- Invalid messages
- Type mismatches
- Path errors
- Value validation

### 3. System Errors
- Resource issues
- State conflicts
- System limits
- Recovery procedures

## Best Practices

### 1. Message Design
- Use consistent paths
- Include type tags
- Validate values
- Handle errors

### 2. Performance
- Batch messages
- Minimize traffic
- Monitor latency
- Optimize timing

### 3. Reliability
- Implement timeouts
- Handle errors
- Verify delivery
- Monitor state

## Examples

### Parameter Queries and Responses
```
# Position Queries
/get "track/1/xyz"                          # Query XYZ position
Response: /track/1/xyz fff 0.5 0.3 0.2      # XYZ response

/get "track/1/aed"                          # Query AED position
Response: /track/1/aed fff 45.0 30.0 0.8    # AED response

/get "track/1/xy"                           # Query XY position
Response: /track/1/xy ff 0.5 0.3            # XY response

# Property Queries
/get "track/1/gain/value"                   # Query gain
Response: /track/1/gain/value f -6.0        # Gain response

/get "track/1/color"                        # Query color
Response: /track/1/color ffff 1.0 0.0 0.0 1.0  # Color response

/get "track/1/mute"                         # Query mute state
Response: /track/1/mute T                   # Mute response
```

### Position Updates
```
# Complete Coordinates
/track/1/xyz fff 0.5 0.3 0.2        # Cartesian coordinates
/track/1/aed fff 45.0 30.0 0.8      # Spherical coordinates

# Individual Coordinates
/track/1/x f 0.5                    # Set X coordinate
/track/1/y f 0.3                    # Set Y coordinate
/track/1/azim f 45.0                # Set azimuth
/track/1/elev f 30.0                # Set elevation

# Coordinate Pairs
/track/1/xy ff 0.5 0.3              # Set X and Y
/track/1/ae ff 45.0 30.0            # Set azimuth and elevation

# Relative Movement
/track/1/x+ f 0.1                   # Increment X by 0.1
/track/1/azim- f 5.0                # Decrement azimuth by 5 degrees
```

### Track Properties
```
# Gain Control
/track/1/gain/value f -6.0          # Set gain to -6 dB

# Visual Properties
/track/1/color ffff 1.0 0.0 0.0 1.0 # Solid red color

# Mute Control
/track/1/mute T                     # Mute the track
```

## OSC Protocol

## Overview

The Holophonix Animator uses OSC (Open Sound Control) for bidirectional communication with Holophonix devices. The protocol enables both sending commands and receiving responses on the same address patterns.

## Message Examples

```
# Setting track parameters
/track/1/gain/value f 0.8           # Set gain for track 1
/track/1/xy ff 0.5 0.3              # Set position for track 1

# Getting current values
/get "track/1/gain/value"           # Query gain
/get "track/1/xy"                   # Query position

# Response comes on same address pattern
/track/1/gain/value f 0.8           # Response with current gain
/track/1/xy ff 0.5 0.3              # Response with current position
```

## Message Types

### 1. Control Messages
- Setting parameter values (position, gain, mute, color)
- Parameter updates
- State queries

### 2. Status Messages
- State updates
- Error reports
- Notifications

## Implementation Details

### 1. Message Handling
- Message parsing
- Type validation
- Error detection
- Response matching

### 2. Connection Management
- Connection setup
- Keep-alive mechanism
- Error recovery
- Connection monitoring

### 3. Performance
- Message batching
- Rate limiting
- Buffer management
- Latency optimization

## Error Handling

### 1. Network Errors
- Connection loss
- Timeout handling
- Retry logic
- State recovery

### 2. Protocol Errors
- Invalid messages
- Type mismatches
- Path errors
- Value validation

### 3. System Errors
- Resource issues
- State conflicts
- System limits
- Recovery procedures

## Best Practices

### 1. Message Design
- Use consistent paths
- Include type tags
- Validate values
- Handle errors

### 2. Performance
- Batch messages
- Minimize traffic
- Monitor latency
- Optimize timing

### 3. Reliability
- Implement timeouts
- Handle errors
- Verify delivery
- Monitor state
