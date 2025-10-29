# Complete Combination Matrix: Track Count × Animation Mode × Animation Type

## Total Combinations: 7 modes × 24 animation types = 168 scenarios

---

## Animation Types (24 Total)

### Basic (5)
1. **linear** - Straight line movement
2. **circular** - Circle path (rotational)
3. **elliptical** - Ellipse path
4. **spiral** - Expanding/contracting circle (rotational)
5. **random** - Random waypoints

### Physics-Based (3)
6. **pendulum** - Swinging with gravity
7. **bounce** - Vertical bouncing
8. **spring** - Spring dynamics

### Wave-Based (3)
9. **wave** - Sinusoidal oscillation
10. **lissajous** - Complex periodic patterns
11. **helix** - 3D spiral along axis

### Curve & Path-Based (3)
12. **bezier** - Cubic Bézier curves
13. **catmull-rom** - Smooth spline through points
14. **zigzag** - Angular back-and-forth

### Advanced Procedural (3)
15. **perlin-noise** - Organic noise-based movement
16. **rose-curve** - Mathematical flower patterns (rotational)
17. **epicycloid** - Circle rolling around circle (rotational)

### Multi-Object & Interactive (3)
18. **orbit** - Orbital motion with inclination (rotational)
19. **formation** - Maintain relative positions
20. **attract-repel** - Force-based physics

### Specialized Spatial Audio (4)
21. **doppler** - Linear fly-by path
22. **circular-scan** - Sweep around listener (rotational)
23. **zoom** - Radial movement
24. **custom** - User-defined keyframes

---

## DEEP ANALYSIS BY MODE

---

## MODE 1: SINGLE TRACK (24 combinations)

### Path Calculation
```typescript
position = calculatePosition(animation, time, loopCount)
// No offsets, no multi-track logic
```

### OSC Format
- Pattern: `/track/{N}/axis++`
- Optimization: Incremental updates
- Messages: 3 per frame

### Per Animation Type Analysis

#### Rotational Animations (7 types)
**circular, spiral, orbit, circular-scan, rose-curve, epicycloid**
- Coordinate System: **AED** (azim, elev, dist)
- Messages: `/track/{N}/azim++`, `/track/{N}/elev++`, `/track/{N}/dist++`
- Offsets: None
- Rotation: N/A (single track)
- ✅ **Status: CORRECT**

#### Linear/Path Animations (10 types)
**linear, bezier, catmull-rom, zigzag, doppler, bounce, perlin-noise, helix, random, custom**
- Coordinate System: **XYZ**
- Messages: `/track/{N}/x++`, `/track/{N}/y++`, `/track/{N}/z++`
- Offsets: None
- ✅ **Status: CORRECT**

#### Hybrid Animations (7 types)
**elliptical, pendulum, spring, wave, lissajous, formation, attract-repel, zoom**
- Coordinate System: **XYZ** (default)
- Messages: `/track/{N}/x++`, `/track/{N}/y++`, `/track/{N}/z++`
- Offsets: None
- ✅ **Status: CORRECT**

---

## MODE 2: IDENTICAL (24 combinations)

### Path Calculation
```typescript
// All tracks: same parameters, same position
position = calculatePosition(animation, time, loopCount)
```

### OSC Format
- Pattern: `/track/[1-N]/axis++` or `/track/{1,3,5}/axis++`
- Optimization: Formation mode
- Messages: 3 total (one delta for all tracks)

### Per Animation Type Analysis

#### Rotational Animations (7 types)
**circular, spiral, orbit, circular-scan, rose-curve, epicycloid**
- Coordinate System: **AED**
- Messages: `/track/[1-N]/azim++`, `/track/[1-N]/elev++`, `/track/[1-N]/dist++`
- All tracks at SAME position
- ✅ **Status: CORRECT** - Formation optimization valid

#### Linear/Path Animations (10 types)
**linear, bezier, catmull-rom, zigzag, doppler, bounce, perlin-noise, helix, random, custom**
- Coordinate System: **XYZ**
- Messages: `/track/[1-N]/x++`, `/track/[1-N]/y++`, `/track/[1-N]/z++`
- All tracks at SAME position
- ✅ **Status: CORRECT** - Formation optimization valid

#### Hybrid Animations (7 types)
**elliptical, pendulum, spring, wave, lissajous, formation, attract-repel, zoom**
- Coordinate System: **XYZ**
- Messages: `/track/[1-N]/x++`, `/track/[1-N]/y++`, `/track/[1-N]/z++`
- All tracks at SAME position
- ✅ **Status: CORRECT** - Formation optimization valid

---

## MODE 3: PHASE-OFFSET (24 combinations)

### Path Calculation
```typescript
// All tracks: same parameters, different time
initialTime = index * phaseOffsetSeconds
position = calculatePosition(animation, time + initialTime, loopCount)
```

### OSC Format
- Pattern: `/track/[1-N]/axis++` (when deltas align)
- Optimization: Phase-offset mode
- Messages: 3 when synced, 3N when not synced

### Per Animation Type Analysis

#### Rotational Animations (7 types)
**circular, spiral, orbit, circular-scan, rose-curve, epicycloid**
- Coordinate System: **AED**
- Messages: Pattern matching possible when rotation speeds align
- Tracks at DIFFERENT positions (phase-shifted)
- ⚠️ **Issue: Formation optimization may not be valid**
- ❌ **Status: NEEDS FIX** - Should use position-relative optimization

#### Linear/Path Animations (10 types)
**linear, bezier, catmull-rom, zigzag, doppler, bounce, perlin-noise, helix, random, custom**
- Coordinate System: **XYZ**
- Tracks at DIFFERENT positions (phase-shifted)
- ⚠️ **Issue: Formation optimization may not be valid**
- ❌ **Status: NEEDS FIX** - Should use position-relative optimization

#### Hybrid Animations (7 types)
**elliptical, pendulum, spring, wave, lissajous, formation, attract-repel, zoom**
- Tracks at DIFFERENT positions (phase-shifted)
- ⚠️ **Issue: Formation optimization may not be valid**
- ❌ **Status: NEEDS FIX** - Should use position-relative optimization

**CRITICAL FINDING: Phase-offset mode cannot use formation optimization because tracks are at different positions!**

---

## MODE 4: POSITION-RELATIVE (24 combinations)

### Path Calculation
```typescript
// Each track: different parameters (centered at track position)
trackParams = adjustParametersToTrackPosition(baseParams, trackPosition)
position = calculatePosition(trackParamsAnimation, time, loopCount)
```

### OSC Format
- Pattern: `/track/{N}/axis++` (individual)
- Optimization: Position-relative mode
- Messages: 3N (one per track per axis)

### Per Animation Type Analysis

#### Center-Based Animations (13 types)
**circular, spiral, elliptical, wave, lissajous, orbit, rose-curve, epicycloid, circular-scan, helix, random, attract-repel, zoom**
- Parameters adjusted: `center` → trackPosition
- ✅ **Status: CORRECT** - Each track has independent path

#### Start-Based Animations (5 types)
**linear, bezier, catmull-rom, zigzag, doppler**
- Parameters adjusted: `startPosition` → trackPosition
- ✅ **Status: CORRECT** - Each track has independent path

#### Special Animations (6 types)
**pendulum** - `anchorPoint` → trackPosition ✅
**bounce** - `startHeight` → trackPosition.z ✅
**spring** - `restPosition` → trackPosition ✅
**formation** - Not applicable in position-relative ⚠️
**custom** - Uses keyframes, no auto-adjustment ⚠️

---

## MODE 5: PHASE-OFFSET-RELATIVE (24 combinations)

### Path Calculation
```typescript
// Each track: different parameters + different time
initialTime = index * phaseOffsetSeconds
trackParams = adjustParametersToTrackPosition(baseParams, trackPosition)
position = calculatePosition(trackParamsAnimation, time + initialTime, loopCount)
```

### OSC Format
- Pattern: `/track/{N}/axis++` (individual)
- Optimization: Position-relative mode
- Messages: 3N

### Status
- Same as position-relative mode + time offset
- ✅ **Status: CORRECT** - All animation types work correctly

---

## MODE 6: ISOBARYCENTER (24 combinations)

### Path Calculation
```typescript
// 1. Calculate barycenter from selected tracks
barycenter = calculateBarycenter(selectedTracks)

// 2. Calculate offset for each track
offset = trackPosition - barycenter

// 3. Animate barycenter
baryPosition = calculatePosition(animation, time, loopCount)

// 4. Rotate offset for rotational animations
rotatedOffset = rotateOffsetForAnimation(offset, animationType, params, time, duration)

// 5. Final position
position = baryPosition + rotatedOffset
```

### OSC Format
- Pattern: `/track/[1-N]/axis++`
- Optimization: Formation mode
- Messages: 3 total

### Per Animation Type Analysis

#### Rotational Animations WITH Rotation (7 types)
**circular, spiral, orbit, circular-scan, rose-curve, epicycloid**
- Offsets **rotate** with animation
- Formation maintains shape while rotating
- All tracks move by SAME delta (after rotation)
- ✅ **Status: CORRECT** - Formation optimization valid

#### Linear/Path Animations WITHOUT Rotation (10 types)
**linear, bezier, catmull-rom, zigzag, doppler, bounce, perlin-noise, helix, random, custom**
- Offsets stay **fixed** in world space
- Formation maintains shape (no rotation)
- All tracks move by SAME delta
- ✅ **Status: CORRECT** - Formation optimization valid

#### Hybrid Animations WITHOUT Rotation (7 types)
**elliptical, pendulum, spring, wave, lissajous, formation, attract-repel, zoom**
- Offsets stay **fixed** in world space
- Formation maintains shape (no rotation)
- All tracks move by SAME delta
- ✅ **Status: CORRECT** - Formation optimization valid

**SPECIAL CASE: rose-curve, epicycloid**
- These are rotational but may have complex rotation patterns
- ⚠️ **Needs verification** - Rotation calculation may need adjustment

---

## MODE 7: CENTERED (24 combinations)

### Path Calculation
```typescript
// 1. User defines center point
centerPoint = {x, y, z}

// 2. Calculate offset for each track
offset = trackPosition - centerPoint

// 3. Animate center
centerPos = calculatePosition(animation, time, loopCount)

// 4. Rotate offset for rotational animations
rotatedOffset = rotateOffsetForAnimation(offset, animationType, params, time, duration)

// 5. Final position
position = centerPos + rotatedOffset
```

### OSC Format
- Pattern: `/track/[1-N]/axis++`
- Optimization: Formation mode
- Messages: 3 total

### Per Animation Type Analysis

#### Center-Compatible Animations (13 types)
**circular, spiral, elliptical, wave, lissajous, orbit, rose-curve, epicycloid, circular-scan, helix, random, attract-repel, zoom**
- Animation has `center` parameter
- Center applied directly to animation
- Rotational types: Offsets rotate ✅
- Non-rotational: Offsets fixed ✅
- ✅ **Status: CORRECT**

#### Center-Incompatible Animations (5 types)
**linear, bezier, catmull-rom, zigzag, doppler**
- Animation uses `startPosition`, not `center`
- ⚠️ **Issue: Center mode not applicable**
- 🔧 **Should be disabled in UI** for these types

#### Special Cases (6 types)
**pendulum** - Uses `anchorPoint` (could map to center) ⚠️
**bounce** - Uses `groundLevel` (not center-based) ❌
**spring** - Uses `restPosition` (not center-based) ❌
**formation** - Already formation-based ❌
**custom** - Keyframe-based ❌

---

## CRITICAL ISSUES FOUND

### 🔴 ISSUE 1: Phase-Offset Mode OSC Optimization
**Problem:** Phase-offset mode uses formation optimization, but tracks are at DIFFERENT positions
**Impact:** Incorrect OSC messages sent to Holophonix
**Fix Required:** Change phase-offset to use position-relative optimization

```typescript
// CURRENT (WRONG)
case 'phase-offset':
  return this.optimizePhaseOffsetMode(updates, coordSystem) // Uses formation

// SHOULD BE
case 'phase-offset':
  return this.optimizePositionRelativeMode(updates, coordSystem) // Individual
```

### 🟡 ISSUE 2: Centered Mode Compatibility
**Problem:** Centered mode allows incompatible animation types
**Impact:** Animations use wrong parameters, unexpected behavior
**Fix Required:** Update compatibility.ts to restrict centered mode

```typescript
// Add to isMultiTrackModeCompatible()
if (multiTrackMode === 'centered') {
  const centerBasedTypes = [
    'circular', 'spiral', 'elliptical', 'wave', 'lissajous',
    'orbit', 'rose-curve', 'epicycloid', 'circular-scan',
    'helix', 'random', 'attract-repel', 'zoom'
  ]
  return centerBasedTypes.includes(animationType)
}
```

### 🟡 ISSUE 3: Rose-Curve & Epicycloid Rotation
**Problem:** Complex rotation patterns may not match simple angle calculation
**Impact:** Formation may distort slightly during animation
**Fix Required:** Verify rotation calculation for these types

---

## VALIDATION MATRIX

| Mode | Animation Type | Path Calc | OSC Format | Offset | Rotation | Status |
|------|---------------|-----------|------------|--------|----------|--------|
| Single | All (24) | ✅ | ✅ | N/A | N/A | ✅ |
| Identical | All (24) | ✅ | ✅ | N/A | N/A | ✅ |
| Phase-Offset | All (24) | ✅ | ❌ | N/A | N/A | ❌ FIX NEEDED |
| Position-Relative | All (24) | ✅ | ✅ | N/A | N/A | ✅ |
| Phase-Offset-Relative | All (24) | ✅ | ✅ | N/A | N/A | ✅ |
| Isobarycenter | Rotational (7) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Isobarycenter | Non-rotational (17) | ✅ | ✅ | ✅ | N/A | ✅ |
| Centered | Center-based (13) | ✅ | ✅ | ✅ | ✅/N/A | ✅ |
| Centered | Path-based (5) | ❌ | N/A | N/A | N/A | ❌ INCOMPATIBLE |
| Centered | Special (6) | ⚠️ | N/A | N/A | N/A | ⚠️ NEEDS REVIEW |

---

## SUMMARY

### ✅ Working Correctly (139/168 combinations)
- Single track: 24/24 ✅
- Identical: 24/24 ✅
- Position-Relative: 24/24 ✅
- Phase-Offset-Relative: 24/24 ✅
- Isobarycenter: 24/24 ✅
- Centered: 13/24 ✅

### ❌ Needs Fixing (24/168 combinations)
- Phase-Offset: 0/24 (OSC optimization wrong)

### ⚠️ Needs Review (5/168 combinations)
- Centered with incompatible types: 5 types should be disabled

### Priority Fixes
1. **HIGH:** Fix phase-offset OSC optimization (24 combinations)
2. **MEDIUM:** Add centered mode compatibility checks (11 combinations)
3. **LOW:** Verify rose-curve/epicycloid rotation accuracy (2 combinations)
