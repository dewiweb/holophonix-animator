# OSC Communication Protocol 📡

This document details the OSC (Open Sound Control) communication protocol used in the Holophonix Track Motion Animator.

## Track Control Paths 🎯

### Individual Absolute Coordinates
```
# Individual absolute coordinates
/track/{id}/azim {value}  # Azimuth angle
/track/{id}/elev {value}  # Elevation angle
/track/{id}/dist {value}  # Distance from origin
/track/{id}/x {value}     # X coordinate
/track/{id}/y {value}     # Y coordinate
/track/{id}/z {value}     # Z coordinate
```

### Individual Relative Movements
```
# Individual relative movements
/track/{id}/azim+ {delta}  # Relative change in azimuth
/track/{id}/elev+ {delta}  # Relative change in elevation
/track/{id}/dist+ {delta}  # Relative change in distance
/track/{id}/x+ {delta}     # Relative change in x
/track/{id}/y+ {delta}     # Relative change in y
/track/{id}/z+ {delta}     # Relative change in z
```

### Combined Coordinates
```
# Combined coordinates
/track/{id}/aed {azimuth} {elevation} {distance}  # All AED values
/track/{id}/xyz {x} {y} {z}                       # All XYZ values
/track/{id}/ae {azimuth} {elevation}              # Azimuth and elevation
/track/{id}/xy {x} {y}                            # X and Y coordinates
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

## Pattern Matching 🎯
OSC addresses support pattern matching for controlling multiple tracks:
```
# Pattern matching characters
? - matches any single character
* - matches any sequence of characters
[abc] - matches any character in the list
[!abc] - matches any character not in the list
{foo,bar} - matches either 'foo' or 'bar'

# Examples
/track/[1-4]/xyz 0 0 0     # Set position for tracks 1-4
/track/*/azim 90           # Set azimuth for all tracks
/track/[!0]/active 1       # Activate all tracks except 0
/track/{1,3,5}/dist 2      # Set distance for tracks 1, 3, and 5
/track/*/color 1 0 0 1     # Set all tracks to red
```

## Connection Settings ⚙️
- Default Input Port: 9000
- Default Output Port: 12000
- Default Host: localhost
- Protocol: UDP
- Message Format: OSC 1.0

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

5. **Visual Properties**
   ```
   /track/1/color 0.12 0.56 1.0 1.0    # Set track 1 color to blue with full opacity
   /track/*/color 1.0 0.0 0.0 0.5      # Set all tracks to semi-transparent red
   ```

6. **Audio Properties**
   ```
   /track/1/gain/value 0.0     # Set track 1 gain to 0 dB (unity gain)
   /track/1/gain/value -60.0   # Set track 1 gain to minimum
   /track/*/gain/value -6.0    # Set all tracks to -6 dB
   /track/1/mute true         # Mute track 1
   /track/1/mute false        # Unmute track 1
   /track/*/mute true         # Mute all tracks
   ```

7. **Query Examples**
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
