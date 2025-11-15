# Animation Engine Migration to Main Process - Analysis

## Current Architecture (Renderer Process)

### Data Flow
```
User Action (Play) 
  → animationStore.playAnimation()
  → startEngine()
  → requestAnimationFrame loop (rendering - 30 FPS)
  → setInterval loop (OSC - 30 FPS)
  → Calculate positions using modelRuntime
  → Update projectStore.tracks (UI)
  → Send OSC via batchManager
  → IPC to main process
  → UDP send
```

### Critical Dependencies

#### 1. **ModelRuntime** (`/src/models/runtime.ts`)
- **Pure calculation engine** - NO renderer dependencies
- Uses `modelRegistry` (singleton, can be imported in main process)
- Maintains state maps for stateful models (pendulum, spring)
- ✅ **Can move to main process**

#### 2. **Transform Application** (`/src/utils/transformApplication.ts`)
- Pure functions for position transforms
- Uses `modelRegistry` for rotation calculations
- No renderer dependencies
- ✅ **Can move to main process**

#### 3. **Project Data** (from `useProjectStore`)
- Tracks: `{ id, position, holophonixIndex, animationState, ... }`
- Animations: `{ id, type, parameters, duration, transform, ... }`
- Coordinate system config
- ❌ **Cannot move** (Zustand store tied to React)
- ✅ **Can serialize and send snapshot via IPC**

#### 4. **Animation Timing** (`/src/utils/animationTiming.ts`)
- Pure timing calculations
- Handles loop, ping-pong, pause/resume
- No dependencies
- ✅ **Can move to main process**

## Problem: Chromium Throttling

### When Window is Hidden/Minimized:
| Timer Type | Normal | Throttled | Impact |
|------------|--------|-----------|--------|
| `requestAnimationFrame` | 60 FPS | **PAUSED** | ❌ No rendering |
| `setInterval` | 30 FPS | **1000ms** | ❌ OSC delayed 1 sec |
| Node.js timers (main) | Any rate | **NEVER** | ✅ Consistent |

### Current OSC Loop (line 784 in animationStore.ts):
```typescript
oscIntervalId = window.setInterval(updateOSC, OSC_INTERVAL) // ❌ Gets throttled!
```

## Proposed Architecture: Hybrid Model

### Main Process (Never Throttled)
```
Animation Engine Service
├─ High-precision timer (setInterval 33ms = 30 FPS)
├─ Animation state snapshot (from renderer)
├─ Model calculations (modelRuntime)
├─ Transform application
├─ OSC sending (already here)
└─ Position updates → IPC → renderer
```

### Renderer Process (Display Only)
```
State Management & UI
├─ Zustand stores (projectStore, animationStore, oscStore)
├─ User controls (play/pause/stop)
├─ Animation state sync → IPC → main
├─ Position updates ← IPC ← main
├─ 3D visualization (throttled OK - just display)
└─ Editor UI
```

## Data Contracts (IPC)

### Renderer → Main: `start-animation-engine`
```typescript
{
  playingAnimations: {
    [animationId]: {
      animation: Animation,        // Full animation object
      tracks: {
        [trackId]: {
          holophonixIndex: number,
          initialPosition: Position,
          transform?: TrackTransform
        }
      },
      timingState: AnimationTimingState
    }
  },
  coordinateSystem: string,
  playbackSpeed: number
}
```

### Main → Renderer: `animation-position-update`
```typescript
{
  timestamp: number,
  positions: {
    [trackId]: {
      position: Position,
      time: number  // For UI display
    }
  }
}
```

### Main → Renderer: `animation-stopped`
```typescript
{
  animationId: string,
  reason: 'completed' | 'error'
}
```

## Implementation Safety Checklist

### ✅ Safe to Move
- [x] Model calculation (`modelRuntime`)
- [x] Transform application
- [x] Timing calculations
- [x] OSC batch creation
- [x] OSC sending (already in main)

### ⚠️ Requires Serialization
- [ ] Animation objects (contains functions - need special handling)
- [ ] Model registry (need to initialize in main process)
- [ ] State maps (need to sync between processes)

### ❌ Must Stay in Renderer
- [ ] Zustand stores
- [ ] React components
- [ ] 3D scene objects
- [ ] User input handling

## Migration Strategy

### Phase 1: Preparation (No Breaking Changes)
1. Create serialization helpers for Animation objects
2. Initialize model registry in main process
3. Create IPC message types
4. Add main process animation engine stub

### Phase 2: Parallel Implementation
1. Keep existing renderer engine working
2. Add main process engine alongside
3. Add feature flag to switch between them
4. Test with simple single-track animation

### Phase 3: Full Migration
1. Move all animation types to main process
2. Test multi-track, formation, relative modes
3. Test fade-in/fade-out, ping-pong, looping
4. Performance benchmarks (hidden vs visible)

### Phase 4: Cleanup
1. Remove renderer animation engine
2. Update animationStore to be state-only
3. Documentation updates

## Risk Analysis

### Low Risk ✅
- Pure calculation functions (no side effects)
- OSC sending (already in main process)
- Timing logic (well tested)

### Medium Risk ⚠️
- State synchronization (race conditions possible)
- IPC overhead (need to batch updates)
- Model registry initialization order

### High Risk ❌
- None identified - architecture is sound

## Performance Expectations

### Before (Window Hidden):
- OSC rate: ~1 msg/second (throttled)
- Position updates: 0 FPS (paused)
- User experience: **Broken**

### After (Window Hidden):
- OSC rate: 30 FPS (consistent)
- Position updates: On-demand when visible
- User experience: **Professional**

## Alternative Considered: `backgroundThrottling: false`

```typescript
mainWindow = new BrowserWindow({
  backgroundThrottling: false
})
```

**Rejected because:**
- Only disables Chromium throttling, not OS-level
- Wastes battery when app is actually idle
- Doesn't work on all platforms (macOS aggressive throttling)
- Not reliable for professional use

## Conclusion

Migration to main process is:
- ✅ Technically sound
- ✅ Low risk with phased approach
- ✅ Solves core professional-grade requirement
- ✅ No major refactoring of existing code
- ✅ Better separation of concerns (calculation vs display)

**Recommendation: Proceed with implementation**
