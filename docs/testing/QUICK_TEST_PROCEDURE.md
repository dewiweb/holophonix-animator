# Quick Testing Guide

## Overview

This guide provides essential testing procedures for verifying animation functionality in Holophonix Animator v2.

## Basic Testing Procedure

For each animation type, follow this simple verification:

### 1. Create Animation
- Add a track to the project
- Select animation type from dropdown
- Configure basic parameters
- Save the animation

### 2. Test Playback
- Click Play button
- Verify smooth movement in 3D preview
- Check that animation completes in expected duration
- Test loop and ping-pong modes

### 3. Verify OSC Output
- Ensure OSC messages are sent (if connected)
- Check position values are reasonable
- Verify message rate is appropriate

## Animation Categories

### Basic Animations
- **Circular** - Circular motion around center point
- **Elliptical** - Elliptical path with configurable radii
- **Spiral** - Expanding or contracting spiral motion
- **Random** - Random movement within defined bounds

### Physics-Based Animations
- **Pendulum** - Realistic swinging motion with gravity
- **Bounce** - Vertical bouncing with damping
- **Spring** - Spring oscillation with overshoot

### Wave-Based Animations
- **Wave** - Sinusoidal oscillation along axes
- **Lissajous** - Complex periodic patterns
- **Helix** - 3D spiral along defined axis

### Path-Based Animations
- **Bézier** - Smooth curved path with control points
- **Catmull-Rom** - Smooth curve through waypoints
- **Zigzag** - Sharp angular movement pattern

### Procedural Animations
- **Perlin Noise** - Organic flowing movement
- **Rose Curve** - Mathematical flower patterns
- **Epicycloid** - Spirograph-like curves

### Interactive Animations
- **Orbit** - Orbital motion around center
- **Formation** - Maintains relative positions
- **Attract/Repel** - Force-based movement

### Spatial Audio Animations
- **Doppler** - Linear fly-by effect
- **Circular Scan** - Radial sweep pattern
- **Zoom** - Radial in/out movement

## Troubleshooting

### Common Issues
- **No movement**: Check animation parameters and track selection
- **Jerky motion**: Verify frame rate and system performance
- **Incorrect timing**: Check duration settings and loop mode
- **OSC not sending**: Verify connection settings and device status

### Performance Tips
- Limit track count for complex animations
- Adjust OSC message rate if needed
- Use appropriate animation types for system capabilities

---

**For detailed technical implementation**, see the Implementation section of this documentation.

## Known Issues to Watch For

From previous session fixes, these should now work correctly:
- ✅ Parameter preservation (coordinates not overwritten)
- ✅ Timing accuracy (10s = 10 real seconds)
- ✅ Pause/resume (position preserved)
- ✅ Per-track loop/ping-pong

Potential issues to note:
- ⚠️ Physics animations (pendulum, bounce, spring) may need state reset on stop
- ⚠️ Random animation should generate different targets over time
- ⚠️ Formation animation is simplified (may not show full behavior)

## Multi-Track Testing (Optional - 10 minutes)

For 3-4 representative animations, test multi-track modes:

1. Create 3 tracks
2. Select all 3 tracks (Ctrl+Click)
3. Apply same animation
4. Test each mode:
   - **Identical**: All tracks follow same path ✅
   - **Phase-Offset**: Tracks staggered in time ✅
   - **Position-Relative**: Each uses own position ✅
   - **Phase-Offset-Relative**: Combined behavior ✅

## Results Recording

Create a simple results file:
```
ANIMATION TEST RESULTS - [DATE]

✅ PASSED (XX/24):
- circular, elliptical, spiral, wave, lissajous, ...

⚠️ WARNINGS (X/24):
- [animation-type]: [issue description]

❌ FAILED (X/24):
- [animation-type]: [error description]

NOTES:
- [Any observations]
```

## Fast Track Testing

If time is limited, prioritize these 10 most-used animations:
1. Circular
2. Linear (already tested ✅)
3. Elliptical
4. Wave
5. Pendulum
6. Orbit
7. Spiral
8. Lissajous
9. Doppler
10. Circular Scan

This covers the most common spatial audio use cases.
