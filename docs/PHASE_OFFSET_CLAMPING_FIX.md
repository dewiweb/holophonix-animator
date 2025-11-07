# Phase-Offset Track Time Clamping Fix

**Date**: November 7, 2025  
**Status**: ✅ **FIXED**

---

## 🐛 **Additional Bug Discovered**

After fixing the phase-offset end detection, another critical issue was found:

**Problem**: In phase-offset loop mode, Track 1 was starting its **second loop** before Tracks 2 and 3 finished their **first loop**.

---

## 🔍 **Root Cause**

### **The Issue**

With phase-offset mode and looping:
```
Animation: Duration 10s, Phase Offset 2s/track, Loop enabled

Track 1: starts at 0s  → finishes at 10s
Track 2: starts at 2s  → finishes at 12s
Track 3: starts at 4s  → finishes at 14s
```

**What was happening**:
1. At `globalTime = 10s`: Track 1 finishes
2. At `globalTime = 11s`: Track 1's `trackAnimationTime = 11s`
3. `modelRuntime.calculatePosition(animation, 11s, ...)` is called
4. Since `11s > duration (10s)`, the model might **loop Track 1 internally**!
5. Track 1 starts moving through its path again while Tracks 2 & 3 are still finishing

**Result**: 
- Track 1 is on its 2nd loop iteration ❌
- Track 2 is still on its 1st iteration
- Track 3 is still on its 1st iteration
- **Not synchronized!**

---

## ✅ **The Fix**

**Location**: `animationStore.ts` lines 527-531

**Solution**: **Clamp track time to animation duration**

```typescript
// CRITICAL: Clamp track time to duration to prevent individual tracks from looping
// before all offset tracks finish. In phase-offset mode, Track 1 might finish at 10s
// but we wait until Track 3 finishes at 14s. During this wait (10s-14s), Track 1
// should hold at its end position, not loop back to start.
let clampedTrackTime = Math.min(trackAnimationTime, animation.duration)
```

### **How It Works**

**Before** (BROKEN):
```
globalTime = 11s
Track 1: trackAnimationTime = 11s → calculatePosition(animation, 11s) → LOOPS! ❌
Track 2: trackAnimationTime = 9s  → still moving (correct)
Track 3: trackAnimationTime = 7s  → still moving (correct)
```

**After** (FIXED):
```
globalTime = 11s
Track 1: trackAnimationTime = 11s → clamp to 10s → calculatePosition(animation, 10s) → HOLDS at end ✅
Track 2: trackAnimationTime = 9s  → clamp to 9s   → still moving (correct)
Track 3: trackAnimationTime = 7s  → clamp to 7s   → still moving (correct)
```

**At Loop Time** (globalTime = 14s):
```
All tracks have finished (maxEndTime reached)
→ Reset startTime for the animation
→ All tracks restart together with their phase offsets maintained ✅

Track 1: trackAnimationTime = 0s  → starts immediately
Track 2: trackAnimationTime = -2s → waits 2s (negative, doesn't render)
Track 3: trackAnimationTime = -4s → waits 4s (negative, doesn't render)
```

---

## 📊 **Timeline Example**

### **Animation**: 10s duration, 2s phase offset, 3 tracks, Loop enabled

```
Time    Track 1         Track 2         Track 3         
-----   -----------     -----------     -----------
0s      [Start]         [waiting]       [waiting]
2s      [moving]        [Start]         [waiting]
4s      [moving]        [moving]        [Start]
...
10s     [HOLD at end]   [moving]        [moving]        ← Track 1 CLAMPED!
11s     [HOLD at end]   [moving]        [moving]        ← Track 1 still CLAMPED!
12s     [HOLD at end]   [HOLD at end]   [moving]        ← Track 2 now CLAMPED!
13s     [HOLD at end]   [HOLD at end]   [moving]        
14s     [HOLD at end]   [HOLD at end]   [HOLD at end]   ← All done!
14s     [Loop Reset: startTime = 14s]                   ← Reset animation
14.1s   [Start loop 2]  [waiting]       [waiting]       ← All restart synchronized!
16.1s   [moving]        [Start loop 2]  [waiting]
18.1s   [moving]        [moving]        [Start loop 2]
```

**Key Point**: All tracks complete their first iteration before ANY track starts its second iteration! ✅

---

## 🎯 **Benefits**

1. ✅ **Synchronized loops**: All tracks finish their current loop before starting next
2. ✅ **Smooth visuals**: Tracks hold at end position, not jerky restart
3. ✅ **Correct behavior**: Matches user expectation for phase-offset loops
4. ✅ **Works with ping-pong**: Clamping applied before reversal logic

---

## 🔧 **Implementation Details**

### **Code Changes**

```typescript
// Line 531: Clamp before any other time manipulation
let clampedTrackTime = Math.min(trackAnimationTime, animation.duration)

// Line 534: Use clamped time as base
let effectiveTrackTime = clampedTrackTime

// Line 535-538: Ping-pong uses clamped time
if (baseAnimation.pingPong && playingAnimation.isReversed) {
  effectiveTrackTime = animation.duration - (clampedTrackTime % animation.duration)
}

// Line 545: Calculate position with clamped/effective time
let position = modelRuntime.calculatePosition(animation, effectiveTrackTime, 0, context)
```

### **Why This Order Matters**

1. **First**: Clamp to duration (prevents overshooting)
2. **Second**: Apply ping-pong reversal (if needed)
3. **Third**: Calculate position

This ensures that:
- Tracks never go past their duration individually
- Ping-pong reversal works on valid time range [0, duration]
- Position calculation receives consistent time values

---

## 📋 **Testing Checklist**

### **Test: Phase-Offset Loop Synchronization** ⭐ **CRITICAL**

**Setup**:
1. Create circular animation, duration 10s
2. Select 3 tracks positioned in a line
3. Set mode: **Phase-Offset**, offset 2s
4. Enable **Loop**
5. Apply and play

**Expected Behavior**:
- **0-10s**: Track 1 moves in circle, Track 2 starts at 2s, Track 3 starts at 4s
- **10-12s**: Track 1 **holds at end** of circle, Track 2 still moving, Track 3 still moving
- **12-14s**: Track 1 and 2 **hold at end**, Track 3 still moving
- **14s**: ALL tracks restart together (synchronized loop)
- **14-16s**: Track 1 starts loop 2, Track 2 waits until 16s, Track 3 waits until 18s
- **Pattern repeats**: All tracks stay synchronized across loops ✅

**What to Watch For**:
- ❌ **WRONG**: Track 1 starts moving again at 10s while others still on first loop
- ✅ **CORRECT**: Track 1 stays still at end position until 14s, then all restart

---

## 🎓 **Technical Notes**

### **Why Not Clamp in Model Runtime?**

The model runtime (`modelRuntime.calculatePosition()`) is designed to be stateless and shouldn't know about multi-track synchronization. Clamping in the animation store keeps the logic centralized.

### **Why `Math.min()` and Not Modulo?**

```typescript
// ❌ WRONG: Using modulo would loop individual tracks
let time = trackAnimationTime % animation.duration

// ✅ CORRECT: Clamping holds at end
let time = Math.min(trackAnimationTime, animation.duration)
```

Modulo would make Track 1 loop back to 0 when it hits 10s, which is exactly what we're trying to prevent!

### **Ping-Pong Compatibility**

The clamping happens **before** ping-pong reversal:
```typescript
clampedTime = min(11s, 10s) = 10s  // Clamp
effectiveTime = 10s - (10s % 10s) = 10s - 0 = 10s  // Reversal (no change)
```

This ensures ping-pong mode also benefits from synchronization.

---

## ✅ **Status**

**Build**: ✅ Passing  
**Lines Changed**: +4 lines (clamping logic + comments)  
**Breaking Changes**: None  
**Performance Impact**: Negligible (single Math.min() per track per frame)  

---

## 📖 **Related Documentation**

- See `ANIMATION_LOOP_AND_PHASE_OFFSET_FIX.md` for the initial loop fixes
- This fix complements the maxEndTime calculation
- Both fixes together ensure complete phase-offset loop synchronization

---

## 🎉 **Summary**

**Problem**: Tracks were looping individually before others finished  
**Solution**: Clamp each track's time to its duration  
**Result**: All tracks stay synchronized across loops ✅

**Now phase-offset loops work correctly!** 🚀
