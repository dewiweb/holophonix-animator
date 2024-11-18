# HOLOPHONIX OSC Reference Guide 📡

This document provides a comprehensive reference for the Open Sound Control (OSC) protocol implementation in HOLOPHONIX spatial audio systems.

## Network Configuration ⚙️

- **Input Port**: 9000 (default)
- **Output Port**: 12000 (default)
- **Protocol**: UDP
- **Host**: localhost (127.0.0.1) or HOLOPHONIX IP address

## OSC Message Format

Messages follow the standard OSC format:
```
/address/pattern [arguments]
```

## OSC Object Types 🎯

The following object types can be controlled via OSC:

- `/track` (mono object)
- `/stereo` (stereo object)
- `/multi` (multichannel object)
- `/tree` (mic tree object)
- `/aformat` (A-Format ambisonics stream source)
- `/bformat` (B-Format ambisonics stream source)
- `/zylia` (Zylia microphone stream source)
- `/eigenmike` (Eigenmike microphone stream source)
- `/hoastream` (Higher Order Ambisonics stream source)
- `/bus` (sound spatialization bus)
- `/reverb` (reverberation associated with each bus)
- `/d2m` (direct to master source)
- `/d2b` (direct to bus source)
- `/thru` (bus through)
- `/lfe` (LFE bus)
- `/monitoring` (monitoring bus)
- `/master` (master bus)

### Pattern Matching 🎯

OSC messages support advanced pattern matching:

- `?` - Match any single character
- `*` - Match zero or more characters
- `[min-max]` - Match a range of numbers (e.g., `[1-4]` for 1,2,3,4)
- `[!abc]` - Match any character not in the list
- `{a,b,c}` - Match specific values (e.g., `{1,3,5}` or `{stereo,multi}`)

Examples:
```
# Control all stereo sources
/stereo/*/gain -6

# Control specific stereo sources
/stereo/[1-5]/gain -6
/stereo/{1,3,5}/gain -6

# Control multiple object types
/{track,stereo}/*/mute 1

# Exclude specific tracks
/track/[!0]/active 1
```

## Track Control

### Position Control

#### Individual Coordinates
```
# XYZ Coordinates
/track/{id}/x {value}     # X coordinate (meters)
/track/{id}/y {value}     # Y coordinate (meters)
/track/{id}/z {value}     # Z coordinate (meters)

# AED Coordinates
/track/{id}/azim {value}  # Azimuth (-180° to +180°)
/track/{id}/elev {value}  # Elevation (-90° to +90°)
/track/{id}/dist {value}  # Distance (0 to max)
```

#### Combined Coordinates
```
# Full Coordinates
/track/{id}/xyz {x} {y} {z}           # All XYZ coordinates
/track/{id}/aed {azim} {elev} {dist}  # All AED coordinates

# Partial Coordinates
/track/{id}/xy {x} {y}                # XY coordinates only
/track/{id}/ae {azim} {elev}          # AE coordinates only
```

### Relative Movement
```
# XYZ Relative
/track/{id}/x+ {delta}     # Increment X
/track/{id}/x- {delta}     # Decrement X
/track/{id}/y+ {delta}     # Increment Y
/track/{id}/y- {delta}     # Decrement Y
/track/{id}/z+ {delta}     # Increment Z
/track/{id}/z- {delta}     # Decrement Z

# AED Relative
/track/{id}/azim+ {delta}  # Increment azimuth
/track/{id}/azim- {delta}  # Decrement azimuth
/track/{id}/elev+ {delta}  # Increment elevation
/track/{id}/elev- {delta}  # Decrement elevation
/track/{id}/dist+ {delta}  # Increment distance
/track/{id}/dist- {delta}  # Decrement distance
```

### Track Properties

#### Visual Properties
```
# Track Color
/track/{id}/color {r} {g} {b} {a}  # RGBA values (0.0 to 1.0)
```

#### Audio Properties
```
# Gain Control
/track/{id}/gain/value {value}  # Gain in dB (-60 to +12)

# Mute Control
/track/{id}/mute {value}        # Boolean (true/false)
```

### Query Messages
```
# Query Format
/get {address}               # Query any property

# Examples
/get "track/{id}/xyz"       # Get XYZ position
/get "track/{id}/aed"       # Get AED position
/get "track/{id}/xy"        # Get XY position
/get "track/{id}/ae"        # Get AE position
/get "track/{id}/gain/value"  # Get gain value
/get "track/{id}/mute"      # Get mute state
/get "track/{id}/color"     # Get track color
```

### Group Control
```
# Pattern Examples
/track/[1-4]/*      # Control tracks 1 through 4
/track/{1,3,5}/*    # Control specific tracks (1, 3, and 5)
/track/*/active     # Control all active tracks
```

## Value Ranges 📊

### Coordinate Systems

1. **XYZ (Cartesian)**
   - X: -max to +max (left to right)
   - Y: -max to +max (back to front)
   - Z: -max to +max (down to up)
   - Units: meters

2. **AED (Spherical)**
   - Azimuth: -180° to +180° (or 0° to 360°)
   - Elevation: -90° to +90°
   - Distance: 0 to configurable maximum
   - Units: degrees for angles, meters for distance

### Other Properties
- **Color**: RGBA values from 0.0 to 1.0
- **Gain**:
  * Range: -60 dB to +12 dB
  * Unity gain: 0 dB
- **Mute**: Boolean (true/false)

## Response Format 📥

Query responses follow the format:
```
/{queried_address} {value(s)}

# Examples
/track/1/xyz 1.0 0.5 2.0
/track/1/gain/value -6.0
/track/1/mute true
```

## Best Practices 💡

1. **Efficiency**
   - Use combined messages (xyz, aed) when updating multiple coordinates
   - Batch related messages together
   - Use relative movements for small adjustments

2. **Precision**
   - Use appropriate units (meters, degrees)
   - Consider coordinate system limitations
   - Handle floating-point precision appropriately

3. **Error Handling**
   - Validate value ranges before sending
   - Handle missing responses for queries
   - Implement timeout mechanisms

4. **Performance**
   - Monitor network latency
   - Implement rate limiting if needed
   - Consider message bundling for atomic updates

## Notes 📝

- Values are case-insensitive for string arguments
- Angular values can be specified in -180° to +180° or 0° to 360° range
- Decimal values sent to integer parameters will be rounded
- The `/get` command only works with indexed elements (not Master, Monitoring, or LFE)