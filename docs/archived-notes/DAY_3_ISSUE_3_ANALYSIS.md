# Issue #3: Multiple Critical Problems (ANALYZING)

**Date**: 2024-11-05  
**Status**: 🔍 Analyzing  
**Severity**: Critical

---

## ✅ **Good News First!**

**Control points now appear!** ✅

Your fixes worked for that issue!

---

## 🐛 **New Problems Found**

### **Problem #1: Double Offset in 3D Preview** 

**Symptoms**:
- 3D preview shows path offset from track position
- But the path appears TWICE as far as it should be
- Like track coordinates are added to the path 2 times

**During Playback**:
- Track and path move together (parallelism)
- Along a DIFFERENT path
- Starting from initial track position

**Root Cause Found**: `src/utils/multiTrackPathGeneration.ts` lines 66-99

In `position-relative` mode:
```typescript
// Step 1: Pass track offset to model
_trackOffset: track.position  // Model uses this to offset path

// Step 2: Apply offset AGAIN to path points
const offsetPath = path.map(point => ({
  position: {
    x: point.position.x + track.position.x,  // ❌ DOUBLE OFFSET!
    y: point.position.y + track.position.y,
    z: point.position.z + track.position.z
  },
  // ...
}))
```

**The offset is applied TWICE**:
1. Model generates path using `_trackOffset` (already includes track position)
2. Then preview adds track position AGAIN to each point

**Result**: Path appears at 2× track position offset

---

### **Problem #2: Editor Resets When Switching Sections**

**Symptoms**:
- Work on animation in Animation Editor
- Switch to Timeline or TrackList tab
- Return to Animation Editor
- **Form is reset - all work lost!**

**Root Cause**: AnimationEditor component probably unmounts/remounts when you switch tabs

**Likely Issue**: Component state is not preserved across navigation

**Needs**:
- Check if AnimationEditor unmounts
- Consider using context or global state
- Or prevent unmounting during tab switches

---

### **Problem #3: Play Button Disabled After First Playback**

**Symptoms**:
- Animation plays successfully once
- Animation finishes
- Animation name still shows in form ✅ (this is good)
- But Play button is greyed out
- Can't play animation again ❌

**Root Cause**: Track's animation state probably not being cleared/reset properly after animation finishes

**Likely Issues**:
1. Track is marked as "has playing animation"
2. When animation finishes, state isn't cleared
3. UI sees track as "busy" and disables play button

---

## 🔧 **Fixes Needed**

### **Fix #1: Remove Double Offset**

**File**: `src/utils/multiTrackPathGeneration.ts:66-99`

**Strategy**: Model ALREADY handles track offset, so preview should NOT add it again

```typescript
case 'position-relative': {
  // Each track animates from its own position
  tracks.forEach(track => {
    // Create animation with track-specific offset
    const offsetAnimation = {
      ...animation,
      parameters: {
        ...animation.parameters,
        _trackOffset: track.position,
        _multiTrackMode: 'position-relative' as const
      }
    }
    const path = generateAnimationPath(offsetAnimation, resolution)
    
    // ❌ DON'T apply offset again - model already did it!
    // The model's calculate function already uses _trackOffset
    
    paths.push({
      trackId: track.id,
      path, // Use path as-is, no additional offset
      color: track.color ? 
        (track.color.r * 0xFF) << 16 | (track.color.g * 0xFF) << 8 | (track.color.b * 0xFF) : 
        undefined
    })
  })
  break
}
```

**BUT WAIT**: Need to check if models actually use `_trackOffset`. Let me verify this first!

---

### **Fix #2: Preserve Editor State Across Navigation**

**Options**:
1. Prevent AnimationEditor from unmounting
2. Store form state in global store (projectStore or dedicated editorStore)
3. Use React Router's location state
4. Keep component mounted but hidden

**Best Approach**: Keep component mounted, just hide it when other tabs active

---

### **Fix #3: Reset Track State After Playback**

**Need to Check**:
1. What happens to track.animationState when animation finishes
2. Why play button becomes disabled
3. How to properly clear "animation playing" state

---

## 🔍 **Investigation Needed**

### **1. Do Models Actually Use _trackOffset?**

Need to check linear model to see if it uses `_trackOffset` from context:

```typescript
// In linear.ts calculate function
if (context?._trackOffset) {
  // Apply track offset?
}
```

**Hypothesis**: 
- Models DON'T use `_trackOffset` in preview
- So preview SHOULD add it
- BUT maybe models use it during playback
- This creates mismatch between preview and playback

---

### **2. Single Track vs Multi-Track Mode**

When only one track is selected:
- What multi-track mode is used?
- Does it default to 'identical'?
- Or 'position-relative'?

This affects whether double offset happens for single track too.

---

### **3. Animation State Management**

When animation finishes:
- `animationStore.stopAnimation()` is called
- What happens to track's `animationState`?
- Does it get cleared?
- Or does it stay with `isPlaying: false`?

---

## 🧪 **Testing Strategy**

### **Test Double Offset Fix**:
1. Create track at position (5, 0, 0)
2. Select Linear animation
3. Parameters should show start at (5,0,0), end at (15,0,0)
4. **3D preview should show**: Line from (5,0,0) to (15,0,0)
5. **NOT**: Line from (10,0,0) to (30,0,0) (double offset)

### **Test Editor Persistence**:
1. Create animation in Animation Editor
2. Switch to Timeline tab
3. Switch back to Animation Editor
4. Form should still show your animation

### **Test Replay**:
1. Create and save animation
2. Play it once
3. Wait for it to finish
4. Play button should still be enabled
5. Click Play again - should work

---

## 📊 **Status**

| Issue | Root Cause | Investigation | Fix Status |
|-------|-----------|---------------|------------|
| Double offset | preview.ts line 81-89 | ✅ Found | 🔍 Need to verify model behavior |
| Editor resets | Component unmounts? | 🔍 Investigating | ⏳ Pending |
| Play disabled | Track state not cleared? | 🔍 Investigating | ⏳ Pending |

---

## 🚀 **Next Steps**

1. **Verify**: Do models use `_trackOffset` in calculate?
2. **Test**: What happens with single track - which mode?
3. **Fix**: Remove double offset (if models handle it)
4. **Investigate**: Why editor unmounts on tab switch
5. **Investigate**: Why play button stays disabled

---

**Status**: 🔍 Analysis in progress - DO NOT apply fixes yet

Need to understand the full picture before making changes!
