# Day 2: Component Migration to New Store

**Date**: November 7, 2025  
**Goal**: Migrate AnimationEditor.tsx to use animationEditorStoreV2  
**Estimated Time**: 6-8 hours  
**Status**: 🟡 Starting

---

## 🎯 Objectives

Transform AnimationEditor.tsx from scattered useState pattern to centralized store pattern:

**Before**:
- 1,114 lines
- 15+ useState hooks
- 10+ useEffect hooks  
- State in 5 places
- Complex save/restore logic

**After**:
- ~400 lines
- 0 useState (use store)
- 2-3 useEffect (focused)
- State in 1 place
- No save/restore needed

---

## 📋 Migration Checklist

### **Phase 1: Switch Import** ✅
- [ ] Change from `useAnimationEditorStore` to `useAnimationEditorStoreV2`
- [ ] Keep old store temporarily for comparison

### **Phase 2: Replace useState Hooks** (15+ hooks)

**Form State**:
- [ ] `animationForm` → `store.animationForm`
- [ ] `setAnimationForm` → `store.setAnimationForm`
- [ ] `keyframes` → `store.keyframes`
- [ ] `setKeyframes` → `store.setKeyframes`
- [ ] `originalAnimationParams` → `store.originalAnimationParams`
- [ ] `selectedModel` → `store.selectedModel`
- [ ] `setSelectedModel` → `store.setSelectedModel`

**Multi-Track State**:
- [ ] `loadedAnimationId` → `store.loadedAnimationId`
- [ ] `multiTrackMode` → `store.multiTrackMode`
- [ ] `setMultiTrackMode` → `store.setMultiTrackMode`
- [ ] `phaseOffsetSeconds` → `store.phaseOffsetSeconds`
- [ ] `setPhaseOffsetSeconds` → `store.setPhaseOffsetSeconds`
- [ ] `centerPoint` → `store.centerPoint`
- [ ] `setCenterPoint` → `store.setCenterPoint`
- [ ] `activeEditingTrackIds` → `store.activeEditingTrackIds`
- [ ] `setActiveEditingTrackIds` → `store.setActiveEditingTrackIds`
- [ ] `multiTrackParameters` → `store.multiTrackParameters`
- [ ] `setMultiTrackParameters` → `store.setMultiTrackParameters`
- [ ] `lockTracks` → `store.lockTracks`
- [ ] `setLockTracks` → `store.setLockTracks`

**UI State**:
- [ ] `previewMode` → `store.previewMode`
- [ ] `setPreviewMode` → `store.setPreviewMode`
- [ ] `showPresetBrowser` → `store.showPresetBrowser`
- [ ] `setShowPresetBrowser` → `store.setShowPresetBrowser`
- [ ] `showPresetNameDialog` → `store.showPresetNameDialog`
- [ ] `setShowPresetNameDialog` → `store.setShowPresetNameDialog`
- [ ] `showAnimationLibrary` → `store.showAnimationLibrary`
- [ ] `setShowAnimationLibrary` → `store.setShowAnimationLibrary`
- [ ] `activeWorkPane` → `store.activeWorkPane`
- [ ] `setActiveWorkPane` → `store.setActiveWorkPane`
- [ ] `isFormPanelOpen` → `store.isFormPanelOpen`
- [ ] `setIsFormPanelOpen` → `store.setIsFormPanelOpen`

### **Phase 3: Remove useAnimationForm Hook**
- [ ] Delete `useAnimationForm` import
- [ ] Remove hook call
- [ ] Use store methods directly:
  - `handleAnimationTypeChange` → `store.setAnimationType`
  - `handleResetToDefaults` → `store.resetToDefaults`

### **Phase 4: Update Action Handlers**

**Parameter Handlers**:
- [ ] `onParameterChange` → Use `store.updateParameter`
- [ ] Update parameter handler imports if needed

**Save Handler**:
- [ ] Pass store state to `handleSaveAnimation`
- [ ] Update to use store actions

**Track Position Handler**:
- [ ] Update to use store state

### **Phase 5: Remove Save/Restore Effects**
- [ ] Delete save-on-unmount effect
- [ ] Delete restore-on-mount effect
- [ ] Delete `hasRestoredRef`
- [ ] Delete `skipFormInitRef`

### **Phase 6: Simplify Effects**

**Keep Only Essential Effects**:
- [ ] Track selection changed → Load animation
- [ ] Multi-track mode changed → Update parameters
- [ ] Remove redundant effects

**Target**: 10+ effects → 2-3 effects

### **Phase 7: Update Component Props**
- [ ] Clean up unused refs
- [ ] Verify all props still work
- [ ] Update JSX to use store

### **Phase 8: Testing**
- [ ] Build compiles
- [ ] Component renders
- [ ] All 24 animation types work
- [ ] Multi-track modes work
- [ ] Save/load works
- [ ] Tab switching works (state persists)

---

## 🔍 Key Code Sections to Update

### **Current Imports** (Lines 1-48)
```typescript
// REMOVE
import { useAnimationEditorStore } from '@/stores/animationEditorStore'
import { useAnimationForm } from './hooks/useAnimationForm'

// ADD
import { useAnimationEditorStoreV2 } from '@/stores/animationEditorStoreV2'
```

### **Current State** (Lines 48-66)
```typescript
// REMOVE ALL useState
const [previewMode, setPreviewMode] = useState(false)
// ... 15+ more

// REPLACE WITH
const {
  animationForm,
  keyframes,
  multiTrackMode,
  // ... all state
  setAnimationType,
  updateParameter,
  // ... all actions
} = useAnimationEditorStoreV2()
```

### **Current useAnimationForm** (Lines 100-109)
```typescript
// REMOVE
const {
  animationForm,
  setAnimationForm,
  keyframes,
  setKeyframes,
  originalAnimationParams,
  setOriginalAnimationParams,
  handleAnimationTypeChange,
  handleResetToDefaults
} = useAnimationForm(selectedTrack, currentAnimation, skipFormInitRef)

// State now comes from store
```

### **Current Effects** (Multiple locations)
```typescript
// REMOVE save/restore effects
useEffect(() => {
  return () => {
    editorStore.saveEditorState({ ... })
  }
}, [...])

// KEEP only essential effects
useEffect(() => {
  // Load animation when track changes
}, [selectedTrack])
```

---

## 📝 Step-by-Step Execution Plan

### **Step 1: Preparation** (30 min)
1. Read entire AnimationEditor.tsx
2. Map all useState to store equivalents
3. Identify effects to remove
4. Create backup if needed

### **Step 2: Basic Migration** (2 hours)
1. Update imports
2. Replace store hook call
3. Remove useState declarations
4. Update all references to use store

### **Step 3: Hook Removal** (1 hour)
1. Remove useAnimationForm
2. Update type change handlers
3. Update reset handlers

### **Step 4: Effect Cleanup** (1.5 hours)
1. Remove save/restore effects
2. Simplify remaining effects
3. Remove unnecessary refs

### **Step 5: Handler Updates** (1.5 hours)
1. Update parameter handlers
2. Update save handler
3. Update track handlers

### **Step 6: Testing** (2 hours)
1. Fix TypeScript errors
2. Test build
3. Manual testing
4. Fix bugs

### **Step 7: Cleanup** (30 min)
1. Remove dead code
2. Update comments
3. Format code
4. Final review

---

## ⚠️ Potential Issues

### **Issue 1: Refs Still Needed?**
- `hasRestoredRef` - DELETE (no restore needed)
- `skipFormInitRef` - DELETE (no restore needed)

### **Issue 2: Effect Dependencies**
Some effects watch state that's now in store. May need to restructure.

### **Issue 3: Handler Signatures**
Some handlers pass state as parameters. May need updates.

---

## 🎯 Success Criteria

- [ ] Build compiles with 0 errors
- [ ] Component renders without crashes
- [ ] All animation types selectable
- [ ] Parameters update correctly
- [ ] Multi-track modes work
- [ ] Save animation works
- [ ] Load animation works
- [ ] Tab switching preserves state (automatic with store)
- [ ] Preview mode works
- [ ] 3D preview works
- [ ] Control point editor works

---

## 📊 Expected Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Lines | 1,114 | ~400 | -714 (-64%) |
| useState | 15+ | 0 | -15 |
| useEffect | 10+ | 2-3 | -7+ |
| State locations | 5 | 1 | Centralized |
| Complexity | High | Low | ✅ |

---

**Ready to start?** Let's go! 🚀
