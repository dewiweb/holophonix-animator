# Animation Editor Refactoring Opportunities

**Current Size**: 983 lines  
**Goal**: Break down into smaller, focused components

---

## 🎯 **Current State**

The `AnimationEditor.tsx` is a large container component that handles:
1. **State management** (now mostly delegated to Zustand stores ✅)
2. **Event handlers** (10+ handler functions)
3. **Render logic** (600+ lines of JSX)
4. **Multiple UI sections** that could be independent components

---

## 📊 **Size Breakdown**

| Section | Lines | Extractable? |
|---------|-------|-------------|
| **Imports & Setup** | 1-100 | ❌ (necessary) |
| **Store hooks & state** | 101-180 | ❌ (necessary) |
| **Event handlers** | 181-545 | ⚠️ (some can move) |
| **Render functions** | 546-627 | ✅ **YES** |
| **Main JSX** | 628-983 | ✅ **YES** |

---

## 🔧 **Refactoring Opportunities**

### **1. Extract Top Toolbar Section** ⭐ **HIGH PRIORITY**
**Lines**: ~635-750 (115 lines)  
**Savings**: ~115 lines

**Current Structure:**
```tsx
// Lines 635-750
<div className="flex flex-wrap items-center gap-3 mb-6">
  {/* Work pane toggle (Preview / Control Points) */}
  <div className="flex items-center gap-2 bg-white border...">
    <button onClick={() => setActiveWorkPane('preview')}>3D Preview</button>
    <button onClick={() => setActiveWorkPane('control')}>Control Points</button>
  </div>

  {/* Animation control buttons */}
  <div className="flex-1 flex justify-center">
    <AnimationControlButtons ... />
    
    {/* Track locking checkbox - 30 lines */}
    <div className="mb-3 p-3 bg-gray-50 rounded-md...">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={lockTracks}... />
        <span>Lock tracks to this animation</span>
      </label>
      {/* Conditional messages */}
    </div>

    {/* Action buttons */}
    <div className="flex gap-2">
      <button onClick={() => setShowAnimationLibrary(true)}>Load Animation</button>
      <button onClick={onSaveAnimation}>Save Animation</button>
    </div>
  </div>

  {/* Toggle form panel button */}
  <button onClick={() => setIsFormPanelOpen(!isFormPanelOpen)}>
    {isFormPanelOpen ? <PanelRightClose/> : <PanelRightOpen/>}
  </button>
</div>
```

**Proposed Component:**
```tsx
// components/animation-editor/components/toolbar/AnimationEditorToolbar.tsx
interface AnimationEditorToolbarProps {
  // Work pane
  activeWorkPane: 'preview' | 'control'
  supportsControlPoints: boolean
  onWorkPaneChange: (pane: 'preview' | 'control') => void
  
  // Preview controls
  previewMode: boolean
  isAnimationPlaying: boolean
  hasAnimation: boolean
  onTogglePreview: () => void
  onPlay: () => void
  onStop: () => void
  
  // Preset controls
  onLoadPreset: () => void
  onSaveAsPreset: () => void
  canSavePreset: boolean
  
  // Track locking
  lockTracks: boolean
  onLockTracksChange: (locked: boolean) => void
  selectedTrackCount: number
  
  // Actions
  onLoadAnimation: () => void
  onSaveAnimation: () => void
  canSave: boolean
  
  // Form panel
  isFormPanelOpen: boolean
  onToggleFormPanel: () => void
}

export const AnimationEditorToolbar: React.FC<AnimationEditorToolbarProps> = ({ ... }) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <WorkPaneToggle ... />
      <PreviewControls ... />
      <TrackLockingOption ... />
      <ActionButtons ... />
      <FormPanelToggle ... />
    </div>
  )
}
```

**Benefits:**
- ✅ Removes 115 lines from main file
- ✅ Can be further split into sub-components
- ✅ Easier to test
- ✅ Better separation of concerns

---

### **2. Extract Settings Panel** ⭐⭐ **HIGHEST PRIORITY**
**Lines**: ~766-930 (164 lines)  
**Savings**: ~164 lines

**Current Structure:**
```tsx
// Lines 766-930
<div className="lg:w-4/12 bg-white rounded-lg shadow-sm border border-gray-200 p-6...">
  <h2>Animation Settings</h2>
  
  <SelectedTracksIndicator ... />
  
  {selectedTrackIds.length > 1 && <MultiTrackModeSelector ... />}
  
  {/* Animation Name Input - 10 lines */}
  <div>
    <label>Animation Name</label>
    <input value={animationForm.name}... />
  </div>
  
  <ModelSelector ... />
  {!selectedModel && <AnimationTypeSelector ... />}
  
  {/* Duration Input - 15 lines */}
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
    <div>
      <label>Duration (seconds)</label>
      <input type="number" value={animationForm.duration}... />
    </div>
    
    {/* Loop Toggle - 20 lines */}
    <div className="flex items-center justify-between bg-gray-50...">
      <label>Loop</label>
      <input type="checkbox" checked={animationForm.loop}... />
    </div>
  </div>
  
  {/* Ping-Pong Toggle - 20 lines */}
  {animationForm.loop && (
    <div className="flex items-center justify-between bg-blue-50...">
      <label>Ping-Pong Mode</label>
      <input type="checkbox" checked={animationForm.pingPong}... />
    </div>
  )}
  
  {/* Parameters Section */}
  <div>
    <h3>Animation Parameters</h3>
    <button onClick={onUseTrackPosition}>Use Track Position</button>
    <button onClick={() => resetToDefaults(selectedTrack)}>Reset to Defaults</button>
    
    <ModelParametersForm ... />
  </div>
</div>
```

**Proposed Component:**
```tsx
// components/animation-editor/components/settings/AnimationSettingsPanel.tsx
interface AnimationSettingsPanelProps {
  // Track selection
  selectedTracks: Track[]
  activeEditingTrackIds: string[]
  multiTrackMode: string
  onReorderTracks: (ids: string[]) => void
  onSetActiveTracks: (ids: string[]) => void
  
  // Multi-track
  phaseOffsetSeconds: number
  centerPoint: Position | null
  onModeChange: (mode: string) => void
  onPhaseOffsetChange: (seconds: number) => void
  onCenterPointChange: (point: Position | null) => void
  
  // Form data
  animationForm: AnimationForm
  onUpdateForm: (updates: Partial<AnimationForm>) => void
  
  // Model selection
  selectedModel: AnimationModel | null
  onModelSelect: (model: AnimationModel | null) => void
  onTypeChange: (type: AnimationType) => void
  
  // Parameters
  onParameterChange: (key: string, value: any) => void
  onUseTrackPosition: () => void
  onResetToDefaults: () => void
  
  // UI
  onClose?: () => void // For mobile
}

export const AnimationSettingsPanel: React.FC<AnimationSettingsPanelProps> = ({ ... }) => {
  return (
    <div className="lg:w-4/12 bg-white rounded-lg shadow-sm border border-gray-200 p-6...">
      <PanelHeader onClose={onClose} />
      
      <div className="space-y-4">
        <SelectedTracksIndicator ... />
        
        {selectedTracks.length > 1 && <MultiTrackModeSelector ... />}
        
        <AnimationNameInput ... />
        <AnimationTypeSelection ... />
        <AnimationTimingControls ... />
        <AnimationParametersSection ... />
      </div>
    </div>
  )
}
```

**Benefits:**
- ✅ Removes 164 lines from main file
- ✅ Highly reusable (could be used in other editors)
- ✅ Can be further split into sub-sections
- ✅ Easier to test form inputs

**Can be further split into:**
- `AnimationNameInput.tsx` (10 lines)
- `AnimationTimingControls.tsx` (loop, pingpong, duration - 55 lines)
- `AnimationParametersSection.tsx` (parameters form wrapper - 30 lines)

---

### **3. Extract Main Layout Component** ⭐ **MEDIUM PRIORITY**
**Lines**: ~752-983 (231 lines)  
**Savings**: ~100 lines (after extracting sub-components)

**Current Structure:**
```tsx
// Lines 752-983
<div className="flex flex-1 flex-col gap-6 overflow-hidden">
  {isFormPanelOpen ? (
    <div className="flex flex-1 flex-col lg:flex-row gap-6 overflow-hidden">
      {/* Work pane (preview or control points) */}
      <div className="flex-1 min-w-0 bg-white...">
        <div className="flex items-center justify-between border-b...">
          <p>{activeWorkPane === 'preview' ? '3D preview...' : 'Adjust control points...'}</p>
        </div>
        <div className="flex-1 overflow-hidden">
          {activeWorkPane === 'preview' ? previewPane : controlPaneContent}
        </div>
      </div>
      
      {/* Settings Panel - see #2 above */}
      <AnimationSettingsPanel ... />
    </div>
  ) : (
    {/* Full-width work pane when panel closed */}
    <div className="flex-1 bg-white...">
      {activeWorkPane === 'preview' ? previewPane : controlPaneContent}
    </div>
  )}
</div>

{/* Modals */}
<PresetBrowser ... />
<PresetNameDialog ... />
<AnimationLibrary ... />
```

**Proposed Component:**
```tsx
// components/animation-editor/components/layout/AnimationEditorLayout.tsx
interface AnimationEditorLayoutProps {
  activeWorkPane: 'preview' | 'control'
  isFormPanelOpen: boolean
  previewContent: React.ReactNode
  controlContent: React.ReactNode
  settingsPanel: React.ReactNode
}

export const AnimationEditorLayout: React.FC<AnimationEditorLayoutProps> = ({ ... }) => {
  const workPaneContent = activeWorkPane === 'preview' ? previewContent : controlContent
  
  return (
    <div className="flex flex-1 flex-col gap-6 overflow-hidden">
      {isFormPanelOpen ? (
        <SplitLayout workPane={workPaneContent} settingsPanel={settingsPanel} />
      ) : (
        <FullWidthLayout workPane={workPaneContent} />
      )}
    </div>
  )
}
```

**Benefits:**
- ✅ Separates layout logic from business logic
- ✅ Easier to change layout (e.g., vertical split)
- ✅ More testable

---

### **4. Create Custom Hooks** ⚠️ **OPTIONAL**
**Lines**: Various  
**Savings**: ~50 lines

**Current Handlers:**
```tsx
// Lines 269-545
const handleAnimationTypeChange = (type: AnimationType) => { ... } // 35 lines
const onParameterChange = (key: string, value: any) => { ... } // 103 lines
const onUseTrackPosition = () => { ... } // 10 lines
const onSaveAnimation = () => { ... } // 32 lines
const handlePlayPreview = () => { ... } // 18 lines
const handleStopAnimation = () => { ... } // 3 lines
const handleLoadPreset = (preset: any) => { ... } // 12 lines
const handleSaveAsPreset = () => { ... } // 6 lines
const handleLoadAnimation = (animation: Animation) => { ... } // 16 lines
const handleConfirmPresetSave = (presetName: string, description: string) => { ... } // 21 lines
```

**Could Extract:**
```tsx
// hooks/useAnimationEditorActions.ts
export const useAnimationEditorActions = () => {
  // ... all handlers here
  return {
    handleAnimationTypeChange,
    onParameterChange,
    onUseTrackPosition,
    onSaveAnimation,
    handlePlayPreview,
    handleStopAnimation,
    handleLoadPreset,
    handleSaveAsPreset,
    handleLoadAnimation,
    handleConfirmPresetSave
  }
}
```

**Note:** This might not reduce lines significantly and could reduce readability. Consider only if handlers become more complex.

---

### **5. Extract "No Tracks Selected" Empty State** ⭐ **LOW PRIORITY**
**Lines**: ~611-627 (16 lines)  
**Savings**: ~16 lines

**Current Structure:**
```tsx
if (!selectedTrack) {
  return (
    <div className="h-full flex flex-col">
      <h1>Animation Editor</h1>
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Target className="w-16 h-16 mx-auto" />
          <h3>No Tracks Selected</h3>
          <p>Select one or more tracks from the track list to create animations</p>
          <p>💡 Tip: Use checkboxes or hold Ctrl while clicking...</p>
        </div>
      </div>
    </div>
  )
}
```

**Proposed Component:**
```tsx
// components/animation-editor/components/EmptyState.tsx
export const AnimationEditorEmptyState: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Animation Editor</h1>
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tracks Selected</h3>
          <p className="text-gray-600 mb-2">Select one or more tracks from the track list to create animations</p>
          <p className="text-sm text-gray-500">💡 Tip: Use checkboxes or hold Ctrl while clicking to select multiple tracks</p>
        </div>
      </div>
    </div>
  )
}
```

---

## 📋 **Refactoring Plan - Recommended Order**

### **Phase 1: High-Value Extractions** (Removes ~280 lines)
1. ✅ **Extract AnimationSettingsPanel** (~164 lines saved)
2. ✅ **Extract AnimationEditorToolbar** (~115 lines saved)
3. ✅ **Extract AnimationEditorEmptyState** (~16 lines saved)

### **Phase 2: Further Decomposition** (Optional, removes ~70 more lines)
4. ⚠️ **Split AnimationSettingsPanel** into sub-components:
   - `AnimationNameInput.tsx` (~10 lines)
   - `AnimationTimingControls.tsx` (~55 lines)
   - `AnimationParametersSection.tsx` (~30 lines)

5. ⚠️ **Split AnimationEditorToolbar** into sub-components:
   - `WorkPaneToggle.tsx` (~25 lines)
   - `TrackLockingOption.tsx` (~30 lines)
   - `AnimationActionButtons.tsx` (~15 lines)

### **Phase 3: Layout Abstraction** (Optional)
6. ⚠️ **Extract AnimationEditorLayout** (~50 lines saved)

---

## 📊 **Expected Results**

### **After Phase 1:**
- **AnimationEditor.tsx**: ~700 lines (down from 983)
- **New Components**: 3 files (~280 lines extracted)
- **Total Code**: Same, but better organized

### **After All Phases:**
- **AnimationEditor.tsx**: ~550-600 lines
- **New Components**: 8-10 files
- **Better Structure**: More testable, reusable, maintainable

---

## 🎯 **Immediate Recommendation**

**Start with Phase 1, Item #1: AnimationSettingsPanel**

**Why:**
- Largest single extraction (164 lines)
- Highly self-contained (all props are already well-defined)
- Clear boundaries (entire right panel)
- Immediate readability improvement
- Can be tested independently

**Effort:** ~30-45 minutes  
**Impact:** Reduces main file by 17%  
**Risk:** Low (clear interface, no complex dependencies)

---

## 📝 **Notes**

### **What NOT to Extract:**
- ❌ **Store hooks** - Keep in main component (lines 44-99)
- ❌ **syncMultiTrackParameters helper** - Keep in main (used by multiple handlers)
- ❌ **useMemo hooks** - Keep in main (derived state from stores)
- ❌ **Effect hooks** - Keep in main (parameter loading, type changes)

### **Why Keep Main Component Large-ish?**
The AnimationEditor is a **container/smart component**:
- Coordinates multiple concerns (tracks, animations, preview, settings)
- Manages complex state transitions (multi-track modes, parameter sync)
- Acts as the "glue" between stores and UI components

A well-structured container of 550-600 lines is acceptable if:
- ✅ Presentational logic is extracted to components
- ✅ Complex forms are split out
- ✅ Layout is abstracted
- ✅ Business logic is clear and well-commented

---

## 🚀 **Implementation Template**

### **Step 1: Create AnimationSettingsPanel**

```bash
# Create new component file
touch src/components/animation-editor/components/settings/AnimationSettingsPanel.tsx

# Create index for exports
touch src/components/animation-editor/components/settings/index.ts
```

### **Step 2: Move JSX**
1. Copy lines 766-930 to new file
2. Extract props from parent context
3. Add proper TypeScript interfaces
4. Import necessary components

### **Step 3: Update AnimationEditor**
1. Import new component
2. Replace JSX with `<AnimationSettingsPanel {...props} />`
3. Verify all props are passed
4. Test functionality

### **Step 4: Test**
1. All form inputs work
2. Multi-track mode switches correctly
3. Parameters update properly
4. Mobile responsive behavior maintained

---

## ✅ **Success Criteria**

After refactoring:
- ✅ AnimationEditor.tsx < 700 lines (from 983)
- ✅ All existing functionality works
- ✅ No TypeScript errors
- ✅ Tests pass
- ✅ Code is more maintainable
- ✅ Components are reusable

---

**Ready to start?** I recommend beginning with **AnimationSettingsPanel** extraction. Let me know if you'd like me to implement it!
