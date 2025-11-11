# Animation Type Switch Fix

**Date**: November 9, 2024  
**Issue**: Switching animation type updates form but not visual control points

---

## Problem

When user changes animation type (e.g., Linear → Bezier):
- ✅ Form updates correctly (shows new parameter inputs)
- ❌ Visual control points don't update (still show old type's points)

---

## Root Cause

**React's shallow comparison** in `useMemo` dependencies:

```typescript
// ❌ PROBLEM - React compares object reference, not content
const controlPointPositions = useMemo(() => {
  return extractControlPointsFromAnimation(animation)
}, [animation?.type, animation?.parameters])
```

**What happens**:
1. Animation type changes: Linear → Bezier
2. `animation.parameters` object is updated with new fields
3. BUT the object **reference might be the same**
4. React's shallow comparison: `oldParams === newParams` → `true`
5. `useMemo` doesn't recompute → **Old control points stay!**

---

## The Solution

**Deep comparison** using JSON serialization:

```typescript
// ✅ SOLUTION - Serialize parameters to detect content changes
const paramsKey = animation?.parameters 
  ? JSON.stringify(animation.parameters) 
  : ''

const controlPointPositions = useMemo(() => {
  return extractControlPointsFromAnimation(animation)
}, [animation?.id, animation?.type, paramsKey])
```

**How it works**:
1. Animation type changes: Linear → Bezier
2. Parameters object updated: `{startPosition, endPosition}` → `{start, control1, control2, end}`
3. `JSON.stringify()` creates different string
4. React compares: `oldKey !== newKey` → `true`
5. `useMemo` recomputes → **New control points! ✅**

---

## Why JSON.stringify?

### ✅ Advantages
- Detects **deep changes** in nested objects
- Simple and readable
- Works for any parameter structure

### ⚠️ Considerations
- Slight performance cost (negligible for small objects)
- Only runs when animation changes (rare)
- Alternative would be custom deep comparison (more code)

---

## Data Flow Now

```
User changes animation type
  ↓
Form updates (animation.type = 'bezier')
  ↓
Form updates parameters (adds control1, control2)
  ↓
animation object passed to UnifiedThreeJsEditor
  ↓
paramsKey = JSON.stringify(parameters)
  ↓
useMemo sees paramsKey changed
  ↓
Recomputes control points
  ↓
useEffect sees controlPointPositions changed
  ↓
Updates meshes
  ↓
✅ Visual control points updated!
```

---

## Console Output

### When animation type changes:
```
🔍 Computing control points from animation: {
  type: "bezier",
  hasParams: true,
  animationId: "preview-123...",
  paramsKey: '{"start":{"x":0,"y":0,"z":0},"control1":...'
}
✅ Control points computed: 4

🔄 Updating control point meshes: 4 (cleaning up 2 old meshes)
✅ Control points updated: 4
```

**What to look for**:
- "Computing control points" appears when type changes
- "cleaning up X old meshes" shows proper cleanup
- New count matches new animation type (Linear=2, Bezier=4, etc.)

---

## Alternative Approaches Considered

### 1. Custom Deep Comparison
```typescript
// More code, same result
const prevParams = useRef()
const paramsChanged = !deepEqual(animation?.parameters, prevParams.current)
```
**Verdict**: More complex, no benefit over JSON.stringify

### 2. Force Re-render on Type Change
```typescript
// Hacky
const [forceUpdate, setForceUpdate] = useState(0)
useEffect(() => {
  setForceUpdate(prev => prev + 1)
}, [animation?.type])
```
**Verdict**: Anti-pattern, fights React

### 3. Pass Parameters as Separate Props
```typescript
// Better but requires refactoring parent
<UnifiedEditor 
  type={animationType}
  parameters={parameters}  // Separate props
/>
```
**Verdict**: Good idea for future refactor (single source of truth)

---

## Files Modified

1. ✅ `useControlPointScene.ts` - Added paramsKey serialization

---

## Test

1. **Create linear animation** (2 control points)
2. **Change type to bezier** (should show 4 control points)
3. **Change type to circular** (should show 1 control point - center)
4. **Expected console**:
   ```
   🔍 Computing control points from animation: {type: "bezier"}
   ✅ Control points computed: 4
   🔄 Updating control point meshes: 4
   ```

---

**Status**: Fixed! ✅  
**Next**: Consider refactoring to single source of truth (separate type/parameters props)
