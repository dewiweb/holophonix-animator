# Custom Variant - Orbital Formation Design

## Original Intent - NOW UNDERSTOOD! 🎯

The `custom` variant is **NOT** redundant with `centered`. It's a **formation designer** that arranges tracks in an **orbital pattern** around the barycenter.

## The Three Distinct Variants

### 1. **Shared** (radius = 0, no offsets)
```
     Center: ●
All tracks: ● (overlapping at center)
```
- All tracks positioned exactly at the center point
- Tracks move identically
- **Use case:** Synchronized identical motion from a single point

### 2. **Centered** (preserves original offsets)
```
     Center: ●
    Track 1: ●  (at original distance)
    Track 2:     ● (at original distance)
    Track 3: ●      (at original distance)
```
- Tracks maintain their ORIGINAL relative positions
- Rigid formation - distances preserved
- **Use case:** Move a pre-arranged formation as a group

### 3. **Custom** (user-defined radius, orbital arrangement) 🆕
```
     Center: ●
    Track 1: ●  \
    Track 2:  ●  } All at same radius R
    Track 3:    ●/
```
- Tracks are REPOSITIONED at a specified radius around center
- Distributed evenly (or with custom angles) on orbit
- **Use case:** Create circular/orbital formations dynamically

## Custom Variant Parameters

### **Orbital Radius**
- **Type:** `number` (meters)
- **Range:** 0 to 20 meters
- **Default:** 5.0 meters
- **Meaning:** Distance from center where tracks are positioned

### **Track Distribution**
Tracks are arranged around the center:
```typescript
// For N tracks at radius R:
for (i = 0; i < N; i++) {
  angle = (i / N) * 2 * Math.PI
  track[i].position = {
    x: center.x + R * cos(angle),
    y: center.y,  // or vary height
    z: center.z + R * sin(angle)
  }
}
```

## Examples

### **Scenario: 4 Tracks Circular Formation**

**With Shared (radius = 0):**
```
All 4 tracks at (10, 0, 10)
→ They move together as one
```

**With Centered (preserves offsets):**
```
Track positions remain as defined:
- Track 1: (5, 0, 5)
- Track 2: (15, 0, 5)
- Track 3: (15, 0, 15)
- Track 4: (5, 0, 15)
→ Square formation preserved during animation
```

**With Custom (radius = 5):**
```
Center: (10, 0, 10)
Tracks arranged on circle:
- Track 1: (15, 0, 10)   [0°]
- Track 2: (10, 0, 15)   [90°]
- Track 3: (5, 0, 10)    [180°]
- Track 4: (10, 0, 5)    [270°]
→ Perfect circle formation, regardless of original positions
```

## UI Implementation

### **Custom Variant Panel**
```tsx
<div className="orbital-radius-control">
  <label>Orbital Radius</label>
  <input 
    type="range" 
    min="0" 
    max="20" 
    step="0.5"
    value={customCenter?.radius ?? 5.0}
  />
  <span>{radius} m</span>
  
  <p>
    🎯 Tracks arranged in circle at this distance from center
    • Radius = 0 → All tracks at center (like shared)
    • Radius > 0 → Tracks distributed on orbit
  </p>
</div>
```

## Type Updates

### **Position Type Extended**
```typescript
export interface Position {
  x: number;
  y: number;
  z: number;
  radius?: number; // Optional: for custom variant orbital arrangement
}
```

### **Animation Parameters**
```typescript
animation.parameters = {
  // ... other params
  _customCenter: {
    x: 10,
    y: 0,
    z: 10,
    radius: 5.0  // Orbital radius for custom variant
  }
}
```

## Implementation Strategy

### **MultiTrackStrategy.ts Updates**

```typescript
// In BarycentricStrategy.getTrackParameters()
if (variant === 'custom' && customCenter?.radius !== undefined) {
  // Calculate orbital positions
  const trackCount = tracks.length
  const radius = customCenter.radius
  
  for (let i = 0; i < trackCount; i++) {
    const angle = (i / trackCount) * 2 * Math.PI
    const trackOffset = {
      x: radius * Math.cos(angle),
      y: 0,  // Could also vary height
      z: radius * Math.sin(angle)
    }
    
    // Apply to track parameters
    trackParameters[trackId]._trackOffset = trackOffset
  }
}
```

### **3D Visualization**

When `custom` variant is active with radius > 0:
1. Show barycentric center (green sphere) - draggable
2. Show orbital circle at specified radius
3. Show track positions on orbit
4. Optionally show "spokes" from center to tracks

## Use Cases

### **Surround Sound Circular Motion**
- Center: Audience position (0, 0, 0)
- Radius: 10 meters (typical speaker distance)
- 8 tracks → Automatically arranged in octagon
- Animation: Rotating or rippling effects

### **Orbital Lighting**
- Center: Stage center
- Radius: 5 meters
- 4 lights → Square orbit
- Animation: Lights circle around performers

### **Dynamic Formation Changes**
1. Start: `custom` with radius = 2 (tight formation)
2. Animate: Increase radius to 10 (expand)
3. End: `shared` with radius = 0 (converge)

## Benefits of Custom Variant

1. **Dynamic Formation Creation:** No need to manually position tracks
2. **Scalable:** Radius slider instantly adjusts formation size
3. **Geometric Precision:** Perfect circles/polygons every time
4. **Animation-Friendly:** Easy to animate radius changes
5. **Track-Count Agnostic:** Works with any number of tracks

## Next Steps

1. ✅ Add `radius` property to `Position` type
2. ✅ Add orbital radius slider to UI
3. ⏳ Implement orbital positioning logic in `MultiTrackStrategy`
4. ⏳ Add visual orbital circle in 3D view
5. ⏳ Test with different track counts
6. ⏳ Add radius animation support

## Summary

**The custom variant is NOT deprecated!** It's a powerful formation tool:

| Variant | Center | Offsets | Radius | Use Case |
|---------|--------|---------|--------|----------|
| **Shared** | User-defined | None (all at center) | N/A | Identical motion |
| **Isobarycentric** | Auto-calculated | Preserved | N/A | Natural rigid formation |
| **Centered** | User-defined | Preserved | N/A | Move predefined formation |
| **Custom** | User-defined | Orbital (calculated) | User-defined | Create circular formations |

**Custom is the "formation designer" variant!** 🎯
