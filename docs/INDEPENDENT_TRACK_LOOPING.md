# Independent Track Looping for Phase-Offset Modes

**Date**: November 7, 2025  
**Status**: ✅ **IMPLEMENTED**

---

## 🎯 **Requirement**

In phase-offset loop modes, each track should **loop independently** on its own timeline, maintaining the phase offset relationship across all loop cycles.

---

## 🔄 **How It Works**

### **Independent Loop Behavior**

With 3 tracks, 2s phase offset, 10s duration, loop enabled:

```
Track 1 (offset 0s):  loops at 10s, 20s, 30s, 40s...
Track 2 (offset 2s):  loops at 12s, 22s, 32s, 42s...
Track 3 (offset 4s):  loops at 14s, 24s, 34s, 44s...
```

**Each track maintains its own loop cycle** while preserving the 2s phase offset!

---

## 📊 **Timeline Visualization**

### **Regular Loop Mode**

```
Time    Track 1         Track 2         Track 3
----    -----------     -----------     -----------
0s      [Start L1]      [waiting]       [waiting]
2s      [moving L1]     [Start L1]      [waiting]
4s      [moving L1]     [moving L1]     [Start L1]
10s     [Start L2]      [moving L1]     [moving L1]      ← Track 1 loops!
12s     [moving L2]     [Start L2]      [moving L1]      ← Track 2 loops!
14s     [moving L2]     [moving L2]     [Start L2]       ← Track 3 loops!
20s     [Start L3]      [moving L2]     [moving L2]      ← Track 1 loops again!
22s     [moving L3]     [Start L3]      [moving L2]      ← Track 2 loops again!
24s     [moving L3]     [moving L3]     [Start L3]       ← Track 3 loops again!
...     (continues independently forever)
```

**Key Point**: Tracks don't wait for each other to loop - each follows its own timeline! ✅

---

## 🔧 **Implementation**

### **Location**: `animationStore.ts` lines 527-552

### **Per-Track Time Calculation**

```typescript
// Each track calculates its own effective time for looping
let effectiveTrackTime = trackAnimationTime

if (baseAnimation.loop) {
  if (baseAnimation.pingPong) {
    // Ping-pong: alternate between forward and backward
    const loopCycle = Math.floor(trackAnimationTime / animation.duration)
    const isReversedCycle = loopCycle % 2 === 1
    const timeInCycle = trackAnimationTime % animation.duration
    
    if (isReversedCycle) {
      effectiveTrackTime = animation.duration - timeInCycle
    } else {
      effectiveTrackTime = timeInCycle
    }
  } else {
    // Regular loop: wrap time using modulo
    effectiveTrackTime = trackAnimationTime % animation.duration
  }
}
```

---

## 🎯 **Examples**

### **Example 1: Regular Loop**

**Track 1** (no offset):
```
trackAnimationTime:    0s    5s    10s   15s   20s   25s   30s
effectiveTrackTime:    0s    5s    0s    5s    0s    5s    0s
                            loop↑     loop↑     loop↑
```

**Track 2** (2s offset):
```
trackAnimationTime:   -2s    0s    5s    10s   15s   20s   25s   30s
effectiveTrackTime:   [skip] 0s    5s    0s    5s    0s    5s    0s
                                        loop↑     loop↑     loop↑
```

**Track 3** (4s offset):
```
trackAnimationTime:   -4s   -2s    0s    5s    10s   15s   20s   25s   30s
effectiveTrackTime:   [skip][skip] 0s    5s    0s    5s    0s    5s    0s
                                              loop↑     loop↑     loop↑
```

**Result**: All tracks maintain 2s phase offset across all loops! ✅

---

### **Example 2: Ping-Pong Mode**

**Track 1** (no offset):
```
Time:              0s    5s    10s   15s   20s   25s   30s
trackAnimationTime: 0s    5s    10s   15s   20s   25s   30s
loopCycle:         0     0     1     1     2     2     3
isReversed:        no    no    yes   yes   no    no    yes
timeInCycle:       0s    5s    0s    5s    0s    5s    0s
effectiveTime:     0s    5s    10s   5s    0s    5s    10s
Direction:         →     →     ←     ←     →     →     ←
```

**Track 2** (2s offset):
```
Time:              2s    7s    12s   17s   22s   27s   32s
trackAnimationTime: 0s    5s    10s   15s   20s   25s   30s
loopCycle:         0     0     1     1     2     2     3
effectiveTime:     0s    5s    10s   5s    0s    5s    10s
Direction:         →     →     ←     ←     →     →     ←
```

**Both tracks ping-pong independently** with 2s phase offset maintained! ✅

---

## 🎓 **Technical Details**

### **Why Modulo for Regular Loop?**

```typescript
effectiveTrackTime = trackAnimationTime % animation.duration
```

The modulo operator (`%`) wraps time back to the range [0, duration):
- `10s % 10s = 0s` (start of loop 2)
- `15s % 10s = 5s` (middle of loop 2)
- `20s % 10s = 0s` (start of loop 3)

This creates seamless continuous looping for each track independently.

### **Why Loop Cycle Calculation for Ping-Pong?**

```typescript
const loopCycle = Math.floor(trackAnimationTime / animation.duration)
const isReversedCycle = loopCycle % 2 === 1
```

**Loop cycle** tells us which iteration we're on:
- Cycle 0: Forward (0-10s)
- Cycle 1: Backward (10-20s)
- Cycle 2: Forward (20-30s)
- Cycle 3: Backward (30-40s)

**Odd cycles** (1, 3, 5...) are reversed, **even cycles** (0, 2, 4...) are forward.

### **Time Within Cycle**

```typescript
const timeInCycle = trackAnimationTime % animation.duration
```

This gives us position within the current cycle (always 0-duration).

For reversed cycles:
```typescript
effectiveTrackTime = animation.duration - timeInCycle
```

Maps [0, 10s] to [10s, 0s], creating backward motion.

---

## 🔄 **Global Animation Loop Logic**

The animation still needs to keep running indefinitely for loops. The `maxEndTime` calculation ensures the animation doesn't stop prematurely:

```typescript
// Calculate when the last track finishes its FIRST cycle
let maxEndTime = baseAnimation.duration
playingAnimation.trackIds.forEach(trackId => {
  const track = projectStore.tracks.find(t => t.id === trackId)
  if (track) {
    const trackPhaseOffset = track.animationState?.currentTime || 0
    const trackEndTime = trackPhaseOffset + baseAnimation.duration
    maxEndTime = Math.max(maxEndTime, trackEndTime)
  }
})

// Only trigger global loop reset after maxEndTime
if (animationTime >= maxEndTime) {
  if (baseAnimation.loop) {
    // Reset animation - this maintains the continuous time flow
    const updatedAnimation = {
      ...playingAnimation,
      startTime: timestamp,
      loopCount: playingAnimation.loopCount + 1
    }
    // Update state...
  }
}
```

**Why reset at maxEndTime?**
- Keeps the animation engine running
- Prevents `animationTime` from growing infinitely large
- Maintains phase offset relationships
- The per-track modulo handles individual looping regardless

---

## ✅ **Benefits**

1. ✅ **Natural behavior**: Each track loops on its own schedule
2. ✅ **Phase offset preserved**: 2s offset maintained across all loops
3. ✅ **Ping-pong works**: Each track alternates independently
4. ✅ **Simple logic**: Modulo operator handles wrapping
5. ✅ **Performance**: No per-track state needed, pure calculation

---

## 🧪 **Testing**

### **Test 1: Independent Regular Loops**

**Setup**:
1. Circular animation, 10s duration
2. 3 tracks, 2s phase offset
3. Enable **Loop** (not ping-pong)
4. Play

**Expected Behavior**:
```
0-10s:  Track 1 completes full circle
10s:    Track 1 RESTARTS immediately (loop 2) ✅
        Track 2 still on loop 1
        Track 3 still on loop 1
12s:    Track 2 RESTARTS (loop 2) ✅
        Track 1 moving on loop 2
        Track 3 still on loop 1
14s:    Track 3 RESTARTS (loop 2) ✅
        All tracks now on loop 2
20s:    Track 1 RESTARTS (loop 3) ✅
        Track 2 still on loop 2
        Track 3 still on loop 2
```

**Visual**: Wave pattern with 3 tracks chasing each other continuously! ✅

---

### **Test 2: Independent Ping-Pong**

**Setup**:
1. Linear animation (back-and-forth), 10s duration
2. 3 tracks in a line, 2s phase offset
3. Enable **Loop** and **Ping-Pong**
4. Play

**Expected Behavior**:
```
0-10s:  Track 1 moves forward
10-20s: Track 1 moves BACKWARD (ping-pong!) ✅
        Track 2 moves forward (started at 2s)
12-22s: Track 2 moves BACKWARD ✅
        Track 1 moving forward again (started at 20s)
14-24s: Track 3 moves BACKWARD ✅
```

**Each track alternates independently!** ✅

---

## 📋 **Comparison**

### **Before (Synchronized Loops)**

```
All tracks wait for each other:
10s: Track 1 finishes → HOLDS
12s: Track 2 finishes → HOLDS
14s: Track 3 finishes → ALL restart together
```

**Problem**: Tracks waste time holding at end position ❌

### **After (Independent Loops)**

```
Each track loops on its own:
10s: Track 1 finishes → RESTARTS immediately ✅
12s: Track 2 finishes → RESTARTS immediately ✅
14s: Track 3 finishes → RESTARTS immediately ✅
```

**Benefit**: Continuous smooth motion, no pauses! ✅

---

## 🎉 **Summary**

**Implementation**: Per-track time wrapping using modulo  
**Regular Loop**: `effectiveTime = trackTime % duration`  
**Ping-Pong**: `effectiveTime = duration - (trackTime % duration)` on odd cycles  
**Result**: Natural, independent looping with phase offset preserved ✅

**Each track is like its own independent animation player!** 🎵🎶🎵

---

## 📚 **Related Documentation**

- `ANIMATION_LOOP_AND_PHASE_OFFSET_FIX.md` - Initial loop fixes
- This document supersedes `PHASE_OFFSET_CLAMPING_FIX.md` (clamping removed)

---

**Status**: ✅ Ready for testing!  
**Build**: ✅ Passing  
**Expected behavior**: Tracks loop independently maintaining phase offset! 🚀
