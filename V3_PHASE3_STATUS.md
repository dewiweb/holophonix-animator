# V3 Phase 3 Cleanup Status

**Date:** November 11, 2025  
**Status:** Core Engine Complete, UI Layer Needs Refactoring

---

## ✅ COMPLETED - Core Animation Engine

### 1. Type System (100% Complete)
- ✅ Removed all v2 fields from `Animation` interface
- ✅ Removed all v2 fields from `CalculationContext`
- ✅ Only v3 types remain

### 2. Models (100% Complete - 20/20 files)
- ✅ `circular.ts` - cleaned
- ✅ `linear.ts` - cleaned
- ✅ `elliptical.ts` - cleaned
- ✅ `spiral.ts` - cleaned
- ✅ `helix.ts` - cleaned (restored parameters)
- ✅ `lissajous.ts` - cleaned
- ✅ `random.ts` - cleaned
- ✅ `bezier.ts` - cleaned
- ✅ `catmullRom.ts` - cleaned
- ✅ `zigzag.ts` - cleaned (restored parameters)
- ✅ `perlinNoise.ts` - cleaned
- ✅ `roseCurve.ts` - cleaned
- ✅ `epicycloid.ts` - cleaned
- ✅ `doppler.ts` - cleaned
- ✅ `circularScan.ts` - cleaned
- ✅ `zoom.ts` - cleaned
- ✅ `pendulum.ts` - cleaned (fixed trackIndex → trackId)
- ✅ `bounce.ts` - cleaned
- ✅ `spring.ts` - cleaned
- ✅ `wave.ts` - cleaned

**Result:** All models are now pure functions, no mode checks

### 3. Core Runtime (100% Complete)
- ✅ `animationStore.ts` - v3 context, unified transform application
- ✅ `models/runtime.ts` - removed multiTrackHandlers logic
- ✅ `utils/testModelSystem.ts` - v3 context

### 4. Deleted Files
- ✅ `src/utils/animationMigration.ts` - removed (no backward compat)
- ✅ `src/animations/strategies/MultiTrackStrategy.ts` - removed

---

## 🔄 REMAINING - UI Layer (Needs Refactoring)

The animation **engine** works with v3, but the **UI editor** still uses v2 concepts for managing multi-track state. This is intentional separation - the UI can use whatever abstractions make sense for editing.

### Files That Need UI Refactoring:

#### High Priority (Breaks Build):

1. **`components/animation-editor/handlers/saveAnimationHandler.ts`**
   - Imports deleted `MultiTrackStrategy`
   - Needs to build v3 `AnimationTransform` directly
   - Calculate offsets and create transform structure

2. **`stores/animationEditorStoreV2.ts`**
   - Imports deleted `MultiTrackStrategy` 
   - Uses v2 fields: multiTrackMode, barycentricVariant, customCenter, phaseOffsetSeconds
   - **Decision:** Keep these as UI state, but convert to v3 when saving

3. **`utils/multiTrackPathGeneration.ts`**
   - Imports deleted `MultiTrackStrategy`
   - Used for visualization preview
   - Needs to work with v3 transforms

#### Medium Priority (UI Components):

4. **`components/animation-editor/AnimationEditor.tsx`**
   - References v2 store fields (multiTrackMode, etc.)
   - **Note:** These are UI state, not animation data
   - Works if store provides them

5. **`components/animation-editor/components/AnimationLibrary.tsx`**
   - References animation.multiTrackMode
   - Used for display/filtering
   - Can show transform.mode instead

---

## Architecture Decision: UI vs Engine Separation

### Engine Layer (v3 - DONE ✅)
```
Animation with transform → Runtime → Model → Position
```
- Clean v3 types
- No mode checking in models
- Single transform application point

### UI Layer (Can Stay v2 for Now)
```
User selects mode → UI state → Build v3 animation → Save
```
- UI can use multiTrackMode, barycentricVariant as **editing abstractions**
- When saving: convert to v3 AnimationTransform
- This separation is actually **good design**

---

## Quick Fix Strategy

### Option A: Keep UI v2, Convert on Save (Recommended)
- UI continues using multiTrackMode etc. as editing state
- `saveAnimationHandler` converts to v3 AnimationTransform when saving
- **Pro:** Minimal UI changes, clear separation
- **Con:** Two representations in codebase

### Option B: Full v3 Refactor
- Refactor entire UI to work with AnimationTransform directly
- Remove all v2 concepts from UI
- **Pro:** Complete consistency
- **Con:** Large refactor, may complicate UI

---

## Immediate TODO (To Make It Build)

### 1. Create Transform Builder Utility
```typescript
// src/utils/transformBuilder.ts
export function buildTransform(
  mode: 'relative' | 'barycentric',
  variant: string,
  tracks: Track[],
  customCenter?: Position,
  phaseOffset?: number
): AnimationTransform {
  // Convert v2 UI state → v3 transform
}
```

### 2. Update saveAnimationHandler
```typescript
// Remove MultiTrackStrategy import
// Use transformBuilder instead
const transform = buildTransform(
  multiTrackMode,
  barycentricVariant,
  selectedTracks,
  customCenter,
  phaseOffsetSeconds
)

const animation: Animation = {
  ...
  transform  // v3
}
```

### 3. Update multiTrackPathGeneration
- Remove MultiTrackStrategy import
- Use transformApplication.ts functions instead
- Apply transforms to preview paths

### 4. Update AnimationLibrary
- Show `animation.transform?.mode` instead of `animation.multiTrackMode`
- Migration: if no transform, show "Single Track"

---

## Estimated Time

- **Transform Builder:** 30 minutes
- **saveAnimationHandler:** 20 minutes
- **multiTrackPathGeneration:** 30 minutes
- **AnimationLibrary:** 10 minutes
- **Testing:** 30 minutes

**Total:** ~2 hours

---

## Current Build Errors

```
❌ Cannot find module '@/animations/strategies/MultiTrackStrategy'
   - saveAnimationHandler.ts
   - animationEditorStoreV2.ts
   - multiTrackPathGeneration.ts

❌ Property 'multiTrackMode' does not exist on type 'Animation'
   - AnimationEditor.tsx (UI state, OK)
   - AnimationLibrary.tsx (display)
   - animationEditorStoreV2.ts (UI state, OK)
   - saveAnimationHandler.ts (needs fix)
```

---

## Benefits of Current Approach

1. **Core engine is clean v3** ✅
2. **Models are pure functions** ✅
3. **No mode checking in models** ✅
4. **Single transform application point** ✅
5. **UI can use convenient abstractions**
6. **Clear separation of concerns**

---

## Recommendation

**Implement Option A:** Keep UI v2-style, convert on save

This gives us:
- Clean v3 engine (done)
- Convenient UI editing experience (existing)
- Clear conversion point (saveAnimationHandler)
- Best of both worlds

The UI doesn't need to know about AnimationTransform internals.
It just needs to provide the inputs (mode, variant, tracks, center, phase).
The save handler converts to v3.

This is actually **better architecture** than forcing v3 concepts into the UI!
