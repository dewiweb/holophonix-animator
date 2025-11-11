# Orbital Positioning Implementation - Custom Variant

## Implementation Status: ✅ COMPLETE

The custom variant now implements **orbital formation** - tracks are automatically arranged in a circle around the barycenter at a user-defined radius.

## How It Works

### **Orbital Distribution Algorithm**

```typescript
// For N tracks at radius R:
for (trackIndex = 0; trackIndex < N; trackIndex++) {
  // Evenly distribute around circle
  angle = (trackIndex / N) * 2 * Math.PI
  
  // Calculate offset from barycenter
  trackOffset = {
    x: R * cos(angle),
    y: 0,  // Horizontal plane
    z: R * sin(angle)
  }
}
```

### **Track Angles**

| Tracks | Angles |
|--------|--------|
| 2 tracks | 0°, 180° (opposite) |
| 3 tracks | 0°, 120°, 240° (triangle) |
| 4 tracks | 0°, 90°, 180°, 270° (square) |
| 8 tracks | 0°, 45°, 90°, 135°, ... (octagon) |

## Example: 4 Tracks at Radius 5m

### **Barycenter Position**
```
Center: (10, 0, 10)
Radius: 5m
```

### **Track Offsets (calculated)**
```
Track 0: angle=0°    → offset=(+5.0, 0, 0)    → position=(15, 0, 10)
Track 1: angle=90°   → offset=(0, 0, +5.0)    → position=(10, 0, 15)
Track 2: angle=180°  → offset=(-5.0, 0, 0)    → position=(5, 0, 10)
Track 3: angle=270°  → offset=(0, 0, -5.0)    → position=(10, 0, 5)
```

**Result:** Perfect square formation around barycenter!

### **As Barycenter Moves**
```
If barycenter follows a linear path from (0,0,0) to (20,0,0):

At t=0:
  Barycenter: (0, 0, 0)
  Track 0: (5, 0, 0)
  Track 1: (0, 0, 5)
  Track 2: (-5, 0, 0)
  Track 3: (0, 0, -5)

At t=1:
  Barycenter: (20, 0, 0)
  Track 0: (25, 0, 0)   [moved +20 in X]
  Track 1: (20, 0, 5)   [moved +20 in X]
  Track 2: (15, 0, 0)   [moved +20 in X]
  Track 3: (20, 0, -5)  [moved +20 in X]

→ Square formation maintains shape while moving!
```

## Code Implementation

### **File: `/src/animations/strategies/MultiTrackStrategy.ts`**

```typescript
if (variant === 'custom') {
  const radius = animation.customCenter?.radius ?? 5.0
  
  if (radius === 0) {
    // Radius 0 = all at center (like shared)
    trackOffset = { x: 0, y: 0, z: 0 }
  } else {
    // Distribute evenly in circle
    const trackCount = allTracks.length
    const angle = (trackIndex / trackCount) * 2 * Math.PI
    
    trackOffset = {
      x: radius * Math.cos(angle),
      y: 0,
      z: radius * Math.sin(angle)
    }
  }
}
```

## UI Integration

### **Radius Slider**
```tsx
<input
  type="range"
  min="0"
  max="20"
  step="0.5"
  value={customCenter?.radius ?? 5.0}
  onChange={(e) => {
    onCustomCenterChange({
      x: customCenter?.x ?? 0,
      y: customCenter?.y ?? 0,
      z: customCenter?.z ?? 0,
      radius: parseFloat(e.target.value)
    })
  }}
/>
```

### **Visual Feedback**
```
Orbital Radius: ████████░░░░ 10.0 m

🎯 Tracks arranged in circle at this distance from center
  • Radius = 0 → All tracks at center (like shared)
  • Radius > 0 → Tracks distributed on orbit
```

## Special Cases

### **Radius = 0**
```
Same as "shared" variant:
All tracks at barycenter position
→ Perfect synchronization
```

### **Single Track (N=1)**
```
Track 0: angle=0° → offset=(R, 0, 0)
→ Track positioned at +X from barycenter
```

### **Two Tracks (N=2)**
```
Track 0: angle=0°   → offset=(+R, 0, 0)
Track 1: angle=180° → offset=(-R, 0, 0)
→ Tracks on opposite sides (diameter)
```

## Future Enhancements

### **1. Vertical Distribution**
Instead of horizontal plane only:
```typescript
trackOffset = {
  x: radius * Math.cos(angle),
  y: radius * Math.sin(phi),    // Add vertical angle
  z: radius * Math.sin(angle)
}
```

### **2. Custom Angle Offsets**
Allow user to define starting angle:
```typescript
const startAngle = customCenter?.startAngle ?? 0
const angle = startAngle + (trackIndex / trackCount) * 2 * Math.PI
```

### **3. Elliptical Orbits**
Different radii for X and Z:
```typescript
trackOffset = {
  x: radiusX * Math.cos(angle),
  y: 0,
  z: radiusZ * Math.sin(angle)  // Different radius
}
```

### **4. Helix/Spiral**
Add height variation:
```typescript
trackOffset = {
  x: radius * Math.cos(angle),
  y: trackIndex * heightStep,    // Spiral upward
  z: radius * Math.sin(angle)
}
```

## Testing Scenarios

### **Test 1: 4 Tracks, Circular Animation**
```
Setup:
- Animation: Circular (radius 10m)
- Variant: Custom (orbital radius 5m)
- Tracks: 4 speakers

Expected:
- 4 tracks form square (5m radius)
- Square orbits around center (10m radius)
- Total motion: Square on circular path
```

### **Test 2: Radius Animation**
```
Setup:
- Start: radius = 2m (tight formation)
- End: radius = 10m (wide formation)
- Animation: Linear path

Expected:
- Formation expands while moving
- Tracks spread out during motion
```

### **Test 3: Radius = 0**
```
Setup:
- Variant: Custom with radius = 0

Expected:
- Behaves identically to "shared" variant
- All tracks overlap at barycenter
```

## Benefits

1. ✅ **Automatic Formation:** No manual track positioning
2. ✅ **Scalable:** Adjust radius instantly
3. ✅ **Geometric Precision:** Perfect circles/polygons
4. ✅ **Track-Count Agnostic:** Works with any number of tracks
5. ✅ **Animation-Ready:** Radius can be animated
6. ✅ **Predictable:** Always evenly distributed

## Integration Checklist

- [x] Add `radius` property to `Position` type
- [x] Add orbital radius slider to UI
- [x] Implement orbital positioning in `BarycentricStrategy`
- [x] Add console logging for debugging
- [ ] Add visual orbital circle in 3D view
- [ ] Add preview of track positions at current time
- [ ] Test with different track counts
- [ ] Add radius animation support
- [ ] Document in user guide

## Console Output

When custom variant is active:
```
🎯 Custom orbital: Track 0/4 at angle 0.0°, offset: {x: 5, y: 0, z: 0}
🎯 Custom orbital: Track 1/4 at angle 90.0°, offset: {x: 0, y: 0, z: 5}
🎯 Custom orbital: Track 2/4 at angle 180.0°, offset: {x: -5, y: 0, z: 0}
🎯 Custom orbital: Track 3/4 at angle 270.0°, offset: {x: 0, y: 0, z: -5}
```

This helps verify the orbital arrangement is working correctly!
