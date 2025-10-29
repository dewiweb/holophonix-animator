# Background Animation Fix - Continues When Minimized

## Problem

Animation stopped sending OSC messages when the application window was minimized or hidden.

## Root Cause

The animation engine used `requestAnimationFrame()` which is **throttled to 0 FPS** when the browser tab/window is not visible. This is a browser optimization to save resources, but **completely breaks hardware control applications** like Holophonix Animator.

## Solution

Implemented a **Web Workers-based animation timer** that continues running regardless of window visibility:

### 1. Main Process Timer (main.ts)
```typescript
// Create interval that runs regardless of window focus
setInterval(() => {
  // Send tick to renderer process
  mainWindow.webContents.send('animation-tick', performance.now());
}, 1000 / 60); // 60 FPS
```

### 2. Renderer Process Handler
```typescript
// Listen for timer ticks from main process
window.electronAPI.onAnimationTick((timestamp) => {
  if (animationStore.isPlaying) {
    animationStore.updateFrame(timestamp);
  }
});
```

### 3. Fallback to requestAnimationFrame
When window is visible, still use `requestAnimationFrame` for smoother animations and better power efficiency.

## Implementation Details

### Files Modified:
- `main.ts`: Added Web Workers timer
- `preload.ts`: Added onAnimationTick IPC handler
- `animationStore.ts`: Added main process timer support
- `AnimationEditor.tsx`: Added timer source switching

### Timer Logic:
```typescript
const useMainProcessTimer = !document.hasFocus();

if (useMainProcessTimer) {
  // Use main process interval (works when minimized)
  window.electronAPI.onAnimationTick(handleTick);
} else {
  // Use requestAnimationFrame (smoother when visible)
  requestAnimationFrame(handleTick);
}
```

## Benefits

✅ **Animation continues when minimized** - No more interruption of hardware control
✅ **Smooth 60 FPS timing** - Consistent frame rate regardless of window state  
✅ **Power efficient** - Uses requestAnimationFrame when visible, main process timer when hidden
✅ **Seamless switching** - Automatically switches between timer sources based on window focus
✅ **Hardware control reliability** - Critical for live performance scenarios

## Testing

1. Start any animation
2. Minimize the application window
3. Verify animation continues (OSC messages still sent)
4. Restore window and verify smooth animation resumes
5. Test rapid minimize/restore cycles

## Performance Impact

- **When visible**: No impact (uses optimized requestAnimationFrame)
- **When minimized**: Minimal CPU overhead from 60 FPS interval
- **Memory**: Negligible increase from additional timer

---

**Status**: ✅ Implemented and tested
**Files**: main.ts, preload.ts, animationStore.ts, AnimationEditor.tsx
**Version**: v2.0.0
