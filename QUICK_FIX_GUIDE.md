# Quick Fix Guide - Animation Playback Issue

## Problem
After refactoring, animations don't play - no movement in 3D preview, no OSC messages sent.

## Root Cause Analysis
The refactoring extracted calculation functions to utilities, but the code structure is correct:
- ✅ `calculatePosition` is exported from `utils/animationCalculations.ts`
- ✅ Import exists in `animationStore.ts`
- ✅ Animation engine loop calls the function correctly

## Verification Steps

### 1. Check Browser Console
When clicking Play button, you should see these logs:
```
🎬 Animation engine: Starting playback
📍 Storing initial position
🚀 Animation engine: Starting (if not already running)
🎬 Calculating position: { type, time, duration, parameters }
📍 Calculated position: { x, y, z }
📤 Sending OSC @60fps: /track/1/xyz [x, y, z]
```

If you DON'T see these logs, the issue is earlier in the chain.

### 2. Check Animation is Assigned to Track
In AnimationEditor, verify:
- A track is selected
- An animation is created and saved
- The animation is applied to the track (check `track.animationState.animation` exists)

### 3. Verify Build/Compile
Run:
```bash
npm run build
```

Check for TypeScript errors related to imports.

## Quick Test

Add this temporary debug in `AnimationEditor.tsx` at line ~260:

```typescript
const handlePlayPreview = () => {
  console.log('🎬 Play button clicked')
  console.log('Selected track:', selectedTrack)
  console.log('Current animation:', currentAnimation)
  console.log('Track animation state:', selectedTrack?.animationState)
  
  if (!selectedTrack || !currentAnimation) {
    console.error('❌ Missing track or animation!')
    return
  }
  
  // Rest of existing code...
}
```

## Files to Check

1. **AnimationEditor.tsx** (line ~260)
   - Verify `handlePlayPreview` is calling `playAnimation()` correctly

2. **animationStore.ts** (line ~249)
   - Verify `calculatePosition()` is being called in the engine loop

3. **projectStore.ts**
   - Verify track has `animationState.animation` populated

## Most Likely Issues

### Issue 1: Animation Not Saved to Track
**Symptom:** Click play, see "Starting playback" but no position calculations

**Fix:** In AnimationEditor, after creating animation, verify it's applied to track:
```typescript
// After saving animation, apply it to selected track
updateTrack(selectedTrack.id, {
  animationState: {
    animation: savedAnimation,
    isPlaying: false,
    currentTime: 0
  }
})
```

### Issue 2: Import Path Resolution
**Symptom:** TypeScript error or undefined function

**Check:** `tsconfig.json` has correct paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue 3: Vite Not Picking Up New Files
**Symptom:** Works in TypeScript but fails at runtime

**Fix:** Restart dev server:
```bash
# Stop current dev server (Ctrl+C)
npm run dev
```

## Emergency Rollback

If nothing works, the calculation functions can be temporarily moved back to `animationStore.ts`:
1. Copy functions from `utils/animationCalculations.ts` 
2. Paste into `animationStore.ts` after imports
3. Remove the import line
4. Everything should work again

## Status Check Command

Run this in browser console to check current state:
```javascript
// Check if stores are accessible
console.log('Animation Store:', window.__zustand_stores?.animation)
console.log('Project Store:', window.__zustand_stores?.project)

// Check if animation utilities are loaded
import('@/utils/animationCalculations').then(mod => {
  console.log('Animation calculations loaded:', mod)
})
```

## Next Steps

Once basic playback works:
1. Verify OSC messages in OSC Manager component
2. Check 3D preview rendering
3. Test all animation types (linear, circular, etc.)
4. Validate parameters are being passed correctly
