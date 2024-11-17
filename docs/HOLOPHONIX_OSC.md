# HOLOPHONIX OSC Documentation 📡

This document outlines the OSC (Open Sound Control) protocol implementation for HOLOPHONIX spatial audio systems.

## Configuration ⚙️

### Network Settings
- **Default Input Port**: 9000
- **Default Output Port**: 12000
- **Protocol**: UDP
- **Host**: localhost (127.0.0.1) for local testing, or IP address of HOLOPHONIX system

### OSC Message Format
Messages follow the standard OSC format:
```
/address/pattern [arguments]
```

## Track Control Messages 🎯

### Position Control
```
# Absolute Position (AED)
/track/{id}/azim {value}  # Azimuth: -180° to +180°
/track/{id}/elev {value}  # Elevation: -90° to +90°
/track/{id}/dist {value}  # Distance: 0 to max_distance

# Absolute Position (XYZ)
/track/{id}/x {value}     # X coordinate
/track/{id}/y {value}     # Y coordinate
/track/{id}/z {value}     # Z coordinate

# Combined Position
/track/{id}/aed {azimuth} {elevation} {distance}
/track/{id}/xyz {x} {y} {z}
```

### Visual Properties
```
# Track Color (RGBA)
/track/{id}/color {r} {g} {b} {a}  # Color values from 0.0 to 1.0
```

### Audio Properties
```
# Track Gain
/track/{id}/gain/value {value}  # Gain value in dB (-60 to +12)

# Track Mute
/track/{id}/mute {value}       # Boolean value (true/false)
```

### Query Paths
```
# Query Format
/get {address}               # Query any property by its address

# Examples of query addresses
"track/{id}/xyz"            # Query XYZ coordinates
"track/{id}/aed"            # Query AED coordinates
"track/{id}/gain/value"     # Query gain value
"track/{id}/mute"           # Query mute state
"track/{id}/color"          # Query track color
```

### Relative Movement
```
# Relative Changes (AED)
/track/{id}/azim+ {delta}  # Relative azimuth change
/track/{id}/elev+ {delta}  # Relative elevation change
/track/{id}/dist+ {delta}  # Relative distance change

# Relative Changes (XYZ)
/track/{id}/x+ {delta}     # Relative X change
/track/{id}/y+ {delta}     # Relative Y change
/track/{id}/z+ {delta}     # Relative Z change
```

### Track Groups
```
# Group Control
/track/[1-4]/*      # Control tracks 1 through 4
/track/{1,3,5}/*    # Control tracks 1, 3, and 5
/track/*/active     # Control all tracks
```

## Value Ranges 📊

### Coordinate Systems
1. **AED (Azimuth, Elevation, Distance)**
   - Azimuth: -180° to +180° or 0° to 360°
   - Elevation: -90° to +90°
   - Distance: 0 to configurable maximum

2. **XYZ (Cartesian)**
   - X: -max to +max (left to right)
   - Y: -max to +max (back to front)
   - Z: -max to +max (down to up)

### Value Types
- All position values are floating-point numbers
- Angles are in degrees
- Distances are in meters
- XYZ coordinates are in meters
- Color values are from 0.0 to 1.0
- Gain values are in decibels (dB)
  * Unity gain: 0 dB
  * Minimum: -60 dB
  * Maximum: +12 dB
- Mute values are boolean
  * true: muted
  * false: unmuted

## Examples 📝

1. **Set Absolute Position (AED)**
   ```
   /track/1/azim 90.0    # Set track 1 azimuth to 90°
   /track/1/elev 45.0    # Set track 1 elevation to 45°
   /track/1/dist 2.5     # Set track 1 distance to 2.5m
   ```

2. **Set Absolute Position (XYZ)**
   ```
   /track/1/x 1.0    # Set track 1 X to 1.0m
   /track/1/y 0.5    # Set track 1 Y to 0.5m
   /track/1/z 2.0    # Set track 1 Z to 2.0m
   ```

3. **Combined Position Updates**
   ```
   /track/1/aed 90.0 45.0 2.5    # Set AED in one message
   /track/1/xyz 1.0 0.5 2.0      # Set XYZ in one message
   ```

4. **Relative Movement**
   ```
   /track/1/azim+ 10.0    # Increase azimuth by 10°
   /track/1/dist+ -0.5    # Decrease distance by 0.5m
   ```

5. **Group Control**
   ```
   /track/[1-4]/azim 90.0    # Set azimuth for tracks 1-4
   /track/*/dist 2.0         # Set distance for all tracks
   ```

6. **Visual Properties**
   ```
   /track/1/color 0.12 0.56 1.0 1.0    # Set track 1 color to blue with full opacity
   /track/*/color 1.0 0.0 0.0 0.5      # Set all tracks to semi-transparent red
   ```

7. **Audio Properties**
   ```
   # Gain Control
   /track/1/gain/value 0.0     # Set track 1 gain to 0 dB (unity gain)
   /track/1/gain/value -60.0   # Set track 1 gain to minimum
   /track/*/gain/value -6.0    # Set all tracks to -6 dB
   
   # Mute Control
   /track/1/mute true         # Mute track 1
   /track/1/mute false        # Unmute track 1
   /track/*/mute true         # Mute all tracks
   ```

8. **Query Operations**
   ```
   # Position Queries
   /get "track/1/xyz"          # Returns /track/1/xyz {x} {y} {z}
   /get "track/1/aed"          # Returns /track/1/aed {azimuth} {elevation} {distance}
   
   # Audio Queries
   /get "track/1/gain/value"   # Returns /track/1/gain/value {value}
   /get "track/1/mute"         # Returns /track/1/mute {true/false}
   
   # Visual Queries
   /get "track/1/color"        # Returns /track/1/color {r} {g} {b} {a}
   
   # Multiple Track Queries (using patterns)
   /get "track/*/xyz"          # Returns XYZ for all tracks
   /get "track/[1-4]/gain/value"  # Returns gain values for tracks 1-4
   ```

## Response Format 📥

When querying track properties using /get, the response will be sent back in the following format:
- Response uses the address from the query argument
- Values formatted according to their type:
  * Coordinates: floating-point numbers
  * Gain: dB value (-60 to +12)
  * Mute: boolean (true/false)
  * Color: RGBA values (0.0 to 1.0)

Example Query/Response:
```
Query:    /get "track/1/xyz"
Response: /track/1/xyz 1.0 0.5 2.0

Query:    /get "track/1/gain/value"
Response: /track/1/gain/value -6.0
```

## Best Practices 🎯

1. **Message Rate**
   - Limit updates to 50ms intervals (20 Hz)
   - Use combined messages when possible
   - Batch related changes together

2. **Error Handling**
   - Validate value ranges before sending
   - Handle connection timeouts
   - Implement message retry for critical updates

3. **Performance**
   - Use relative movements for smooth transitions
   - Implement rate limiting for rapid changes
   - Monitor network bandwidth usage

4. **Testing**
   - Start with single track control
   - Verify coordinate system conversions
   - Test group control patterns
   - Monitor system response times
