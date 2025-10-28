# Animation Testing Guide

## Overview
Comprehensive testing plan for all 24 animation types across different track configurations and multi-track modes.

## Test Environment Setup

### Prerequisites
1. Run `npm run electron:dev`
2. Create OSC connection (optional, for live testing)
3. Open Animation Editor panel
4. Enable 3D Preview for visual verification

---

## Animation Categories & Tests

### 1. BASIC ANIMATIONS (5 types)

#### ✅ Linear Motion
**Single Track:**
- [ ] Create track at (0,0,0)
- [ ] Set animation: Linear, start (-5,0,0) → end (5,0,0), 10s duration
- [ ] Verify: Straight line path in 3D preview
- [ ] Play: Track moves smoothly from left to right

**Multiple Tracks - Position-Relative Mode:**
- [ ] Create 3 tracks at different positions
- [ ] Apply same linear animation with "Use Track Position"
- [ ] Verify: Each track moves relative to its own position
- [ ] Play: All tracks move in parallel paths

**Multiple Tracks - Identical Mode:**
- [ ] Select 3 tracks
- [ ] Apply linear animation with fixed coordinates
- [ ] Verify: All tracks follow same absolute path
- [ ] Play: Tracks converge and move together

#### ✅ Circular Motion
**Single Track:**
- [ ] Set animation: Circular, center (0,0,0), radius 5, plane XY
- [ ] Verify: Perfect circle in 3D preview
- [ ] Test planes: XY, XZ, YZ all render correctly
- [ ] Play: Smooth circular motion

**Multiple Tracks - Phase-Offset Mode:**
- [ ] Apply circular to 4 tracks with phase offsets (0°, 90°, 180°, 270°)
- [ ] Verify: Tracks evenly distributed on circle
- [ ] Play: Tracks maintain spacing while rotating

#### ✅ Elliptical Motion
**Single Track:**
- [ ] Set: Elliptical, radiusX=5, radiusY=3, radiusZ=1, plane XY
- [ ] Verify: Ellipse shape in preview
- [ ] Test: Different radius combinations
- [ ] Play: Smooth elliptical path

#### ✅ Spiral Motion
**Single Track:**
- [ ] Set: Spiral, startRadius=1, endRadius=5, rotations=3, direction clockwise
- [ ] Verify: Expanding spiral in preview
- [ ] Test: Counterclockwise direction
- [ ] Test: Contracting spiral (endRadius < startRadius)
- [ ] Play: Smooth expanding/contracting spiral

#### ✅ Random Motion
**Single Track:**
- [ ] Set: Random, center (0,0,0), bounds (±5,±5,±5), speed=1
- [ ] Verify: Random path within bounds
- [ ] Test: Different smoothness values (0.1, 0.5, 0.9)
- [ ] Test: Update frequency (1Hz vs 10Hz)
- [ ] Play: Organic, unpredictable movement

---

### 2. PHYSICS-BASED ANIMATIONS (3 types)

#### ✅ Pendulum
**Single Track:**
- [ ] Set: Pendulum, anchor (0,5,0), length=3, initialAngle=45°
- [ ] Verify: Arc path in preview
- [ ] Test: Different damping values (0.01, 0.1, 0.5)
- [ ] Play: Realistic swinging, gradual slow-down

**Edge Cases:**
- [ ] Test: Very small angle (5°) → small oscillations
- [ ] Test: Large angle (85°) → wide swings
- [ ] Test: Zero damping → perpetual motion

#### ✅ Bounce
**Single Track:**
- [ ] Set: Bounce, center (0,0,0), startHeight=10, bounciness=0.8
- [ ] Verify: Vertical path with decreasing peaks
- [ ] Test: High bounciness (0.95) → many bounces
- [ ] Test: Low bounciness (0.3) → few bounces
- [ ] Play: Realistic bouncing physics

#### ✅ Spring
**Single Track:**
- [ ] Set: Spring, restPosition (0,0,0), stiffness=10, damping=0.5
- [ ] Set: Initial displacement (5,5,0)
- [ ] Verify: Oscillating path converging to rest
- [ ] Test: High stiffness → fast oscillations
- [ ] Test: Low stiffness → slow oscillations
- [ ] Play: Spring-like overshoot and settle

---

### 3. WAVE-BASED ANIMATIONS (3 types)

#### ✅ Wave
**Single Track:**
- [ ] Set: Wave, center (0,0,0), amplitude (2,2,1), frequency=1Hz
- [ ] Test wave types: sine, square, triangle, sawtooth
- [ ] Verify: Each wave type shows distinct pattern
- [ ] Test: Phase offset creates starting position shift
- [ ] Play: Smooth oscillation

**Multiple Tracks - Formation:**
- [ ] Create 5 tracks in a line
- [ ] Apply wave with increasing phase offsets
- [ ] Verify: Wave pattern propagating across tracks
- [ ] Play: Beautiful wave formation

#### ✅ Lissajous
**Single Track:**
- [ ] Set: Lissajous, freqRatioA=3, freqRatioB=2, phaseDiff=90°
- [ ] Verify: Complex figure-eight or flower pattern
- [ ] Test: Different frequency ratios (2:1, 3:2, 5:3)
- [ ] Test: Different phase differences
- [ ] Play: Mesmerizing periodic motion

#### ✅ Helix
**Single Track:**
- [ ] Set: Helix, axisStart (0,-5,0), axisEnd (0,5,0), radius=2, rotations=5
- [ ] Verify: 3D spiral along vertical axis
- [ ] Test: Clockwise vs counterclockwise
- [ ] Test: Horizontal axis (X or Z direction)
- [ ] Play: Smooth helical motion

---

### 4. CURVE & PATH-BASED ANIMATIONS (3 types)

#### ✅ Bézier
**Single Track:**
- [ ] Set: Bézier with 4 control points
- [ ] Verify: Smooth curve through control points
- [ ] Test easing: linear, ease-in, ease-out, ease-in-out
- [ ] Adjust control points → path updates
- [ ] Play: Smooth curved motion

#### ✅ Catmull-Rom
**Single Track:**
- [ ] Set: Catmull-Rom with 4+ control points
- [ ] Verify: Smooth spline through all points
- [ ] Test: Closed loop option
- [ ] Test: Different tension values (0.3, 0.5, 0.8)
- [ ] Play: Fluid motion through waypoints

#### ✅ Zigzag
**Single Track:**
- [ ] Set: Zigzag, start (-5,0,0), end (5,0,0), count=5, amplitude=2
- [ ] Verify: Sharp zigzag pattern
- [ ] Test: Different planes (XY, XZ, YZ)
- [ ] Test: Varying zigzag count (3, 5, 10)
- [ ] Play: Sharp angular movements

---

### 5. ADVANCED PROCEDURAL ANIMATIONS (3 types)

#### ✅ Perlin Noise
**Single Track:**
- [ ] Set: Perlin Noise, frequency=1, octaves=3, persistence=0.5
- [ ] Verify: Organic, smooth random path
- [ ] Test: Different seeds → different patterns
- [ ] Test: High octaves (5+) → more detail
- [ ] Test: Low persistence → smoother motion
- [ ] Play: Natural, fluid movement

**Multiple Tracks:**
- [ ] Apply same seed to multiple tracks
- [ ] Verify: Synchronized organic movement
- [ ] Apply different seeds → independent paths

#### ✅ Rose Curve
**Single Track:**
- [ ] Set: Rose Curve, radius=3, petalCount=5, rotation=0°
- [ ] Verify: Flower-like pattern with 5 petals
- [ ] Test: Different petal counts (3, 4, 5, 7)
- [ ] Test: Different planes
- [ ] Play: Beautiful mathematical curve

#### ✅ Epicycloid
**Single Track:**
- [ ] Set: Epicycloid, fixedRadius=3, rollingRadius=1, type=epicycloid
- [ ] Verify: Complex looping pattern
- [ ] Test: Hypocycloid type (rolling inside)
- [ ] Test: Different radius ratios
- [ ] Play: Intricate geometric motion

---

### 6. MULTI-OBJECT & INTERACTIVE ANIMATIONS (3 types)

#### ✅ Orbit
**Single Track:**
- [ ] Set: Orbit, center (0,0,0), radius=4, speed=1, inclination=0°
- [ ] Verify: Circular orbit
- [ ] Test: Inclination 30° → tilted orbit
- [ ] Test: Phase offset for starting position
- [ ] Play: Smooth orbital motion

**Multiple Tracks - Orbital Formation:**
- [ ] Create 8 tracks
- [ ] Apply orbit with phase offsets (0°, 45°, 90°, etc.)
- [ ] Verify: Evenly distributed on orbit
- [ ] Play: Synchronized orbital rotation

#### ✅ Formation
**Single Track:**
- [ ] Set: Formation (simplified version)
- [ ] Verify: Basic formation offset
- [ ] Note: Full implementation requires track context

#### ✅ Attract/Repel
**Single Track:**
- [ ] Set: Attract/Repel, target (0,0,0), attractionStrength=5
- [ ] Set: Starting position away from target
- [ ] Verify: Path curves toward target
- [ ] Test: Repulsion radius → bounces back when too close
- [ ] Play: Physics-based attraction/repulsion

---

### 7. SPECIALIZED SPATIAL AUDIO ANIMATIONS (3 types)

#### ✅ Doppler
**Single Track:**
- [ ] Set: Doppler, pathStart (-10,0,5), pathEnd (10,0,5), speed=1
- [ ] Verify: Linear fly-by path
- [ ] Test: Different speeds
- [ ] Play: Fast linear motion (ideal for Doppler effect testing)

**Multiple Tracks - Fly-by Formation:**
- [ ] Create 3 tracks with parallel paths
- [ ] Apply Doppler with offset start/end points
- [ ] Play: Formation fly-by

#### ✅ Circular Scan
**Single Track:**
- [ ] Set: Circular Scan, center (0,0,0), radius=5, height=0, sweepCount=1
- [ ] Verify: Circular path
- [ ] Test: Multiple sweeps (2, 3, 5)
- [ ] Test: Different heights
- [ ] Play: Scanning circular motion

#### ✅ Zoom
**Single Track:**
- [ ] Set: Zoom, center (0,0,0), startDistance=10, endDistance=1
- [ ] Verify: Radial movement toward center
- [ ] Test: Acceleration curves (linear, ease-in, ease-out)
- [ ] Test: Reverse (zoom out): startDistance=1, endDistance=10
- [ ] Play: Smooth zoom motion with rotation

---

## Multi-Track Mode Testing

### Position-Relative Mode
- [ ] **Test 1:** Create 4 tracks at corners of a square
- [ ] Apply circular animation with "Use Track Position"
- [ ] Verify: Each track orbits around its own position
- [ ] Expected: 4 independent circles at different locations

### Identical Mode
- [ ] **Test 2:** Create 4 tracks at different positions
- [ ] Apply circular animation with fixed center (0,0,0)
- [ ] Verify: All tracks converge to same circular path
- [ ] Expected: Tracks meet and move together

### Phase-Offset Mode
- [ ] **Test 3:** Create 8 tracks
- [ ] Apply circular animation with phase offsets (0°, 45°, 90°, ..., 315°)
- [ ] Verify: Tracks evenly distributed on circle
- [ ] Expected: Synchronized rotation maintaining spacing

---

## Critical Validation Checklist

### Visual Verification
- [ ] 3D preview shows correct path shape
- [ ] Direction indicators point along movement direction
- [ ] Path bounds are reasonable (not infinite)
- [ ] No sudden jumps or discontinuities

### Animation Playback
- [ ] Smooth motion at 60 FPS
- [ ] Correct duration timing
- [ ] Loop behavior works correctly
- [ ] Pause/resume maintains position
- [ ] Stop returns to start position

### OSC Integration (if connected)
- [ ] Position messages sent to Holophonix
- [ ] Correct track index in OSC path
- [ ] Coordinate system matches settings (XYZ or AED)
- [ ] No message flooding or dropped messages

### State Management
- [ ] Physics animations maintain state across loops
- [ ] Random animations don't reset unexpectedly
- [ ] Multi-track animations stay synchronized
- [ ] Parameter changes update preview immediately

---

## Known Issues to Watch For

### Common Problems
1. **Null reference errors** - Check console for errors
2. **Path not rendering** - Verify animation parameters are valid
3. **Jerky motion** - Check browser/Electron performance
4. **Tracks diverging** - Verify mode settings
5. **No OSC messages** - Check connection status

### Testing Tips
- Test one animation type at a time
- Start with default parameters before customizing
- Use console logs to debug calculation issues
- Save working configurations as presets
- Document any unexpected behavior

---

## Bug Report Template

```
**Animation Type:** [e.g., Circular]
**Configuration:** [Single/Multiple tracks, Mode]
**Parameters:** [List key parameters]
**Expected Behavior:** [What should happen]
**Actual Behavior:** [What actually happens]
**Console Errors:** [Any error messages]
**Screenshots:** [If applicable]
```

---

## Success Criteria

✅ **All 24 animation types:**
- Render correct paths in 3D preview
- Play smoothly without errors
- Work with single track
- Work with multiple tracks (where applicable)

✅ **Multi-track modes:**
- Position-Relative: Each track uses its own position as center
- Identical: All tracks follow same absolute path
- Phase-Offset: Tracks maintain synchronized spacing

✅ **Edge cases:**
- Zero duration handled gracefully
- Extreme parameter values don't crash
- State persists across loops for stateful animations
- Parameter changes update immediately

---

**Start testing and check off items as you complete them!** 🎯
