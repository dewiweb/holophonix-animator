# Animation Types Reference

Holophonix Animator v2 includes 24 different animation types organized into 6 categories. Each animation type creates unique movement patterns for your spatial audio tracks.

## 🎯 Quick Reference

| Category | Animations | Best For |
|----------|------------|----------|
| **Basic** | Circular, Elliptical, Spiral, Random | Simple, predictable movements |
| **Physics** | Pendulum, Bounce, Spring | Realistic, natural motion |
| **Wave** | Wave, Lissajous, Helix | Rhythmic, periodic patterns |
| **Path** | Bézier, Catmull-Rom, Zigzag | Custom, precise routes |
| **Procedural** | Perlin Noise, Rose Curve, Epicycloid | Organic, mathematical patterns |
| **Spatial** | Doppler, Circular Scan, Zoom | Audio-specific effects |

---

## 🔄 Basic Animations

### Circular Animation
**Perfect for**: Rotating speakers, circular panning, orbital effects

**Key Parameters**:
- **Center Point**: X, Y, Z coordinates of rotation center
- **Radius**: Distance from center (0.1 - 20 meters)
- **Start/End Angle**: Rotation range (0-360 degrees)
- **Plane**: XY, XZ, or YZ rotation plane

**Use Cases**:
- Surround sound rotation
- Circular speaker movement
- Orbital panning effects

### Elliptical Animation
**Perfect for**: Oval paths, stadium seating, elliptical orbits

**Key Parameters**:
- **Center Point**: Ellipse center position
- **Radius X/Y**: Separate horizontal and vertical radii
- **Start/End Angle**: Rotation range and direction
- **Plane**: Orientation of ellipse

**Use Cases**:
- Stadium-style speaker arrays
- Elliptical room acoustics
- Wide panning movements

### Spiral Animation
**Perfect for**: Expanding/contracting patterns, vortex effects

**Key Parameters**:
- **Center Point**: Spiral center
- **Start/End Radius**: Inner and outer spiral bounds
- **Rotations**: Number of complete rotations
- **Direction**: Clockwise or counter-clockwise

**Use Cases**:
- Spiral speaker arrays
- Expanding sound fields
- Vortex spatial effects

### Random Animation
**Perfect for**: Unpredictable movement, ambient effects

**Key Parameters**:
- **Bounds**: X, Y, Z movement limits
- **Update Frequency**: How often position changes (0.1-10 Hz)
- **Smoothing**: Movement smoothness (0-1)

**Use Cases**:
- Ambient spatial effects
- Unpredictable movement patterns
- Random speaker positioning

---

## ⚡ Physics Animations

### Pendulum Animation
**Perfect for**: Swinging motions, pendulum effects, natural movement

**Key Parameters**:
- **Anchor Point**: Fixed pivot position
- **Length**: Pendulum arm length
- **Initial Angle**: Starting swing angle
- **Damping**: Energy loss over time (0-1)
- **Gravity**: Downward force strength

**Use Cases**:
- Pendulum speaker arrays
- Natural swinging effects
- Physics-based movement

### Bounce Animation
**Perfect for**: Bouncing effects, impact simulation, vertical movement

**Key Parameters**:
- **Center Point**: Bounce center position
- **Start Height**: Initial drop height
- **Ground Level**: Bounce boundary
- **Bounciness**: Energy retention (0-1)
- **Damping**: Height reduction per bounce

**Use Cases**:
- Bouncing speaker effects
- Impact simulation
- Vertical rhythmic movement

### Spring Animation
**Perfect for**: Springy motion, elastic effects, oscillation

**Key Parameters**:
- **Rest Position**: Equilibrium position
- **Stiffness**: Spring tension (0.1-10)
- **Damping**: Oscillation decay (0-1)
- **Displacement**: Initial pull distance

**Use Cases**:
- Spring-loaded speaker movement
- Elastic spatial effects
- Oscillating patterns

---

## 🌊 Wave Animations

### Wave Animation
**Perfect for**: Sinusoidal movement, rhythmic patterns, wave effects

**Key Parameters**:
- **Center Point**: Wave center position
- **Amplitude**: Movement intensity (X, Y, Z)
- **Frequency**: Wave speed (0.1-10 Hz)
- **Phase Offset**: Wave timing shift
- **Wave Type**: Sine, Square, Triangle, Sawtooth

**Use Cases**:
- Rhythmic speaker movement
- Wave spatial patterns
- Oscillating effects

### Lissajous Animation
**Perfect for**: Complex patterns, figure-8 movements, intricate paths

**Key Parameters**:
- **Center Point**: Pattern center
- **Frequency Ratio A/B**: X and Y frequency relationship
- **Phase Difference**: Pattern phase offset
- **Amplitude**: Movement scale (X, Y, Z)

**Use Cases**:
- Figure-8 speaker patterns
- Complex spatial movements
- Intricate path designs

### Helix Animation
**Perfect for**: 3D spirals, corkscrew effects, vertical rotation

**Key Parameters**:
- **Axis Start/End**: Helix center line
- **Radius**: Spiral radius
- **Rotations**: Number of turns
- **Direction**: Rotation direction

**Use Cases**:
- Helical speaker arrays
- Corkscrew spatial effects
- 3D spiral movements

---

## 🛤️ Path Animations

### Bézier Curve Animation
**Perfect for**: Smooth curved paths, custom routes, organic movement

**Key Parameters**:
- **Start Point**: Beginning position
- **Control Point 1/2**: Curve shaping points
- **End Point**: Final position
- **Easing**: Speed curve (linear, ease-in/out, etc.)

**Use Cases**:
- Custom speaker paths
- Smooth transitions
- Organic movement patterns

### Catmull-Rom Spline Animation
**Perfect for**: Smooth multi-point paths, wayfinding, complex routes

**Key Parameters**:
- **Control Points**: Array of waypoints
- **Tension**: Curve tightness (0-1)
- **Closed Loop**: Return to start

**Use Cases**:
- Multi-point speaker paths
- Complex route planning
- Smooth wayfinding

### Zigzag Animation
**Perfect for**: Angular movements, sharp transitions, geometric patterns

**Key Parameters**:
- **Start/End Position**: Path boundaries
- **Zigzag Count**: Number of direction changes
- **Amplitude**: Turn intensity
- **Plane**: Movement orientation

**Use Cases**:
- Angular speaker movement
- Sharp spatial transitions
- Geometric patterns

---

## 🎨 Procedural Animations

### Perlin Noise Animation
**Perfect for**: Organic movement, natural patterns, flowing effects

**Key Parameters**:
- **Center Point**: Movement center
- **Bounds**: Movement limits
- **Frequency**: Pattern detail (0.01-1)
- **Octaves**: Complexity layers (1-8)
- **Scale**: Pattern size
- **Seed**: Random seed for reproducibility

**Use Cases**:
- Organic speaker movement
- Natural spatial patterns
- Flowing ambient effects

### Rose Curve Animation
**Perfect for**: Flower patterns, radial designs, mathematical beauty

**Key Parameters**:
- **Center Point**: Pattern center
- **Radius**: Pattern size
- **Petal Count**: Number of petals (2-12)
- **Rotation**: Pattern rotation angle
- **Plane**: Pattern orientation

**Use Cases**:
- Flower speaker arrays
- Radial spatial patterns
- Mathematical art effects

### Epicycloid Animation
**Perfect for**: Spirograph patterns, gear-like movement, complex curves

**Key Parameters**:
- **Center Point**: Pattern center
- **Fixed Radius**: Inner circle radius
- **Rolling Radius**: Outer circle radius
- **Type**: Epicycloid or Hypocycloid
- **Plane**: Movement orientation

**Use Cases**:
- Spirograph speaker patterns
- Gear-like spatial movement
- Complex curve designs

---

## 🎵 Spatial Audio Animations

### Doppler Animation
**Perfect for**: Fly-by effects, movement simulation, distance changes

**Key Parameters**:
- **Path Start/End**: Fly-by route
- **Pass-by Speed**: Movement velocity
- **Height**: Flight altitude

**Use Cases**:
- Aircraft fly-by effects
- Moving sound sources
- Distance simulation

### Circular Scan Animation
**Perfect for**: Radar effects, sweeping patterns, room analysis

**Key Parameters**:
- **Radius**: Scan distance
- **Height**: Scan elevation
- **Sweep Count**: Number of rotations
- **Start Angle**: Initial scan position

**Use Cases**:
- Radar-style spatial effects
- Room acoustic scanning
- Circular sound sweeps

### Zoom Animation
**Perfect for**: Radial movement, approach/retreat effects, distance changes

**Key Parameters**:
- **Zoom Center**: Focus point
- **Start/End Distance**: Movement range
- **Acceleration Curve**: Speed profile

**Use Cases**:
- Approaching sound sources
- Radial distance effects
- Zoom-based spatial movement

---

## 🔧 Using Animation Types

### Selecting the Right Animation

**For Beginners:**
- Start with **Circular** or **Linear** animations
- Learn timing and basic parameters
- Practice with single tracks

**For Specific Effects:**
- **Realistic movement**: Physics animations
- **Rhythmic patterns**: Wave animations  
- **Custom paths**: Path animations
- **Natural effects**: Procedural animations
- **Audio-specific**: Spatial animations

### Parameter Tips

**Common Parameters:**
- **Duration**: Animation length (1-300 seconds)
- **Center/Start Point**: Where animation begins
- **Loop/Ping-Pong**: Repeat behavior
- **Multi-track Mode**: How multiple tracks interact

**Best Practices:**
- Keep animations under 60 seconds for loops
- Use appropriate scales for your venue
- Test animations with actual hardware
- Save presets for frequently used patterns

---

**Need help with a specific animation type?** Check our detailed guides or contact support.

[← Getting Started](GETTING_STARTED.md) | [→ OSC Setup Guide](OSC_SETUP.md) | [→ Troubleshooting](TROUBLESHOOTING.md)
