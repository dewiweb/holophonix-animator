# Quick Animation Testing Procedure

## Overview
This guide provides a fast, systematic approach to verify all 23 remaining animation types work correctly with the engine fixes from the previous session.

## Prerequisites
- Start the dev server: `npm run dev`
- Open the application in browser
- Open browser console (F12)

## Quick Test Method

### Browser Console Testing
Once the app is loaded, open the browser console and run:
```javascript
window.testAnimations()
```

This will automatically test all 24 animation types and display results.

## Manual Testing (Per Animation Type)

For each animation, follow this 2-minute procedure:

### 1. CREATE (15 seconds)
- Click "Add Track" 
- Select animation type from dropdown
- Click "Save Animation"

### 2. PLAY (30 seconds)
- Click Play ▶️
- Watch for 5 seconds
- Verify smooth movement
- Check 3D path preview displays correctly

### 3. VERIFY TIMING (30 seconds)
- Note the duration (default 10s)
- Start a timer
- Click Play
- Verify animation completes in expected time

### 4. LOOP TEST (30 seconds)
- Enable "Loop" checkbox
- Click Play
- Verify animation restarts smoothly without jumps
- Try Ping-Pong mode - verify reversal

### 5. QUICK PASS/FAIL (15 seconds)
✅ **PASS** if:
- Animation plays without errors
- Movement is visible and smooth
- Duration is accurate
- Loop/ping-pong work

❌ **FAIL** if:
- Console errors appear
- No movement occurs
- Position values are NaN/Infinity
- Jumps/discontinuities on loop

## Animation Types by Category

### CATEGORY 1: Basic (5 types) - 10 minutes
- [ ] **Circular** - Should move in circle
- [ ] **Elliptical** - Should move in ellipse
- [ ] **Spiral** - Should spiral outward/inward
- [ ] **Random** - Should move randomly within bounds

### CATEGORY 2: Physics (3 types) - 6 minutes
- [ ] **Pendulum** - Should swing realistically
- [ ] **Bounce** - Should bounce and settle
- [ ] **Spring** - Should oscillate with damping

### CATEGORY 3: Wave (3 types) - 6 minutes
- [ ] **Wave** - Should oscillate in wave pattern
- [ ] **Lissajous** - Should create figure-8 or complex curve
- [ ] **Helix** - Should spiral along axis

### CATEGORY 4: Curve/Path (3 types) - 6 minutes
- [ ] **Bézier** - Should follow smooth curve
- [ ] **Catmull-Rom** - Should pass through points smoothly
- [ ] **Zigzag** - Should create sharp angular path

### CATEGORY 5: Procedural (3 types) - 6 minutes
- [ ] **Perlin Noise** - Should create organic flowing movement
- [ ] **Rose Curve** - Should create flower petal pattern
- [ ] **Epicycloid** - Should create spirograph-like pattern

### CATEGORY 6: Interactive (3 types) - 6 minutes
- [ ] **Orbit** - Should orbit around center point
- [ ] **Formation** - Should maintain position (simplified)
- [ ] **Attract/Repel** - Should move toward/away from target

### CATEGORY 7: Spatial Audio (3 types) - 6 minutes
- [ ] **Doppler** - Should fly-by in straight line
- [ ] **Circular Scan** - Should sweep in circle
- [ ] **Zoom** - Should move radially in/out

**Total estimated time: ~45 minutes for all 23 types**

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
