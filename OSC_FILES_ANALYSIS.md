# OSC Files Reorganization Analysis

## Files to Move to `utils/osc/`

### 1. oscBatchManager.ts (258 lines)
**Purpose:** Batches multiple track updates into single IPC calls
**Imported by:**
- `stores/oscStore.ts`
- `stores/animationStore.ts`
- `components/OSCPerformanceMonitor.tsx`
- `utils/index.ts` (re-export)

### 2. oscInputManager.ts (222 lines)
**Purpose:** Handles incoming OSC messages with throttling and filtering
**Imported by:**
- `stores/oscStore.ts`
- `stores/animationStore.ts`
- `utils/index.ts` (re-export)

### 3. oscMessageOptimizer.ts (673 lines)
**Purpose:** Optimizes OSC messages using incremental updates and patterns
**Imported by:**
- `stores/oscStore.ts`
- `stores/animationStore.ts`
- `utils/index.ts` (re-export)

---

## Current Structure
```
src/utils/
├── osc/                        # Already exists
│   ├── DevOSCServer.ts
│   ├── deviceAvailability.ts
│   ├── messageProcessor.ts
│   ├── trackDiscovery.ts
│   └── index.ts
├── oscBatchManager.ts          # ❌ Should be in osc/
├── oscInputManager.ts          # ❌ Should be in osc/
└── oscMessageOptimizer.ts      # ❌ Should be in osc/
```

## Proposed Structure
```
src/utils/
└── osc/
    ├── DevOSCServer.ts
    ├── deviceAvailability.ts
    ├── messageProcessor.ts
    ├── trackDiscovery.ts
    ├── batchManager.ts         # ✅ Moved & renamed
    ├── inputManager.ts         # ✅ Moved & renamed
    ├── messageOptimizer.ts     # ✅ Moved & renamed
    └── index.ts                # ✅ Updated exports
```

---

## Import Update Strategy

### Option A: Update all imports (Breaking)
Update all files to use new paths:
```typescript
// Before
import { oscBatchManager } from '@/utils/oscBatchManager'

// After
import { oscBatchManager } from '@/utils/osc/batchManager'
```
**Impact:** 4 files need updates

### Option B: Keep re-exports (Non-breaking) ✅ RECOMMENDED
Keep `utils/index.ts` re-exports working:
```typescript
// utils/index.ts
export { oscBatchManager } from './osc/batchManager'
export { oscInputManager } from './osc/inputManager'
export { oscMessageOptimizer } from './osc/messageOptimizer'
```
**Impact:** Only 2 files need updates (utils/index.ts and utils/osc/index.ts)

---

## Recommended Actions

### 1. Move Files ✅
```bash
git mv src/utils/oscBatchManager.ts src/utils/osc/batchManager.ts
git mv src/utils/oscInputManager.ts src/utils/osc/inputManager.ts
git mv src/utils/oscMessageOptimizer.ts src/utils/osc/messageOptimizer.ts
```

### 2. Update `utils/osc/index.ts` ✅
Add exports:
```typescript
export { oscBatchManager } from './batchManager'
export { oscInputManager } from './inputManager'
export { oscMessageOptimizer } from './messageOptimizer'
// ... types
```

### 3. Update `utils/index.ts` ✅
Change re-exports:
```typescript
export { oscBatchManager } from './osc/batchManager'
export { oscInputManager } from './osc/inputManager'
export { oscMessageOptimizer } from './osc/messageOptimizer'
```

---

## Benefits

1. **Better Organization** - All OSC utilities in one place
2. **Clearer Module Boundaries** - OSC folder is self-contained
3. **Easier Discovery** - Find all OSC code in one location
4. **No Breaking Changes** - Re-exports maintain compatibility
5. **Shorter Names** - Remove "osc" prefix (already in osc folder)

---

## File Renaming Rationale

Since files are in `utils/osc/`, the "osc" prefix is redundant:
- `oscBatchManager.ts` → `batchManager.ts`
- `oscInputManager.ts` → `inputManager.ts`
- `oscMessageOptimizer.ts` → `messageOptimizer.ts`

Usage remains the same:
```typescript
import { oscBatchManager } from '@/utils/osc'
```

---

## Risk Assessment

**Risk Level:** LOW ✅
- Re-exports maintain backward compatibility
- Only 2 files need modification
- No functional changes
- Git history preserved with `git mv`

**Time Estimate:** 10 minutes

---

## Conclusion

✅ **Proceed with reorganization**
- Move 3 files to `utils/osc/`
- Update 2 export files
- Maintain backward compatibility with re-exports
- Clean, organized OSC module structure
