# Pause/Resume Intermittent Jump Bug - Investigation Needed

## Status: NOT RESOLVED ⚠️

## Issue Description

**Symptom**: When pausing and resuming an animation multiple times, tracks **sometimes** jump to unexpected positions:
- Starting position (animation start)
- Ending position (animation end)  
- Other random positions on the animation path
- Initial position (pre-animation)

**Frequency**: Intermittent/random - only happens sometimes after multiple pause/resume cycles

**Impact**: Makes pause/resume unreliable for production use

---

## What We Fixed (That's Working)

✅ **OSC Interference Prevention**
- Block OSC position updates during paused animations
- Block OSC updates during all easing operations (start/stop)
- Added `easingTracks` Set to track which tracks are easing
- OSC echoes from Holophonix no longer interfere with animations

✅ **Multiple Animations on Same Track**
- Auto-stop conflicting animations when starting new one
- Prevents having paused + playing animation on same track

✅ **Frame-Accurate Resume**
- Correct `startTime` calculation on first frame after resume
- `pausedTime` properly managed across pause/resume cycles

✅ **Protection During Easing**
- "Goto start" easing protected from OSC
- "Return to initial" easing protected from OSC

---

## What's Still Broken

❌ **Intermittent Position Jumps**
- All the above fixes are working correctly in logs
- But jumps still happen sometimes
- Bug is race-condition based
- Needs to catch it "in the act" with logs

---

## Investigation Plan

### 1. Capture the Bug in Logs

**Test Scenario**:
```
1. Clear/delete old log files
2. Start fresh session
3. Play animation → Pause → Resume (repeat 5-10 times)
4. When jump occurs, IMMEDIATELY save the log
5. Share log file showing the actual jump
```

**What to Look For in Logs**:
- What was the last `pausedTime` stored?
- What `startTime` was calculated on resume?
- What was the `animationTime` when it jumped?
- Were there any OSC updates between pause/resume?
- Was there a stop/easing triggered unexpectedly?

### 2. Possible Root Causes

**Theory 1: Animation Time Calculation During Pause**
```typescript
// In animate loop, even though we skip paused animations,
// if somehow animationTime is calculated:
const animationTime = (timestamp - animation.startTime) / 1000

// If animation.startTime is stale or wrong, this could
// calculate a time that's > duration or < 0
// causing position to jump
```

**Theory 2: Race Between State Updates**
```
User clicks pause
  ↓
State update queued
  ↓
User clicks resume (before pause completes)
  ↓
State collision: startTime/pausedTime corrupted
```

**Theory 3: OSC Echo Timing**
```
Animation updates position
  ↓
OSC sends to Holophonix
  ↓
User pauses
  ↓
Holophonix echoes position back (delayed)
  ↓
Echo arrives after pause
  ↓
Something lets the echo through?
```

**Theory 4: Animation Reaching End While Paused**
```
Animation paused at 8.5s (duration=10s)
  ↓
User waits a long time
  ↓
Resume clicked
  ↓
Some calculation thinks "time > duration"
  ↓
Triggers end behavior (return to initial?)
```

### 3. Debug Additions Needed

Add these logs to catch the bug:

**In `playAnimation` (resume path)**:
```typescript
if (existingAnimation.isPaused) {
  // LOG: All animation state before resume
  console.log('🔍 RESUME DEBUG:', {
    currentTime: Date.now(),
    animation: {
      startTime: existingAnimation.startTime,
      pausedTime: existingAnimation.pausedTime,
      isPaused: existingAnimation.isPaused,
      loopCount: existingAnimation.loopCount
    },
    calculated: {
      elapsedBeforePause: existingAnimation.pausedTime,
      expectedResumeTime: existingAnimation.pausedTime / 1000,
      timeSincePause: Date.now() - (existingAnimation.pauseTimestamp || 0)
    }
  })
}
```

**In `animate` loop (first frame after resume)**:
```typescript
if (trulyFreshAnimation.startTime === 0 && trulyFreshAnimation.pausedTime !== undefined) {
  const correctStartTime = timestamp - trulyFreshAnimation.pausedTime
  console.log('🔍 FIRST FRAME AFTER RESUME:', {
    timestamp,
    pausedTime: trulyFreshAnimation.pausedTime,
    calculatedStartTime: correctStartTime,
    resultingAnimationTime: (timestamp - correctStartTime) / 1000,
    // This should match pausedTime/1000
    shouldMatch: trulyFreshAnimation.pausedTime / 1000
  })
}
```

**Track Position Updates**:
```typescript
// In projectStore.updateTrack
if (updates.position) {
  console.log('🎯 POSITION UPDATE:', {
    trackId,
    trackName: track?.name,
    oldPosition: track?.position,
    newPosition: updates.position,
    stackTrace: new Error().stack?.split('\n')[2] // Who called this?
  })
}
```

### 4. Verification Tests

Once bug is caught and fixed, verify:

✅ **Test 1: Rapid Pause/Resume**
- Play → Pause → Resume → Pause → Resume (10 times quickly)
- Track should stay on path

✅ **Test 2: Long Pause**
- Play → Pause → Wait 30 seconds → Resume
- Track should continue from pause point

✅ **Test 3: Near-End Pause**
- Play → Pause at 9.5s (duration=10s) → Resume
- Should complete animation normally

✅ **Test 4: Multiple Tracks**
- Play multi-track animation → Pause → Resume
- All tracks should stay synchronized

✅ **Test 5: With OSC Active**
- Play with Holophonix connected → Pause → Resume
- No interference from OSC echoes

---

## Code Locations

**Resume Logic**: `src/stores/animationStore.ts:170-210`
**First Frame Calculation**: `src/stores/animationStore.ts:680-700`
**OSC Protection**: `src/stores/oscStore.ts:960-1010`
**Easing Tracking**: `src/stores/animationStore.ts:138` (`easingTracks` Set)

---

## Current Hypothesis

Most likely cause: **Race condition during rapid pause/resume cycles**

The `pausedTime` or `startTime` gets calculated based on stale state when:
1. User clicks pause → state update queued
2. User clicks resume before update completes → reads stale `startTime`
3. First frame calculation uses wrong `startTime` value
4. Results in jump

**Solution**: Ensure all state reads use `get()` to fetch fresh state, even mid-calculation.

---

## Next Session TODO

1. [ ] Add comprehensive debug logging (above)
2. [ ] Test rapid pause/resume to trigger bug
3. [ ] Capture log showing the jump
4. [ ] Analyze state values at moment of jump
5. [ ] Implement fix based on findings
6. [ ] Verify with all test scenarios

---

**Date**: 2025-01-07  
**Priority**: HIGH - Blocks production use of pause/resume feature  
**Assigned**: Next debugging session
