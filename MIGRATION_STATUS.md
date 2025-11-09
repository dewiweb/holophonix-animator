# Multi-Track Mode Migration Status

## ✅ COMPLETED
1. **Strategy Pattern** - `/src/animations/strategies/MultiTrackStrategy.ts` created
2. **Type Definitions** - `Animation` interface updated (3 modes)
3. **Path Generation** - `multiTrackPathGeneration.ts` refactored to use strategies
4. **Compatibility** - `compatibility.ts` simplified to 3 modes
5. **UI Component** - `MultiTrackModeSelector.tsx` rebuilt
6. **Store Migration** - `animationEditorStoreV2.ts` updated with migration helper

## ⚠️ IN PROGRESS (BROKEN)
- **AnimationEditor.tsx** - Partially updated, has TypeScript errors
  - Old mode string comparisons still present
  - `centerPoint`/`setCenterPoint` references not fully removed
  - Needs systematic replacement of conditional checks

## 🔴 TODO (Critical for UI to work)
1. **Complete AnimationEditor.tsx fixes:**
   - Replace all `=== 'position-relative' || === 'phase-offset-relative'` with `=== 'per-track'`
   - Replace all `=== 'isobarycenter' || === 'centered'` with `=== 'identical'`
   - Remove all `centerPoint` / `setCenterPoint` usage
   - Fix `handleSaveAnimation` to use new mode types

2. **Update parameterHandlers.ts:**
   - Line 32: Update mode check to use 'per-track' instead of old modes

3. **Update saveAnimationHandler.ts:**
   - Migration logic for saving animations with new mode names

4. **Update animationStore.ts playback:**
   - Add `migrateMultiTrackMode()` call when loading animations
   - Update runtime calculations to use new mode names

5. **Simplify animation models (25 files):**
   - Example: `circular.ts` lines 114-131
   - Remove 5-way conditional (centered/isobarycenter/position-relative/phase-offset-relative)
   - Replace with simple: `if (context?.trackOffset) { offset center }`

## 📊 Files Modified So Far
- ✅ `/src/types/index.ts` - Animation interface
- ✅ `/src/animations/strategies/MultiTrackStrategy.ts` - NEW
- ✅ `/src/utils/multiTrackPathGeneration.ts` - 216 → 60 lines
- ✅ `/src/components/animation-editor/utils/compatibility.ts` - 62 → 40 lines
- ✅ `/src/components/animation-editor/components/controls/MultiTrackModeSelector.tsx` - Rewritten
- ✅ `/src/stores/animationEditorStoreV2.ts` - Types + migration
- ⚠️ `/src/components/animation-editor/AnimationEditor.tsx` - Partial, broken

## 🎯 Quick Fix Commands (Run in order)

```bash
# 1. Fix AnimationEditor.tsx mode comparisons
cd /home/dewi/Github/holophonix-animator

# Replace old mode checks with new ones
sed -i "s/multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative'/multiTrackMode === 'per-track'/g" src/components/animation-editor/AnimationEditor.tsx
sed -i "s/multiTrackMode === 'isobarycenter'/multiTrackMode === 'identical'/g" src/components/animation-editor/AnimationEditor.tsx  
sed -i "s/multiTrackMode === 'centered'/multiTrackMode === 'identical'/g" src/components/animation-editor/AnimationEditor.tsx

# Remove centerPoint usage (manual edit required for complex cases)
# - Line 267: Remove centerPoint check
# - Line 296: Remove centerPoint from deps
# - Lines 621, 694-695, 989, 992: Remove setCenterPoint calls
# - Line 888-891: Remove centerPoint props from AnimationSettingsPanel

# 2. Fix parameterHandlers.ts  
sed -i "s/'position-relative' || multiTrackMode === 'phase-offset-relative' || multiTrackMode === 'isobarycenter'/'per-track'/g" src/components/animation-editor/handlers/parameterHandlers.ts

# 3. Test build
npm run build
```

## 💡 Why Migration Incomplete

The codebase has string literal mode checks scattered across 10+ files. Converting all requires:
1. Systematic regex replacement for each comparison pattern
2. Removing centerPoint feature entirely  
3. Updating all components that pass multiTrackMode props
4. Model simplification (25 files, ~100 conditionals to remove)

**Estimated**: 2-3 hours to complete full migration + testing

## 🚀 Benefits When Complete
- **-60% multi-track code** (200+ conditionals → 40 strategy calls)
- **3 clear modes** instead of 6 confusing ones
- **Easier to extend** (add mode = new strategy class)
- **Testable** (unit test each strategy)
- **No more sync bugs** between old/new mode names
