# V3 Cleanup - Remaining Work

**Status:** In Progress - Core Types Done, Models Need Cleanup

## Completed ✅

1. **Removed v2 deprecated fields from Animation interface**
   - Removed: multiTrackMode, barycentricVariant, customCenter, preserveOffsets, multiTrackParameters, phaseOffsetSeconds
   - Kept: transform (v3 unified)

2. **Removed v2 deprecated fields from CalculationContext**
   - Now only: trackId, time, duration, deltaTime, frameCount, state
   - Removed all mode-specific fields

3. **Deleted migration utilities**
   - Removed: src/utils/animationMigration.ts (no longer needed)

4. **Deleted old strategy pattern**
   - Removed: src/animations/strategies/MultiTrackStrategy.ts

5. **Updated animationStore.ts**
   - Removed old rotateOffsetForAnimation function
   - Simplified context building (removed deprecated fields)
   - Using clean v3 CalculationContext

6. **Updated models (partial)**
   - ✅ circular.ts - cleaned

## Remaining Work 🔄

### Models Need v2 Logic Removal

The following models still have v2 mode-checking logic that needs to be removed:

**Pattern to Remove:**
```typescript
// OLD (v2) - REMOVE THIS:
const multiTrackMode = parameters._multiTrackMode || context?.multiTrackMode

if (multiTrackMode === 'barycentric') {
  const baryCenter = parameters._isobarycenter || parameters._customCenter
  if (baryCenter) {
    center = baryCenter
  }
} else if (multiTrackMode === 'relative' && context?.trackOffset) {
  center = {
    x: center.x + context.trackOffset.x,
    y: center.y + context.trackOffset.y,
    z: center.z + context.trackOffset.z
  }
}
```

**Replace With:**
```typescript
// NEW (v3) - JUST USE PARAMETERS:
// V3: Pure function - just use parameters, no mode checks
// Transforms are applied AFTER calculation in animationStore
const center = parameters.center || { x: 0, y: 0, z: 0 }
```

### Models To Clean (19 files):

1. ✅ `src/models/builtin/circular.ts` - DONE
2. ❌ `src/models/builtin/linear.ts`
3. ❌ `src/models/builtin/elliptical.ts`
4. ❌ `src/models/builtin/spiral.ts`
5. ❌ `src/models/builtin/helix.ts`
6. ❌ `src/models/builtin/lissajous.ts`
7. ❌ `src/models/builtin/random.ts`
8. ❌ `src/models/builtin/bezier.ts`
9. ❌ `src/models/builtin/catmullRom.ts`
10. ❌ `src/models/builtin/zigzag.ts`
11. ❌ `src/models/builtin/perlinNoise.ts`
12. ❌ `src/models/builtin/roseCurve.ts`
13. ❌ `src/models/builtin/epicycloid.ts`
14. ❌ `src/models/builtin/doppler.ts`
15. ❌ `src/models/builtin/circularScan.ts`
16. ❌ `src/models/builtin/zoom.ts`
17. ❌ `src/models/builtin/pendulum.ts` (also has trackIndex)
18. ❌ `src/models/builtin/bounce.ts`
19. ❌ `src/models/builtin/spring.ts`
20. ❌ `src/models/builtin/wave.ts`

### Special Cases:

**pendulum.ts** - Also uses `context.trackIndex` which needs to be removed:
```typescript
// OLD:
const key = `pendulum_${context.trackIndex || 0}`
// NEW:
const key = `pendulum_${context.trackId}`
```

## How To Clean Each Model

For each model file:

1. Find the `calculate` function
2. Remove lines checking `multiTrackMode`
3. Remove lines checking `trackOffset`
4. Remove lines checking `isobarycenter`
5. Remove lines checking `customCenter`
6. Remove lines checking `trackIndex`
7. Just use parameters directly
8. Add comment: `// V3: Pure function - just use parameters, no mode checks`

## Estimated Time

- Per model: 2-3 minutes
- Total: ~40-60 minutes for all 19 models

## After Models Are Clean

Then we can:
1. Run `npm run build` - should pass
2. Test animations
3. Remove v2 internal parameter fields from AnimationParameters:
   - `_isobarycenter`, `_customCenter`, `_trackOffset`, `_multiTrackMode`

## Benefits After Cleanup

- **Pure Functions:** Models become mathematical functions
- **No Mode Logic:** Models don't know about multi-track
- **Type Safe:** No optional context fields to check
- **Easier to Test:** Just test (parameters, time) -> position
- **Easier to Add New Models:** Simple template to follow
