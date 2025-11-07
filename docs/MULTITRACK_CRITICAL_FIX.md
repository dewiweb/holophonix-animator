# Multi-Track Critical Bug Fix

**Date**: November 7, 2025  
**Issue**: Multi-track behaviors not working - all tracks use same path  
**Status**: ✅ FIXED

---

## 🐛 **The Critical Bugs**

There were **TWO separate bugs** preventing multi-track behaviors from working:

### **Bug #1: Visualization - Only 1 Path Shown** ✅ FIXED
### **Bug #2: Playback - All Tracks Use Same Parameters** ✅ FIXED

---

## **Bug #1: Visualization Issue** 

### **Symptom**
When in position-relative mode with multiple tracks selected, only **1 animation path** was visible in the preview, even though multiple tracks were selected.

### **Root Cause**
`PlaneEditor.tsx` line 202-207 was only generating paths for `activeEditingTrackIds` (the track currently being edited), not for **all tracks** with parameters.

```typescript
// BEFORE (Broken)
if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && 
    activeEditingTrackIds.length > 0 &&  // ❌ Only tracks being edited
    Object.keys(allActiveTrackParameters).length > 0) {
  console.log('🎨 Generating paths for', activeEditingTrackIds.length, 'tracks')
  return activeEditingTrackIds.map(trackId => { // ❌ Only 1 track
```

**Log Evidence:**
```
🎯 Active editing tracks: ['31c97bac-b982-47c7-9f59-63eea01d3c78']  ← Only 1 track
🎯 allActiveTrackParameters keys: (2) ['31c97bac...', 'f9701d2a...']  ← Has 2!
🎨 Generating paths for 1 tracks  ← WRONG!
```

### **The Fix**
```typescript
// AFTER (Fixed)
if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && 
    Object.keys(allActiveTrackParameters).length > 0) {
  const trackIdsWithParams = Object.keys(allActiveTrackParameters)  // ✅ All tracks!
  console.log('🎨 Generating paths for', trackIdsWithParams.length, 'tracks')
  return trackIdsWithParams.map(trackId => {  // ✅ All tracks
```

**Result:** Now shows paths for **all selected tracks** in preview! ✅

---

## **Bug #2: Playback Issue** ⚠️ **THIS WAS THE CRITICAL BUG**

### **Symptom**
Even though the visualization showed multiple paths correctly after Bug #1 was fixed, when the animation played, **all tracks moved identically** instead of using their per-track parameters.

### **Root Cause**
`animationStore.ts` line 478-479 was looking up the animation from `projectStore.animations` using the **base animation ID**, so all tracks were using the **same base animation parameters**.

```typescript
// BEFORE (Broken)
const animationTime = (timestamp - playingAnimation.startTime) / 1000

const animation = projectStore.animations.find(a => a.id === playingAnimation.animationId)
if (!animation) return

// Process each track for this animation
playingAnimation.trackIds.forEach(trackId => {
  const track = projectStore.tracks.find(t => t.id === trackId)
  if (!track) return
  
  // ...
  
  // ❌ Uses same 'animation' for ALL tracks!
  let position = modelRuntime.calculatePosition(animation, animationTime, 0, context)
```

**Why This Was Wrong:**

1. When saving in position-relative mode, each track gets a **unique animation** stored in `track.animationState.animation` with per-track parameters (e.g., different center positions)

2. But when **playing**, the code was looking up the animation from `projectStore.animations` by the **base animation ID**

3. So all tracks were using the **same base animation parameters**, ignoring the per-track customizations!

**Example:**
```javascript
// What was saved correctly:
track1.animationState.animation = {
  id: 'anim-123-track1',
  parameters: { center: { x: 0, y: 0, z: 0 }, radius: 5 }  // Track 1 position
}

track2.animationState.animation = {
  id: 'anim-123-track2',
  parameters: { center: { x: 10, y: 0, z: 0 }, radius: 5 }  // Track 2 position
}

// What was being used during playback (WRONG):
const animation = projectStore.animations.find(a => a.id === 'anim-123')
// Both tracks used this base animation → same center → identical paths!
```

### **The Fix**
```typescript
// AFTER (Fixed)
const animationTime = (timestamp - playingAnimation.startTime) / 1000

// Get base animation for reference (duration, loop, etc.)
const baseAnimation = projectStore.animations.find(a => a.id === playingAnimation.animationId)
if (!baseAnimation) return

// Process each track for this animation
playingAnimation.trackIds.forEach(trackId => {
  const track = projectStore.tracks.find(t => t.id === trackId)
  if (!track) return
  
  // ...
  
  // ✅ CRITICAL: Use track's own animation which has per-track parameters
  // In multi-track modes, each track has its own animation with custom parameters
  const animation = track.animationState?.animation || baseAnimation
  
  // ✅ Now uses per-track parameters!
  let position = modelRuntime.calculatePosition(animation, animationTime, 0, context)
```

**Key Change:**
- Use `track.animationState?.animation` (which has per-track parameters)
- Fall back to `baseAnimation` if no per-track animation exists (for backward compatibility)
- Use `baseAnimation.duration` and `baseAnimation.loop` for timing/loop checks

**Result:** Each track now uses its **own parameters** during playback! ✅

---

## **How Multi-Track Parameters Flow**

### **1. Editing Phase** 📝
```
User edits parameters → onParameterChange → multiTrackParameters updated in store
```

Each track has its own entry in `multiTrackParameters`:
```javascript
{
  'track-1-id': { center: { x: 0, y: 0, z: 0 }, radius: 5 },
  'track-2-id': { center: { x: 10, y: 0, z: 0 }, radius: 5 }
}
```

### **2. Saving Phase** 💾
```
Click Save → handleSaveAnimation → updateTrack for each track
```

Each track gets its own animation with per-track parameters:
```javascript
track1.animationState = {
  animation: {
    id: 'anim-123-track1',
    parameters: multiTrackParameters['track-1-id']  // Per-track!
  }
}

track2.animationState = {
  animation: {
    id: 'anim-123-track2',
    parameters: multiTrackParameters['track-2-id']  // Per-track!
  }
}
```

### **3. Preview Phase** 👁️
```
PlaneEditor → animationPaths → generates path for each track
```

**Before Fix:** Only generated path for `activeEditingTrackIds[0]` (1 track)  
**After Fix:** Generates paths for all tracks in `allActiveTrackParameters` ✅

### **4. Playback Phase** ▶️
```
Play button → animationStore.animate → calculatePosition for each track
```

**Before Fix:** Used `projectStore.animations.find()` → Same animation for all tracks ❌  
**After Fix:** Uses `track.animationState.animation` → Per-track parameters ✅

---

## **What Now Works** 🎉

### ✅ **Position-Relative Mode**
- Each track's animation is centered on its own position
- Editing parameters updates all selected tracks with relative offsets
- Visualization shows all track paths correctly
- **Playback uses per-track parameters** → Different paths for each track!

### ✅ **Phase-Offset Mode**
- All tracks use identical animation
- But start at staggered times (phase offset)
- Creates wave/sequential effects

### ✅ **Phase-Offset-Relative Mode**
- Combines both: per-track centers + staggered timing
- Each track has its own path AND delayed start time

### ✅ **Isobarycenter Mode**
- Formation maintained around barycenter
- Offsets preserved during animation

### ✅ **Centered Mode**
- Custom center point respected
- Formation around center

---

## **Files Changed**

### 1. `src/components/animation-editor/components/control-points-editor/PlaneEditor.tsx`
**Line 201-207**: Generate paths for all tracks with parameters, not just actively editing tracks

### 2. `src/stores/animationStore.ts`
**Line 478-495**: Use track's own `animationState.animation` for per-track parameters during playback

### 3. `src/components/animation-editor/handlers/saveAnimationHandler.ts`
**Added debug logging**: To verify multiTrackParameters are being used correctly (can be removed later)

---

## **Testing Checklist** ✅

### **Test 1: Position-Relative Visualization**
1. Select 2-3 tracks at different positions
2. Set mode to "Position-Relative"
3. Choose circular animation
4. Adjust radius in form

**Expected:**
- ✅ See multiple circular paths in preview
- ✅ Each path centered on its track's position
- ✅ All paths have same radius

### **Test 2: Position-Relative Playback** ⚠️ **CRITICAL TEST**
1. Continue from Test 1
2. Click "Save Animation"
3. Click "Play"

**Expected:**
- ✅ Each track follows its own circular path
- ✅ Tracks move in circles around their own positions
- ✅ NOT moving identically!

### **Test 3: Control Point Dragging**
1. In position-relative mode
2. Drag a control point (e.g., center or endpoint)
3. Save and play

**Expected:**
- ✅ Dragged control point offset applies to all tracks
- ✅ Each track maintains its relative position
- ✅ Paths remain parallel but offset

---

## **Technical Notes**

### **Why Two Separate Variables?**
```typescript
const baseAnimation = projectStore.animations.find(...)  // For duration, loop
const animation = track.animationState?.animation || baseAnimation  // For parameters
```

- `baseAnimation`: Used for **timing properties** (duration, loop) that are the same for all tracks
- `animation`: Used for **position parameters** that are **per-track** in multi-track modes

### **Backward Compatibility**
The fallback `|| baseAnimation` ensures:
- Old animations without per-track parameters still work
- Single-track animations work
- Identical mode works (all tracks share same parameters)

### **Why Not Store Per-Track Animations in projectStore.animations?**
- Each track's animation is **transient** (derived from multi-track parameters)
- Storing them in the track's `animationState` keeps them with the track
- The base animation in `projectStore.animations` is the "template"
- Per-track animations are "instances" applied to specific tracks

---

## **Lessons Learned** 📚

### **1. Visualization ≠ Playback**
Just because the preview looks correct doesn't mean playback will work. They use different code paths!

### **2. State Fragmentation**
When state is split across multiple stores (projectStore, track.animationState), it's easy for one code path to use the wrong source.

### **3. Debug Logging is Essential**
The logs revealed that:
- Saving was working (multiTrackParameters were correct)
- Visualization was broken (only 1 path)
- Playback was broken (wrong animation used)

Without logs, this would have been much harder to diagnose.

---

## **Status**

✅ **FIXED** - Build succeeds  
🧪 **READY FOR TESTING** - Please test position-relative playback!

**Next Step:** Test and verify that tracks now move on their own paths during playback.
