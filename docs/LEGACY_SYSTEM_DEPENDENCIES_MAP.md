# Legacy Animation System: Complete Dependency Map

**Date**: 2024-11-06  
**Status**: 🚨 CRITICAL - Many hardcoded dependencies found  
**Warning**: Cannot simply delete `/utils/animations/` - need migration plan

---

## ⚠️ **USER WARNING VALIDATED**

The user was RIGHT to warn about hardcoded switch statements. Found **extensive** hardcoded dependencies throughout codebase.

---

## 📊 **Legacy Dependencies Found**

### **Category 1: Direct Function Imports** (3 files)

#### **1. test/animations.test.ts**
```typescript
import {
  calculateLinearPosition,
  calculateCircularPosition,
  calculateEllipticalPosition,
  // ... 20+ more legacy functions
} from '@/utils/animations'
```

**Impact**: ALL unit tests use legacy functions  
**Lines**: ~300 lines of tests  
**Migration**: Replace with `modelRuntime.calculatePosition()`

---

#### **2. utils/animations/index.ts** (MAIN LEGACY FILE)
```typescript
// Lines 99-165: Giant switch statement
switch (type) {
  case 'linear':
    return calculateLinearPosition(parameters, effectiveTime, duration)
  case 'circular':
    return calculateCircularPosition(parameters, effectiveTime, duration)
  // ... 24 animation types
}
```

**Impact**: Entry point for all legacy calculations  
**Lines**: 166 lines  
**Migration**: REPLACE with `modelRuntime.calculatePosition()` call

---

### **Category 2: Hardcoded Type Switches** (5 files)

#### **3. components/animation-editor/AnimationEditor.backup.tsx**
**MASSIVE** hardcoded switches:

**Switch 1: Compatibility Checks** (lines 368-500+)
```typescript
switch (animationType) {
  case 'linear':
    modes['position-relative'] = { 
      compatible: false, 
      reason: 'Linear needs explicit start/end points' 
    }
    // ... hundreds of lines
}
```

**Switch 2: Default Parameters** (lines 613-800+)
```typescript
switch (type) {
  case 'linear':
    defaultParams.startPosition = { ...trackPosition }
    defaultParams.endPosition = { x: trackPosition.x + 5, ... }
    break
  case 'circular':
    defaultParams.center = { ...trackPosition }
    // ... 24 types
}
```

**Switch 3: Track Position Updates** (lines 808-900+)
```typescript
switch (type) {
  case 'linear':
  case 'bezier':
  case 'catmull-rom':
    updatedParams.startPosition = { ...trackPosition }
    break
  // ... more cases
}
```

**Switch 4: Parameter Modification Checks** (lines 1237-1270)
```typescript
switch (animationType) {
  case 'linear':
  case 'bezier':
    modified.startPosition = JSON.stringify(currentParams.startPosition) !== ...
    break
  // ... more cases
}
```

**Switch 5: Render Parameters UI** (lines 1389-2000+)
```typescript
switch (type) {
  case 'linear':
    return (<LinearParametersForm ... />)
  case 'circular':
    return (<CircularParametersForm ... />)
  // ... 24 types
}
```

**Impact**: 102KB file with ~2,500 lines of hardcoded logic  
**Status**: Backup file (AnimationEditor.tsx is current)  
**Migration**: DELETE if not needed, or update if still used

---

#### **4. components/animation-editor/utils/compatibility.ts**
```typescript
// Lines 27-150+: Mode compatibility by type
switch (animationType) {
  case 'linear':
    modes['position-relative'] = { 
      compatible: false, 
      reason: 'Linear needs explicit start/end points' 
    }
    break
  case 'circular':
  case 'orbit':
    // Different logic
    break
  // ... 24 types
}
```

**Impact**: Multi-track mode compatibility checks  
**Lines**: ~150 lines  
**Migration**: Use model metadata for compatibility

---

#### **5. components/animation-editor/utils/barycentricCalculations.ts**
```typescript
// Lines 130-180: Rotation angles by type
switch (animationType) {
  case 'circular':
  case 'orbit':
    return progress * Math.PI * 2
  case 'spiral':
    return progress * rotations * 2 * Math.PI
  // ... more cases
}
```

**Impact**: Formation mode calculations  
**Lines**: ~50 lines  
**Migration**: Use model properties or calculation context

---

#### **6. components/animation-editor/components/3d-preview/AnimationPreview3D.tsx**
```typescript
// Lines 995-1100+: Preview calculation by type
switch (animation.type) {
  case 'linear': {
    const start = params.startPosition || { x: 0, y: 0, z: 0 }
    const end = params.endPosition || { x: 0, y: 0, z: 0 }
    return { ... }
  }
  case 'circular': {
    const center = params.center || { x: 0, y: 0, z: 0 }
    // Calculate position
    return { x, y, z }
  }
  // ... 24 types
}
```

**Impact**: 3D preview rendering  
**Lines**: ~100+ lines  
**Migration**: Use `modelRuntime.calculatePosition()` for preview

---

### **Category 3: Legacy Calculation Files** (9 files)

Files in `/utils/animations/`:
1. `basicAnimations.ts` (6,368 bytes)
2. `physicsAnimations.ts` (6,149 bytes)
3. `waveAnimations.ts` (3,075 bytes)
4. `curveAnimations.ts` (3,725 bytes)
5. `proceduralAnimations.ts` (5,540 bytes)
6. `interactiveAnimations.ts` (3,582 bytes)
7. `spatialAnimations.ts` (2,182 bytes)
8. `keyframeAnimations.ts` (3,559 bytes)
9. `index.ts` (5,289 bytes) - Router

**Total**: ~39 KB, ~1,500 lines of duplicate code

---

## 🎯 **Migration Complexity Assessment**

### **Easy Migrations** (Can do immediately):
1. ✅ `/models/runtime.ts` - Remove legacy fallback (already identified)
2. ✅ `/stores/animationStore.ts` - Remove legacy import (already identified)
3. ✅ `/utils/pathGeneration.ts` - Remove legacy import (already identified)

### **Medium Migrations** (Need code changes):
4. ⚠️ `test/animations.test.ts` - Update ~40 test calls
5. ⚠️ `AnimationPreview3D.tsx` - Replace switch with `modelRuntime` call
6. ⚠️ `utils/compatibility.ts` - Use model metadata instead of switch
7. ⚠️ `utils/barycentricCalculations.ts` - Use model properties

### **Complex Migrations** (Need architectural decisions):
8. 🔴 `AnimationEditor.backup.tsx` - DELETE or completely refactor?
9. 🔴 Legacy calculation files - Can delete after other migrations

---

## 📋 **Revised Removal Plan: 6 Phases**

### **Phase 0: Investigation** (DONE)
- ✅ Map all dependencies
- ✅ Categorize by migration complexity
- ✅ Identify blockers

---

### **Phase 1: Easy Wins** (1 hour)

#### **A. Remove Legacy Fallbacks**
Files: `runtime.ts`, `animationStore.ts`, `pathGeneration.ts`

```typescript
// models/runtime.ts - Remove this:
import { calculatePosition as calculateLegacyPosition } from '@/utils/animations'

private calculateWithLegacy(...) {
  return calculateLegacyPosition(...)  // DELETE
}
```

**Impact**: Runtime ONLY uses models (no fallback)

---

#### **B. Verify Backup File Status**
```bash
# Check if AnimationEditor.backup.tsx is used anywhere
grep -r "AnimationEditor.backup" src/
```

**Decision**:
- If NOT used → DELETE (saves 102KB)
- If used → Must refactor (complex)

---

### **Phase 2: Replace 3D Preview Switch** (1 hour)

**File**: `AnimationPreview3D.tsx`

**Current** (lines 990-1100):
```typescript
function calculatePositionAtTime(animation: Animation, time: number) {
  switch (animation.type) {
    case 'linear': { /* hardcoded */ }
    case 'circular': { /* hardcoded */ }
    // ... 24 types
  }
}
```

**Replace with**:
```typescript
import { modelRuntime } from '@/models/runtime'

function calculatePositionAtTime(animation: Animation, time: number) {
  return modelRuntime.calculatePosition(animation, time, 0, {
    trackId: 'preview',
    trackIndex: 0,
    totalTracks: 1
  })
}
```

**Lines removed**: ~110 lines  
**Benefit**: Preview uses same calculation as playback

---

### **Phase 3: Migrate Compatibility Checks** (2 hours)

**File**: `utils/compatibility.ts`

**Current**: Hardcoded switch statement

**Option A: Add to Model Metadata**
```typescript
// In each model definition
export const linearModel: AnimationModel = {
  metadata: {
    // ...
    multiTrackSupport: {
      'identical': true,
      'phase-offset': true,
      'position-relative': false,  // Not compatible
      'phase-offset-relative': false,
      'isobarycenter': true,
      'centered': true
    }
  }
}
```

**Option B: Create Compatibility Service**
```typescript
// utils/animationModelCompatibility.ts
export function getCompatibleModes(type: AnimationType): CompatibilityMap {
  const model = modelRegistry.getModel(type)
  if (!model) return defaultCompatibility
  
  return model.metadata.multiTrackSupport || defaultCompatibility
}
```

**Replace in**:
- `compatibility.ts` - Use model metadata
- Remove hardcoded switch

**Lines removed**: ~150 lines

---

### **Phase 4: Migrate Barycentric Calculations** (1 hour)

**File**: `barycentricCalculations.ts`

**Current**: Hardcoded rotation angles

**Option A: Add to Model**
```typescript
// In model definition
export const circularModel: AnimationModel = {
  // ...
  properties: {
    isRotational: true,
    rotationFunction: (progress: number, params: any) => progress * Math.PI * 2
  }
}
```

**Option B: Query Model for Behavior**
```typescript
function getRotationAngle(animationType: AnimationType, progress: number, params: any) {
  const model = modelRegistry.getModel(animationType)
  
  if (model?.properties?.rotationFunction) {
    return model.properties.rotationFunction(progress, params)
  }
  
  // Default: no rotation
  return 0
}
```

**Lines removed**: ~50 lines

---

### **Phase 5: Update Tests** (2 hours)

**File**: `test/animations.test.ts`

**Current**:
```typescript
import {
  calculateLinearPosition,
  calculateCircularPosition,
  // ... 24 imports
} from '@/utils/animations'

describe('calculateLinearPosition', () => {
  const result = calculateLinearPosition(params, time, duration)
  // ...
})
```

**Replace with**:
```typescript
import { modelRuntime } from '@/models/runtime'
import { AnimationType } from '@/types'

function testAnimation(type: AnimationType, params: any, time: number, duration: number) {
  const animation = { type, parameters: params, duration }
  return modelRuntime.calculatePosition(animation, time)
}

describe('Linear animation', () => {
  const result = testAnimation('linear', params, time, duration)
  // ...
})
```

**Updates needed**: ~40 test cases  
**Lines changed**: ~300 lines

---

### **Phase 6: Delete Legacy Files** (15 minutes)

**After all migrations complete**:

```bash
cd src/utils/
rm -rf animations/
```

**Files deleted**:
- animations/basicAnimations.ts
- animations/physicsAnimations.ts
- animations/waveAnimations.ts
- animations/curveAnimations.ts
- animations/proceduralAnimations.ts
- animations/interactiveAnimations.ts
- animations/spatialAnimations.ts
- animations/keyframeAnimations.ts
- animations/index.ts

**Total removed**: ~39 KB, ~1,500 lines

---

## ⏱️ **Revised Time Estimate**

| Phase | Work | Time | Risk |
|-------|------|------|------|
| Phase 0 | Investigation | ✅ DONE | - |
| Phase 1 | Easy wins | 1h | Low |
| Phase 2 | 3D Preview | 1h | Low |
| Phase 3 | Compatibility | 2h | Medium |
| Phase 4 | Barycentric | 1h | Low |
| Phase 5 | Tests | 2h | Low |
| Phase 6 | Delete files | 0.25h | Low |
| **Total** | | **7.25h** | **~1 day** |

**Original estimate**: 3.5 hours (too optimistic!)  
**Realistic estimate**: 7-8 hours (~1 full day)

---

## 🚨 **Critical Decisions Needed**

### **Decision 1: AnimationEditor.backup.tsx**
**Question**: Is this file still used?

**Check**:
```bash
grep -r "AnimationEditor.backup" src/
```

**Options**:
- If NOT used → DELETE (saves 102KB, 2,500 lines)
- If used → Must refactor (adds 1-2 days!)

**Impact**: Huge - backup file has 5 massive switch statements

---

### **Decision 2: Model Metadata Expansion**
**Question**: Should models include compatibility info?

**Options**:
- **A**: Add to model metadata (cleaner, more data)
- **B**: Keep separate compatibility service (separation of concerns)

**Recommendation**: Option A (models know their own constraints)

---

### **Decision 3: Test Strategy**
**Question**: Rewrite tests or just update imports?

**Options**:
- **A**: Update imports, keep same test structure
- **B**: Rewrite to test models directly
- **C**: Keep legacy tests, add new model tests

**Recommendation**: Option A (fastest, preserves coverage)

---

## 🎯 **Recommended Approach**

### **Safest Path: Incremental Migration**

#### **Day 1 Morning**: Prep & Easy Wins (2h)
1. Check if `AnimationEditor.backup.tsx` is used
2. Remove legacy fallbacks (Phase 1)
3. Commit & test

#### **Day 1 Afternoon**: Core Migrations (3h)
1. Replace 3D Preview switch (Phase 2)
2. Start compatibility migration (Phase 3)
3. Commit & test

#### **Day 2 Morning**: Finish Migrations (3h)
1. Finish compatibility (Phase 3)
2. Barycentric calculations (Phase 4)
3. Update tests (Phase 5)
4. Commit & test

#### **Day 2 Afternoon**: Cleanup & Verify (1h)
1. Delete legacy files (Phase 6)
2. Run all tests
3. Manual testing
4. Final commit

**Total**: 1.5 days (instead of 0.5 days)

---

## ✅ **Verification Checklist**

After each phase:
- [ ] TypeScript compiles (no errors)
- [ ] Tests pass
- [ ] Dev server runs
- [ ] Manual testing of affected features
- [ ] Git commit with clear message

Final verification:
- [ ] All 24 animation types work
- [ ] Multi-track modes work
- [ ] 3D preview accurate
- [ ] No legacy imports remain
- [ ] Tests all pass
- [ ] Bundle size reduced

---

## 📝 **Migration Log Template**

```markdown
## Phase X: [Name]

**Date**: 
**Time**: 
**Status**: 

### Files Modified:
- [ ] file1.ts - Description
- [ ] file2.ts - Description

### Changes Made:
1. Change 1
2. Change 2

### Testing:
- [ ] TypeScript compiles
- [ ] Tests pass
- [ ] Feature X still works

### Rollback Plan:
If issues: `git revert [commit-hash]`

### Notes:
- Any issues found
- Any decisions made
```

---

## 🚀 **Next Steps**

1. **FIRST**: Check if `AnimationEditor.backup.tsx` is used
2. **DECIDE**: Model metadata expansion or separate service?
3. **CREATE**: Detailed Phase 1 implementation plan
4. **EXECUTE**: One phase at a time with testing
5. **VERIFY**: Each phase before moving to next

---

**Status**: 🟡 Ready to proceed with caution  
**Complexity**: Higher than initially estimated  
**User Warning**: VALIDATED - many hardcoded dependencies found

---

*"Measure twice, cut once." - Carpentry proverb*

We measured. Now we know the real scope.
