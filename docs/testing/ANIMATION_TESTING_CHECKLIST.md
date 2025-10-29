# Animation Testing Checklist

## Testing Status
- ✅ **Linear** - Fully tested (previous session)
- 🔲 **Circular** - Pending
- 🔲 **Elliptical** - Pending
- 🔲 **Spiral** - Pending
- 🔲 **Random** - Pending
- 🔲 **Pendulum** - Pending
- 🔲 **Bounce** - Pending
- 🔲 **Spring** - Pending
- 🔲 **Wave** - Pending
- 🔲 **Lissajous** - Pending
- 🔲 **Helix** - Pending
- 🔲 **Bézier** - Pending
- 🔲 **Catmull-Rom** - Pending
- 🔲 **Zigzag** - Pending
- 🔲 **Perlin Noise** - Pending
- 🔲 **Rose Curve** - Pending
- 🔲 **Epicycloid** - Pending
- 🔲 **Orbit** - Pending
- 🔲 **Formation** - Pending
- 🔲 **Attract/Repel** - Pending
- 🔲 **Doppler** - Pending
- 🔲 **Circular Scan** - Pending
- 🔲 **Zoom** - Pending
- 🔲 **Custom** - Pending

## Test Criteria for Each Animation

### 1. Basic Functionality
- [ ] Animation creates and saves without errors
- [ ] Play/Pause/Stop controls work correctly
- [ ] Position updates in real-time
- [ ] 3D preview shows path correctly
- [ ] Animation completes within expected duration

### 2. Parameter Preservation
- [ ] All parameters saved correctly
- [ ] Parameters persist after reload
- [ ] Default parameters are sensible
- [ ] Parameter changes update animation immediately

### 3. Loop & Ping-Pong Modes
- [ ] Loop mode restarts correctly
- [ ] Ping-pong reverses direction properly
- [ ] No jumps or discontinuities at boundaries
- [ ] Per-track loop works in multi-track mode

### 4. Multi-Track Modes
- [ ] Identical mode: all tracks follow same path
- [ ] Phase-offset mode: tracks are time-staggered
- [ ] Position-relative mode: each track uses own center
- [ ] Phase-offset-relative mode: combines both

### 5. OSC Output
- [ ] OSC messages sent at correct rate
- [ ] Position values are accurate
- [ ] No message flooding
- [ ] Coordinates match coordinate system setting

## Test Procedure

For each animation type:

1. **Create Animation**
   - Create a new track
   - Select animation type
   - Keep default parameters
   - Save animation

2. **Verify Playback**
   - Play animation
   - Check duration matches expectation
   - Verify smooth movement
   - Check 3D path preview

3. **Test Parameters**
   - Modify key parameters
   - Save and verify changes persist
   - Reset to defaults and verify

4. **Test Timing**
   - Set duration to 10 seconds
   - Play and time with stopwatch
   - Verify 10s animation = 10 real seconds

5. **Test Loop/Ping-Pong**
   - Enable loop, verify restart
   - Enable ping-pong, verify reversal
   - Check for discontinuities

6. **Multi-Track Test (selected types)**
   - Create 3 tracks
   - Apply same animation
   - Test each multi-track mode
   - Verify phase offset order

## Known Issues to Watch For

Based on previous fixes:
- ✅ Parameter overwriting (x,y,z coordinates) - **FIXED**
- ✅ Timing accuracy - **FIXED**
- ✅ Pause/resume position preservation - **FIXED**
- ✅ Loop/ping-pong global time reset - **FIXED**
- ⚠️ Physics-based animations state reset on pause
- ⚠️ Random animation target regeneration

## Testing Categories Priority

1. **HIGH PRIORITY** (Common use cases)
   - Basic: Circular, Elliptical, Spiral, Random
   - Physics: Pendulum, Bounce, Spring
   - Wave: Wave, Lissajous, Helix

2. **MEDIUM PRIORITY** (Advanced features)
   - Curve: Bézier, Catmull-Rom, Zigzag
   - Procedural: Perlin Noise, Rose Curve, Epicycloid
   - Interactive: Orbit, Formation, Attract/Repel

3. **LOW PRIORITY** (Specialized)
   - Spatial: Doppler, Circular Scan, Zoom
   - Custom: Keyframe-based

## Test Results Template

```
### [Animation Type]
- Date: YYYY-MM-DD
- Tester: [Name]
- Status: ✅ Pass / ⚠️ Issues / ❌ Fail

**Basic Functionality:** ✅/⚠️/❌
- Notes:

**Parameter Preservation:** ✅/⚠️/❌
- Notes:

**Loop/Ping-Pong:** ✅/⚠️/❌
- Notes:

**Multi-Track:** ✅/⚠️/❌
- Notes:

**Issues Found:**
1. [Description]
2. [Description]

**Recommendations:**
- [Suggestion]
```
