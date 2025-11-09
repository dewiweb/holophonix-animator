# Proper Control Points Architecture

**Date**: November 9, 2024  
**Problem**: Over-engineered with refs, skip logic, and React fighting

---

## Simple, Clear Data Flow

### 1. Form is Source of Truth
```typescript
// AnimationEditor.tsx
const [animationForm, setAnimationForm] = useState({
  type: 'linear',
  parameters: {
    startPosition: {x: 0, y: 0, z: 0},
    endPosition: {x: 10, y: 0, z: 0}
  }
})
```

### 2. Visual Editor Receives Parameters
```typescript
// UnifiedThreeJsEditor receives animation object
<UnifiedThreeJsEditor 
  animation={animation} // Has parameters
  onAnimationChange={(updated) => {
    // Update form with new parameters
    updateParameters(updated.parameters)
  }}
/>
```

### 3. Control Points are COMPUTED (not stored)
```typescript
// Inside UnifiedThreeJsEditor
const controlPoints = useMemo(() => {
  return extractControlPointsFromAnimation(animation)
}, [animation.type, animation.parameters])
// React handles caching - no manual skip logic needed!
```

### 4. Editing Updates Form
```typescript
// User drags gizmo
onGizmoDrag(newPosition) {
  const updatedParams = updateParameter(animation, newPosition)
  onAnimationChange({ ...animation, parameters: updatedParams })
  // Form updates → React re-renders → Control points recomputed
}
```

---

## What to Remove

### ❌ Remove All Skip Logic
```typescript
// DELETE THIS
if (lastKey === animationKey && hasLoadedRef.current) return
```

### ❌ Remove State Tracking Refs
```typescript
// DELETE THIS
const hasLoadedRef = useRef(false)
const lastAnimationIdRef = useRef(null)
```

### ❌ Remove Control Points State in Hook
```typescript
// CHANGE THIS
const [controlPoints, setControlPoints] = useState([])

// TO THIS - Just return the extracted points
return extractControlPointsFromAnimation(animation)
```

---

## What to Keep Simple

### ✅ Extract Control Points (Pure Function)
```typescript
// utils/extractControlPoints.ts
export function extractControlPointsFromAnimation(animation) {
  if (!animation?.parameters) return []
  
  switch (animation.type) {
    case 'linear':
      return [
        animation.parameters.startPosition,
        animation.parameters.endPosition
      ].filter(Boolean).map(appToThreePosition)
    // ...
  }
}
```

### ✅ Render Scene (useEffect)
```typescript
// Just render what's in props - no skip logic
useEffect(() => {
  if (!scene) return
  
  // Clear old meshes
  scene.children.filter(isMesh).forEach(mesh => {
    scene.remove(mesh)
    mesh.dispose()
  })
  
  // Add new meshes for current control points
  controlPoints.forEach((point, i) => {
    const mesh = createMesh(point, i)
    scene.add(mesh)
  })
}, [scene, controlPoints])
```

### ✅ Update Form on Edit
```typescript
const handleControlPointDrag = (index, newPosition) => {
  const updatedParams = { ...animation.parameters }
  
  if (animation.type === 'linear') {
    if (index === 0) updatedParams.startPosition = threeToAppPosition(newPosition)
    if (index === 1) updatedParams.endPosition = threeToAppPosition(newPosition)
  }
  
  onAnimationChange({ ...animation, parameters: updatedParams })
}
```

---

## Architecture Benefits

### ✅ Simple
- No refs
- No skip logic
- No manual state tracking
- React handles caching via useMemo

### ✅ Predictable
- One source of truth (form)
- Unidirectional data flow
- Parameters → Control points (always)
- Edit → Update parameters → Re-render

### ✅ Works with React
- useMemo prevents unnecessary recomputation
- useEffect only runs when dependencies change
- No fighting Strict Mode

### ✅ Debuggable
- Log parameters → See what control points should be
- Log control points → See what's rendered
- Clear cause and effect

---

## Implementation Plan

### 1. Simplify useControlPointScene Hook
```typescript
export function useControlPointScene(animation) {
  const sceneRef = useRef(null)
  const meshesRef = useRef([])
  
  // Compute control points from animation (cached by React)
  const controlPoints = useMemo(() => 
    extractControlPointsFromAnimation(animation),
    [animation?.type, animation?.parameters]
  )
  
  // Initialize scene once
  useEffect(() => {
    const scene = new THREE.Scene()
    // Add grid, lights, etc.
    sceneRef.current = scene
    return () => scene.clear()
  }, [])
  
  // Update meshes when control points change
  useEffect(() => {
    if (!sceneRef.current) return
    
    // Remove old meshes
    meshesRef.current.forEach(mesh => {
      sceneRef.current.remove(mesh)
      mesh.dispose()
    })
    meshesRef.current = []
    
    // Add new meshes
    controlPoints.forEach((point, i) => {
      const mesh = createControlPointMesh(point, i)
      sceneRef.current.add(mesh)
      meshesRef.current.push(mesh)
    })
  }, [controlPoints])
  
  return { scene: sceneRef.current, controlPoints }
}
```

### 2. Update Parameter on Edit
```typescript
const handleGizmoDragEnd = (index, newPosition) => {
  if (!animation || !onAnimationChange) return
  
  const appPosition = threeToAppPosition(newPosition)
  const updatedParams = updateParameterAtIndex(
    animation.type,
    animation.parameters,
    index,
    appPosition
  )
  
  onAnimationChange({
    ...animation,
    parameters: updatedParams
  })
}
```

### 3. Form Updates Trigger Re-render
```typescript
// AnimationEditor
const handleParameterChange = (key, value) => {
  setAnimationForm(prev => ({
    ...prev,
    parameters: { ...prev.parameters, [key]: value }
  }))
  // React automatically re-renders UnifiedThreeJsEditor
  // useMemo recomputes control points
  // useEffect updates scene
  // ✅ All automatic!
}
```

---

## Testing the Simple Architecture

### Test 1: Initial Load
```
1. Create linear animation
2. Set start (0,0,0), end (10,0,0)
3. Expected: See 2 control points
4. Log: extractControlPointsFromAnimation called once
5. Log: Scene updated once
```

### Test 2: Edit in Form
```
1. Change end position to (20,0,0)
2. Expected: End control point moves to x=20
3. Log: extractControlPointsFromAnimation called (useMemo)
4. Log: Scene updated (useEffect)
5. No manual skip logic needed!
```

### Test 3: Edit in Visual
```
1. Drag end control point to (15,0,0)
2. onAnimationChange called with updated parameters
3. Form updates
4. extractControlPointsFromAnimation recomputes (same result)
5. useMemo sees same data → No re-render
6. ✅ Efficient!
```

---

## Summary

### What We're Doing Wrong
- Fighting React with manual optimization
- Multiple sources of truth (refs, state, props)
- Complex skip logic
- Not trusting React's reconciliation

### What We Should Do
- Trust React's useMemo/useEffect
- Single source of truth (form parameters)
- Derive everything from parameters
- Simple, predictable data flow

### Result
- Less code
- Easier to debug
- Works with React Strict Mode
- No weird edge cases

---

**Next**: Implement this clean architecture
