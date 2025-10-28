# Bug Fix: Pause Animation Corrupting Parameters

## Problem Description

**Issue:** When user pauses an animation and then re-saves it, the animation's center position or initial position gets updated to the location where the track was paused.

**Root Cause:** AnimationEditor was using `selectedTrack.position` when initializing animation parameters. Since the animation engine updates `track.position` during playback, pausing leaves the track at an animated position. Re-saving then uses this animated position as the new center/initial position.

## Example Scenario

1. Create circular animation with center at (0, 0, 0)
2. Play animation - track moves around the circle
3. Pause when track is at (3, 2, 0)
4. Save animation again
5. **BUG:** Animation center is now (3, 2, 0) instead of (0, 0, 0)

## Solution

### Fix 1: Use Initial Position for New Animations
**File:** `src/components/AnimationEditor.tsx` (line 127)

**Before:**
```typescript
const trackPosition = selectedTrack?.position || { x: 0, y: 0, z: 0 }
```

**After:**
```typescript
const trackPosition = selectedTrack?.initialPosition || selectedTrack?.position || { x: 0, y: 0, z: 0 }
```

**Explanation:** When creating new animation parameters, use the track's `initialPosition` (stored before animation starts) instead of current animated position.

### Fix 2: Preserve Existing Animation Parameters
**File:** `src/components/AnimationEditor.tsx` (lines 105-110)

Added clear documentation that existing animations should NOT have their parameters modified based on current track position:

```typescript
if (currentAnimation) {
  // Load existing animation - preserve its original parameters
  // DO NOT modify parameters based on current track position
  // This prevents corruption when user pauses and re-saves
  setAnimationForm(currentAnimation)
  setKeyframes(currentAnimation.keyframes || [])
}
```

## How It Works Now

### Track Position Flow
1. **Initial Position** (`track.initialPosition`): Stored when animation starts playing
2. **Current Position** (`track.position`): Updated every frame during playback
3. **Animation Parameters**: Always reference initial position, never animated position

### When Creating New Animation
```typescript
// Uses initialPosition if animation was played, otherwise current position
trackPosition = track.initialPosition || track.position
parameters.center = trackPosition  // Safe - uses original position
```

### When Loading Existing Animation
```typescript
// Simply loads saved parameters - no position calculations
setAnimationForm(currentAnimation)  // Preserves original parameters
```

## Testing the Fix

### Test Case 1: Create → Pause → Save
1. Create track at (0, 0, 0)
2. Create circular animation with center (0, 0, 0), radius 3
3. Play animation
4. Pause when track is at (3, 0, 0)
5. Save animation
6. **Expected:** Center remains (0, 0, 0) ✅
7. **Previous:** Center changed to (3, 0, 0) ❌

### Test Case 2: Edit Existing Animation
1. Load animation with center (5, 5, 0)
2. Track is currently at (8, 5, 0) after pausing
3. Open AnimationEditor
4. **Expected:** Parameters show center (5, 5, 0) ✅
5. **Previous:** Parameters corrupted with (8, 5, 0) ❌

### Test Case 3: Create New After Pause
1. Animation running, track at (3, 2, 1)
2. Pause animation
3. Click "New Animation" or change animation type
4. **Expected:** Default parameters use track.initialPosition
5. If no initialPosition exists, falls back to current position

## Related Code

### Initial Position Storage
**File:** `src/stores/animationStore.ts` (lines 67-70)

When animation starts:
```typescript
projectStore.updateTrack(trackId, {
  initialPosition: { ...track.position },  // Save original position
  animationState: { ... }
})
```

### Position Updates During Playback
**File:** `src/stores/animationStore.ts` (line 276)

Every frame:
```typescript
projectStore.updateTrack(track.id, {
  position,  // Animated position - changes every frame
  animationState: { ... }
})
```

## Benefits

✅ Animation parameters remain stable across pause/resume cycles
✅ Re-saving an animation preserves its original design
✅ User can safely pause, inspect, and continue without data corruption
✅ Clear separation between "design position" and "animated position"

## Additional Notes

- `track.position` is the "live" animated position (changes during playback)
- `track.initialPosition` is the "home" position (stable reference point)
- Animation parameters should ALWAYS reference stable positions
- This fix applies to all animation types: linear, circular, elliptical, spiral, random, custom

---

**Date:** 2025-10-02  
**Status:** ✅ Fixed  
**Impact:** High - Prevents data corruption in animation workflow
