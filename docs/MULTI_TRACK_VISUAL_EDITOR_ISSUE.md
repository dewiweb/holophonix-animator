# Multi-Track Visual Editor Issue

**Date**: November 9, 2024  
**Status**: ⚠️ **CRITICAL ISSUE - Visual editor not showing per-track control points**

---

## Problem

In **position-relative** and **phase-offset-relative** modes, each track should have its own independent control points and path. However, the `UnifiedThreeJsEditor` only shows ONE set of control points/paths, even when switching between tracks.

---

## Root Cause

### Architecture

**Position-Relative Mode**:
- Each track animates independently from its own position
- Each track has **different parameters** stored in `multiTrackParameters[trackId]`
- Example: Circular animation
  - Track 1: center at (0, 0, 0), radius 5
  - Track 2: center at (10, 0, 0), radius 5
  - Track 3: center at (20, 0, 0), radius 5

### Current Implementation

```typescript
// AnimationEditor.tsx line 203-232
const unifiedEditorAnimation = useMemo<Animation | null>(() => {
  const animation = {
    id: loadedAnimationId || previewIdRef.current,
    parameters: animationForm.parameters || {}, // ❌ WRONG!
    // ...
  }
  return animation
}, [animationForm, loadedAnimationId, ...])
```

**Problem**: Always uses `animationForm.parameters` (base/template parameters), ignoring per-track parameters!

---

## What Should Happen

### Position-Relative Mode

When user clicks on **Track 2** badge:
1. ✅ UI updates to show Track 2 is selected (`activeEditingTrackIds = ['track-2']`)
2. ✅ Form shows Track 2's parameters (`multiTrackParameters['track-2']`)
3. ❌ Visual editor still shows Track 1's control points (BUG!)

**Expected**: Visual editor should show Track 2's control points at (10, 0, 0)

### Multi-Track Editing

When user Ctrl+clicks multiple tracks:
1. `activeEditingTrackIds = ['track-1', 'track-2', 'track-3']`
2. Form shows parameters from first track
3. Visual editor should show ALL THREE tracks' control points simultaneously

---

## Solution

### 1. Pass Active Track Info to Unified Editor

Update `UnifiedThreeJsEditor` props:

```typescript
export interface UnifiedThreeJsEditorProps {
  animation: Animation | null
  selectedTracks?: Track[]
  multiTrackMode?: MultiTrackMode
  
  // NEW: Per-track control
  activeEditingTrackIds?: string[]          // Which tracks to show
  multiTrackParameters?: Record<string, any> // Per-track parameters
  
  // Rest of props...
}
```

### 2. Use Active Track's Parameters

Update `unifiedEditorAnimation` creation in `AnimationEditor.tsx`:

```typescript
const unifiedEditorAnimation = useMemo<Animation | null>(() => {
  if (!animationForm.type || !USE_UNIFIED_EDITOR) return null
  
  // Determine which parameters to use
  let parameters = animationForm.parameters || {}
  
  // In position-relative mode, use active track's parameters
  if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') 
      && activeEditingTrackIds.length > 0) {
    // Use first active track's parameters
    const activeTrackParams = multiTrackParameters[activeEditingTrackIds[0]]
    if (activeTrackParams) {
      parameters = activeTrackParams
    }
  }
  
  return {
    id: loadedAnimationId || previewIdRef.current,
    parameters, // ✅ Now uses active track's params!
    // ...
  }
}, [
  animationForm, 
  loadedAnimationId, 
  multiTrackMode, 
  activeEditingTrackIds,  // ✅ Re-compute when active track changes
  multiTrackParameters,    // ✅ Re-compute when track params change
  // ...
])
```

### 3. Multi-Track Rendering (Future)

For showing ALL active tracks simultaneously:

```typescript
// In UnifiedThreeJsEditor or useControlPointScene
if (activeEditingTrackIds && activeEditingTrackIds.length > 1) {
  // Generate control points for EACH active track
  activeEditingTrackIds.forEach((trackId, index) => {
    const trackParams = multiTrackParameters[trackId]
    const trackAnimation = { ...animation, parameters: trackParams }
    const trackPoints = extractControlPointsFromAnimation(trackAnimation)
    
    // Create meshes with different colors
    const color = index === 0 ? 0x00ff00 : 0x0088ff
    createControlPointMeshes(trackPoints, color)
  })
}
```

---

## Implementation Plan

### Phase 1: Single Active Track ✅ **DO THIS NOW**

**Goal**: Show correct control points when user switches tracks

**Changes**:
1. Add `activeEditingTrackIds` to `UnifiedThreeJsEditor` props
2. Add `multiTrackParameters` to `UnifiedThreeJsEditor` props  
3. Update `unifiedEditorAnimation` creation to use active track's parameters
4. Add dependencies to useMemo

**Files**:
- `AnimationEditor.tsx` - Update useMemo dependencies
- `UnifiedThreeJsEditor.tsx` - Add props (optional, for future)

**Testing**:
- Create circular animation, position-relative mode
- Select 3 tracks
- Click Track 1 badge → see control point at Track 1 position
- Click Track 2 badge → see control point at Track 2 position
- Click Track 3 badge → see control point at Track 3 position

---

### Phase 2: Multi-Track Rendering (Future)

**Goal**: Show all active tracks' control points simultaneously

**Changes**:
1. Update `useControlPointScene.ts` to handle multiple track parameters
2. Generate control points for each track
3. Color-code by track (Track 1 = green, others = blue)
4. Show all paths

**Complexity**: Medium (need to refactor control point generation)

---

## Current Behavior

### Position-Relative Mode

```
User Action:           Visual Editor Shows:
--------------         --------------------
Select 3 tracks        Track 1 control points (default)
Click Track 2          Track 1 control points (WRONG! ❌)
Click Track 3          Track 1 control points (WRONG! ❌)
```

### Expected Behavior

```
User Action:           Visual Editor Shows:
--------------         --------------------
Select 3 tracks        Track 1 control points ✅
Click Track 2          Track 2 control points ✅
Click Track 3          Track 3 control points ✅
Ctrl+Click all 3       All 3 control points ✅
```

---

## Code Example

### Before (Wrong) ❌

```typescript
// Always shows Track 1's parameters
const unifiedEditorAnimation = useMemo(() => ({
  parameters: animationForm.parameters, // Generic, not track-specific
  // ...
}), [animationForm]) // Doesn't watch activeEditingTrackIds
```

**Result**: Clicking Track 2 → still shows Track 1's control points

---

### After (Correct) ✅

```typescript
// Shows active track's parameters
const unifiedEditorAnimation = useMemo(() => {
  let params = animationForm.parameters
  
  if (multiTrackMode === 'position-relative' && activeEditingTrackIds[0]) {
    params = multiTrackParameters[activeEditingTrackIds[0]] || params
  }
  
  return { parameters: params, /* ... */ }
}, [
  animationForm,
  multiTrackMode,
  activeEditingTrackIds,    // ✅ Re-compute on track switch
  multiTrackParameters      // ✅ Re-compute on param change
])
```

**Result**: Clicking Track 2 → shows Track 2's control points ✅

---

## Related Systems

### ✅ Form Parameters
- Already working correctly
- Switches to active track's parameters
- Updates on track badge click

### ✅ Old Control Point Editor
- Already supports multi-track
- Shows all active tracks' control points
- Lines 262-268 in `ControlPointEditor.tsx`

### ❌ Unified Visual Editor
- **NOT** using active track parameters
- **NOT** watching activeEditingTrackIds
- **BUG**: Shows same control points for all tracks

---

## Testing Checklist

### Single Track Mode
- [x] Linear animation shows start/end points
- [x] Circular shows center point
- [x] Switching animation type updates points

### Position-Relative Mode
- [ ] Click Track 1 → shows Track 1's control points
- [ ] Click Track 2 → shows Track 2's control points
- [ ] Click Track 3 → shows Track 3's control points
- [ ] Control points at correct positions (track positions)
- [ ] Paths at correct positions

### Multi-Track Selection (Future)
- [ ] Ctrl+Click 2 tracks → shows both control points
- [ ] Color-coded by track
- [ ] Both paths visible

---

## Priority

**HIGH** - This breaks the visual editor for multi-track workflows

**Impact**:
- ❌ Users can't see where each track's animation will happen
- ❌ Can't edit Track 2 or 3 visually (only Track 1)
- ❌ Confusing: form shows Track 2, visual shows Track 1

**Effort**: Low (just dependency update)

---

## Files to Modify

### Required
1. ✅ `AnimationEditor.tsx` (line 203-233)
   - Add activeEditingTrackIds to useMemo dependencies
   - Add multiTrackParameters to useMemo dependencies
   - Use active track's parameters instead of base

### Optional (Future)
2. `UnifiedThreeJsEditor.tsx`
   - Add activeEditingTrackIds prop
   - Add multiTrackParameters prop
3. `useControlPointScene.ts`
   - Support multiple track parameters

---

## Console Logs to Add

```typescript
// In AnimationEditor.tsx
console.log('🎯 Creating unified animation for:', {
  multiTrackMode,
  activeEditingTrackIds,
  usingParams: multiTrackMode === 'position-relative' && activeEditingTrackIds[0]
    ? `track ${activeEditingTrackIds[0]}`
    : 'base parameters'
})
```

---

**Status**: Issue documented, solution identified  
**Next**: Implement Phase 1 (single active track support)  
**Time**: 15-30 minutes
