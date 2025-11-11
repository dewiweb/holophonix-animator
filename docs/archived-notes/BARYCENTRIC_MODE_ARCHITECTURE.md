# Barycentric Mode Architecture - CORE CONCEPT

## Fundamental Principle 🎯

**In barycentric mode, the BARYCENTER follows the designed animation path, and tracks move relative to the barycenter based on their variant-specific arrangement.**

This is the KEY difference from relative mode!

## How It Works

### **The Animation Path = Barycenter Path**

When you design a `linear`, `circular`, `bounce`, etc. animation in barycentric mode:

```
The control points define → BARYCENTER movement path
                           NOT individual track paths!
```

**Example: Circular Animation**
```
Control points define circle:
  • Center: (0, 0, 0)
  • Radius: 10m
  
→ BARYCENTER moves in circle
→ Tracks move relative to barycenter position
```

### **Track Position Calculation**

```typescript
// At any time t during animation:

// Step 1: Calculate barycenter position from animation
barycenterPosition(t) = animationPath(t)
  // e.g., for circular: (10*cos(t), 0, 10*sin(t))

// Step 2: Calculate each track's position
trackPosition(t) = barycenterPosition(t) + trackOffset
  // trackOffset depends on variant:
  // - shared: (0, 0, 0)
  // - isobarycentric: original track offset
  // - centered: original track offset  
  // - custom: orbital offset at radius R
```

## Variant Behaviors

### **1. Shared (Zero Offsets)**
```
Barycenter follows path → ●────────→

Track 1: ●────────→  \
Track 2: ●────────→  } All overlap at barycenter
Track 3: ●────────→  /

Result: All tracks move identically along the path
```

### **2. Isobarycentric (Preserve Original Offsets)**
```
Barycenter follows path → ●────────→

Track 1: ●────────→  (offset: +2,0,+2)
Track 2:   ●────────→  (offset: -2,0,-2)
Track 3:     ●────────→  (offset: +1,0,-1)

Result: Rigid formation follows the path
```

### **3. Centered (User-Defined Center + Original Offsets)**
```
User places barycenter at (5, 0, 5)
Barycenter follows path from there → ●────────→

Track 1: ●────────→  (original offset from chosen center)
Track 2:   ●────────→
Track 3:     ●────────→

Result: Same as isobarycentric but with user-controlled center
```

### **4. Custom (Orbital Arrangement)**
```
User defines radius = 5m
Barycenter follows path → ●────────→

Track 1: ●────────→  (offset: +5,0,0)    [0°]
Track 2:     ●────────→  (offset: 0,0,+5)    [90°]
Track 3:         ●────────→  (offset: -5,0,0)   [180°]
Track 4:     ●────────→  (offset: 0,0,-5)   [270°]

Result: Circular formation follows the path
```

## Comparison: Relative vs Barycentric

### **Relative Mode**
```
Animation path (e.g., circle) is applied to EACH track individually:

Track 1: (circle at track1.position)
Track 2: (circle at track2.position)
Track 3: (circle at track3.position)

→ Each track does its own circle
→ Tracks don't maintain formation
```

### **Barycentric Mode**
```
Animation path (e.g., circle) is applied to the BARYCENTER:

Barycenter: (circle)
Track 1: (follows barycenter + offset1)
Track 2: (follows barycenter + offset2)
Track 3: (follows barycenter + offset3)

→ Formation moves as a unit
→ Tracks maintain relative positions
```

## Example: Circular Animation with 4 Tracks

### **Setup**
- Animation: Circular
- Control Points: Center (0,0,0), Radius 10m
- Tracks: 4 speakers
- Variant: Custom with radius 5m

### **At t=0 (barycenter at position [10, 0, 0])**
```
Barycenter:  ● (10, 0, 0)

Track 1: ● (15, 0, 0)   [barycenter + (5, 0, 0)]
Track 2: ● (10, 0, 5)   [barycenter + (0, 0, 5)]
Track 3: ● (5, 0, 0)    [barycenter + (-5, 0, 0)]
Track 4: ● (10, 0, -5)  [barycenter + (0, 0, -5)]

Formation: Square around barycenter
```

### **At t=π/2 (barycenter at position [0, 0, 10])**
```
Barycenter:  ● (0, 0, 10)

Track 1: ● (5, 0, 10)   [barycenter + (5, 0, 0)]
Track 2: ● (0, 0, 15)   [barycenter + (0, 0, 5)]
Track 3: ● (-5, 0, 10)  [barycenter + (-5, 0, 0)]
Track 4: ● (0, 0, 5)    [barycenter + (0, 0, -5)]

Formation: Square has moved 1/4 around circle
```

**The square formation orbits the center while maintaining its shape!**

## Implementation in Code

### **Animation Calculation (in models)**

```typescript
// e.g., circular.ts
export const calculate = (params: CircularParams, context: AnimationContext) => {
  const t = context.progress // 0 to 1
  const angle = t * 2 * Math.PI
  
  // This calculates the BARYCENTER position
  const baryPosition = {
    x: center.x + radius * Math.cos(angle),
    y: center.y,
    z: center.z + radius * Math.sin(angle)
  }
  
  // In barycentric mode, this is the barycenter
  // Strategy will add track offsets
  return baryPosition
}
```

### **Strategy Application (in MultiTrackStrategy)**

```typescript
// BarycentricStrategy.getTrackParameters()
getTrackParameters(animation, tracks, variant, customCenter) {
  
  // The animation defines barycenter movement
  const baryPath = animation.calculate(t)
  
  // Calculate offsets based on variant
  const offsets = calculateOffsets(variant, tracks, customCenter)
  
  // Apply to each track
  for (const track of tracks) {
    track.parameters = {
      ...animation.parameters,
      _baryCenter: baryPath,           // Barycenter position
      _trackOffset: offsets[track.id]  // This track's offset
    }
  }
}
```

### **Track Position During Playback**

```typescript
// In AnimationPlayer
for each frame:
  // 1. Calculate barycenter position at current time
  barycenter = animation.calculate(currentTime)
  
  // 2. For each track, add its offset
  for track in tracks:
    trackPosition = barycenter + track._trackOffset
    
    // 3. Send OSC to move track
    sendOSC(track.id, trackPosition)
```

## Control Points Visualization

### **What Control Points Represent**

In the 3D editor when editing barycentric animations:

```
Control Points → Define BARYCENTER movement path
   NOT → Individual track paths!
```

**When you drag a control point:**
- You're modifying the path the barycenter follows
- All tracks will move accordingly (maintaining their offsets)

**Example:**
```
Editing linear animation:
  Control Point 1: Start (0, 0, 0)
  Control Point 2: End (20, 0, 0)
  
→ Barycenter moves from (0,0,0) to (20,0,0)
→ If track has offset (+5,0,0), it moves from (5,0,0) to (25,0,0)
```

## Editor Visualization Considerations

### **What Should Be Displayed**

1. **Barycenter Path** (the animation curve)
   - Always visible
   - Defined by control points
   - This is what you're editing

2. **Barycenter Marker** (green sphere)
   - Shows where barycenter is positioned
   - Draggable in custom/centered/shared variants
   - Defines the reference point

3. **Track Preview Paths** (optional)
   - Show where each track will move
   - = Barycenter path + track offset
   - Helps visualize the formation movement

4. **Formation Preview** (optional)
   - Show track positions at current preview time
   - = Barycenter position(t) + offsets
   - Shows the shape of the formation

### **Example Display**

```
3D View in Edit Mode (Barycentric Circular):

  ○ ← Control Point 1 (circle center)
  
  ●───────●───────●  ← Barycenter path (circular)
  
  ◆ ← Barycenter marker (current position)
  
  ▲ ▲ ▲ ▲ ← Track positions (formation around barycenter)
```

## Key Takeaways

1. ✅ **Barycenter follows the animation path** (defined by control points)
2. ✅ **Tracks move relative to barycenter** (based on variant offsets)
3. ✅ **Control points edit barycenter movement**, not individual tracks
4. ✅ **Variants control track arrangement** around barycenter
5. ✅ **Formation maintains shape** while moving along path

This is fundamentally different from relative mode where each track independently follows the animation path from its own position!

## Implementation Checklist

- [ ] MultiTrackStrategy correctly applies offsets to barycenter position
- [ ] Custom variant calculates orbital offsets
- [ ] Animation models calculate barycenter path (not individual tracks)
- [ ] 3D editor shows barycenter path, not track paths
- [ ] Control points edit barycenter movement
- [ ] Track preview shows offset paths (optional)
- [ ] Documentation updated with this architecture
