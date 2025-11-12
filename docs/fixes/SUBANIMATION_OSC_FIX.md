# Subanimation OSC Message Fix

## Problem

OSC messages were not being sent during fade-in and fade-out transitions (subanimations).

### Context

The Holophonix Animator supports fade-in and fade-out subanimations that smoothly transition tracks:
- **Fade-in**: Ease tracks from current position to animation start position
- **Fade-out**: Ease tracks from current position back to initial position

These transitions use the `_easeToPositions()` function which:
1. Uses `requestAnimationFrame` for smooth interpolation
2. Updates track positions via Zustand store
3. Calculates eased positions using ease-out cubic easing

## Root Cause

The `_easeToPositions()` function was **adding OSC messages to the batch but never flushing them**.

### Code Analysis

```typescript
// BEFORE - Messages queued but never sent
_easeToPositions: (...) => {
  const animate = () => {
    tracks.forEach(({ trackId, from, to }) => {
      // Calculate interpolated position
      const position = { ... }
      
      // Update UI
      projectStore.updateTrack(trackId, { position })
      
      // Add OSC message to batch
      if (track.holophonixIndex) {
        oscBatchManager.addMessage(track.holophonixIndex, position, coordType)
      }
    })
    
    // ❌ MISSING: oscBatchManager.flushBatch()
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
}
```

### Why Messages Weren't Sent

1. `oscBatchManager.addMessage()` adds messages to an internal queue
2. Messages are only transmitted when `oscBatchManager.flushBatch()` is called
3. The batch was never flushed in `_easeToPositions()`
4. Messages accumulated in memory but were never sent to the device

### Impact

- No OSC messages during fade-in transitions
- No OSC messages during fade-out transitions
- Tracks appeared to "jump" on the Holophonix device instead of smoothly transitioning
- Visual feedback in UI was smooth, but actual device positions were not updated

## Solution

Add `oscBatchManager.flushBatch()` call after updating all track positions in each animation frame.

```typescript
// AFTER - Messages properly sent
_easeToPositions: (...) => {
  const animate = () => {
    tracks.forEach(({ trackId, from, to }) => {
      // Calculate interpolated position
      const position = { ... }
      
      // Update UI
      projectStore.updateTrack(trackId, { position })
      
      // Add OSC message to batch
      if (track.holophonixIndex !== undefined && track.holophonixIndex !== null) {
        oscBatchManager.addMessage(track.holophonixIndex, position, coordType)
      }
    })
    
    // ✅ FIXED: Flush batch to send messages
    oscBatchManager.flushBatch()
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
}
```

### Additional Fix

Also fixed the `holophonixIndex` check to properly handle index 0 (Track 1):
```typescript
// BEFORE
if (track.holophonixIndex) { ... }

// AFTER - Properly handles holophonixIndex = 0
if (track.holophonixIndex !== undefined && track.holophonixIndex !== null) { ... }
```

## Affected Animations

This fix applies to all subanimations that use `_easeToPositions()`:

1. **Fade-in subanimations** (`playAnimation` function)
   - Smooth entry from current position to animation start
   - Configured via `fadeIn.enabled` and `fadeIn.autoTrigger`

2. **Fade-out subanimations** (`stopAnimation` function)
   - Smooth exit back to initial position
   - Configured via `fadeOut.enabled` and `fadeOut.autoTrigger`

3. **Go To Start** (`goToStart` function)
   - Reset animation to start position with easing
   - Used when resetting animations

## Performance Considerations

### Before Fix
- Messages queued: **Every RAF frame** (~60 FPS)
- Messages sent: **0 FPS** (never)
- Memory: Batch accumulation until cleared

### After Fix
- Messages queued: **Every RAF frame** (~60 FPS)
- Messages sent: **Every RAF frame** (~60 FPS)
- Behavior: Same as main animation loop

**Note**: The high RAF rate during transitions is acceptable because:
- Transitions are short-lived (typically 0.5-3 seconds)
- Smooth transitions require high update rate
- Main animation loop runs at throttled 30 FPS (via setInterval)
- Subanimations use RAF for precise timing control

## Testing

✅ **Fade-in**
- Configure animation with fade-in enabled
- Play animation
- Verify OSC messages sent smoothly during fade-in transition
- Verify device tracks move smoothly (no jumps)

✅ **Fade-out**
- Play animation
- Stop animation with fade-out enabled
- Verify OSC messages sent smoothly during fade-out
- Verify tracks return to initial position smoothly

✅ **Go To Start**
- Play animation
- Use "Go To Start" control
- Verify smooth easing back to start position
- Verify OSC messages sent during transition

✅ **Track 1 (Index 0)**
- Test with track that has `holophonixIndex = 0`
- Verify OSC messages sent (holophonixIndex check now correct)

## Files Modified

- `src/stores/animationStore.ts` - Added `oscBatchManager.flushBatch()` call in `_easeToPositions()`

## Related Issues

This fix complements the main OSC rendering blocking fix:
- Main animations: OSC via dedicated 30 FPS setInterval loop
- Subanimations: OSC via RAF (high precision for short transitions)
- Both now properly flush messages to ensure delivery

## Migration Notes

No breaking changes - fully backward compatible.
- Existing fade-in/fade-out configurations work unchanged
- OSC behavior improved (now actually sends messages)
- No user configuration required
