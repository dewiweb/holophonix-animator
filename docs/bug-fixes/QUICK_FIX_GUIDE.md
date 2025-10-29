# Quick Fix Guide - Animation Playback Issue

## Problem

After refactoring, animations don't play - no movement in 3D preview, no OSC messages sent.

## Root Cause Analysis

The refactoring extracted calculation functions to utilities, but the code structure is correct:
- ✅ `calculatePosition` is exported from `utils/animationCalculations.ts`
- ✅ Import exists in `animationStore.ts`
- ✅ Animation engine loop calls the function correctly

**The actual issue**: Missing function call in the animation loop!

---

## Quick Fix (2 minutes)

### File: `src/stores/animationStore.ts`

**Find this code around line 180:**
```typescript
// ❌ BROKEN - Function exists but not called
const updateFrame = (timestamp: number) => {
  if (!isPlaying) return;
  
  // Calculate elapsed time
  const elapsed = (timestamp - startTime) / 1000;
  
  // Update track positions
  selectedTrackIds.forEach(trackId => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      // ❌ MISSING: Actual position calculation!
      // const newPosition = calculatePosition(...)
      // track.position = newPosition
    }
  });
};
```

**Replace with:**
```typescript
// ✅ FIXED - Actually call the calculation function
const updateFrame = (timestamp: number) => {
  if (!isPlaying) return;
  
  // Calculate elapsed time
  const elapsed = (timestamp - startTime) / 1000;
  
  // Update track positions
  selectedTrackIds.forEach(trackId => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      // ✅ ADDED: Calculate and apply new position
      const newPosition = calculatePosition(
        activeAnimation!,
        elapsed,
        track,
        selectedTrackIds.indexOf(trackId)
      );
      
      // Update track position in store
      updateTrackPosition(trackId, newPosition);
      
      // Send OSC message
      sendOSCPosition(trackId, newPosition);
    }
  });
};
```

---

## Detailed Fix Steps

### 1. Import Required Functions
```typescript
// Add these imports at the top of animationStore.ts
import { calculatePosition } from '../utils/animationCalculations';
import { updateTrackPosition } from './projectStore';
import { sendOSCMessage } from './oscStore';
```

### 2. Fix the Animation Loop
```typescript
// Complete fixed updateFrame function
const updateFrame = (timestamp: number) => {
  if (!isPlaying || !activeAnimation) return;
  
  // Calculate elapsed time
  const elapsed = (timestamp - startTime) / 1000;
  
  // Handle looping
  const currentElapsed = elapsed % activeAnimation.duration;
  
  // Update each selected track
  selectedTrackIds.forEach((trackId, index) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    // Calculate new position based on animation type
    const newPosition = calculatePosition(
      activeAnimation,
      currentElapsed,
      track,
      index,
      selectedTrackIds.length,
      multiTrackMode
    );
    
    // Update track in store
    projectStore.getState().updateTrackPosition(trackId, newPosition);
    
    // Send OSC message if connected
    if (oscStore.getState().isConnected) {
      oscStore.getState().sendPositionMessage(trackId, newPosition);
    }
  });
  
  // Update animation state
  set({ 
    currentTime: currentElapsed,
    lastUpdateTime: timestamp 
  });
};
```

### 3. Ensure Animation Loop Starts
```typescript
// Fix the play function
export const playAnimation = () => {
  const { isPlaying, activeAnimation } = get();
  
  if (isPlaying || !activeAnimation) return;
  
  // Start animation loop
  const startTime = performance.now();
  
  const animationLoop = (timestamp: number) => {
    updateFrame(timestamp);
    
    // Continue loop if playing
    if (get().isPlaying) {
      requestAnimationFrame(animationLoop);
    }
  };
  
  // Start the loop
  requestAnimationFrame(animationLoop);
  
  set({ 
    isPlaying: true, 
    startTime,
    lastUpdateTime: startTime 
  });
};
```

---

## Verification Steps

### 1. Check Function Imports
```bash
# Verify these functions are exported
grep -n "export.*calculatePosition" src/utils/animationCalculations.ts
grep -n "export.*updateTrackPosition" src/stores/projectStore.ts
grep -n "export.*sendPositionMessage" src/stores/oscStore.ts
```

### 2. Test Animation Playback
```typescript
// Quick test in browser console
// 1. Create a track
projectStore.addTrack({ name: 'Test Track' });

// 2. Create an animation
animationStore.setActiveAnimation({
  type: 'circular',
  duration: 10,
  parameters: { center: { x: 0, y: 0, z: 0 }, radius: 5 }
});

// 3. Select track and play
projectStore.selectTracks(['track-1']);
animationStore.playAnimation();

// 4. Check if position updates
console.log(projectStore.tracks[0].position); // Should show changing values
```

### 3. Monitor OSC Messages
```typescript
// Check OSC message sending
oscStore.subscribe((state) => {
  console.log('Messages sent:', state.messagesSent);
  console.log('Last message:', state.lastMessage);
});
```

---

## Common Related Issues

### Issue: Animation plays but no OSC messages
**Fix**: Ensure OSC connection is established
```typescript
// Check connection status
if (oscStore.getState().isConnected) {
  oscStore.getState().sendPositionMessage(trackId, newPosition);
}
```

### Issue: Tracks don't move in 3D preview
**Fix**: Ensure Three.js receives position updates
```typescript
// In AnimationPreview3D.tsx, ensure it subscribes to track changes
useEffect(() => {
  const unsubscribe = projectStore.subscribe((state) => {
    updateTrackMeshes(state.tracks);
  });
  return unsubscribe;
}, []);
```

### Issue: Animation timing is wrong
**Fix**: Use proper time calculation
```typescript
// Use performance.now() for accurate timing
const elapsed = (timestamp - startTime) / 1000;
const currentElapsed = elapsed % animation.duration;
```

---

## Prevention Tips

### 1. Add Console Logging for Debugging
```typescript
const updateFrame = (timestamp: number) => {
  if (!isPlaying) return;
  
  const elapsed = (timestamp - startTime) / 1000;
  
  // Debug logging
  console.log(`🎬 Frame: ${elapsed.toFixed(2)}s`);
  
  selectedTrackIds.forEach((trackId, index) => {
    const newPosition = calculatePosition(...);
    console.log(`📍 Track ${trackId}:`, newPosition);
    
    updateTrackPosition(trackId, newPosition);
    sendOSCMessage(trackId, newPosition);
  });
};
```

### 2. Add Error Handling
```typescript
const updateFrame = (timestamp: number) => {
  try {
    // Animation logic here
  } catch (error) {
    console.error('Animation frame error:', error);
    // Stop animation on error
    set({ isPlaying: false });
  }
};
```

### 3. Add Unit Tests
```typescript
describe('Animation Playback', () => {
  test('calculatePosition is called during playback', () => {
    const mockCalculatePosition = jest.fn();
    
    // Start animation
    animationStore.playAnimation();
    
    // Advance time
    jest.advanceTimersByTime(1000);
    
    // Verify function was called
    expect(mockCalculatePosition).toHaveBeenCalled();
  });
});
```

---

## Files to Check

After applying the fix, verify these files are working:

1. **`src/stores/animationStore.ts`** - Main animation engine
2. **`src/utils/animationCalculations.ts`** - Position calculation functions
3. **`src/stores/projectStore.ts`** - Track position updates
4. **`src/stores/oscStore.ts`** - OSC message sending
5. **`src/components/AnimationPreview3D.tsx`** - 3D visualization

---

## Expected Results

After applying the fix:
- ✅ Animations play when clicking Play button
- ✅ Track positions update in real-time
- ✅ 3D preview shows movement
- ✅ OSC messages are sent at correct rate
- ✅ Animation timing is accurate
- ✅ Loop and ping-pong modes work

---

**Fix Time**: 2 minutes
**Difficulty**: Easy
**Impact**: Critical - animations were completely broken
**Testing**: Verify with circular, linear, and random animations
