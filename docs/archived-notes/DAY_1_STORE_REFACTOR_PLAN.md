# Day 1: Animation Editor Store Refactoring

**Date**: November 7, 2025  
**Goal**: Transform `animationEditorStore` from "backup" pattern to "primary" state management  
**Estimated Time**: 6-8 hours  
**Status**: 🟡 In Progress

---

## 🎯 Objective

Replace scattered `useState` hooks in `AnimationEditor.tsx` with centralized Zustand store.

### **Pattern Change**

**Before** (Backup Pattern):
```typescript
// AnimationEditor.tsx
const [animationForm, setAnimationForm] = useState({})
const [keyframes, setKeyframes] = useState([])
const [multiTrackMode, setMultiTrackMode] = useState('position-relative')
// ... 15+ useState hooks

// On unmount
editorStore.saveEditorState({ animationForm, keyframes, ... })

// On mount
const restored = editorStore.savedFormState
setAnimationForm(restored || defaults)
```

**After** (Primary Pattern):
```typescript
// AnimationEditor.tsx
const {
  animationForm,
  keyframes,
  multiTrackMode,
  setAnimationType,
  updateParameter,
  setMultiTrackMode
} = useAnimationEditorStore()

// State always lives in store
// No save/restore needed
```

---

## 📊 Current State Analysis

### **Current Store** (`animationEditorStore.ts` - 89 lines)
```typescript
interface AnimationEditorState {
  // Backup fields
  savedFormState: Partial<Animation> | null
  savedKeyframes: Keyframe[]
  savedOriginalParams: any | null
  savedMultiTrackMode: '...'
  savedPhaseOffsetSeconds: number
  savedCenterPoint: { x: number; y: number; z: number }
  savedMultiTrackParameters: Record<string, any>
  savedActiveEditingTrackIds: string[]
  savedLoadedAnimationId: string | null
  
  // Actions (only 3)
  saveEditorState: (state: {...}) => void
  clearEditorState: () => void
  hasRestoredState: () => boolean
}
```

### **Current Component State** (`AnimationEditor.tsx` - Lines 52-66)
```typescript
// UI State
const [previewMode, setPreviewMode] = useState(false)
const [showPresetBrowser, setShowPresetBrowser] = useState(false)
const [showPresetNameDialog, setShowPresetNameDialog] = useState(false)
const [showAnimationLibrary, setShowAnimationLibrary] = useState(false)
const [activeWorkPane, setActiveWorkPane] = useState<'preview' | 'control'>('preview')
const [isFormPanelOpen, setIsFormPanelOpen] = useState(false)

// Form State (from useAnimationForm hook)
const [animationForm, setAnimationForm] = useState({...})
const [keyframes, setKeyframes] = useState([])
const [originalAnimationParams, setOriginalAnimationParams] = useState(null)

// Multi-Track State
const [loadedAnimationId, setLoadedAnimationId] = useState<string | null>(null)
const [multiTrackMode, setMultiTrackMode] = useState('position-relative')
const [phaseOffsetSeconds, setPhaseOffsetSeconds] = useState(0.5)
const [centerPoint, setCenterPoint] = useState({ x: 0, y: 0, z: 0 })
const [activeEditingTrackIds, setActiveEditingTrackIds] = useState<string[]>([])
const [multiTrackParameters, setMultiTrackParameters] = useState<Record<string, any>>({})
const [selectedModel, setSelectedModel] = useState<AnimationModel | null>(null)
const [lockTracks, setLockTracks] = useState(false)
```

**Total**: ~15 useState hooks to migrate

---

## 🏗️ New Store Structure

### **Interface Design**

```typescript
interface AnimationEditorState {
  // ============================================
  // FORM STATE (Core Animation Data)
  // ============================================
  animationForm: Partial<Animation>
  keyframes: Keyframe[]
  originalAnimationParams: any | null
  selectedModel: AnimationModel | null
  loadedAnimationId: string | null
  
  // ============================================
  // MULTI-TRACK STATE
  // ============================================
  multiTrackMode: 'identical' | 'phase-offset' | 'position-relative' | 
                  'phase-offset-relative' | 'isobarycenter' | 'centered'
  phaseOffsetSeconds: number
  centerPoint: Position
  multiTrackParameters: Record<string, any>
  activeEditingTrackIds: string[]
  lockTracks: boolean
  
  // ============================================
  // UI STATE
  // ============================================
  previewMode: boolean
  showPresetBrowser: boolean
  showPresetNameDialog: boolean
  showAnimationLibrary: boolean
  activeWorkPane: 'preview' | 'control'
  isFormPanelOpen: boolean
  
  // ============================================
  // COMPUTED/DERIVED STATE (Getters)
  // ============================================
  isDirty: () => boolean
  canSave: () => boolean
  hasUnsavedChanges: () => boolean
  
  // ============================================
  // FORM ACTIONS
  // ============================================
  setAnimationForm: (form: Partial<Animation>) => void
  updateAnimationForm: (updates: Partial<Animation>) => void
  setAnimationType: (type: AnimationType) => void
  updateParameter: (key: string, value: any) => void
  updateParameters: (params: Record<string, any>) => void
  resetToDefaults: (track?: Track) => void
  loadAnimation: (animation: Animation) => void
  clearForm: () => void
  
  // ============================================
  // KEYFRAME ACTIONS
  // ============================================
  setKeyframes: (keyframes: Keyframe[]) => void
  addKeyframe: (keyframe: Keyframe) => void
  updateKeyframe: (id: string, updates: Partial<Keyframe>) => void
  deleteKeyframe: (id: string) => void
  
  // ============================================
  // MULTI-TRACK ACTIONS
  // ============================================
  setMultiTrackMode: (mode: ...) => void
  setPhaseOffsetSeconds: (seconds: number) => void
  setCenterPoint: (point: Position) => void
  setMultiTrackParameters: (params: Record<string, any>) => void
  updateMultiTrackParameter: (trackId: string, key: string, value: any) => void
  setActiveEditingTrackIds: (ids: string[]) => void
  setLockTracks: (lock: boolean) => void
  
  // ============================================
  // UI ACTIONS
  // ============================================
  setPreviewMode: (mode: boolean) => void
  setShowPresetBrowser: (show: boolean) => void
  setShowPresetNameDialog: (show: boolean) => void
  setShowAnimationLibrary: (show: boolean) => void
  setActiveWorkPane: (pane: 'preview' | 'control') => void
  setIsFormPanelOpen: (open: boolean) => void
  
  // ============================================
  // UTILITY ACTIONS
  // ============================================
  reset: () => void  // Reset to initial state
  getState: () => AnimationEditorState  // Get current state snapshot
}
```

---

## 📝 Implementation Steps

### **Step 1: Create New Store File** ✅
- [x] Create `/src/stores/animationEditorStoreV2.ts`
- [x] Define full state interface
- [x] Add all action methods
- [x] Add computed getters

### **Step 2: Implement State Logic** 🟡
- [ ] Basic state setters
- [ ] Form update logic
- [ ] Multi-track coordination
- [ ] Validation logic
- [ ] Default parameter generation

### **Step 3: Write Tests** ⏳
- [ ] Test file: `/src/stores/__tests__/animationEditorStore.test.ts`
- [ ] Test state initialization
- [ ] Test all action methods
- [ ] Test computed values
- [ ] Test edge cases

### **Step 4: Migration Guide** ⏳
- [ ] Document API changes
- [ ] Create migration checklist for Day 2
- [ ] Update architecture docs

---

## 🧪 Testing Strategy

### **Test Coverage Goals**
- ✅ 100% of action methods
- ✅ All state transitions
- ✅ Computed value accuracy
- ✅ Edge cases (null, undefined, empty)

### **Test Structure**
```typescript
describe('AnimationEditorStore', () => {
  describe('Form State', () => {
    it('should initialize with defaults')
    it('should update animation form')
    it('should update single parameter')
    it('should reset to defaults')
  })
  
  describe('Multi-Track State', () => {
    it('should change multi-track mode')
    it('should update phase offset')
    it('should set center point')
  })
  
  describe('Computed Values', () => {
    it('should detect dirty state')
    it('should validate save capability')
  })
})
```

---

## 📦 Deliverables

**At end of Day 1**:
1. ✅ `/src/stores/animationEditorStoreV2.ts` - New primary store
2. ✅ `/src/stores/__tests__/animationEditorStore.test.ts` - Full test coverage
3. ✅ This migration plan updated with results
4. ✅ Ready for Day 2 component migration

---

## 🎯 Success Criteria

- [ ] All 15+ useState hooks have store equivalents
- [ ] All action methods implemented
- [ ] 100% test coverage
- [ ] Zero TypeScript errors
- [ ] Tests passing
- [ ] Documentation complete

---

## ⏱️ Time Tracking

| Task | Estimated | Actual | Status |
|------|-----------|--------|--------|
| Plan & Design | 1h | - | 🟡 In Progress |
| Implement Store | 3h | - | ⏳ Pending |
| Write Tests | 2h | - | ⏳ Pending |
| Documentation | 1h | - | ⏳ Pending |
| **Total** | **7h** | **-** | **-** |

---

## 📌 Notes

- Keep backward compatibility during transition
- Old store (`animationEditorStore.ts`) stays until Day 2 complete
- New store (`animationEditorStoreV2.ts`) ready for gradual adoption
- Can test new store without breaking existing functionality

---

**Next**: Implement the new store! 🚀
