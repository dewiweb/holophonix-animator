# New Animation Types Implementation

## Overview
Added 18 new animation types to the Holophonix Animator, organized into 4 categories:

## 1. Physics-Based Animations

### Pendulum
Realistic swinging motion with gravity simulation
- **Parameters:**
  - Anchor Point (X, Y, Z)
  - Pendulum Length
  - Initial Angle (degrees)
  - Damping (0-1)
  - Gravity strength

### Bounce
Vertical bouncing with realistic physics
- **Parameters:**
  - Center Position (X, Y, Z)
  - Start Height
  - Ground Level
  - Bounciness (0-1)
  - Damping Per Bounce
  - Gravity

### Spring
Spring-based motion with overshoot
- **Parameters:**
  - Rest Position (X, Y, Z)
  - Spring Stiffness
  - Damping Coefficient
  - Initial Displacement (X, Y, Z)
  - Mass

## 2. Wave-Based Animations

### Wave
Sinusoidal oscillation along axes
- **Parameters:**
  - Center Position (X, Y, Z)
  - Amplitude (X, Y, Z)
  - Frequency (Hz)
  - Phase Offset
  - Wave Type (sine, square, triangle, sawtooth)

### Lissajous Curves
Complex periodic motion
- **Parameters:**
  - Center Position (X, Y, Z)
  - Frequency Ratio A
  - Frequency Ratio B
  - Phase Difference (degrees)
  - Amplitude X, Y, Z

### Helix
3D spiral along an axis
- **Parameters:**
  - Axis Start (X, Y, Z)
  - Axis End (X, Y, Z)
  - Radius
  - Rotations
  - Direction

## 3. Curve & Path-Based Animations

### Bézier Curve
Smooth curved path with control points
- **Parameters:**
  - Start Point (X, Y, Z)
  - Control Point 1 (X, Y, Z)
  - Control Point 2 (X, Y, Z)
  - End Point (X, Y, Z)
  - Easing Function

### Catmull-Rom Spline
Smooth curve through control points
- **Parameters:**
  - Control Points array
  - Tension (0-1)
  - Closed Loop (boolean)

### Zigzag
Sharp angular movements
- **Parameters:**
  - Start Position (X, Y, Z)
  - End Position (X, Y, Z)
  - Zigzag Count
  - Amplitude
  - Plane (XY, XZ, YZ)

## 4. Advanced Procedural Animations

### Perlin Noise
Smooth organic random movement
- **Parameters:**
  - Center Position (X, Y, Z)
  - Bounds (X, Y, Z)
  - Frequency
  - Octaves
  - Persistence
  - Scale
  - Seed

### Rose Curve
Mathematical flower patterns
- **Parameters:**
  - Center Position (X, Y, Z)
  - Radius
  - Petal Count
  - Rotation (degrees)
  - Plane

### Epicycloid/Hypocycloid
Circle rolling around circle
- **Parameters:**
  - Center Position (X, Y, Z)
  - Fixed Circle Radius
  - Rolling Circle Radius
  - Speed
  - Type (epicycloid/hypocycloid)
  - Plane

## 5. Multi-Object & Interactive Animations

### Orbit
Orbital motion around center
- **Parameters:**
  - Center Position (X, Y, Z)
  - Orbital Radius
  - Orbital Speed
  - Phase Offset (degrees)
  - Inclination (degrees)

### Formation
Maintain relative positions (simplified)
- **Parameters:**
  - Center Position (X, Y, Z)
  - Formation Shape
  - Spacing
  - Follow Stiffness

### Attract/Repel
Dynamic force-based movement
- **Parameters:**
  - Center/Initial Position (X, Y, Z)
  - Target Position (X, Y, Z)
  - Attraction Strength
  - Repulsion Radius
  - Max Speed

## 6. Specialized Spatial Audio Animations

### Doppler Path
Optimized for Doppler effect
- **Parameters:**
  - Path Start (X, Y, Z)
  - Path End (X, Y, Z)
  - Pass-By Speed

### Circular Scan
Sweep around listener
- **Parameters:**
  - Center Position (X, Y, Z)
  - Radius
  - Height
  - Sweep Count
  - Start Angle Offset (degrees)

### Zoom
Radial movement towards/away
- **Parameters:**
  - Zoom Center (X, Y, Z)
  - Start Distance
  - End Distance
  - Acceleration Curve

## Implementation Status

✅ Types defined in `types/index.ts`
✅ Calculation functions in `animationCalculations.ts`
⏳ UI parameter forms in `AnimationEditor.tsx` (in progress)

## Usage Notes

- All physics-based animations use real-time state and should use actual `time` (not `effectiveTime`)
- Perlin noise uses a seeded random generator for reproducibility
- Formation animation is simplified and may need track context for full implementation
