# Systematic Verification Checklist: Animation Types × Modes

## Purpose
This document provides a systematic checklist to verify that 3D preview and OSC messages are consistent for ALL combinations of animation types and multi-track modes.

---

## Critical Bug Pattern Identified

**The Helix Bug Pattern:**
- ✅ 3D preview shows correct behavior (tracks with independent paths)
- ❌ OSC messages show sync behavior (all tracks moving together)
- **Root Cause:** `_multiTrackMode` not preserved in per-track parameters
- **Result:** Optimizer defaults to 'identical' mode → formation optimization → wrong OSC

**This pattern MUST be checked for every animation type in every mode!**

---

## Verification Points (For Each Combination)

### 1. Parameter Adjustment
- [ ] Animation type has parameter adjustment logic in `applyPositionRelativeParameters()`
- [ ] Correct parameter is adjusted (center, startPosition, axisStart/End, etc.)
- [ ] Offset calculation is correct for track position
- [ ] User-modified parameters are respected

### 2. Multi-Track Mode Preservation
- [ ] `_multiTrackMode` is stored in animation parameters when saving
- [ ] Mode is preserved in per-track parameters for position-relative modes
- [ ] Mode is preserved in formation mode parameters (isobarycenter, centered)
- [ ] Animation engine correctly reads mode from first track

### 3. 3D Preview
- [ ] Single track: Animates correctly at track position
- [ ] Multiple tracks, identical: All tracks at same position
- [ ] Multiple tracks, position-relative: Each track has independent path
- [ ] Multiple tracks, formation: Tracks maintain formation geometry
- [ ] Rotation: Formation rotates correctly (for rotational animations)

### 4. OSC Messages
- [ ] Single track: Individual incremental messages (`/track/N/axis++`)
- [ ] Identical: Formation pattern (`/track/[1-N]/axis++`, 3 messages)
- [ ] Position-relative: Individual per-track (`/track/N/axis++`, 3N messages)
- [ ] Formation modes: Formation pattern with correct deltas
- [ ] Coordinate system: AED for rotational, XYZ for linear
- [ ] Messages match 3D preview movement

### 5. Console Logs
- [ ] Save: Shows correct mode application per track
- [ ] Play: Shows detected `_multiTrackMode` (debug logs)
- [ ] Play: Optimization stats show correct message count
- [ ] Play: Track positions match expected values

---

## 24 Animation Types × 7 Modes = 168 Verification Tests

### Animation Type Categories

#### A. Center-Based (13 types)
**Parameter:** `center` → track position
1. circular ✅
2. spiral ✅
3. elliptical (uses centerX/Y/Z) ⚠️
4. wave ✅
5. lissajous ✅
6. orbit ✅
7. rose-curve ✅
8. epicycloid ✅
9. circular-scan ✅
10. perlin-noise ✅
11. attract-repel (uses targetPosition) ⚠️
12. zoom (uses zoomCenter) ⚠️
13. random (uses center + bounds) ⚠️

#### B. Path-Based (5 types)
**Parameter:** `startPosition` + `endPosition` → track position
14. linear ✅
15. bezier ✅
16. catmull-rom ✅
17. zigzag ✅
18. doppler ✅

#### C. Axis-Based (1 type)
**Parameter:** `axisStart` + `axisEnd` → track position
19. helix ✅ **FIXED**

#### D. Anchor-Based (3 types)
**Parameter:** varies
20. pendulum (anchorPoint) ✅
21. spring (restPosition) ✅
22. bounce (groundLevel) ✅

#### E. Special (2 types)
23. formation ❓ (formation within formation?)
24. custom ❓ (keyframes, no auto-adjustment)

---

## Mode-Specific Checks

### MODE 1: Single Track
**Path:** Direct calculation, no offsets
**OSC:** Individual incremental (`/track/N/axis++`, 3 msgs)
**_multiTrackMode:** N/A (not set)

| Animation Type | Param Adjust | 3D Preview | OSC Format | Status |
|----------------|--------------|------------|------------|--------|
| circular | N/A | ✅ | ✅ | ✅ |
| spiral | N/A | ✅ | ✅ | ✅ |
| helix | N/A | ✅ | ✅ | ✅ |
| linear | N/A | ✅ | ✅ | ✅ |
| ... (all 24) | N/A | ✅ | ✅ | ✅ |

---

### MODE 2: Identical
**Path:** Same parameters for all tracks
**OSC:** Formation pattern (`/track/[1-N]/axis++`, 3 msgs)
**_multiTrackMode:** `'identical'`

| Animation Type | _multiTrackMode Set | 3D Preview | OSC Format | Status |
|----------------|---------------------|------------|------------|--------|
| circular | ✅ | ✅ (all same) | ✅ formation | ✅ |
| spiral | ✅ | ✅ (all same) | ✅ formation | ✅ |
| helix | ✅ | ✅ (all same) | ✅ formation | ✅ |
| linear | ✅ | ✅ (all same) | ✅ formation | ✅ |
| ... (all 24) | ✅ | ✅ | ✅ | ✅ |

---

### MODE 3: Phase-Offset
**Path:** Same parameters, time offset per track
**OSC:** Individual per-track (`/track/N/axis++`, 3N msgs) **FIXED**
**_multiTrackMode:** `'phase-offset'`

| Animation Type | _multiTrackMode Set | 3D Preview | OSC Format | Status |
|----------------|---------------------|------------|------------|--------|
| circular | ✅ | ✅ (offset timing) | ✅ individual | ✅ |
| spiral | ✅ | ✅ (offset timing) | ✅ individual | ✅ |
| helix | ✅ | ✅ (offset timing) | ✅ individual | ✅ |
| linear | ✅ | ✅ (offset timing) | ✅ individual | ✅ |
| ... (all 24) | ✅ | ✅ | ✅ | ✅ |

---

### MODE 4: Position-Relative
**Path:** Per-track parameters (centered at each track)
**OSC:** Individual per-track (`/track/N/axis++`, 3N msgs)
**_multiTrackMode:** `'position-relative'` **MUST BE PRESERVED IN PER-TRACK PARAMS**

| Animation Type | Param Adjust | _multiTrackMode Preserved | 3D Preview | OSC Format | Status |
|----------------|--------------|---------------------------|------------|------------|--------|
| circular | ✅ center | ✅ **FIXED** | ✅ (independent) | ✅ individual | ✅ |
| spiral | ✅ center | ✅ **FIXED** | ✅ (independent) | ✅ individual | ✅ |
| helix | ✅ axisStart/End | ✅ **FIXED** | ✅ (independent) | ✅ individual | ✅ |
| linear | ✅ startPos | ✅ **FIXED** | ✅ (independent) | ✅ individual | ✅ |
| elliptical | ✅ centerX/Y/Z | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| wave | ✅ center | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| lissajous | ✅ center | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| orbit | ✅ center | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| rose-curve | ✅ center | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| epicycloid | ✅ center | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| circular-scan | ✅ center | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| perlin-noise | ✅ center | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| bezier | ✅ startPos | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| catmull-rom | ✅ startPos | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| zigzag | ✅ startPos | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| doppler | ✅ startPos | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| pendulum | ✅ anchorPoint | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| spring | ✅ restPosition | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| bounce | ✅ groundLevel | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| attract-repel | ✅ targetPosition | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| zoom | ✅ zoomCenter | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| random | ✅ center+waypoints | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| formation | ❌ N/A | ⚠️ | ⚠️ | ⚠️ | ❓ |
| custom | ❌ N/A | ⚠️ | ⚠️ | ⚠️ | ❓ |

---

### MODE 5: Phase-Offset-Relative
**Path:** Per-track parameters + time offset
**OSC:** Individual per-track (`/track/N/axis++`, 3N msgs)
**_multiTrackMode:** `'phase-offset-relative'` **MUST BE PRESERVED**

| Animation Type | Param Adjust | _multiTrackMode Preserved | 3D Preview | OSC Format | Status |
|----------------|--------------|---------------------------|------------|------------|--------|
| helix | ✅ | ✅ **FIXED** | ✅ (independent + offset) | ✅ individual | ✅ |
| ... (all 24) | ✅ | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |

---

### MODE 6: Isobarycenter
**Path:** Barycenter + rotated offsets
**OSC:** Formation pattern (`/track/[1-N]/axis++`, 3 msgs)
**_multiTrackMode:** `'isobarycenter'` **MUST BE PRESERVED**

| Animation Type | Rotation | _multiTrackMode Preserved | 3D Preview | OSC Format | Status |
|----------------|----------|---------------------------|------------|------------|--------|
| circular | ✅ rotates | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| spiral | ✅ rotates | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| orbit | ✅ rotates | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| circular-scan | ✅ rotates | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| rose-curve | ✅ rotates | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| epicycloid | ✅ rotates | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| linear | ❌ fixed | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| helix | ❌ fixed | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| ... (all 24) | varies | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |

---

### MODE 7: Centered
**Path:** User center + rotated offsets
**OSC:** Formation pattern (`/track/[1-N]/axis++`, 3 msgs)
**_multiTrackMode:** `'centered'` **MUST BE PRESERVED**
**Compatibility:** Only center-based animations (13 types)

| Animation Type | Compatible | Rotation | _multiTrackMode Preserved | 3D Preview | OSC Format | Status |
|----------------|------------|----------|---------------------------|------------|------------|--------|
| circular | ✅ | ✅ rotates | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| spiral | ✅ | ✅ rotates | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |
| linear | ❌ | N/A | N/A | ❌ incompatible | N/A | ❌ BLOCK |
| bezier | ❌ | N/A | N/A | ❌ incompatible | N/A | ❌ BLOCK |
| ... | varies | varies | ✅ **FIXED** | ⚠️ TEST | ⚠️ TEST | ⚠️ |

---

## Testing Protocol

### For Each Animation Type:

#### 1. Single Track Test
```
1. Create animation with default parameters
2. Select 1 track
3. Save and play animation
4. Check: 3D preview shows correct movement
5. Check: Console shows individual OSC messages (/track/N/axis++)
6. Check: Holophonix track moves correctly
```

#### 2. Identical Mode Test (5 tracks)
```
1. Create animation with default parameters
2. Select 5 tracks
3. Choose "Identical" mode
4. Save and play animation
5. Check: 3D preview shows all tracks at same position
6. Check: Console shows _multiTrackMode: 'identical'
7. Check: Console shows formation pattern (/track/[1-5]/axis++)
8. Check: Console shows 3 messages (70% reduction)
9. Check: Holophonix all tracks move together in sync
```

#### 3. Position-Relative Mode Test (5 tracks)
```
1. Create animation with default parameters
2. Select 5 tracks at different positions
3. Choose "Position-Relative" mode
4. Save and play animation
5. Check: 3D preview shows each track with independent path
6. Check: Console shows _multiTrackMode: 'position-relative' for all tracks
7. Check: Console shows individual messages (/track/N/axis++)
8. Check: Console shows 15 messages (3 per track)
9. Check: Holophonix tracks move independently
```

#### 4. Phase-Offset-Relative Mode Test (5 tracks)
```
1. Create animation with default parameters
2. Select 5 tracks at different positions
3. Choose "Phase-Offset-Relative" mode
4. Set phase offset (e.g., 0.5 seconds)
5. Save and play animation
6. Check: 3D preview shows independent paths + time stagger
7. Check: Console shows _multiTrackMode: 'phase-offset-relative'
8. Check: Console shows individual messages (/track/N/axis++)
9. Check: Holophonix tracks move independently with time offset
```

#### 5. Isobarycenter Mode Test (5 tracks)
```
1. Create animation (prefer rotational type)
2. Select 5 tracks at different positions
3. Choose "Formation/Isobarycenter" mode
4. Save and play animation
5. Check: 3D preview shows golden barycenter sphere
6. Check: 3D preview shows tracks maintain formation shape
7. Check: For rotational: formation rotates as rigid body
8. Check: Console shows _multiTrackMode: 'isobarycenter'
9. Check: Console shows formation pattern (/track/[1-5]/axis++)
10. Check: Console shows 3 messages (70% reduction)
11. Check: Holophonix tracks move in formation
```

#### 6. Centered Mode Test (5 tracks, if compatible)
```
1. Create center-based animation
2. Select 5 tracks at different positions
3. Choose "Centered" mode
4. Set center point (e.g., 0, 0, 0)
5. Save and play animation
6. Check: 3D preview shows tracks maintain formation
7. Check: For rotational: formation rotates around center
8. Check: Console shows _multiTrackMode: 'centered'
9. Check: Console shows formation pattern
10. Check: Holophonix tracks move in formation around center
```

---

## Known Issues & Fixes Applied

### ✅ FIXED Issues:
1. **Helix position-relative:** Missing parameter adjustment ✅
2. **Phase-offset OSC:** Used formation instead of individual ✅
3. **Position-relative _multiTrackMode:** Not preserved in per-track params ✅
4. **Isobarycenter/Centered _multiTrackMode:** Now explicitly preserved ✅

### ⚠️ Needs Testing:
- All 24 animation types in position-relative mode
- All 24 animation types in phase-offset-relative mode
- All 24 animation types in isobarycenter mode
- 13 center-based types in centered mode

### ❓ Needs Investigation:
- `formation` animation in position-relative mode (formation within formation?)
- `custom` animation in position-relative mode (keyframes, no auto-adjustment?)

---

## Quick Test Scenarios (Priority)

### HIGH PRIORITY: Position-Relative Modes
Test these IMMEDIATELY as they had the bug:
1. ✅ helix + phase-offset-relative (FIXED & TESTED)
2. ⚠️ circular + position-relative
3. ⚠️ spiral + position-relative
4. ⚠️ linear + position-relative
5. ⚠️ wave + phase-offset-relative

### MEDIUM PRIORITY: Formation Modes
6. ⚠️ circular + isobarycenter (rotation test)
7. ⚠️ linear + isobarycenter (fixed offset test)
8. ⚠️ circular + centered (rotation test)

### LOW PRIORITY: Edge Cases
9. ⚠️ formation + any mode
10. ⚠️ custom + any mode

---

## Automation Potential

This verification could be automated with:
1. Automated test suite that creates animations programmatically
2. Captures 3D preview positions per frame
3. Captures OSC messages sent per frame
4. Compares 3D preview deltas with OSC message deltas
5. Asserts consistency
6. Reports any discrepancies

**Recommended:** E2E testing framework (Playwright/Cypress) + OSC message capture
