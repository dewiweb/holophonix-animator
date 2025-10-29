# OSC Message Optimization Strategy

## Overview
Holophonix supports powerful OSC features that can dramatically reduce message overhead:
1. **Incremental updates**: `x++`, `y++`, `z++`, `azim++`, `elev++`, `dist++`
2. **Pattern matching**: `*`, `?`, `[ranges]`, `{lists}` for batch control

## Coordinate System Analysis

### Animation Types → Optimal Coordinate System

#### **AED (Polar) - Best for Rotational/Radial Motion**
These animations naturally work in polar space and benefit from azimuth/elevation updates:

- **circular**: Pure rotation around center → Use `azim++` for incremental rotation
- **orbit**: Orbital motion → Use `azim++` and `elev++` for inclination
- **circular-scan**: Sweeping around listener → Use `azim++` with constant distance
- **zoom**: Radial in/out → Use `dist++` with constant azimuth/elevation
- **spiral**: Expanding rotation → Use `azim++` and `dist++` together
- **rose-curve**: Mathematical polar patterns → Natural AED representation
- **epicycloid**: Circle rolling around circle → Polar coordinate transformation

**Optimization Potential:**
- Single-axis rotation: `/track/*/azim++ 2.5` (1 message for all tracks)
- Pure zoom: `/track/{1,3,5}/dist++ 0.1` (1 message for multiple tracks)

#### **XYZ (Cartesian) - Best for Linear/Path-Based Motion**
These animations work in rectilinear space:

- **linear**: Straight line motion → Use `x++`, `y++`, `z++` increments
- **bezier**: Curved paths → XYZ interpolation
- **catmull-rom**: Spline paths → XYZ waypoints
- **zigzag**: Angular rectilinear → XYZ jumps
- **bounce**: Vertical physics → Primarily `z++`
- **spring**: Directional oscillation → XYZ components
- **doppler**: Fly-by path → Linear XYZ trajectory
- **perlin-noise**: Organic 3D movement → XYZ noise
- **helix**: 3D spiral along axis → XYZ calculation
- **random**: Bounded XYZ space → Independent axis updates

**Optimization Potential:**
- Vertical-only bounce: `/track/*/z++ -0.05` (1 message for all tracks)
- Parallel linear motion: `/track/[1-10]/x++ 0.1` (1 message for range)

#### **Hybrid - Could Use Either**
These animations adapt based on context:

- **elliptical**: Can be XY plane (XYZ) or azim/elev plane (AED)
- **wave**: Sinusoidal oscillation in any axis
- **lissajous**: Complex periodic - depends on orientation
- **pendulum**: Angular swing (AED) or XYZ arc
- **attract-repel**: Radial forces (AED) or vector forces (XYZ)
- **formation**: Depends on formation geometry

---

## Optimization Strategies by Multi-Track Mode

### 1. **Identical Mode** (All tracks → same position)
**Pattern Matching Wins:**
- XYZ: `/track/*/xyz [x, y, z]` → **1 message** instead of N
- AED: `/track/*/aed [azim, elev, dist]` → **1 message** instead of N

**Incremental (when delta is small):**
- `/track/*/azim++ 1.5` → **1 message** for pure rotation
- `/track/*/dist++ 0.05` → **1 message** for zoom

**Best Use Cases:**
- Circular rotation: Send only azimuth changes
- Zoom animation: Send only distance changes
- Combined: `/track/*/azim++ 2.0` then `/track/*/dist++ 0.01`

### 2. **Phase-Offset Mode** (Same path, staggered timing)
**Grouping by Position:**
- Group tracks at identical positions using list notation
- `/track/{1,3,7}/xyz [x1, y1, z1]` + `/track/{2,5}/xyz [x2, y2, z2]`
- Reduces N messages to ~(N/phaseSteps) messages

**Incremental Updates:**
- Tracks on same path segment: `/track/{4,8,12}/azim++ 1.2`

### 3. **Formation/Isobarycenter Mode** (Move as unit)
**Pattern Matching:**
- All tracks move together by same offset
- Calculate delta from previous frame
- `/track/*/x++ deltaX` → **1 message** for X-axis
- `/track/*/y++ deltaY` → **1 message** for Y-axis  
- `/track/*/z++ deltaZ` → **1 message** for Z-axis
- Total: **3 messages** instead of 3N messages

**Circular formation rotation:**
- Rotate entire formation: `/track/*/azim++ rotationSpeed`

### 4. **Position-Relative Mode** (Each track has unique path)
**Incremental Updates per Track:**
- Small movements: `/track/1/x++ 0.03`
- Threshold: Use increment if `|delta| < 0.5`, else full position
- Still reduces message size (1 float vs 3 floats)

**Grouping Similar Deltas:**
- Tracks with similar movement: `/track/{2,5,9}/y++ -0.08`

---

## Smart Coordinate System Selection

### Auto-Selection Logic
```
if (animationType in ['circular', 'orbit', 'circular-scan', 'zoom', 'spiral', 'rose-curve', 'epicycloid']) {
  preferredCoordSystem = 'aed'
  
  // Further optimization: detect single-axis changes
  if (only_azimuth_changes) → use /track/.../azim++ only
  if (only_distance_changes) → use /track/.../dist++ only
  
} else if (animationType in ['bounce', 'linear', 'zigzag']) {
  preferredCoordSystem = 'xyz'
  
  // Detect dominant axis
  if (primarily_vertical) → use /track/.../z++ only
  if (primarily_horizontal_x) → use /track/.../x++ only
  
} else {
  // Hybrid: analyze actual movement pattern
  preferredCoordSystem = analyzeMovementPattern()
}
```

### Single-Axis Optimization Examples

**Pure Azimuth Rotation (Circular scan):**
```
// Before: Send full AED position 60 times/sec
/track/1/aed [45.0, 0, 5]
/track/1/aed [47.5, 0, 5]
/track/1/aed [50.0, 0, 5]

// After: Send only azimuth changes
/track/1/azim++ 2.5
/track/1/azim++ 2.5
/track/1/azim++ 2.5

// With pattern matching (identical mode):
/track/*/azim++ 2.5  → ALL tracks rotate together
```

**Pure Vertical Bounce:**
```
// Before: Send full XYZ position
/track/1/xyz [0, 0, 2.5]
/track/1/xyz [0, 0, 2.3]
/track/1/xyz [0, 0, 2.1]

// After: Send only Z changes
/track/1/z++ -0.2
/track/1/z++ -0.2
```

**Zoom Animation (identical mode):**
```
// Before: N messages per frame
/track/1/aed [0, 0, 5.0]
/track/2/aed [45, 0, 5.0]
/track/3/aed [90, 0, 5.0]
...

// After: 1 message per frame
/track/*/dist++ 0.1  → ALL tracks zoom in together
```

---

## Message Reduction Calculations

### Example: 10 tracks, circular rotation, identical mode, 20 FPS

**Current (no optimization):**
- 10 tracks × 3 values (x,y,z) × 20 FPS = **600 values/sec**
- 10 messages/frame × 20 FPS = **200 messages/sec**

**With AED + Single-Axis:**
- 1 value (azim) × 20 FPS = **20 values/sec** (97% reduction)
- 1 message/frame × 20 FPS = **20 messages/sec** (90% reduction)

**With Pattern Matching:**
- `/track/*/azim++ 2.5` → **1 message for all 10 tracks**

### Example: 20 tracks, formation mode, 20 FPS

**Current:**
- 20 tracks × 3 values × 20 FPS = **1200 values/sec**
- 20 messages/frame × 20 FPS = **400 messages/sec**

**With Incremental XYZ:**
- 3 messages/frame (x++, y++, z++) × 20 FPS = **60 messages/sec** (85% reduction)
- 3 values × 20 FPS = **60 values/sec** (95% reduction)

---

## Implementation Priorities

### Phase 1: Smart Coordinate System Selection ✓
- Add per-animation-type coordinate system preference
- Auto-detect single-axis movements
- User override option in settings

### Phase 2: Incremental Updates
- Track previous positions for delta calculation
- Threshold logic (use ++ if delta < threshold)
- Per-axis increment detection

### Phase 3: Pattern Matching
- Detect identical positions across tracks
- Generate wildcard/list patterns
- Batch similar movements

### Phase 4: Adaptive Strategy
- Monitor Holophonix response time
- Fall back to simple XYZ if processor struggles
- Dynamic optimization based on track count

---

## Settings UI Additions

```typescript
interface OSCOptimizationSettings {
  enableIncrementalUpdates: boolean;      // Use x++, azim++, etc.
  enablePatternMatching: boolean;         // Use /track/*/ and /track/{list}/
  autoSelectCoordinateSystem: boolean;    // Choose XYZ vs AED per animation
  incrementalThreshold: number;           // Max delta for ++ (default: 0.5)
  singleAxisThreshold: number;            // Min ratio for single-axis (default: 0.9)
  forceCoordinateSystem?: 'xyz' | 'aed';  // User override
}
```

---

## Notes & Considerations

1. **Holophonix Compatibility**: Verify pattern matching works with all Holophonix firmware versions
2. **Message Ordering**: Incremental updates require strict ordering (no UDP packet loss tolerance)
3. **State Sync**: Periodically send full positions to resync state
4. **Testing**: Need real Holophonix hardware to validate optimizations
5. **Fallback**: Always have non-optimized path as backup

---

## Next Steps

1. Implement coordinate system selection per animation type
2. Create OSC message optimizer utility
3. Add delta tracking to animation engine
4. Integrate pattern matching for multi-track modes
5. Add optimization settings to UI
6. Test with real Holophonix processor
