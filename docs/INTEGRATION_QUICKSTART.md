# Unified Editor Integration - Quick Start

**5-Minute Implementation Guide**

---

## Step 1: Add Import (30 seconds)

**File**: `src/components/animation-editor/AnimationEditor.tsx`

```typescript
// Add to existing imports (line ~14)
import { UnifiedThreeJsEditor } from './components/threejs-editor/UnifiedThreeJsEditor'
```

---

## Step 2: Add Feature Flag (30 seconds)

**File**: `AnimationEditor.tsx` - Inside component, before first hook

```typescript
export const AnimationEditor: React.FC<AnimationEditorProps> = ({ onAnimationSelect }) => {
  // FEATURE FLAG - Easy rollback if needed
  const USE_UNIFIED_EDITOR = true
  
  // ... rest of code
```

---

## Step 3: Create Animation Object (2 minutes)

**File**: `AnimationEditor.tsx` - After all hooks, before render

```typescript
// Create animation object for unified editor
const currentAnimation = useMemo<Animation | null>(() => {
  if (!animationForm.type) return null
  
  return {
    id: loadedAnimationId || `preview-${Date.now()}`,
    name: animationForm.name || 'Untitled Animation',
    type: animationForm.type,
    parameters: animationForm.parameters || {},
    duration: animationForm.duration || 10,
    multiTrackMode: multiTrackMode,
    trackIds: selectedTrackIds,
    state: 'idle' as AnimationState,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}, [animationForm, loadedAnimationId, multiTrackMode, selectedTrackIds])

// Handle updates from unified editor
const handleUnifiedEditorChange = useCallback((updatedAnimation: Animation) => {
  updateParameters(updatedAnimation.parameters)
  if (loadedAnimationId) {
    updateAnimation(loadedAnimationId, updatedAnimation)
  }
}, [loadedAnimationId, updateParameters, updateAnimation])
```

---

## Step 4: Create Unified Pane (1 minute)

**File**: `AnimationEditor.tsx` - After `controlPaneContent` definition

```typescript
// NEW: Unified editor pane (replaces both preview and control panes)
const unifiedPane = (
  <div className="h-full flex flex-col min-h-0">
    <div className="flex-1 min-h-0">
      <UnifiedThreeJsEditor
        animation={currentAnimation}
        selectedTracks={selectedTrackObjects}
        multiTrackMode={multiTrackMode}
        onAnimationChange={handleUnifiedEditorChange}
        readOnly={false}
      />
    </div>
    <div className="border-t border-gray-700 px-4 py-2 bg-gray-800/50 text-xs text-gray-300">
      💡 <kbd className="px-1 bg-gray-700 rounded">Tab</kbd> Preview/Edit | <kbd className="px-1 bg-gray-700 rounded">Q/W/E/R</kbd> Views | <kbd className="px-1 bg-gray-700 rounded">ESC</kbd> Deselect
    </div>
  </div>
)
```

---

## Step 5: Update Render Logic (1 minute)

**File**: `AnimationEditor.tsx` - Find the layout rendering (~line 755)

**FIND** this block:
```typescript
<div className="flex-1 overflow-hidden">
  {activeWorkPane === 'preview' ? previewPane : controlPaneContent}
</div>
```

**REPLACE** with:
```typescript
<div className="flex-1 overflow-hidden">
  {USE_UNIFIED_EDITOR ? unifiedPane : (
    activeWorkPane === 'preview' ? previewPane : controlPaneContent
  )}
</div>
```

**AND** find the dual-pane layout (~line 798):

**FIND**:
```typescript
<div className="flex-1 grid gap-6 lg:grid-cols-2">
  <div className="bg-white rounded-lg ...">
    {/* Preview */}
  </div>
  <div className="bg-white rounded-lg ...">
    {/* Control Points */}
  </div>
</div>
```

**REPLACE** with:
```typescript
{USE_UNIFIED_EDITOR ? (
  <div className="flex-1 bg-gray-900 rounded-lg shadow-sm border border-gray-700 flex flex-col overflow-hidden">
    {unifiedPane}
  </div>
) : (
  <div className="flex-1 grid gap-6 lg:grid-cols-2">
    {/* Old preview/control panes */}
  </div>
)}
```

---

## Step 6: Hide Old Tabs (30 seconds)

**File**: `AnimationEditor.tsx` - Find tab buttons (~line 638)

**FIND**:
```typescript
<div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md p-1 shadow-sm">
  <button onClick={() => setActiveWorkPane('preview')}>
    3D Preview
  </button>
  <button onClick={() => setActiveWorkPane('control')}>
    Control Points
  </button>
</div>
```

**WRAP** with condition:
```typescript
{!USE_UNIFIED_EDITOR && (
  <div className="flex items-center gap-2 ...">
    {/* Tab buttons */}
  </div>
)}
```

---

## Test It! (2 minutes)

1. **Start dev server**: `npm run dev`
2. **Navigate to Animation Editor**
3. **Select a track**
4. **Load an animation** (or create new)
5. **Test keyboard shortcuts**:
   - `Tab` → Toggle Preview/Edit modes
   - `Q` → Perspective view
   - `W` → Top view
   - `E` → Front view
   - `R` → Side view
   - `ESC` → Deselect control point
6. **Test editing**:
   - Switch to Edit mode (Tab)
   - Click a control point (turns yellow)
   - Drag gizmo arrows to move point
   - See path update in real-time!

---

## Rollback (if needed)

**Change one line**:
```typescript
const USE_UNIFIED_EDITOR = false  // Back to old system
```

**That's it!** Old components still work.

---

## Common Issues

### Issue: TypeScript errors on Animation type

**Solution**: Add missing fields to animation object
```typescript
return {
  // ... existing fields ...
  lockedTrackIds: multiTrackMode === 'identical' ? selectedTrackIds : undefined,
  phaseOffset: multiTrackMode.includes('phase-offset') ? phaseOffsetSeconds : undefined,
  centerPoint: multiTrackMode === 'centered' ? centerPoint : undefined,
}
```

### Issue: Control points don't update

**Solution**: Verify `onAnimationChange` callback is called
```typescript
const handleUnifiedEditorChange = (updatedAnimation: Animation) => {
  console.log('Animation updated:', updatedAnimation)  // Add logging
  updateParameters(updatedAnimation.parameters)
}
```

### Issue: Unified editor not showing

**Solution**: Check conditional rendering
```typescript
console.log('USE_UNIFIED_EDITOR:', USE_UNIFIED_EDITOR)
console.log('unifiedPane:', unifiedPane)
```

---

## Next Steps

1. ✅ **Basic integration** (5 minutes) - DONE!
2. ⏳ **Test all features** (30 minutes)
3. ⏳ **Test multi-track modes** (20 minutes)
4. ⏳ **User acceptance testing** (varies)
5. ⏳ **Remove old code** (10 minutes)
6. ⏳ **Update docs** (20 minutes)

---

## Full Example Code

**Complete integration snippet**:

```typescript
export const AnimationEditor: React.FC<AnimationEditorProps> = ({ onAnimationSelect }) => {
  const USE_UNIFIED_EDITOR = true
  
  // ... existing hooks and state ...
  
  // Create animation for unified editor
  const currentAnimation = useMemo<Animation | null>(() => {
    if (!animationForm.type) return null
    return {
      id: loadedAnimationId || `preview-${Date.now()}`,
      name: animationForm.name || 'Untitled',
      type: animationForm.type,
      parameters: animationForm.parameters || {},
      duration: animationForm.duration || 10,
      multiTrackMode,
      trackIds: selectedTrackIds,
      state: 'idle' as AnimationState,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }, [animationForm, loadedAnimationId, multiTrackMode, selectedTrackIds])
  
  // Handle updates
  const handleUnifiedEditorChange = useCallback((updated: Animation) => {
    updateParameters(updated.parameters)
    if (loadedAnimationId) updateAnimation(loadedAnimationId, updated)
  }, [loadedAnimationId, updateParameters, updateAnimation])
  
  // Unified pane
  const unifiedPane = (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <UnifiedThreeJsEditor
          animation={currentAnimation}
          selectedTracks={selectedTrackObjects}
          multiTrackMode={multiTrackMode}
          onAnimationChange={handleUnifiedEditorChange}
        />
      </div>
      <div className="border-t px-4 py-2 bg-gray-800/50 text-xs text-gray-300">
        💡 Tab: Preview/Edit | Q/W/E/R: Views | ESC: Deselect
      </div>
    </div>
  )
  
  // ... existing previewPane and controlPaneContent ...
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {/* Tab buttons (hidden if unified editor) */}
        {!USE_UNIFIED_EDITOR && (
          <div className="flex gap-2">
            <button onClick={() => setActiveWorkPane('preview')}>3D Preview</button>
            <button onClick={() => setActiveWorkPane('control')}>Control Points</button>
          </div>
        )}
        
        {/* ... other controls ... */}
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {USE_UNIFIED_EDITOR ? unifiedPane : (
          activeWorkPane === 'preview' ? previewPane : controlPaneContent
        )}
      </div>
    </div>
  )
}
```

---

## Verification Checklist

- [ ] Unified editor renders
- [ ] Can see tracks as spheres
- [ ] Can see animation path
- [ ] Tab key switches Preview/Edit
- [ ] Q/W/E/R keys switch views
- [ ] Can select control point in Edit mode
- [ ] Can drag gizmo to move point
- [ ] Path updates in real-time
- [ ] ESC deselects control point
- [ ] Save animation works
- [ ] Load animation works

---

**Total Time**: ~5-10 minutes for basic integration!

**Status**: Ready to integrate! 🚀

**Support**: See full integration plan in `UNIFIED_EDITOR_INTEGRATION_PLAN.md`
