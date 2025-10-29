# OSC Input Reference

This document describes all OSC paths that can be used to control Holophonix Animator from external devices.

## Overview

Holophonix Animator accepts OSC messages to control animations, tracks, parameters, and UI elements. Simply right-click on any control button in the application to copy its OSC path to the clipboard.

## Animation Control

### Basic Playback
- `/anim/play` - Start animation playback
- `/anim/pause` - Pause current animation  
- `/anim/stop` - Stop animation and reset to beginning
- `/anim/gotoStart <duration_ms>` - Go to start position with easing duration
- `/anim/speed <0.0-2.0>` - Set animation speed (1.0 = normal)
- `/anim/time <seconds>` - Set global animation time position

### Loop Control
- `/anim/loop <true/false>` - Enable/disable looping
- `/anim/pingPong <true/false>` - Enable/disable ping-pong mode

**Examples:**
```
/anim/play "track-1"
/anim/pause
/anim/stop
/anim/gotoStart 1000
/anim/speed 1.5
/anim/loop true
```

## Track Selection

### Individual Track Control
- `/track/select <trackId>` - Select single track
- `/track/selectMulti <trackId1> <trackId2> ...` - Select multiple tracks
- `/track/clearSelection` - Clear all selected tracks
- `/track/selectAll` - Select all tracks

**Examples:**
```
/track/select "track-1"
/track/selectMulti "track-1" "track-3" "track-5"
/track/clearSelection
/track/selectAll
```

## Animation Parameters

### Parameter Control
- `/params/type <animationType>` - Set animation type (circular, linear, spiral, etc.)
- `/params/duration <seconds>` - Set animation duration
- `/params/set <parameterName> <value>` - Set specific animation parameter
- `/params/reset` - Reset all parameters to defaults

**Examples:**
```
/params/type "circular"
/params/duration 10.5
/params/set "radius" 5.0
/params/set "center" "0 0 0"
/params/reset
```

### Available Animation Types
- `linear`, `circular`, `elliptical`, `spiral`, `random`
- `pendulum`, `bounce`, `spring`
- `wave`, `lissajous`, `helix`
- `bezier`, `catmull-rom`, `zigzag`, `custom`
- `perlin-noise`, `rose-curve`, `epicycloid`
- `orbit`, `attract-repel`, `doppler`, `circular-scan`, `zoom`

## Multi-Track Modes

### Mode Control
- `/mode/set <mode>` - Set multi-track animation mode
- `/mode/phaseOffset <seconds>` - Set phase offset time
- `/mode/centerPoint <x> <y> <z>` - Set center point for centered mode

**Available Modes:**
- `identical` - All tracks follow same exact path
- `position-relative` - Each track has independent animation at its position
- `phase-offset` - Same path with staggered timing
- `phase-offset-relative` - Independent paths with staggered timing
- `formation` - Tracks maintain relative positions as a rigid formation
- `centered` - All tracks animate around user-defined center point

**Examples:**
```
/mode/set "position-relative"
/mode/set "centered"
/mode/phaseOffset 0.5
/mode/centerPoint 0 2 0
```

## Preset Management

### Preset Control
- `/preset/load <presetName>` - Load animation preset
- `/preset/save <presetName>` - Save current animation as preset
- `/preset/list` - List all available presets

**Examples:**
```
/preset/load "circular-scan-default"
/preset/save "my-custom-animation"
/preset/list
```

## UI Control

### Interface Control
- `/ui/preview` - Toggle 3D preview visibility
- `/ui/controlPoints` - Toggle control points editor
- `/ui/plane <plane>` - Set active work plane (xy, xz, yz)

**Examples:**
```
/ui/preview
/ui/controlPoints
/ui/plane xy
```

## Using with External Devices

### Right-Click Copy Method
1. Right-click on any control button in Holophonix Animator
2. Select "Copy OSC Path" from context menu
3. Paste the path into your external OSC controller

### Message Format
- OSC paths use the format shown above
- String values should be quoted in most OSC software
- Multiple values are space-separated
- Numeric values can be integers or floats

### Common External Devices
- TouchOSC
- Lemur for iPad
- Max/MSP
- Pure Data (Pd)
- SuperCollider
- Reaktor
- Custom OSC controllers

## Timing and Performance

### Message Processing
- OSC messages are processed in real-time
- Animation engine updates at 60 FPS
- OSC message throttling available in Settings → OSC

### Best Practices
- Use throttle control for large track counts
- Batch track selection with `/track/selectMulti`
- Use parameter groups for complex animations
- Test with single tracks before scaling to multi-track

## Troubleshooting

### Common Issues
1. **OSC not responding** - Check OSC input port in Settings
2. **Track not found** - Verify track IDs match exactly
3. **Parameter errors** - Check animation type compatibility
4. **No visual feedback** - Ensure preview mode is enabled

### Debug Tips
- Use `/ui/preview` to enable 3D visualization
- Check browser console for OSC message logs
- Verify track selection before sending animation commands
- Test with simple commands like `/anim/play` before complex parameters

---
*For complete OSC specification, see: `OSC_SPECS/` directory*
*For OSC output optimization, see: `docs/OSC_OPTIMIZATION_STRATEGY.md`*
