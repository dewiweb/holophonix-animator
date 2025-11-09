# Single Source of Truth Architecture

**Date**: November 9, 2024  
**Issue**: Form and Visual Editor have synchronization issues

---

## Current Problem

### Two Separate States
```
Form State (useAnimationForm)
  ↓ derives
Animation Object (unifiedEditorAnimation)
  ↓ prop
Visual Editor
  ↓ onChange callback
Update Form State
  ↓ re-render
Derive Animation Object again
  ↓ prop change
Visual Editor re-renders
  → Potential loops, sync issues
```

**Problems**:
1. Form has `animationForm.parameters` state
2. Visual editor receives **derived** `animation` object
3. When visual editor changes, **callbacks update form**
4. Form re-renders → New animation object → Visual editor re-renders
5. **Two sources of truth fighting each other**

---

## Current Code Flow

### Form State (Source #1)
```typescript
// useAnimationForm.ts
const [animationForm, setAnimationForm] = useState({
  type: 'linear',
  parameters: { startPosition: {...}, endPosition: {...} }
})
```

### Visual Editor Receives Derived Object (Source #2)
```typescript
// AnimationEditor.tsx
const unifiedEditorAnimation = useMemo(() => ({
  id: loadedAnimationId || previewIdRef.current,
  type: animationForm.type,
  parameters: animationForm.parameters,  // Derived!
  ...
}), [animationForm, ...])

<UnifiedThreeJsEditor 
  animation={unifiedEditorAnimation}  // Prop
  onAnimationChange={(updated) => {
    updateParameters(updated.parameters)  // Callback!
  }}
/>
```

### Visual Editor Updates Form
```typescript
// UnifiedThreeJsEditor.tsx
onGizmoDragEnd() {
  const updatedParams = controlPointsToParameters(...)
  onAnimationChange({
    ...animation,  // Using prop
    parameters: updatedParams  // New params
  })
}

// Back in AnimationEditor
handleUnifiedEditorChange(updatedAnimation) {
  updateParameters(updatedAnimation.parameters)  // Updates form!
  // → Form re-renders
  // → useMemo creates new animation object
  // → Visual editor gets new prop
  // → Potential loop!
}
```

---

## The Solution: Direct State Access

### Option 1: Pass State Setters Directly (Simplest)

**Don't derive animation object. Pass form state directly.**

```typescript
// AnimationEditor.tsx
<UnifiedThreeJsEditor 
  animationType={animationForm.type}
  parameters={animationForm.parameters}  // Direct state
  onParametersChange={updateParameters}  // Direct setter
/>
```

```typescript
// UnifiedThreeJsEditor.tsx
export function UnifiedThreeJsEditor({
  animationType,
  parameters,  // Direct from form state
  onParametersChange,  // Direct setter
}) {
  // Extract control points from parameters
  const controlPoints = useMemo(() => 
    extractControlPointsFromAnimation({ type: animationType, parameters }),
    [animationType, parameters]
  )
  
  // Update parameters directly
  const handleGizmoDrag = (index, newPosition) => {
    const updated = updateParameterAtIndex(
      animationType,
      parameters,  // Current state
      index,
      newPosition
    )
    onParametersChange(updated)  // Direct update!
  }
}
```

**Benefits**:
- ✅ Single source of truth: `animationForm` state
- ✅ No derived objects
- ✅ No prop/callback loop
- ✅ Visual editor directly reads/writes form state
- ✅ Always synchronized

---

### Option 2: Shared Zustand Store (More Complex)

Create a temporary editing store:

```typescript
// stores/animationEditorStore.ts
export const useAnimationEditorStore = create((set) => ({
  editingAnimation: null,
  setEditingAnimation: (anim) => set({ editingAnimation: anim }),
  updateParameters: (params) => set((state) => ({
    editingAnimation: {
      ...state.editingAnimation,
      parameters: params
    }
  }))
}))
```

```typescript
// Both AnimationEditor AND UnifiedThreeJsEditor use same store
const { editingAnimation, updateParameters } = useAnimationEditorStore()

// Form reads from store
<input value={editingAnimation.parameters.startPosition.x} />

// Visual editor reads from same store
const controlPoints = extractControlPoints(editingAnimation)

// Both write to same store
updateParameters({ startPosition: newValue })
```

**Benefits**:
- ✅ True single source of truth
- ✅ No prop drilling
- ✅ Perfect sync
- ✅ Can access from anywhere

**Drawbacks**:
- ❌ More boilerplate
- ❌ Adds another store

---

## Recommended Solution: Option 1 (Direct Props)

**Simplest and most React-like**:

```typescript
// AnimationEditor.tsx
const { animationForm, updateParameter, updateParameters } = useAnimationForm(...)

<UnifiedThreeJsEditor 
  animationType={animationForm.type}
  parameters={animationForm.parameters}
  duration={animationForm.duration}
  onParametersChange={updateParameters}
  onParameterChange={updateParameter}
/>
```

```typescript
// UnifiedThreeJsEditor.tsx
interface Props {
  animationType: AnimationType
  parameters: AnimationParameters
  onParametersChange: (params: AnimationParameters) => void
  onParameterChange: (key: string, value: any) => void
}

export function UnifiedThreeJsEditor({
  animationType,
  parameters,
  onParametersChange,
}) {
  // Derive control points (React caches)
  const controlPoints = useMemo(() => 
    extractControlPointsFromAnimation({ type: animationType, parameters }),
    [animationType, parameters]
  )
  
  // Update form directly
  const handleGizmoDrag = (index, newPosition) => {
    const updatedParams = {
      ...parameters,
      [getParameterKey(animationType, index)]: newPosition
    }
    onParametersChange(updatedParams)
  }
  
  return (
    <scene>
      {controlPoints.map((point, i) => (
        <Mesh 
          position={point}
          onDrag={(pos) => handleGizmoDrag(i, pos)}
        />
      ))}
    </scene>
  )
}
```

**Data Flow**:
```
Form State (animationForm.parameters)
  ↓ direct prop
Visual Editor (parameters)
  ↓ useMemo
Control Points (derived, cached)
  ↓ render
Visible on screen

User drags gizmo
  ↓ event
onParametersChange(newParams)
  ↓ direct call
updateParameters(newParams)
  ↓ updates
Form State
  ↓ re-render
Visual Editor gets new parameters prop
  ↓ useMemo sees change
Control Points recomputed
  ↓ render
Updated position on screen
```

**Key Points**:
1. ✅ ONE source of truth: `animationForm.parameters`
2. ✅ Visual editor reads directly from form state (via props)
3. ✅ Visual editor writes directly to form state (via callback)
4. ✅ No intermediate derived objects
5. ✅ React's `useMemo` handles caching
6. ✅ No manual synchronization needed

---

## Implementation Steps

### 1. Change UnifiedThreeJsEditor Props
```typescript
// BEFORE ❌
interface Props {
  animation: Animation | null
  onAnimationChange: (animation: Animation) => void
}

// AFTER ✅
interface Props {
  animationType: AnimationType
  parameters: AnimationParameters
  onParametersChange: (parameters: AnimationParameters) => void
}
```

### 2. Update AnimationEditor
```typescript
// BEFORE ❌
const unifiedEditorAnimation = useMemo(() => ({...}), [...])
<UnifiedThreeJsEditor animation={unifiedEditorAnimation} />

// AFTER ✅
<UnifiedThreeJsEditor 
  animationType={animationForm.type}
  parameters={animationForm.parameters}
  onParametersChange={updateParameters}
/>
```

### 3. Update Visual Editor Logic
```typescript
// BEFORE ❌
const controlPoints = useMemo(() => 
  extractControlPoints(animation),
  [animation]  // Whole object
)

// AFTER ✅
const controlPoints = useMemo(() => 
  extractControlPoints({ type: animationType, parameters }),
  [animationType, parameters]  // Only what changes
)
```

### 4. Update Callbacks
```typescript
// BEFORE ❌
onGizmoDrag() {
  const newAnim = { ...animation, parameters: newParams }
  onAnimationChange(newAnim)  // Pass whole object
}

// AFTER ✅
onGizmoDrag() {
  onParametersChange(newParams)  // Direct update
}
```

---

## Benefits

### ✅ Single Source of Truth
- Form state is THE source
- Visual editor is view of that state
- No duplication, no sync issues

### ✅ Simpler Code
- No derived animation objects
- No complex callbacks
- Direct state flow

### ✅ Better Performance
- React knows exactly what changed
- useMemo only recomputes when parameters actually change
- No unnecessary re-renders

### ✅ Easier Debugging
- One place to look for state
- Clear data flow
- No mysterious sync bugs

---

## Next Steps

1. Refactor `UnifiedThreeJsEditor` props interface
2. Update `AnimationEditor` to pass direct state
3. Update gizmo callbacks to use direct setter
4. Remove `unifiedEditorAnimation` derived object
5. Test synchronization

---

**Status**: Ready to implement  
**Confidence**: High - This is standard React architecture  
**Benefit**: Eliminates entire class of sync bugs
