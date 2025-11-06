# Day 4 Plan: Hybrid Sprint - Validation & Critical Fixes

**Date**: 2024-11-06  
**Sprint Day**: 4 of 7  
**Approach**: Path C (Hybrid)  
**Goals**: Fix tab switching + Validate all 24 animation types

---

## 🎯 **Day 4 Objectives**

### **Primary Goals**
1. ✅ Fix tab switching issue (editor state persists)
2. ✅ Test all 24 animation types (rapid validation)
3. ✅ Document which types work vs broken
4. ✅ Create issue list for Day 5

### **Success Criteria**
- ✅ Can switch tabs without losing editor state
- ✅ Know status of all 24 animation types
- ✅ Clear list of what needs fixing
- ✅ Decision-ready for Day 5

**Estimated Time**: 8 hours (4 morning + 4 afternoon)

---

## 🌅 **Morning Session: Fix Tab Switching (4 hours)**

### **Problem Statement**
When user switches from Animation Editor to Timeline/TrackList and back, the editor form resets, losing work.

**Root Cause**: Component unmounts when React Router switches tabs.

### **Solution: Editor State Store (Proper Fix)**

We'll create a dedicated editor store that persists form state globally.

---

#### **Task 1: Create Editor Store (1 hour)**

**File**: `src/stores/editorStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AnimationType } from '@/types'
import { Position } from '@/types/geometry'

export interface EditorFormState {
  // Animation metadata
  name: string
  type: AnimationType | null
  description: string
  
  // Parameters (varies by type)
  parameters: Record<string, any>
  
  // Multi-track settings
  trackIds: string[]
  multiTrackMode: string
  
  // UI state
  isDirty: boolean
  lastSaved: number | null
}

interface EditorStore {
  // Current form state
  formState: EditorFormState
  
  // Actions
  updateForm: (updates: Partial<EditorFormState>) => void
  resetForm: () => void
  setDirty: (isDirty: boolean) => void
  
  // Autosave
  hasUnsavedChanges: () => boolean
}

const defaultFormState: EditorFormState = {
  name: '',
  type: null,
  description: '',
  parameters: {},
  trackIds: [],
  multiTrackMode: 'identical',
  isDirty: false,
  lastSaved: null,
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      formState: { ...defaultFormState },
      
      updateForm: (updates) => set((state) => ({
        formState: {
          ...state.formState,
          ...updates,
          isDirty: true,
        }
      })),
      
      resetForm: () => set({ 
        formState: { ...defaultFormState } 
      }),
      
      setDirty: (isDirty) => set((state) => ({
        formState: { ...state.formState, isDirty }
      })),
      
      hasUnsavedChanges: () => get().formState.isDirty,
    }),
    {
      name: 'holophonix-editor-state',
      // Only persist form state, not UI state
      partialize: (state) => ({ formState: state.formState }),
    }
  )
)
```

**Checklist**:
- [ ] Create file
- [ ] Add zustand persist for localStorage
- [ ] Include all form fields
- [ ] Add dirty tracking
- [ ] Test store creation

---

#### **Task 2: Update useAnimationForm Hook (1.5 hours)**

**File**: `src/components/animation-editor/hooks/useAnimationForm.ts`

**Changes**:
1. Import `useEditorStore`
2. Initialize from store state
3. Sync changes to store
4. Load animation overrides store state

```typescript
// Add this near the top
const { formState, updateForm, resetForm } = useEditorStore()

// Initialize from store if available
useEffect(() => {
  if (formState.type && !currentAnimation) {
    // Restore from store
    setAnimationForm({
      name: formState.name,
      type: formState.type,
      description: formState.description,
      parameters: formState.parameters,
      // ... other fields
    })
  }
}, [])

// Sync to store on changes
useEffect(() => {
  if (animationForm.type) {
    updateForm({
      name: animationForm.name,
      type: animationForm.type,
      description: animationForm.description,
      parameters: animationForm.parameters,
      trackIds: animationForm.trackIds,
      multiTrackMode: animationForm.multiTrackMode,
    })
  }
}, [animationForm])

// When loading an animation, update store
useEffect(() => {
  if (currentAnimation) {
    updateForm({
      name: currentAnimation.name,
      type: currentAnimation.type,
      // ... etc
    })
  }
}, [currentAnimation?.id])
```

**Checklist**:
- [ ] Import editor store
- [ ] Initialize from store state
- [ ] Sync changes bidirectionally
- [ ] Handle load animation (store > form)
- [ ] Test restoration after tab switch

---

#### **Task 3: Add Unsaved Changes Warning (1 hour)**

**File**: `src/components/animation-editor/AnimationEditor.tsx`

Add warning when navigating away with unsaved changes.

```typescript
import { useEditorStore } from '@/stores/editorStore'

// Inside component
const { hasUnsavedChanges } = useEditorStore()

useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges()) {
      e.preventDefault()
      e.returnValue = ''
    }
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [hasUnsavedChanges])
```

**Optional**: Add visual indicator for unsaved changes
```tsx
{hasUnsavedChanges() && (
  <div className="text-yellow-600 text-sm">
    • Unsaved changes
  </div>
)}
```

**Checklist**:
- [ ] Add beforeunload handler
- [ ] Add visual indicator (optional)
- [ ] Test navigation warning
- [ ] Test tab switch (no warning, just persists)

---

#### **Task 4: Testing & Validation (30 min)**

**Test Scenarios**:
1. Create animation in editor
2. Switch to Timeline tab
3. Switch back to Animation Editor
4. **Expected**: Form state preserved ✅

**Additional Tests**:
- [ ] Switch between all 3 tabs (TrackList, Timeline, Animation Editor)
- [ ] Change animation type, switch tabs, verify persisted
- [ ] Change parameters, switch tabs, verify persisted
- [ ] Load animation, switch tabs, verify persisted
- [ ] Create new animation, verify store cleared appropriately

**If Issues Found**: Debug and fix (budget extra 30 min)

---

### **Morning Session Deliverables**
- ✅ `src/stores/editorStore.ts` created
- ✅ `useAnimationForm` updated
- ✅ Unsaved changes warning added
- ✅ Tab switching works without data loss
- ✅ Committed to git

---

## 🌤️ **Afternoon Session: Rapid Animation Testing (4 hours)**

### **Goal**: Validate all 24 animation types work end-to-end

**Methodology**: Quick smoke test (10-15 min per type)

---

#### **Testing Template (Per Animation Type)**

For each animation:
1. **Select** animation type from dropdown
2. **Verify** parameters appear correctly
3. **Check** 3D preview shows path
4. **Set** basic parameters (use defaults mostly)
5. **Save** animation with test name
6. **Play** animation
7. **Observe** track movement
8. **Stop** animation
9. **Mark** status: ✅ Working / ⚠️ Issues / ❌ Broken

**Time Budget**: 10-15 minutes per type

---

#### **Task 5: Create Testing Spreadsheet (15 min)**

**File**: `docs/DAY_4_ANIMATION_TESTING_RESULTS.md`

Create tracking document:

```markdown
# Day 4: Animation Type Testing Results

**Date**: 2024-11-06
**Tester**: [Your name]
**Method**: Rapid smoke testing

## Testing Matrix

| # | Type | Select | Params | Preview | Save | Play | Track | Status | Notes |
|---|------|--------|--------|---------|------|------|-------|--------|-------|
| 1 | Linear | | | | | | | | |
| 2 | Circular | | | | | | | | |
| 3 | Elliptical | | | | | | | | |
| 4 | Spiral | | | | | | | | |
| 5 | Random | | | | | | | | |
| 6 | Pendulum | | | | | | | | |
| 7 | Bounce | | | | | | | | |
| 8 | Spring | | | | | | | | |
| 9 | Wave | | | | | | | | |
| 10 | Lissajous | | | | | | | | |
| 11 | Helix | | | | | | | | |
| 12 | Bezier | | | | | | | | |
| 13 | Catmull-Rom | | | | | | | | |
| 14 | Zigzag | | | | | | | | |
| 15 | Perlin Noise | | | | | | | | |
| 16 | Rose Curve | | | | | | | | |
| 17 | Epicycloid | | | | | | | | |
| 18 | Orbit | | | | | | | | |
| 19 | Formation | | | | | | | | |
| 20 | Attract/Repel | | | | | | | | |
| 21 | Doppler | | | | | | | | |
| 22 | Circular Scan | | | | | | | | |
| 23 | Zoom | | | | | | | | |
| 24 | Custom | | | | | | | | |

## Status Legend
- ✅ Working: All steps pass, no issues
- ⚠️ Issues: Works but has problems (document in notes)
- ❌ Broken: Cannot complete basic workflow
- ⏸️ Skipped: Intentionally not tested

## Issues Found
[Document any issues discovered]

## Summary
- Total Tested: __/24
- Working: __
- Issues: __
- Broken: __
- Success Rate: __%
```

---

#### **Task 6: Test Basic Animations (1 hour)**

Test animations 1-8:
- Linear ✅ (already tested)
- Circular
- Elliptical
- Spiral
- Random
- Pendulum
- Bounce
- Spring

**Tips**:
- Create one track at (5, 0, 0)
- Use default parameters
- Focus on "does it work" not "is it perfect"
- Note major issues only

---

#### **Task 7: Test Wave & Path Animations (1 hour)**

Test animations 9-17:
- Wave
- Lissajous
- Helix
- Bezier
- Catmull-Rom
- Zigzag
- Perlin Noise
- Rose Curve
- Epicycloid

**Note**: Bezier/Catmull-Rom use control points - verify they appear

---

#### **Task 8: Test Interactive & Spatial (1 hour)**

Test animations 18-24:
- Orbit
- Formation (requires multiple tracks)
- Attract/Repel
- Doppler
- Circular Scan
- Zoom
- Custom

**Note**: Formation requires 2+ tracks selected

---

#### **Task 9: Summarize & Document (45 min)**

**Activities**:
1. Fill in summary statistics
2. Categorize issues by severity:
   - 🔴 Critical: Blocks usage completely
   - 🟡 Major: Works but major problems
   - 🟢 Minor: Small issues, usable
3. Create issue list for Day 5
4. Update `PROJECT_STATUS.md`
5. Commit results

**Output**: `docs/DAY_4_ANIMATION_TESTING_RESULTS.md`

---

### **Afternoon Session Deliverables**
- ✅ All 24 animation types tested
- ✅ Results documented in spreadsheet
- ✅ Issues categorized by severity
- ✅ Day 5 task list created
- ✅ Committed to git

---

## 📊 **End of Day 4 Checklist**

### **Must Complete**
- [ ] Tab switching fixed and tested
- [ ] All 24 animation types tested
- [ ] Results documented
- [ ] Issues list created
- [ ] Code committed

### **Success Metrics**
- ✅ Can switch tabs without data loss
- ✅ Know status of all 24 types
- ✅ Have clear Day 5 priorities
- ✅ 8 hours of focused work completed

### **Decision Ready For Day 5**
Based on results, we'll know:
- How many types are broken (determines Day 5 workload)
- Severity of issues (critical vs minor)
- Whether Day 6 can start Timeline or needs more fixes

---

## 🎯 **Expected Outcomes**

### **Best Case** (Green Light)
- 20-24 types working ✅
- 0-2 broken types ⚠️
- Minor issues only 🟢
- **Ready for Timeline Day 6** 🚀

### **Medium Case** (Yellow Light)
- 15-19 types working ✅
- 3-5 broken types ⚠️
- Some major issues 🟡
- **1 more fix day needed**

### **Worst Case** (Red Light)
- <15 types working ❌
- 6+ broken types 🔴
- Critical issues found
- **Reassess approach**

---

## 🛠️ **Tools & Setup**

### **Before Starting**
```bash
# Ensure clean state
git status

# Create Day 4 branch (optional)
git checkout -b day-4-validation

# Pull latest (if collaborating)
git pull origin V3_dev

# Start dev server
npm run dev
```

### **Testing Checklist**
- [ ] Dev server running
- [ ] Browser console open (check for errors)
- [ ] Testing document open
- [ ] At least 1 track created
- [ ] Timer ready (track time per animation)

---

## 📝 **Progress Tracking**

Use this to track throughout the day:

```markdown
## Morning Progress
- [ ] 9:00 - Task 1: Editor store (1h)
- [ ] 10:00 - Task 2: Update hook (1.5h)
- [ ] 11:30 - Task 3: Unsaved warning (1h)
- [ ] 12:30 - Task 4: Testing (0.5h)
- [ ] 13:00 - Lunch break

## Afternoon Progress
- [ ] 14:00 - Task 5: Setup spreadsheet (0.25h)
- [ ] 14:15 - Task 6: Test basics (1h)
- [ ] 15:15 - Task 7: Test wave/path (1h)
- [ ] 16:15 - Task 8: Test interactive (1h)
- [ ] 17:15 - Task 9: Summarize (0.75h)
- [ ] 18:00 - Day complete! 🎉
```

---

## 🚨 **Contingency Plans**

### **If Morning Takes Longer**
- Skip unsaved changes warning (nice to have)
- Focus on core tab switching fix
- Move testing to full afternoon

### **If Testing Reveals Many Broken Types**
- Document thoroughly
- Don't try to fix today
- Adjust Day 5 plan for more fixes
- May need Day 6 for fixes too

### **If Blocked on Technical Issue**
- Document blocker clearly
- Move to testing (can do in parallel)
- Come back to blocker with fresh eyes

---

## 🎓 **Tips for Success**

### **Morning (Coding)**
- ✅ Focus on one task at a time
- ✅ Test incrementally (don't wait until end)
- ✅ Commit working code frequently
- ✅ Take 5-min breaks between tasks

### **Afternoon (Testing)**
- ✅ Be systematic (don't skip types)
- ✅ Use timer to stay on schedule
- ✅ Document issues immediately
- ✅ Don't try to fix while testing

### **General**
- ✅ Stay hydrated
- ✅ Take lunch break
- ✅ Celebrate small wins
- ✅ End on time (avoid burnout)

---

## 🎉 **End of Day Celebration**

When Day 4 is complete:

1. **Commit everything**:
```bash
git add .
git commit -m "Day 4 complete: Tab switching fixed + All 24 types tested"
git push origin V3_dev
```

2. **Create Day 4 Complete Document**:
- Copy results from testing spreadsheet
- Summarize successes and issues
- Create Day 5 plan based on findings

3. **Take a break!** You've earned it 🎉

---

**Status**: 🟢 Ready to execute Day 4

**Next**: Start morning session - fix tab switching

**Confidence**: High - Clear tasks, realistic time estimates

---

*Good luck! You've got this!* 💪
