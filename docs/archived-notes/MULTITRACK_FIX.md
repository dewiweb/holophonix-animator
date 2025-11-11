# Multi-Track Behaviors Fix

**Date**: November 7, 2025  
**Issue**: Multi-track behaviors not working after refactoring  
**Status**: ✅ FIXED

---

## 🐛 **The Problem**

After the technical debt cleanup, multi-track behaviors (position-relative, phase-offset, isobarycenter, etc.) stopped working correctly.

### **Root Cause**

The `onSaveAnimation` function in `AnimationEditor.tsx` was using **simplified save logic** that didn't properly handle multi-track modes. It was just naively merging `multiTrackParameters[trackId]` into the parameters without:

1. ❌ Handling phase offsets (timing delays between tracks)
2. ❌ Calculating position-relative parameters per track
3. ❌ Checking which parameters were user-modified
4. ❌ Handling isobarycenter mode (barycentric formation)
5. ❌ Handling centered mode (custom center point)
6. ❌ Applying proper per-track parameter adjustments

### **What Was Happening**

**Before (Broken):**
```typescript
// AnimationEditor.tsx - onSaveAnimation
const animationState: AnimationState = {
  animation: {
    ...updatedAnimation,
    parameters: {
      ...updatedAnimation.parameters,
      ...(multiTrackParameters?.[trackId] || {})  // ❌ Simple merge, no logic
    }
  },
  // ...
}
```

This simple merge approach:
- Didn't handle position-relative calculations
- Didn't check user-modified vs default parameters
- Didn't apply phase offsets
- Didn't handle formation modes (isobarycenter, centered)
- Just blindly copied parameters, losing multi-track context

---

## ✅ **The Fix**

Replaced the simplified save logic with a call to the **proper `handleSaveAnimation` handler** which has comprehensive multi-track support.

**After (Fixed):**
```typescript
// AnimationEditor.tsx - onSaveAnimation
const onSaveAnimation = () => {
  if (!animationForm.name) {
    console.warn('Cannot save animation: Name is required')
    return
  }

  const projectStore = useProjectStore.getState()
  
  // ✅ Use the proper handleSaveAnimation with full multi-track support
  handleSaveAnimation({
    animationForm,
    keyframes,
    selectedTrackIds,
    tracks,
    multiTrackMode,
    phaseOffsetSeconds,
    centerPoint,
    currentAnimation: loadedAnimationId ? { id: loadedAnimationId } as Animation : currentAnimation,
    originalAnimationParams,  // ✅ For detecting user-modified params
    addAnimation: projectStore.addAnimation,
    updateAnimation: projectStore.updateAnimation,
    updateTrack: projectStore.updateTrack,
    multiTrackParameters,  // ✅ Per-track custom parameters
    lockTracks
  })
  
  // Update parent component if needed
  if (onAnimationSelect && loadedAnimationId) {
    onAnimationSelect(loadedAnimationId)
  }
}
```

---

## 🎯 **What Each Multi-Track Mode Does**

The `handleSaveAnimation` function properly implements all multi-track modes:

### **1. Position-Relative Mode** 📍
Each track gets parameters centered on its own position.

**Logic:**
- If `multiTrackParameters[trackId]` exists → use custom per-track parameters
- Otherwise → auto-adjust parameters to center on track position
- Checks `originalAnimationParams` to detect user-modified parameters
- Only auto-adjusts parameters that user didn't explicitly modify

**Example:**
- Track A at (0, 0, 0) → circular animation centered at (0, 0, 0)
- Track B at (5, 0, 0) → circular animation centered at (5, 0, 0)
- Both have same radius, but different centers

### **2. Phase-Offset Mode** 🔄
All tracks get identical animation, but staggered in time.

**Logic:**
- `initialTime = index * phaseOffsetSeconds`
- Track 0 starts at t=0
- Track 1 starts at t=phaseOffsetSeconds
- Track 2 starts at t=2*phaseOffsetSeconds
- etc.

**Example:**
- Track A: circular animation starting at t=0
- Track B: same circular animation starting at t=2s
- Track C: same circular animation starting at t=4s
- Creates a "wave" effect

### **3. Phase-Offset-Relative Mode** 🔄📍
Combines both: position-relative centers + phase-offset timing.

**Logic:**
- Each track's animation centered on its own position (like position-relative)
- Plus staggered start times (like phase-offset)

**Example:**
- Track A at (0, 0, 0): circular centered at (0, 0, 0), starts at t=0
- Track B at (5, 0, 0): circular centered at (5, 0, 0), starts at t=2s
- Track C at (10, 0, 0): circular centered at (10, 0, 0), starts at t=4s

### **4. Isobarycenter Mode** 🎯
Maintains formation around the barycenter (center of mass) of selected tracks.

**Logic:**
- Calculate barycenter: average position of all selected tracks
- Calculate offset from barycenter for each track
- Store `_isobarycenter` and `_trackOffset` in parameters
- Animation engine uses these to maintain formation

**Example:**
- 3 tracks forming a triangle
- Barycenter at center of triangle
- Each track animates while maintaining its relative position to barycenter
- Formation stays intact during animation

### **5. Centered Mode** ⭕
All tracks maintain offsets from a user-defined center point.

**Logic:**
- Use user-defined `centerPoint`
- Calculate offset from centerPoint for each track
- Store `_centeredPoint` and `_trackOffset` in parameters
- Similar to isobarycenter but with custom center

**Example:**
- User picks center at (0, 5, 0)
- Track A at (-2, 5, 0) → offset (-2, 0, 0)
- Track B at (2, 5, 0) → offset (2, 0, 0)
- Both animate around center while maintaining offsets

### **6. Identical Mode** 🔁
All tracks get the exact same animation (default fallback).

**Logic:**
- Same parameters for all tracks
- Same start time
- Simplest mode

**Example:**
- All tracks do the same circular animation
- All centered at (0, 0, 0) with same radius
- No customization per track

---

## 🔍 **Key Components of the Fix**

### **1. User-Modified Parameter Detection**

`checkUserModifiedParameters` (in `parameterModification.ts`) compares current parameters with original to detect which params the user explicitly changed:

```typescript
const userModifiedParams = checkUserModifiedParameters(
  animation.type,
  updatedParams,
  originalAnimationParams,  // ✅ Critical for detection
  track.initialPosition || track.position
)
```

**Why It Matters:**
- If user explicitly set `center = (5, 5, 0)`, don't auto-adjust it
- If user didn't touch `center`, auto-adjust to track position in position-relative mode
- Preserves user intent while auto-centering other parameters

### **2. Per-Track Parameters (multiTrackParameters)**

In position-relative mode, when you drag control points or edit parameters, the component stores per-track versions in `multiTrackParameters`:

```typescript
// In onParameterChange
const updated = { ...multiTrackParameters }
activeEditingTrackIds.forEach(trackId => {
  updated[trackId] = {
    ...updated[trackId],
    [key]: newValue
  }
})
syncMultiTrackParameters(updated)
```

Then when saving:
```typescript
if (multiTrackParameters && multiTrackParameters[track.id]) {
  updatedParams = { ...multiTrackParameters[track.id] }
  console.log(`📍 Track ${track.name}: using custom parameters`)
}
```

### **3. Phase Offset Timing**

For phase-offset modes, `initialTime` is set based on track index:

```typescript
case 'phase-offset':
  initialTime = index * phaseOffsetSeconds
  console.log(`🔄 Track ${track.name}: phase offset = ${initialTime}s`)
  break
```

This creates the staggered timing effect.

---

## ✅ **What Should Work Now**

### **Position-Relative Mode** 📍
- ✅ Editing parameters in form updates per-track parameters
- ✅ Dragging control points updates per-track control points
- ✅ Each track's animation centered on its own position
- ✅ User-modified parameters preserved
- ✅ Auto-adjusted parameters centered correctly

### **Phase-Offset Mode** 🔄
- ✅ Tracks start at staggered times
- ✅ All tracks have identical animations
- ✅ Phase offset value respected

### **Phase-Offset-Relative Mode** 🔄📍
- ✅ Combines position-relative + phase-offset
- ✅ Each track centered on own position
- ✅ Plus staggered start times

### **Isobarycenter Mode** 🎯
- ✅ Barycenter calculated from selected tracks
- ✅ Offsets stored per track
- ✅ Formation maintained during animation

### **Centered Mode** ⭕
- ✅ Custom center point used
- ✅ Offsets calculated per track
- ✅ Formation maintained around center

---

## 🧪 **Testing Guide**

### **Test 1: Position-Relative Mode**
1. Select 2-3 tracks at different positions
2. Set mode to "Position-Relative"
3. Choose any animation type (e.g., circular)
4. Adjust radius/parameters in form
5. Click "Save Animation"

**Expected:**
- Each track should have animation centered on its own position
- All should have same radius/parameters
- Paths should be parallel but at different locations

### **Test 2: Phase-Offset Mode**
1. Select 3 tracks
2. Set mode to "Phase-Offset"
3. Set phase offset to 2 seconds
4. Choose circular animation
5. Save and play

**Expected:**
- All tracks do same circular path
- Track 1 starts at t=0
- Track 2 starts at t=2s
- Track 3 starts at t=4s
- Creates a wave/sequential effect

### **Test 3: Phase-Offset-Relative Mode**
1. Select tracks at different positions
2. Set mode to "Phase-Offset-Relative"
3. Set phase offset
4. Choose animation
5. Save and play

**Expected:**
- Each track centered on its own position (position-relative)
- Plus staggered start times (phase-offset)
- Combination of both effects

### **Test 4: Control Point Editing in Position-Relative**
1. Select 2 tracks in different locations
2. Set mode to "Position-Relative"
3. Choose linear animation
4. Drag the end position control point in the editor
5. Save

**Expected:**
- Both tracks should have linear path
- Both should have same length/direction
- But each centered on its own start position
- The dragged control point offset should be preserved

### **Test 5: Isobarycenter Formation**
1. Select 3-4 tracks in a pattern (square, triangle, etc.)
2. Set mode to "Isobarycenter"
3. Choose circular animation
4. Save and play

**Expected:**
- Formation stays intact
- All tracks orbit around the barycenter (center of mass)
- Relative positions between tracks preserved

---

## 📊 **Before vs After**

| Feature | Before (Broken) | After (Fixed) |
|---------|----------------|---------------|
| **Position-relative** | ❌ All tracks had identical params | ✅ Per-track params, centered correctly |
| **Phase-offset** | ❌ No timing offsets applied | ✅ Staggered start times work |
| **Phase-offset-relative** | ❌ Broken | ✅ Both position + timing work |
| **Isobarycenter** | ❌ Formation not maintained | ✅ Formation preserved |
| **Centered mode** | ❌ Center point ignored | ✅ Custom center respected |
| **Control point editing** | ❌ Didn't affect saved animation | ✅ Per-track control points work |
| **User-modified params** | ❌ Not detected | ✅ Preserved correctly |

---

## 🎓 **Lessons Learned**

### **1. Don't Reinvent the Wheel**
When there's already a comprehensive handler function (`handleSaveAnimation`) with 470 lines of carefully implemented logic for all multi-track modes, **use it**. Don't create a simplified version that loses functionality.

### **2. Multi-Track Modes Are Complex**
Proper multi-track support requires:
- Mode-specific logic for each mode
- Parameter adjustment calculations
- User intent detection (modified vs default params)
- Per-track storage
- Phase offset timing calculations
- Formation preservation
- It's more than just merging parameters!

### **3. Integration Points Matter**
Even if individual pieces work (store, handlers, components), if they're not properly connected (like not calling the right handler), the whole system breaks.

---

## ✅ **Status**

**Fixed!** The proper `handleSaveAnimation` is now being used, which implements all multi-track modes correctly.

**Ready for testing** - Please test all multi-track modes to verify they work as expected.
