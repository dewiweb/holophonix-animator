# Quick Test: Is Main Process Engine Running?

## Start the app:
```bash
npm run electron:dev
```

## Check Browser Console (DevTools - F12)

Look for these messages on app startup:

### ✅ SUCCESS - You should see:
```
🔍 Main Process Engine availability check: {
  hasWindow: true,
  hasElectronAPI: true,
  hasAnimationEnginePlay: true,  ← THIS MUST BE TRUE
  available: true
}
🎬 Using Main Process Animation Engine (production-grade, never throttled)
🔄 Initializing main process animation engine synchronization...
✅ Main process animation engine sync initialized
```

### ❌ FAILURE - If you see:
```
hasAnimationEnginePlay: false
⚠️ Main process engine not available, falling back to renderer engine
🎬 Using Renderer Process Animation Engine (development mode)
```

This means preload.ts isn't exposing the API correctly.

## Check Terminal/Main Process Console

When you PLAY an animation, you should see:

### ✅ SUCCESS:
```
🎬 Main engine: Received play command for animation [id]
▶️  Main engine: Playing animation [id]
🚀 Main engine started: 30 FPS (33.3ms interval)
✅ CRITICAL: Engine runs in MAIN PROCESS - NEVER THROTTLED by OS
```

### ❌ FAILURE:
If you don't see these messages, the renderer is using its own engine (which WILL be throttled).

## Test Hidden Window

1. Start an animation
2. Minimize window
3. Watch terminal for "Main engine" messages - they should continue at 30 FPS
4. OSC messages should arrive at device consistently

## Common Issues

### Issue 1: "hasAnimationEnginePlay: false"
**Cause:** Preload script not compiled/loaded
**Fix:** Check if preload.cjs exists and has the animation engine methods

### Issue 2: No terminal messages when playing
**Cause:** main.ts not loading animationEngine.js
**Fix:** Check main-process/animationEngine.js exists

### Issue 3: Messages appear but stop when window hidden
**Cause:** Renderer engine still running
**Fix:** Check animationStore.ts is delegating correctly
