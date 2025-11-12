# OSC Rendering Blocking Fix

## Problem

OSC messages were being blocked or sent erratically when the 3D visualization was visible in the Animation Editor tab:

- **Symptoms:**
  - Multi-track barycentric animations work fine on OSC Manager tab (no 3D visible)
  - OSC messages stop or become erratic when switching to Animation Editor (3D visible)
  - This affects all animation types, especially complex multi-track setups

## Root Cause

Multiple issues were causing OSC blocking:

### 1. Animation Engine Loop Coupling
The animation engine used a single `requestAnimationFrame` loop for both:
- **UI Updates** - Calculating and displaying track positions in 3D
- **OSC Messages** - Sending position updates to Holophonix device

### 2. Multiple Competing RAF Loops
Three separate `requestAnimationFrame` loops competed for CPU:
- **3D Renderer** - Running at 60 FPS rendering the scene
- **OrbitControls** - Separate loop for camera control updates
- **UI Animation** - Track position updates

### 3. Excessive 3D Rendering
- 3D renderer ran at maximum 60 FPS even when not needed
- Heavy rendering blocked the main thread
- Prevented timers and other operations from executing smoothly

**The Problem:**
- `requestAnimationFrame` is throttled when browser is busy
- Multiple RAF loops compete for resources
- OSC messages need **consistent timing** regardless of rendering performance
- Heavy 3D rendering can starve other operations

## Solution

**Three-part fix to completely decouple OSC from rendering:**

### Part 1: Separate OSC Update Loop (animationStore.ts)

```typescript
// High-precision timer for OSC (not affected by rendering)
const TARGET_OSC_FPS = 30 // 30 updates per second
const OSC_INTERVAL = 1000 / TARGET_OSC_FPS
oscIntervalId = window.setInterval(updateOSC, OSC_INTERVAL)
```

### Part 2: Remove OrbitControls Loop (useSingleViewportControl.ts)

Removed the separate RAF loop that was updating controls every frame.
Controls are now updated by the renderer's loop instead.

### Part 3: Throttle 3D Rendering (SingleViewRenderer.tsx)

```typescript
// Throttle 3D renderer to 30 FPS
const TARGET_FPS = 30
const FRAME_INTERVAL = 1000 / TARGET_FPS

const animate = (currentTime: number) => {
  requestAnimationFrame(animate)
  
  // Skip frames to maintain 30 FPS
  const elapsed = currentTime - lastFrameTime
  if (elapsed < FRAME_INTERVAL) return
  
  // Update controls and render
  controls?.update()
  renderer.render(scene, camera)
}
```

### Key Benefits

✅ **Guaranteed OSC Timing**
- OSC messages sent at consistent 30 FPS via `setInterval`
- Completely independent of rendering performance
- Not throttled by browser or heavy 3D rendering

✅ **Reduced CPU Usage**
- 3D renderer throttled to 30 FPS (was running at 60+ FPS)
- Eliminated duplicate OrbitControls RAF loop
- All animation loops synchronized at 30 FPS

✅ **Smooth 3D Visualization**
- 30 FPS is sufficient for smooth visual feedback
- Reduced CPU allows other operations to run smoothly
- No impact on OSC message reliability

✅ **Proper Cleanup**
- All loops properly stopped on component unmount
- No memory leaks or hanging timers

## Implementation Details

### updateOSC() Function
```typescript
const updateOSC = () => {
  // Calculate positions for all playing animations
  // Send OSC messages via oscBatchManager
  // Runs at fixed 30 FPS via setInterval
}
```

### animate() Function
```typescript
const animate = () => {
  // Calculate positions for UI display
  // Update track positions in 3D scene
  // No OSC sending (moved to updateOSC)
  // Runs via requestAnimationFrame
}
```

## Performance Impact

- **CPU Usage:** Slight increase due to running two loops
  - OSC loop is lightweight (position calculation only)
  - Worth it for reliable OSC messaging

- **OSC Bandwidth:** Same (30 FPS fixed rate)
- **UI Smoothness:** Improved (can drop frames without affecting OSC)

## Testing Checklist

✅ Test multi-track barycentric animations with 3D visible
✅ Verify OSC messages sent consistently at ~30 FPS
✅ Switch between tabs and verify OSC continues
✅ Test with complex scenes (10+ tracks)
✅ Verify UI doesn't freeze during heavy rendering

## Related Files

**Modified:**
- `src/stores/animationStore.ts` - Separate OSC update loop with setInterval
- `src/components/animation-editor/components/threejs-editor/SingleViewRenderer.tsx` - Throttled to 30 FPS, added controls.update()
- `src/components/animation-editor/components/threejs-editor/MultiViewRenderer.tsx` - Throttled to 30 FPS (deprecated but fixed)
- `src/components/animation-editor/components/threejs-editor/hooks/useSingleViewportControl.ts` - Removed separate RAF loop
- `src/components/animation-editor/components/threejs-editor/UnifiedThreeJsEditor.tsx` - Pass controls to renderer

**Unchanged:**
- `src/utils/osc/batchManager.ts` - OSC batching logic unchanged

## Migration Notes

No breaking changes - fully backward compatible.
- Existing animations work without modification
- OSC settings unchanged
- UI behavior improved
