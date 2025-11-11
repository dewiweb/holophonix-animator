# Path Generation: Dual Source of Truth Issue

**Date**: November 9, 2024  
**Status**: ⚠️ **ARCHITECTURAL ISSUE IDENTIFIED**

---

## Problem

Path generation happens in **TWO separate places**:

### 1. Runtime Path (Source #1)
**Location**: `src/models/builtin/*.ts`  
**Purpose**: Calculate actual positions during animation playback  
**Used by**: Animation engine, OSC message generation  
**Example**: `circular.ts` lines 142-155

```typescript
// Runtime circular calculation (APP COORDINATE SPACE)
switch (plane) {
  case 'xy':
    pos.x = center.x + Math.cos(angle) * radius
    pos.y = center.y + Math.sin(angle) * radius
    break
  case 'xz':
    pos.x = center.x + Math.cos(angle) * radius
    pos.z = center.z + Math.sin(angle) * radius
    break
  case 'yz':
    pos.y = center.y + Math.cos(angle) * radius
    pos.z = center.z + Math.sin(angle) * radius
    break
}
```

### 2. Visual Path (Source #2)
**Location**: `src/components/animation-editor/components/threejs-editor/utils/generateAnimationPath.ts`  
**Purpose**: Generate path for 3D visualization  
**Used by**: Control point editor, visual preview  
**Example**: `generateAnimationPath.ts` lines 70-85

```typescript
// Visual circular generation (converted to THREE.JS COORDINATE SPACE)
if (plane === 'xy') {
  // App XY → Three XZ
  point.x = center.x + Math.cos(angle) * radius
  point.y = center.y
  point.z = center.z + Math.sin(angle) * radius
}
```

---

## The Issue

### ⚠️ Synchronization Risk

If the runtime model changes but visual generation doesn't:
- **User sees**: Path A in visual editor
- **Runtime executes**: Path B (different!)
- **Result**: Visual preview doesn't match actual behavior

### ⚠️ Code Duplication

Same logic exists in multiple places:
- Circular: `circular.ts` + `generateAnimationPath.ts`
- Spiral: `spiral.ts` + `generateAnimationPath.ts`
- Helix: `helix.ts` + `generateAnimationPath.ts`
- ... 24 animation types total

### ⚠️ Maintenance Burden

To add new animation type or fix bug:
1. Update runtime model (`src/models/builtin/*.ts`)
2. Update visual generator (`generateAnimationPath.ts`)
3. Update control point extractor (`extractControlPoints.ts`)
4. Update control point converter (`controlPointsToParameters`)
5. Keep all synchronized!

---

## Current Architecture

```
Runtime Path Calculation
├── src/models/builtin/circular.ts
├── src/models/builtin/spiral.ts
├── src/models/builtin/helix.ts
└── ... (24 models)
    ↓ calculate(time) → Position
    ↓ (Used at runtime)
OSC Messages

Visual Path Generation
├── generateAnimationPath.ts
    ├── case 'circular': generate circle
    ├── case 'spiral': generate spiral
    └── ... (24 cases)
    ↓ generate() → Vector3[]
    ↓ (Used in editor)
Visual Display
```

**Problem**: TWO separate implementations of same math!

---

## Solutions

### Solution 1: Visual Samples Runtime ✅ **RECOMMENDED**

**Visual generator calls runtime models** to get positions:

```typescript
// generateAnimationPath.ts
export const generateAnimationPath = (
  animation: Animation,
  segments: number = 100
): THREE.Vector3[] => {
  const points: THREE.Vector3[] = []
  const model = getModel(animation.type)
  
  // Sample the runtime model at multiple time points
  for (let i = 0; i <= segments; i++) {
    const time = (i / segments) * animation.duration
    
    // Call RUNTIME calculation
    const appPos = model.calculate(
      animation.parameters,
      time,
      animation.duration,
      context
    )
    
    // Convert to Three.js for display
    const threePos = appToThreePosition(appPos)
    points.push(threePos)
  }
  
  return points
}
```

**Benefits**:
- ✅ Single source of truth (runtime models)
- ✅ Visual ALWAYS matches runtime
- ✅ Add new animation type → visual works automatically
- ✅ Fix bug in model → visual fixed too
- ✅ No code duplication

**Implementation**:
1. Import model registry
2. Sample runtime model at time intervals
3. Convert positions to Three.js space
4. Generate path line

---

### Solution 2: Extract Shared Math Library ⚠️ **COMPLEX**

Create shared path generation functions:

```typescript
// src/utils/pathMath.ts
export const generateCircularPath = (
  center: Position,
  radius: number,
  plane: string,
  segments: number
): Position[] => {
  // Shared implementation
}
```

Used by both:
- Runtime models (call directly)
- Visual generator (call + convert)

**Benefits**:
- ✅ Shared code
- ✅ No duplication

**Drawbacks**:
- ❌ Requires refactoring all models
- ❌ More complex architecture
- ❌ Models lose independence
- ❌ Breaking changes to model API

---

### Solution 3: Keep Separate (Current) ❌ **NOT RECOMMENDED**

Keep both implementations separate.

**Drawbacks**:
- ❌ Risk of divergence
- ❌ Maintenance burden
- ❌ Code duplication
- ❌ Easy to introduce bugs

---

## Recommended Implementation

### Phase 1: Refactor Visual Generator

Replace `generateAnimationPath.ts` with runtime sampling:

```typescript
import { getModelByType } from '@/models/registry'
import { appToThreePosition } from './coordinateConversion'

export const generateAnimationPath = (
  animation: Animation | null,
  controlPoints: THREE.Vector3[] // Kept for backward compatibility
): THREE.Vector3[] => {
  if (!animation) return []
  
  // Get runtime model
  const model = getModelByType(animation.type)
  if (!model) {
    // Fallback: use control points
    if (controlPoints.length >= 2) {
      return new THREE.CatmullRomCurve3(controlPoints).getPoints(50)
    }
    return []
  }
  
  // Sample the model at time intervals
  const segments = getSegmentCount(animation.type) // 100 for most, 200 for complex
  const points: THREE.Vector3[] = []
  
  for (let i = 0; i <= segments; i++) {
    const time = (i / segments) * (animation.duration || 10)
    
    // Call runtime calculation (in APP space)
    const appPos = model.calculate(
      animation.parameters,
      time,
      animation.duration || 10,
      { multiTrackMode: animation.multiTrackMode }
    )
    
    // Convert to Three.js space for display
    const threePos = appToThreePosition(appPos)
    points.push(threePos)
  }
  
  return points
}

function getSegmentCount(animationType: string): number {
  // More segments for complex curves
  const complexTypes = ['rose-curve', 'epicycloid', 'lissajous', 'perlin-noise']
  return complexTypes.includes(animationType) ? 200 : 100
}
```

### Phase 2: Remove Duplicate Code

Delete manual path generation for each animation type from `generateAnimationPath.ts`.

### Phase 3: Test

Verify visual paths match runtime behavior:
1. Play animation
2. Visual path should match actual track movement
3. All 24 animation types

---

## Migration Strategy

### Week 1: Prototype
- Create new runtime-sampling function
- Test with 3 animation types (linear, circular, bezier)
- Verify coordinate conversion
- Performance testing

### Week 2: Rollout
- Replace generateAnimationPath.ts
- Test all 24 animation types
- Visual regression testing
- Performance optimization

### Week 3: Cleanup
- Remove duplicate code
- Update documentation
- Add tests

---

## Benefits of Solution 1

### ✅ Accuracy
- Visual path EXACTLY matches runtime
- No possibility of divergence
- What you see = What you get

### ✅ Maintainability
- Single place to update animation logic
- Add new type: just implement model
- Fix bug: automatic in both visual + runtime

### ✅ Consistency
- Same parameters → Same path (guaranteed)
- Coordinate conversion in one place
- Plane mapping handled once

### ✅ Simplicity
- Less code overall
- Clear dependencies
- Model system as single source

---

## Risks & Mitigations

### Risk 1: Performance
**Concern**: Sampling 100+ points per animation  
**Mitigation**: 
- Cache results based on parameters
- Only regenerate when parameters change
- Use requestIdleCallback for non-critical updates

### Risk 2: Circular Dependency
**Concern**: Visual code importing model system  
**Mitigation**: 
- Models are pure functions (no UI imports)
- Clear dependency direction: UI → Models
- Already done for runtime

### Risk 3: Breaking Changes
**Concern**: What if model API changes?  
**Mitigation**: 
- Model API is stable (production)
- Any changes would need migration anyway
- Visual generator is internal only

---

## Current State

### ✅ What We Fixed
- Coordinate conversion (Z-up vs Y-up)
- Plane mapping (app space → Three.js space)
- Control point extraction for all types

### ⚠️ What Remains
- **Dual source of truth** for path generation
- Risk of visual/runtime divergence
- Code duplication across 24 types

---

## Next Steps

### Option A: Implement Solution 1 (Recommended)
1. Create new runtime-sampling function
2. Test with subset of types
3. Roll out to all types
4. Remove duplicate code
5. **Estimated**: 2-3 days

### Option B: Document Risk, Fix Later
1. Add comments warning about duplication
2. Create validation tests (visual path = runtime path)
3. Plan future refactor
4. **Estimated**: 1 day documentation, future refactor

### Option C: Do Nothing
1. Accept dual source of truth
2. Manual synchronization on changes
3. Hope for the best ❌

---

## Recommendation

**Implement Solution 1** because:
- ✅ Eliminates architectural risk
- ✅ Reduces maintenance burden
- ✅ Guarantees accuracy
- ✅ Cleaner codebase
- ✅ Future-proof

**Timeline**: 2-3 days  
**Risk**: Low (models are stable, well-tested)  
**Benefit**: High (eliminates entire class of bugs)

---

**Status**: Issue identified, solution proposed  
**Priority**: Medium-High (affects accuracy and maintenance)  
**Decision needed**: Which solution to implement?
