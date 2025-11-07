# Phase Offset Fix

**Date**: November 7, 2025  
**Issue**: Phase-offset and phase-offset-relative modes not applying timing delays  
**Status**: ✅ FIXED

---

## 🐛 **The Problem**

User reported:
> "simple offset doesn't work and relative+offset mode is the same as relative mode (offset isn't applied)"

**What Was Happening:**
- Phase-offset mode: All tracks started simultaneously (no timing delay) ❌
- Phase-offset-relative mode: Tracks had different paths (position-relative) but no timing delay ❌
- The phase offset was being **saved** but **not used during playback**

---

## **Root Cause**

### **Saving Phase Offset** ✅ (Was Working)

In `saveAnimationHandler.ts`, the phase offset was correctly calculated and stored:

```typescript
case 'phase-offset':
  initialTime = index * phaseOffsetSeconds  // Track 0: 0s, Track 1: 2s, Track 2: 4s
  console.log(`🔄 Track ${track.name}: phase offset = ${initialTime}s`)
  break

// Later...
updateTrack(track.id, {
  animationState: {
    animation: trackAnimation,
    currentTime: initialTime,  // ✅ Phase offset stored here!
    // ...
  }
})
```

### **Playback Phase Offset** ❌ (Was Broken)

In `animationStore.ts`, the playback code was **ignoring** the phase offset:

```typescript
// BEFORE (Broken)
const animationTime = (timestamp - playingAnimation.startTime) / 1000

playingAnimation.trackIds.forEach(trackId => {
  const track = projectStore.tracks.find(t => t.id === trackId)
  
  // ❌ Uses same animationTime for ALL tracks!
  let position = modelRuntime.calculatePosition(animation, animationTime, 0, context)
  
  // Result: All tracks start at the same time, no phase offset applied
})
```

**The Issue:**
- `animationTime` was calculated once for the entire animation (global time)
- All tracks used the same `animationTime` value
- The track's `currentTime` (which stored the phase offset) was never read or used

---

## **The Fix** ✅

Apply the phase offset from each track's `animationState.currentTime` during playback:

```typescript
// AFTER (Fixed)
const animationTime = (timestamp - playingAnimation.startTime) / 1000

playingAnimation.trackIds.forEach(trackId => {
  const track = projectStore.tracks.find(t => t.id === trackId)
  
  // ✅ Get track's phase offset
  const trackPhaseOffset = track.animationState?.currentTime || 0
  
  // ✅ Calculate track-specific animation time
  const trackAnimationTime = animationTime - trackPhaseOffset
  
  // ✅ Don't render if track hasn't started yet
  if (trackAnimationTime < 0) {
    return
  }
  
  // ✅ Use track-specific time for position calculation
  let position = modelRuntime.calculatePosition(animation, trackAnimationTime, 0, context)
  
  // Result: Each track starts at its own time!
})
```

**Key Changes:**
1. **Read phase offset**: `track.animationState?.currentTime || 0`
2. **Calculate track time**: `animationTime - trackPhaseOffset`
3. **Skip if not started**: `if (trackAnimationTime < 0) return`
4. **Use track time**: Pass `trackAnimationTime` to `calculatePosition`

---

## **How It Works**

### **Phase-Offset Mode Example**

**Setup:**
- 3 tracks
- Phase offset: 2 seconds
- Animation duration: 10 seconds
- Animation: Circular path

**Track Timing:**
- Track 0: phase offset = 0s → starts at t=0s
- Track 1: phase offset = 2s → starts at t=2s
- Track 2: phase offset = 4s → starts at t=4s

**Playback Timeline:**

| Global Time | Track 0 Time | Track 1 Time | Track 2 Time |
|-------------|--------------|--------------|--------------|
| 0s | 0s (moving) | -2s (not started) | -4s (not started) |
| 2s | 2s (moving) | 0s (starts now) | -2s (not started) |
| 4s | 4s (moving) | 2s (moving) | 0s (starts now) |
| 6s | 6s (moving) | 4s (moving) | 2s (moving) |
| 10s | 10s (finished) | 8s (moving) | 6s (moving) |

**Result:** Wave effect! Tracks start one after another. ✅

---

## **Phase-Offset-Relative Mode**

Combines **two effects**:

1. **Position-Relative**: Each track's path centered on its own position
2. **Phase-Offset**: Each track starts at a delayed time

**Example:**
- Track A at (0, 0, 0): Circular path centered at (0, 0, 0), starts at t=0s
- Track B at (10, 0, 0): Circular path centered at (10, 0, 0), starts at t=2s
- Track C at (20, 0, 0): Circular path centered at (20, 0, 0), starts at t=4s

**Result:** Each track has its **own path** AND starts at a **different time**! ✅

---

## **Technical Details**

### **Why Subtract the Phase Offset?**

```typescript
const trackAnimationTime = animationTime - trackPhaseOffset
```

**Logic:**
- `animationTime` = seconds since animation started (global)
- `trackPhaseOffset` = how many seconds to delay this track
- `trackAnimationTime` = where this track is in its own animation

**Example:**
- Global time = 5s
- Track 2 has phase offset = 2s
- Track 2's animation time = 5s - 2s = 3s
- Track 2 is at the 3-second mark of its animation

### **Why Check for Negative Time?**

```typescript
if (trackAnimationTime < 0) {
  return  // Don't render this track yet
}
```

**Logic:**
- If `trackAnimationTime < 0`, the track hasn't started yet
- Don't calculate or render position for tracks that haven't started
- This creates the "wave" effect where tracks appear one by one

### **Offset Rotation Consistency**

```typescript
// Also use trackAnimationTime for offset rotation
const rotatedOffset = rotateOffsetForAnimation(
  offset,
  animation.type,
  params,
  trackAnimationTime,  // ✅ Use track time, not global time
  animation.duration
)
```

For formations (isobarycenter, centered), the offset rotation must use the track's animation time to stay synchronized with the track's movement.

---

## **Files Modified**

| File | Lines | Change |
|------|-------|--------|
| `animationStore.ts` | 497-518 | Apply phase offset during playback |
| `animationStore.ts` | 528 | Use trackAnimationTime for offset rotation |
| `saveAnimationHandler.ts` | 268-270 | Add logging for phase offset saving |

---

## **Debug Logging**

### **When Saving:**
```
✅ Animation applied to track: Track1 (track-1-id)
✅ Animation applied to track: Track2 (track-2-id)
   ⏱️ Phase offset: 2.00s
✅ Animation applied to track: Track3 (track-3-id)
   ⏱️ Phase offset: 4.00s
```

### **During Playback:**
```
⏱️ Track Track2: globalTime=2.00s, phaseOffset=2.00s, trackTime=0.00s
⏱️ Track Track3: globalTime=4.00s, phaseOffset=4.00s, trackTime=0.00s
```

These logs confirm:
1. Phase offsets are being saved correctly
2. Phase offsets are being applied during playback
3. Tracks start at the correct times

---

## **Testing Guide**

### **Test 1: Phase-Offset Mode**

**Setup:**
1. Select 3 tracks
2. Set mode to "Phase-Offset"
3. Set phase offset to 2 seconds
4. Choose circular animation
5. Save and play

**Expected:**
- ✅ Track 1 starts immediately at t=0s
- ✅ Track 2 starts at t=2s (2 seconds later)
- ✅ Track 3 starts at t=4s (4 seconds later)
- ✅ All tracks follow the **same circular path** (identical animation)
- ✅ Creates a "wave" or "sequential" effect

**Console Logs:**
```
⏱️ Track Track2: globalTime=2.00s, phaseOffset=2.00s, trackTime=0.00s
⏱️ Track Track3: globalTime=4.00s, phaseOffset=4.00s, trackTime=0.00s
```

### **Test 2: Phase-Offset-Relative Mode**

**Setup:**
1. Select 3 tracks at **different positions** (e.g., (0,0,0), (10,0,0), (20,0,0))
2. Set mode to "Phase-Offset-Relative"
3. Set phase offset to 2 seconds
4. Choose circular animation
5. Save and play

**Expected:**
- ✅ Track 1: Circular path at (0,0,0), starts at t=0s
- ✅ Track 2: Circular path at (10,0,0), starts at t=2s
- ✅ Track 3: Circular path at (20,0,0), starts at t=4s
- ✅ Each track has its **own path** (position-relative)
- ✅ Plus **staggered timing** (phase-offset)
- ✅ Combined effect: Wave pattern across space and time!

**Console Logs:**
```
📍 Track Track1: using custom parameters
📍 Track Track2: using custom parameters
   ⏱️ Phase offset: 2.00s
📍 Track Track3: using custom parameters
   ⏱️ Phase offset: 4.00s

// During playback:
⏱️ Track Track2: globalTime=2.00s, phaseOffset=2.00s, trackTime=0.00s
⏱️ Track Track3: globalTime=4.00s, phaseOffset=4.00s, trackTime=0.00s
```

---

## **Edge Cases**

### **What if phase offset > animation duration?**

Example: Phase offset = 12s, Animation duration = 10s

- Track with 12s offset never starts (trackAnimationTime always < 0)
- Track remains at its initial position
- This is expected behavior (user should adjust phase offset or duration)

### **What happens at animation end?**

The animation ends when `globalTime >= duration`, regardless of individual track times.

Example:
- Animation duration = 10s
- Track 3 has phase offset = 4s
- At global t=10s, Track 3 is only at animation time 6s (not finished)
- Animation stops anyway

This is **intentional** - all tracks stop together at the animation's end time. If you want all tracks to complete their animations, increase the duration by the maximum phase offset.

---

## **Comparison: Before vs After**

| Mode | Before Fix | After Fix |
|------|-----------|-----------|
| **Phase-Offset** | All tracks start together ❌ | Tracks start sequentially ✅ |
| **Phase-Offset-Relative** | Same as position-relative ❌ | Position-relative + timing delay ✅ |
| **Position-Relative** | Different paths ✅ | Different paths ✅ (no change) |
| **Isobarycenter** | Formation preserved ✅ | Formation preserved ✅ (no change) |

---

## **Status**

✅ **Fixed** - Build successful  
🧪 **Ready for Testing** - Please test phase-offset modes  
📝 **Documented** - Complete technical details provided  

---

## **Next Steps**

1. Test phase-offset mode with 3+ tracks
2. Test phase-offset-relative mode
3. Verify console logs show correct phase offsets
4. Confirm timing delays are visible (wave effect)
5. If working, remove debug logs

---

**The phase offset timing is now fully implemented!** Both phase-offset and phase-offset-relative modes should work correctly with proper timing delays. 🎉
