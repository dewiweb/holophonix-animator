# Multi-Track Mode Migration Status (2-Mode Architecture)

## ✅ COMPLETED (Latest: Nov 10, 2025 - 7:55am)
1. **Type Definitions** - Updated to 2-mode architecture (relative + barycentric with variants)
   - `/src/types/index.ts` - Animation interface with barycentricVariant
   - `/src/models/types.ts` - Model types updated
2. **All 24 Animation Models** - Refactored to new architecture
   - `/src/models/builtin/*.ts` - supportedModes, supportedBarycentricVariants
   - Calculate functions updated with consistent multi-track handling
3. **Strategy Pattern** - `/src/animations/strategies/MultiTrackStrategy.ts` 
   - 2 strategies: RelativeStrategy, BarycentricStrategy
   - Migration helper for old 6-mode → new 2-mode system
4. **OSC Optimizer** - `/src/utils/oscMessageOptimizer.ts` updated
5. **UI Components**
   - `MultiTrackModeSelector.tsx` - Rebuilt with variant selector
   - `animationEditorStoreV2.ts` - **FULLY UPDATED** with barycentric variants
6. **Animation Stores**
   - `/src/stores/animationStore.ts` - Partially updated (context includes barycentricVariant)
   - `/src/stores/animationEditorStoreV2.ts` - **FULLY UPDATED** with all new actions
7. **Three.js Scene** - Enhanced lighting and dark grey background
8. **Documentation** - Created `/docs/MULTI_TRACK_ARCHITECTURE.md` and `/docs/MODEL_DEFINITION_STANDARD.md`

## ⚠️ IN PROGRESS
- **AnimationEditor.tsx** - Contains old 3-mode references (shared/relative/formation)
- **AnimationStore.ts** - Needs complete integration with BarycentricStrategy
- **saveAnimationHandler.ts** - Needs update for new mode system
- **UI Components** - Various components still reference old modes

## 🔴 TODO (Critical for App to Work)
1. **Update AnimationEditor.tsx:**
   - Replace `'shared'` → `'barycentric'` + `variant:'shared'`
   - Replace `'formation'` → `'barycentric'` + `variant:'isobarycentric'`
   - Keep `'relative'` as is
   - Add barycentricVariant state and handlers
   - Update getCompatibleModes logic

2. **Update saveAnimationHandler.ts:**
   - Use MultiTrackStrategy to calculate track parameters
   - Pass barycentricVariant to strategy
   - Store barycentricVariant in saved animations

3. **Complete animationStore.ts integration:**
   - Import and use getMultiTrackStrategy
   - Calculate track parameters using strategy.getTrackParameters
   - Pass barycentricVariant to context

4. **Update remaining UI components:**
   - UnifiedThreeJsEditor.tsx
   - useTrackVisualization.ts
   - trackPositionHandler.ts
   - All references to old 'shared'/'formation' modes

5. **Add project migration on load:**
   - Call migrateMultiTrackMode() when loading old projects
   - Convert 6-mode → 2-mode + variant automatically
   - Save migrated projects in new format

## 📊 Files Modified (2-Mode Architecture)
- ✅ `/src/types/index.ts` - Animation interface + barycentricVariant
- ✅ `/src/models/types.ts` - Model types updated
- ✅ `/src/models/builtin/*.ts` (24 files) - All models refactored
- ✅ `/src/animations/strategies/MultiTrackStrategy.ts` - 2 strategies + migration
- ✅ `/src/utils/oscMessageOptimizer.ts` - Updated optimize() signature
- ✅ `/src/components/animation-editor/components/controls/MultiTrackModeSelector.tsx` - Rebuilt with variants
- ✅ `/src/stores/animationStore.ts` - Partially updated (context includes barycentricVariant)
- ✅ `/src/components/animation-editor/components/threejs-editor/hooks/useControlPointScene.ts` - Scene styling
- ⚠️ `/src/components/animation-editor/AnimationEditor.tsx` - Needs update
- ⚠️ `/src/components/animation-editor/handlers/saveAnimationHandler.ts` - Needs update
- ⚠️ Other UI components - Need updates

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

## 💡 Current Architecture

**New 2-Mode System:**
- `relative`: Each track independent (offset by track.position)
- `barycentric`: Formation around center with variants:
  - `shared`: All tracks identical (zero offsets) - replaces old 'identical'
  - `isobarycentric`: Auto-calculated center, preserves offsets - replaces old 'isobarycenter'
  - `centered`: User-defined center, preserves offsets - replaces old 'centered'
  - `custom`: Advanced user control

**Migration Map:**
```
'identical' → 'barycentric' + variant:'shared'
'phase-offset' → 'barycentric' + variant:'shared' + phaseOffsetSeconds
'position-relative' → 'relative'
'phase-offset-relative' → 'relative' + phaseOffsetSeconds
'isobarycenter'/'formation' → 'barycentric' + variant:'isobarycentric'
'centered' → 'barycentric' + variant:'centered'
'shared' (old 3-mode) → 'barycentric' + variant:'shared'
```

**Estimated Time to Complete**: 3-4 hours
- AnimationEditor.tsx updates: 1 hour
- Handler and store updates: 1.5 hours  
- UI component updates: 1 hour
- Testing: 0.5 hour

## 🚀 Benefits of 2-Mode Architecture
- **Simpler mental model**: 2 base modes vs 6 confusing ones
- **More extensible**: Easy to add new barycentric variants (random, orbiting, etc.)
- **Type-safe**: Compile-time validation
- **Cleaner code**: Fewer conditionals, clear separation
- **Future-ready**: User-created models will follow same standard
