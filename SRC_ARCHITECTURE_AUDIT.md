# src/ Folder Architecture Audit

## Current Structure Analysis

### Overview
```
src/
├── animations/          # Animation strategies
├── components/          # React components
├── constants/           # App constants
├── cues/               # Cue system
├── data/               # Static data
├── hooks/              # React hooks
├── models/             # Animation models
├── orchestrator/       # Animation orchestration
├── pages/              # Page components
├── stores/             # Zustand stores
├── test/               # ⚠️ Tests (some missing)
├── theme/              # Theme configuration
├── timeline/           # Timeline system
├── types/              # Global type definitions
└── utils/              # Utilities
```

---

## Issues Identified

### 1. Test Files Scattered (HIGH PRIORITY)

**Problem:** Test files in 3 different locations

**Current State:**
```
✅ src/test/
   ├── animations.test.ts
   ├── animationEditorStore.test.ts
   ├── integration.test.ts
   ├── setup.ts
   └── setup.integration.ts

❌ src/stores/__tests__/
   └── animationEditorStoreV2.test.ts  # MISPLACED

❌ src/utils/
   └── animationTiming.test.ts  # MISPLACED
```

**Recommendation:** Follow Jest/Vitest best practice of `__tests__` folders next to source

**Proposed Structure:**
```
src/
├── stores/
│   ├── __tests__/
│   │   ├── animationStore.test.ts
│   │   ├── animationEditorStoreV2.test.ts
│   │   └── projectStore.test.ts
│   ├── animationStore.ts
│   └── ...
├── utils/
│   ├── __tests__/
│   │   ├── animationTiming.test.ts
│   │   └── transformations.test.ts
│   ├── animationTiming.ts
│   └── ...
└── test/
    ├── integration/  # NEW: Integration tests
    │   ├── animations.test.ts
    │   └── multiTrack.test.ts
    ├── setup.ts
    └── setup.integration.ts
```

---

### 2. Type Definitions Organization (LOW PRIORITY - OK AS-IS)

**Current State:**
```
src/types/index.ts       # ✅ Global types
src/types/osc.d.ts       # ✅ OSC ambient types
src/cues/types.ts        # ✅ Cue-specific types (colocation)
src/models/types.ts      # ✅ Model-specific types (colocation)
src/orchestrator/types.ts # ✅ Orchestrator types (colocation)
src/timeline/types.ts    # ✅ Timeline types (colocation)
```

**Assessment:** ✅ **Current organization is GOOD**
- Module-specific types colocated with module (best practice)
- Global types centralized in `src/types/`
- No changes needed

---

### 3. Component Organization (GOOD)

**Current State:**
```
src/components/
├── animation-editor/    # ✅ Feature-based organization
│   ├── components/
│   ├── handlers/
│   ├── hooks/
│   └── utils/
├── common/             # ✅ Shared components
├── cue-grid/           # ✅ Feature-based
└── ui/                 # ✅ UI primitives
```

**Assessment:** ✅ **Well organized** - No changes needed

---

### 4. Utils Organization (NEEDS MINOR CLEANUP)

**Current State:**
```
src/utils/
├── osc/                        # ✅ NEW: Well organized
│   ├── DevOSCServer.ts
│   ├── deviceAvailability.ts
│   ├── messageProcessor.ts
│   ├── trackDiscovery.ts
│   └── index.ts
├── animationTiming.test.ts     # ❌ MISPLACED TEST
├── animationTiming.ts
├── transformBuilder.ts
├── transformApplication.ts
├── oscBatchManager.ts
├── oscInputManager.ts
└── ... (20+ utility files)
```

**Recommendation:** Group related utilities into subfolders

**Proposed Structure:**
```
src/utils/
├── __tests__/                  # NEW: Unit tests
│   ├── animationTiming.test.ts
│   └── transformations.test.ts
├── animation/                  # NEW: Animation utilities
│   ├── animationTiming.ts
│   ├── transformBuilder.ts
│   └── transformApplication.ts
├── osc/                        # ✅ Already done
│   └── ...
└── ... (top-level utilities)
```

---

## Proposed Changes

### Phase 1: Move Test Files (HIGH PRIORITY)

#### 1.1 Move Store Tests
```bash
# Keep in stores/__tests__ (already correct location)
src/stores/__tests__/animationEditorStoreV2.test.ts  # ✅ STAY

# Move from src/test/ to stores/__tests__/
src/test/animationEditorStore.test.ts
→ src/stores/__tests__/animationEditorStore.test.ts
```

#### 1.2 Move Utils Tests
```bash
# Move to utils/__tests__/
src/utils/animationTiming.test.ts
→ src/utils/__tests__/animationTiming.test.ts
```

#### 1.3 Reorganize Integration Tests
```bash
# Keep but organize better
src/test/animations.test.ts
→ src/test/integration/animations.test.ts

src/test/integration.test.ts
→ src/test/integration/multiTrack.test.ts (rename for clarity)
```

**Import Updates Needed:**
- Update vitest.config.ts to include new test paths
- Update any test imports in moved files

---

### Phase 2: Optional Utils Grouping (MEDIUM PRIORITY)

**Create Subfolders:**
```bash
src/utils/animation/
  ├── animationTiming.ts
  ├── transformBuilder.ts
  └── transformApplication.ts
```

**Benefits:**
- Clearer organization
- Easier to find related utilities
- Scalable for future growth

**Considerations:**
- Requires updating ~50+ imports across codebase
- Low risk but time-consuming
- Can be done incrementally

---

## Benefits of Proposed Changes

### Immediate Benefits (Phase 1)
1. **Consistency:** All tests follow `__tests__` pattern
2. **Discoverability:** Tests next to source code
3. **IDE Support:** Better test runner integration
4. **Standards:** Aligns with Jest/Vitest best practices

### Long-term Benefits (Phase 2)
1. **Scalability:** Grouped utilities easier to navigate
2. **Maintainability:** Clear module boundaries
3. **Onboarding:** New developers find code faster

---

## Risk Assessment

### Phase 1: Test File Moves
- **Risk:** LOW
- **Impact:** ~5 import updates
- **Breaking:** None (test-only)
- **Time:** 15 minutes

### Phase 2: Utils Grouping
- **Risk:** MEDIUM
- **Impact:** ~50+ import updates
- **Breaking:** Potential if imports missed
- **Time:** 1-2 hours

---

## Recommendation

### Immediate Actions (NOW)
✅ **Execute Phase 1:** Move misplaced test files
- Low risk, high value
- Follows best practices
- Quick wins

### Future Actions (OPTIONAL)
⏸️ **Phase 2:** Consider when:
- Adding many new utilities
- Team requests better organization
- During major refactoring anyway

---

## Current Architecture Score

| Category | Score | Notes |
|----------|-------|-------|
| Components | 9/10 | Excellent feature-based org |
| Stores | 8/10 | Good, tests already in __tests__ |
| Types | 9/10 | Smart colocation + globals |
| Utils | 6/10 | Functional but could be grouped |
| Tests | 5/10 | Scattered, needs consolidation |
| **Overall** | **7.5/10** | **Good base, minor improvements needed** |

---

## Conclusion

The current architecture is **well-organized overall** with room for minor improvements:

1. **Must Fix:** Test file locations (Phase 1)
2. **Optional:** Utils grouping (Phase 2)
3. **Keep As-Is:** Types, components, stores structure

**Action:** Proceed with Phase 1 test reorganization.
