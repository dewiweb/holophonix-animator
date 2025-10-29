# OSC Animation Scenarios - Complete Review

## Overview
This document reviews all combinations of track count, multi-track modes, and animation types to ensure path calculations and OSC message formatting are consistent.

---

## 1. SINGLE TRACK

### Path Calculation
- Uses standard `calculatePosition()` for the animation type
- No offsets applied
- Direct position calculation

### OSC Message Format
- **Pattern:** `/track/{N}/axis++` (individual track)
- **Optimization:** Incremental updates (x++, y++, z++) when delta is small
- **Coordinate System:** Auto-selected based on animation type (AED for circular, XYZ for linear)
- **Example:** `/track/5/azim++ [0.067]`

### Supported Animation Types
All 24 types: linear, circular, elliptical, spiral, random, pendulum, bounce, spring, wave, lissajous, helix, bezier, catmull-rom, zigzag, perlin-noise, rose-curve, epicycloid, orbit, formation, attract-repel, doppler, circular-scan, zoom, custom

---

## 2. MULTI-TRACK: IDENTICAL MODE

### Path Calculation
- All tracks use **identical animation parameters**
- Same `calculatePosition()` result for all tracks
- All tracks at same position at same time

### OSC Message Format
- **Pattern:** `/track/[1-10]/axis++` or `/track/{1,3,5}/axis++`
- **Optimization:** Formation mode (one delta for all tracks)
- **Messages:** 3 messages total (azim++, elev++, dist++ OR x++, y++, z++)
- **Example:** `/track/[1-10]/azim++ [0.067]` - single message moves all 10 tracks

### Multi-Track Mode Parameter
```typescript
parameters: {
  ...animationParams,
  _multiTrackMode: 'identical'
}
```

---

## 3. MULTI-TRACK: PHASE-OFFSET MODE

### Path Calculation
- All tracks use **identical animation parameters**
- Each track has **different initial time offset**: `initialTime = index * phaseOffsetSeconds`
- Same path, staggered timing

### OSC Message Format
- **Pattern:** `/track/[1-10]/axis++` or `/track/{1,3,5}/axis++`
- **Optimization:** Phase-offset mode (pattern matching possible when tracks sync)
- **Messages:** Can use pattern when deltas align, otherwise individual
- **Example:** `/track/[1-10]/azim++ [0.067]` when all moving in sync

### Multi-Track Mode Parameter
```typescript
parameters: {
  ...animationParams,
  _multiTrackMode: 'phase-offset'
}
```

---

## 4. MULTI-TRACK: POSITION-RELATIVE MODE

### Path Calculation
- Each track has **different animation parameters** (centered at track position)
- Uses per-track parameters from `multiTrackParameters[trackId]` OR auto-adjusted
- Each track calculates its own independent path

### OSC Message Format
- **Pattern:** Individual `/track/{N}/axis++` per track
- **Optimization:** Position-relative mode (individual incremental updates)
- **Messages:** N tracks × 3 axes = 3N messages (but still incremental)
- **Example:** 
  ```
  /track/1/azim++ [0.067]
  /track/2/azim++ [0.071]
  /track/3/azim++ [0.065]
  ```

### Multi-Track Mode Parameter
```typescript
parameters: {
  ...trackSpecificParams,
  _multiTrackMode: 'position-relative'
}
```

---

## 5. MULTI-TRACK: PHASE-OFFSET-RELATIVE MODE

### Path Calculation
- Combines **position-relative + phase-offset**
- Each track has different parameters (centered at track position)
- Each track has different initial time: `initialTime = index * phaseOffsetSeconds`
- Independent paths with time stagger

### OSC Message Format
- **Pattern:** Individual `/track/{N}/axis++` per track
- **Optimization:** Position-relative mode (individual incremental updates)
- **Messages:** 3N messages (one per track per axis)
- **Example:** Same as position-relative, but timing is staggered

### Multi-Track Mode Parameter
```typescript
parameters: {
  ...trackSpecificParams,
  _multiTrackMode: 'phase-offset-relative'
}
```

---

## 6. MULTI-TRACK: ISOBARYCENTER (FORMATION) MODE

### Path Calculation
1. Calculate barycenter (center of mass) from selected tracks
2. Calculate offset for each track: `offset = trackPosition - barycenter`
3. Animation calculates barycenter position: `baryPosition = calculatePosition(animation, time)`
4. **For rotational animations:** Rotate offset by animation angle
5. Final position: `trackPosition = baryPosition + rotatedOffset`

### Rotation Logic (Rotational Animations Only)
- **Rotational types:** circular, spiral, orbit, circular-scan
- **Rotation angle:** Calculated from animation progress and type
- **2D rotation matrix:** Applied in animation plane (XY, XZ, or YZ)
- **Effect:** Formation rotates as a rigid body while following the path

### OSC Message Format
- **Pattern:** `/track/[1-10]/axis++` or `/track/{1,3,5}/axis++`
- **Optimization:** Formation mode (all tracks move by same delta)
- **Messages:** 3 messages total (one per axis for all tracks)
- **Example:** `/track/[1-10]/azim++ [0.067]` - formation rotates together
- **Key Insight:** Offsets rotate, but delta is still same for all tracks

### Multi-Track Mode Parameter
```typescript
parameters: {
  ...animationParams,
  _multiTrackMode: 'isobarycenter',
  _isobarycenter: {x, y, z},  // Barycenter position
  _trackOffset: {x, y, z}      // This track's offset from barycenter
}
```

### Supported Animation Types
- **Rotational (with offset rotation):** circular, spiral, orbit, circular-scan
- **Non-rotational (fixed offsets):** linear, bezier, wave, pendulum, etc.

---

## 7. MULTI-TRACK: CENTERED MODE

### Path Calculation
1. User defines center point (X, Y, Z)
2. Calculate offset for each track: `offset = trackPosition - centerPoint`
3. Animation calculates center position: `centerPos = calculatePosition(animation, time)`
4. **For rotational animations:** Rotate offset by animation angle
5. Final position: `trackPosition = centerPos + rotatedOffset`

### Rotation Logic
- **Identical to isobarycenter** - same rotation function
- Only difference: center is user-defined instead of calculated

### OSC Message Format
- **Pattern:** `/track/[1-10]/axis++` or `/track/{1,3,5}/axis++`
- **Optimization:** Formation mode (all tracks move by same delta)
- **Messages:** 3 messages total
- **Example:** `/track/[1-10]/azim++ [0.067]`

### Multi-Track Mode Parameter
```typescript
parameters: {
  ...animationParams,
  _multiTrackMode: 'centered',
  _centeredPoint: {x, y, z},   // User-defined center
  _trackOffset: {x, y, z}       // This track's offset from center
}
```

---

## OSC OPTIMIZATION MATRIX

| Mode | Track Count | Pattern | Message Count | Optimization |
|------|-------------|---------|---------------|--------------|
| Single | 1 | `/track/5/axis++` | 3 | Incremental |
| Identical | N | `/track/[1-N]/axis++` | 3 | Formation |
| Phase-Offset | N | `/track/[1-N]/axis++` | 3 | Phase-offset |
| Position-Relative | N | `/track/{N}/axis++` | 3N | Per-track incremental |
| Phase-Offset-Relative | N | `/track/{N}/axis++` | 3N | Per-track incremental |
| Isobarycenter | N | `/track/[1-N]/axis++` | 3 | Formation |
| Centered | N | `/track/[1-N]/axis++` | 3 | Formation |

---

## COORDINATE SYSTEM SELECTION

### AED-Optimal Animations (Rotational)
- circular, orbit, circular-scan, zoom, spiral, rose-curve, epicycloid
- Messages: `/track/.../azim++`, `/track/.../elev++`, `/track/.../dist++`

### XYZ-Optimal Animations (Linear/Path-based)
- linear, bounce, zigzag, bezier, catmull-rom, doppler, perlin-noise, helix, random
- Messages: `/track/.../x++`, `/track/.../y++`, `/track/.../z++`

### Hybrid Animations
- pendulum, spring, wave, lissajous, attract-repel, formation
- Default to XYZ unless circular motion detected

---

## CRITICAL IMPLEMENTATION DETAILS

### 1. Offset Rotation (Formation Modes Only)
```typescript
function rotateOffsetForAnimation(offset, animationType, params, time, duration) {
  // Only rotate for: circular, spiral, orbit, circular-scan
  // Calculate rotation angle from animation progress
  // Apply 2D rotation matrix in animation plane
  // Returns rotated offset
}
```

### 2. Delta Calculation (OSC Optimizer)
```typescript
const delta = {
  x: currentPosition.x - previousPosition.x,
  y: currentPosition.y - previousPosition.y,
  z: currentPosition.z - previousPosition.z
}
```

### 3. Pattern Generation
```typescript
// Never use /track/* - always specify exact tracks
// Consecutive: /track/[1-10]
// Non-consecutive: /track/{1,3,5,7,10}
// Single: /track/5
```

---

## VALIDATION CHECKLIST

### Path Calculation ✅
- [x] Single track: Direct calculation
- [x] Identical: Same parameters for all
- [x] Phase-offset: Time offset applied
- [x] Position-relative: Per-track parameters
- [x] Phase-offset-relative: Per-track + time offset
- [x] Isobarycenter: Barycenter + rotated offset
- [x] Centered: Center + rotated offset

### OSC Message Format ✅
- [x] Single track: Individual incremental
- [x] Identical: Formation pattern matching
- [x] Phase-offset: Formation when synced
- [x] Position-relative: Individual incremental
- [x] Phase-offset-relative: Individual incremental
- [x] Isobarycenter: Formation pattern matching
- [x] Centered: Formation pattern matching

### Offset Rotation ✅
- [x] Rotational animations: Offset rotates
- [x] Non-rotational: Offset fixed
- [x] Correct plane (XY/XZ/YZ)
- [x] Angle calculation per animation type

### OSC Optimization ✅
- [x] Pattern matching for formation modes
- [x] No /track/* wildcard (always explicit tracks)
- [x] Incremental updates (++) for small deltas
- [x] Auto coordinate system selection
- [x] Delta calculated from frame-to-frame

---

## KNOWN EDGE CASES

1. **First frame:** May send absolute position (no previous position for delta)
2. **Large delta:** Switches from ++ to full position update
3. **Plane changes:** Formation rotation respects animation plane parameter
4. **Loop/ping-pong:** Phase offset maintains independent timing per track
5. **Track range:** Always uses [1-N] or {list}, never *

---

## TESTING RECOMMENDATIONS

1. **Single track circular:** Verify incremental AED messages
2. **10 tracks identical circular:** Verify single pattern message
3. **10 tracks phase-offset circular:** Verify timing stagger
4. **10 tracks position-relative linear:** Verify individual XYZ messages
5. **10 tracks isobarycenter circular:** Verify formation rotation + pattern
6. **10 tracks centered circular:** Verify formation rotation + pattern
7. **Mixed tracks (1,3,5,7,10):** Verify {list} pattern, not [range]
